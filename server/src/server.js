import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { Pool } from 'pg';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const pool = new Pool({
  host: process.env.DB_HOST || 'competitor-postgres',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'competitor',
  password: process.env.DB_PASSWORD || 'comp123456',
  database: process.env.DB_NAME || 'competitor_analysis'
});

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 存储在线用户
let onlineUsers = new Map();

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('用户连接:', socket.id);
  
  socket.on('userJoin', (userId) => {
    onlineUsers.set(socket.id, userId);
    io.emit('usersOnline', Array.from(onlineUsers.values()));
  });
  
  socket.on('disconnect', () => {
    onlineUsers.delete(socket.id);
    io.emit('usersOnline', Array.from(onlineUsers.values()));
  });
});

// 获取所有分析任务
app.get('/api/tasks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.username 
      FROM analysis_tasks t 
      LEFT JOIN users u ON t.user_id = u.id 
      ORDER BY t.created_at DESC 
      LIMIT 50
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 获取单个任务的完整分析结果
app.get('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const taskResult = await pool.query(
      'SELECT * FROM analysis_tasks WHERE id = $1',
      [id]
    );
    
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: '任务不存在' });
    }
    
    const resultsResult = await pool.query(
      `SELECT * FROM category_results WHERE task_id = $1`,
      [id]
    );
    
    const resultsWithData = await Promise.all(
      resultsResult.rows.map(async (result) => {
        const dataResult = await pool.query(
          'SELECT * FROM competitor_data WHERE category_result_id = $1 ORDER BY total_order_amount DESC',
          [result.id]
        );
        return {
          ...result,
          rows: dataResult.rows
        };
      })
    );
    
    res.json({
      task: taskResult.rows[0],
      results: resultsWithData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取分析结果失败' });
  }
});

// 获取最新分析结果（用于实时同步）
app.get('/api/latest', async (req, res) => {
  try {
    const taskResult = await pool.query(
      'SELECT * FROM analysis_tasks ORDER BY created_at DESC LIMIT 1'
    );
    
    if (taskResult.rows.length === 0) {
      return res.json(null);
    }
    
    const task = taskResult.rows[0];
    const resultsResult = await pool.query(
      'SELECT * FROM category_results WHERE task_id = $1',
      [task.id]
    );
    
    const resultsWithData = await Promise.all(
      resultsResult.rows.map(async (result) => {
        const dataResult = await pool.query(
          'SELECT * FROM competitor_data WHERE category_result_id = $1 ORDER BY total_order_amount DESC',
          [result.id]
        );
        return {
          ...result,
          rows: dataResult.rows
        };
      })
    );
    
    res.json({
      task,
      results: resultsWithData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '获取最新数据失败' });
  }
});

// 创建新的分析任务（保存分析结果）
app.post('/api/tasks', async (req, res) => {
  const client = await pool.connect();
  try {
    const { fileName, rowCount, results, userId = 1 } = req.body;
    
    await client.query('BEGIN');
    
    // 创建任务记录
    const taskResult = await client.query(
      'INSERT INTO analysis_tasks (user_id, file_name, row_count, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, fileName, rowCount, 'completed']
    );
    const task = taskResult.rows[0];
    
    // 保存每个类目的分析结果
    for (const category of results) {
      const categoryResult = await client.query(
        `INSERT INTO category_results 
         (task_id, category_key, category_label, category_color, category_icon, total_consumption, total_order_amount, avg_roi) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
          task.id,
          category.config.key,
          category.config.label,
          category.config.color,
          category.config.icon,
          category.totalConsumption,
          category.totalOrderAmount,
          category.avgRoi
        ]
      );
      
      const categoryId = categoryResult.rows[0].id;
      
      // 保存每个视频号的详细数据
      for (const row of category.rows) {
        await client.query(
          `INSERT INTO competitor_data 
           (category_result_id, video_name, total_order_amount, order_amount_masked, order_price, ctr, conversion_rate, cpm, roi, roi_masked, consumption) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            categoryId,
            row.videoName,
            row.totalOrderAmount,
            row.orderAmountMasked,
            row.orderPrice,
            row.ctr,
            row.conversionRate,
            row.cpm,
            row.roi,
            row.roiMasked,
            row.consumption
          ]
        );
      }
    }
    
    await client.query('COMMIT');
    
    // 通过Socket.io广播新数据给所有在线用户
    io.emit('newAnalysis', { taskId: task.id });
    
    res.json({ success: true, taskId: task.id });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: '保存分析结果失败' });
  } finally {
    client.release();
  }
});

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`API服务器运行在端口 ${PORT}`);
  console.log(`WebSocket服务器已启动`);
});
