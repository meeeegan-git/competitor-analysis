-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- 分析任务表
CREATE TABLE IF NOT EXISTS analysis_tasks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    file_name VARCHAR(255) NOT NULL,
    file_size INTEGER,
    row_count INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 分析结果表
CREATE TABLE IF NOT EXISTS category_results (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES analysis_tasks(id) ON DELETE CASCADE,
    category_key VARCHAR(100) NOT NULL,
    category_label VARCHAR(100) NOT NULL,
    category_color VARCHAR(20),
    category_icon VARCHAR(20),
    total_consumption DECIMAL(15,2) DEFAULT 0,
    total_order_amount DECIMAL(15,2) DEFAULT 0,
    avg_roi DECIMAL(10,4) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 竞品数据表
CREATE TABLE IF NOT EXISTS competitor_data (
    id SERIAL PRIMARY KEY,
    category_result_id INTEGER REFERENCES category_results(id) ON DELETE CASCADE,
    video_name VARCHAR(255) NOT NULL,
    total_order_amount DECIMAL(15,2) DEFAULT 0,
    order_amount_masked VARCHAR(50),
    order_price DECIMAL(15,2) DEFAULT 0,
    ctr DECIMAL(10,4) DEFAULT 0,
    conversion_rate DECIMAL(10,4) DEFAULT 0,
    cpm DECIMAL(10,4) DEFAULT 0,
    roi DECIMAL(10,4) DEFAULT 0,
    roi_masked VARCHAR(50),
    consumption DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tasks_user ON analysis_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON analysis_tasks(status);
CREATE INDEX IF NOT EXISTS idx_results_task ON category_results(task_id);
CREATE INDEX IF NOT EXISTS idx_data_result ON competitor_data(category_result_id);

-- 创建默认用户
INSERT INTO users (username) VALUES ('anonymous') ON CONFLICT (username) DO NOTHING;

SELECT 'Database tables created successfully!' as message;
