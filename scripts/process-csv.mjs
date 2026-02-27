/**
 * CSV 预处理脚本
 * 用途：将大型 CSV 文件解析、去重、取 TOP100 后生成精简 JSON
 * 用法：node scripts/process-csv.mjs <csv文件路径> [周标签，如 2026-W09]
 * 
 * 生成的 JSON 文件保存到 src/data/ 目录下
 * 同时更新 src/data/weeks.json 索引文件
 */

import fs from 'fs';
import path from 'path';
import { createReadStream } from 'fs';
import readline from 'readline';

// CSV 列名
const COL_INDUSTRY = 'KPI三级行业';
const COL_CATEGORY = '商品统一类目V2(一级～四级)';
const COL_DPA_NAME = 'DPA商品名称';
const COL_CONSUMPTION = '消耗(元)';
const COL_ORDER_PRICE = '下单单价(元)';
const COL_ROI = '下单ROI';
const COL_VIDEO_3S_RATE = '视频3秒完播率(%)';
const COL_AVG_PLAY_DURATION = '平均播放时长(毫秒精度)(s)';
const COL_CTR = 'ctr(%)';
const COL_MATERIAL_MD5 = '素材MD5示意(预览)(翻译后)';

/**
 * 行业整合映射：将细分行业合并
 */
const INDUSTRY_MERGE_MAP = {
  '运动鞋服-非品牌': '运动鞋服',
  '运动鞋服-品牌': '运动鞋服',
  '运动用品-非品牌': '运动用品',
  '运动用品-品牌': '运动用品',
  '箱包': '箱包鞋靴',
  '鞋类': '箱包鞋靴',
  '综合服饰-品牌': '综合服饰',
  '综合服饰-非品牌': '综合服饰',
};

/**
 * "其他"行业重分类规则：根据商品名称关键词自动归类
 * 优先级从上到下，命中第一条即返回
 */
const RECLASSIFY_RULES = [
  // 贴身衣物（内衣、文胸、睡衣、家居服、袜子、保暖内衣等）
  { pattern: /文胸|乳贴|内衣|内裤|秋衣秋裤|保暖套装|打底裤|家居服|睡衣|袜|热感衣/, target: '贴身衣物' },
  // 箱包鞋靴
  { pattern: /(?:登机|旅行|收纳|手提|单肩|出差)包|皮带|腰带|箱/, target: '箱包鞋靴' },
  // 鞋类
  { pattern: /鞋|靴/, target: '箱包鞋靴' },
  // 运动相关
  { pattern: /运动|健身|跑步|压缩衣|户外.*(?:防风|防水|拆卸)|三合一|XBIONIC/, target: '运动鞋服' },
  // 女装 - 明确女性标识（羽绒服女、外套女 等模式）
  { pattern: /女装|女士|女款|连衣裙|裙|阔腿裤女|裤子女|裤女|大码女|皮草.*女|皮草外套(?!.*男)|羽绒服女|外套.*女|女.*(?:衬衫|印花)|减龄女/, target: '女装' },
  // 皮草类（无明确性别）→ 潮奢鞋服包
  { pattern: /皮草|貂皮|裘皮|水貂/, target: '潮奢鞋服包' },
  // 男装 - 明确男性标识
  { pattern: /男装|男士|男款|男裤|爸爸装|polo衫男|衬衫男|裤.*男|T恤男|防泼水男|男.*(?:外套|夹克|羽绒|棉衣|衬衫|卫衣|休闲裤|牛仔裤|棉服|皮衣)|(?:外套|夹克|羽绒|棉衣|衬衫|卫衣|休闲裤|牛仔裤|棉服|皮衣).*男|毛衫男|中年.*针织/, target: '男装' },
  // 儿童
  { pattern: /儿童|青少年|男女童|童装/, target: '综合服饰' },
  // 服饰通用兜底（情侣款、中性服饰、含服装关键词但无性别的）
  { pattern: /T恤|短袖|毛衣|针织衫|卫衣|polo|Polo|POLO|套装.*(?:情侣|男女)|情侣.*套装|衬衫|皮衣|牛仔裤|棉服|外套|夹克|羽绒|打底|裤|上衣|背心/, target: '综合服饰' },
];

/**
 * 对"其他"行业的商品进行重分类
 */
function reclassifyOther(productName) {
  const name = productName || '';
  for (const rule of RECLASSIFY_RULES) {
    if (rule.pattern.test(name)) {
      return rule.target;
    }
  }
  // 兜底：无法分类的仍归为"其他"
  return '其他';
}

/**
 * 整合行业名称
 */
function normalizeIndustry(industry, productName) {
  // 1. 先做合并映射
  let result = INDUSTRY_MERGE_MAP[industry] || industry;
  // 2. 如果是"其他"或空值，尝试根据商品名称重分类
  if (result === '其他' || !result) {
    result = reclassifyOther(productName);
  }
  return result;
}

/**
 * 素材分析生成器
 * 基于商品名称、类目、行业、数据指标自动推断4个分析维度：
 * 1. 前3秒亮点 (hook)
 * 2. 人物形象 (persona)
 * 3. 卖点 (sellingPoint)
 * 4. 素材脚本结构 (scriptStructure)
 */
function generateAnalysis(productName, category, industry, metrics) {
  const name = productName || '';
  const cat = category || '';

  // === 1. 前3秒亮点 ===
  let hook = '';
  if (/同款|明星|杨幂|张柏芝|侯勇|田曦薇|冰冰|冠军|代言/.test(name)) hook = '明星同款引入';
  else if (/买一送一|半价|福利|限购|撤柜|奥莱|清仓|特价/.test(name)) hook = '促销利益点开场';
  else if (/新款|2026|2025|春季|冬季|秋冬|春秋|夏季|当季/.test(name)) hook = '应季新品展示';
  else if (/官方|正品|专利|10A|7A|5A|品牌/.test(name)) hook = '品质认证背书';
  else if (/高端|高奢|轻奢|顶奢|贵族|奢华/.test(name)) hook = '高端质感开场';
  else if (/爆款|热卖|经典|畅销|必入/.test(name)) hook = '爆款数据背书';
  else if (metrics.v3 >= 50) hook = '强视觉冲击开场';
  else if (metrics.ct >= 3) hook = '痛点场景切入';
  else hook = '产品特写开场';

  // === 2. 人物形象 ===
  let persona = '';
  if (/儿童|青少年|童|学生|校服/.test(name)) persona = '青少年/儿童';
  else if (/爸爸|中老年|中年|老年|爷爷/.test(name)) persona = '中年男性';
  else if (/大码女|微胖|胖mm/.test(name)) persona = '大码女性模特';
  else if (/情侣|男女同款/.test(name)) persona = '情侣组合';
  else if (industry === '男装') persona = '男性模特';
  else if (industry === '女装') persona = '女性模特';
  else if (/男/.test(name)) persona = '男性模特';
  else if (/女/.test(name)) persona = '女性模特';
  else if (industry === '贴身衣物' && /文胸|乳贴/.test(name)) persona = '女性模特';
  else if (industry === '运动鞋服' || industry === '运动用品') persona = '运动达人';
  else if (industry === '潮奢鞋服包' || industry === '潮奢珠宝配饰') persona = '时尚达人';
  else persona = '真人模特';

  // === 3. 卖点 ===
  let sellingPoint = '';
  if (/保暖|加厚|加绒|羊绒|羊毛|鹅绒|鸭绒|蓄热|发热/.test(name)) sellingPoint = '保暖御寒';
  else if (/轻薄|薄款|透气|速干|冰丝|凉感/.test(name)) sellingPoint = '轻薄透气';
  else if (/防风|防水|防泼水|三合一|冲锋/.test(name)) sellingPoint = '户外防护';
  else if (/百搭|通勤|日常|简约/.test(name)) sellingPoint = '百搭通勤';
  else if (/显瘦|修身|收腹|提臀/.test(name)) sellingPoint = '修身显瘦';
  else if (/真皮|头层牛皮|小牛皮|纯棉|蚕丝|真丝/.test(name)) sellingPoint = '优质面料';
  else if (/减震|缓震|回弹|碳板/.test(name)) sellingPoint = '科技缓震';
  else if (/大容量|防盗|轻便|耐磨/.test(name)) sellingPoint = '实用功能';
  else if (/时尚|潮流|设计|个性|复古/.test(name)) sellingPoint = '时尚设计';
  else if (/高弹|无痕|无钢圈|舒适/.test(name)) sellingPoint = '舒适体验';
  else if (metrics.or >= 2) sellingPoint = '高性价比';
  else sellingPoint = '品质做工';

  // === 4. 素材脚本结构 ===
  let scriptStructure = '';
  if (metrics.ap >= 20) scriptStructure = '详细讲解型';
  else if (metrics.ap >= 10) scriptStructure = '场景种草型';
  else if (metrics.v3 >= 60) scriptStructure = '快节奏展示型';
  else if (/同款|明星/.test(name)) scriptStructure = '明星带货型';
  else if (/买一送一|半价|福利|限购/.test(name)) scriptStructure = '促销口播型';
  else if (metrics.ct >= 4) scriptStructure = '痛点解决型';
  else if (metrics.ap < 6) scriptStructure = '快速展示型';
  else scriptStructure = '产品展示型';

  // === 5. 30字以内总结描述 ===
  // 格式：{hook}+{persona}展示{sellingPoint}，{scriptStructure}
  const summary = `${hook}，${persona}展示${sellingPoint}，${scriptStructure}`;
  // 如果超过30字，进行截断
  const trimmedSummary = summary.length > 30 ? summary.slice(0, 29) + '…' : summary;

  return { hook, persona, sellingPoint, scriptStructure, summary: trimmedSummary };
}

function toNum(val) {
  if (val === undefined || val === '' || val === '~') return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// 获取当前 ISO 周标签
function getCurrentWeekLabel() {
  const now = new Date();
  const year = now.getFullYear();
  const oneJan = new Date(year, 0, 1);
  const days = Math.floor((now - oneJan) / 86400000);
  const weekNum = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

// 解析 CSV（手动处理，支持带逗号的字段）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

async function processCSV(csvPath, weekLabel) {
  console.log(`正在处理: ${csvPath}`);
  console.log(`周标签: ${weekLabel}`);

  const rl = readline.createInterface({
    input: createReadStream(csvPath, { encoding: 'utf-8' }),
    crlfDelay: Infinity,
  });

  let headers = null;
  let lineCount = 0;

  // 按DPA商品名称去重（保留消耗最大的行）
  const dpaMap = new Map(); // dpaName -> rowObject

  for await (const line of rl) {
    const trimmed = line.replace(/\r$/, '');
    if (!trimmed) continue;

    if (!headers) {
      // 移除 BOM
      const cleaned = trimmed.replace(/^\uFEFF/, '');
      headers = parseCSVLine(cleaned);
      console.log(`列数: ${headers.length}`);
      console.log(`列名: ${headers.join(' | ')}`);
      continue;
    }

    lineCount++;
    const values = parseCSVLine(trimmed);
    
    // 构建行对象
    const row = {};
    for (let i = 0; i < headers.length && i < values.length; i++) {
      row[headers[i]] = values[i];
    }

    const rawIndustry = (row[COL_INDUSTRY] || '').trim();
    const category = (row[COL_CATEGORY] || '').trim();
    const dpaName = (row[COL_DPA_NAME] || '').trim();
    
    // 跳过汇总行、空行、素材为空的行
    const materialLink = (row[COL_MATERIAL_MD5] || '').trim();
    if (rawIndustry === '整体' || !dpaName || !materialLink) continue;
    
    // 整合行业名称
    const industry = normalizeIndustry(rawIndustry, dpaName);
    
    const consumption = toNum(row[COL_CONSUMPTION]);

    const existing = dpaMap.get(dpaName);
    if (!existing || consumption > existing._consumption) {
      dpaMap.set(dpaName, {
        ...row,
        _consumption: consumption,
        _normalizedIndustry: industry,  // 存储整合后的行业名称
      });
    }
  }

  console.log(`总行数: ${lineCount}`);
  console.log(`去重后商品数: ${dpaMap.size}`);

  // 按行业分组取 TOP100（每个行业最多100条素材）
  const industryGroups = new Map();
  for (const [, row] of dpaMap) {
    const industry = row._normalizedIndustry || (row[COL_INDUSTRY] || '').trim();
    if (!industry) continue;
    if (!industryGroups.has(industry)) industryGroups.set(industry, []);
    industryGroups.get(industry).push(row);
  }

  const allRows = [];
  const industries = new Set();
  const categories = new Set();

  for (const [industry, items] of industryGroups) {
    industries.add(industry);
    items.sort((a, b) => b._consumption - a._consumption);
    const top100 = items.slice(0, 100);

    for (const row of top100) {
      const consumption = row._consumption;
      const category = (row[COL_CATEGORY] || '').trim();
      const orderPrice = toNum(row[COL_ORDER_PRICE]);
      const orderRoi = toNum(row[COL_ROI]);
      const video3sRate = toNum(row[COL_VIDEO_3S_RATE]);
      const avgPlayDuration = toNum(row[COL_AVG_PLAY_DURATION]);
      const ctr = toNum(row[COL_CTR]);
      const materialLink = row[COL_MATERIAL_MD5] || '';
      const dpaName = (row[COL_DPA_NAME] || '').trim();

      if (category) categories.add(category);

      // 生成素材分析标签
      const analysis = generateAnalysis(dpaName, category, industry, {
        v3: video3sRate,
        ct: ctr,
        ap: avgPlayDuration,
        or: orderRoi,
      });

      allRows.push({
        pn: dpaName,                                     // productName 商品名称
        op: Math.round(orderPrice),                      // orderPrice 下单单价
        or: parseFloat(orderRoi.toFixed(2)),             // orderRoi 下单ROI
        v3: parseFloat(video3sRate.toFixed(2)),          // video3sRate 3秒完播率
        ap: parseFloat(avgPlayDuration.toFixed(1)),      // avgPlayDuration 平均播放时长
        ct: parseFloat(ctr.toFixed(2)),                  // ctr
        ml: materialLink,                                // materialLink 素材链接
        ca: category,                                    // category 类目
        ind: industry,                                   // industry KPI三级行业
        cs: Math.round(consumption),                     // consumption 消耗（用于排序，前端不展示）
        an: analysis,                                    // analysis 素材分析标签
      });
    }
  }

  // 全局按消耗降序
  allRows.sort((a, b) => b.cs - a.cs);
  const sortedCategories = Array.from(categories).sort();
  const sortedIndustries = Array.from(industries).sort();

  console.log(`最终素材数: ${allRows.length}`);
  console.log(`行业数: ${sortedIndustries.length}`);
  console.log(`行业列表: ${sortedIndustries.join(', ')}`);

  // 输出
  const projectRoot = path.dirname(path.dirname(new URL(import.meta.url).pathname));
  const dataDir = path.join(projectRoot, 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 保存当周数据
  const dataFile = path.join(dataDir, `week-${weekLabel}.json`);
  const outputData = {
    week: weekLabel,
    generatedAt: new Date().toISOString(),
    totalCount: allRows.length,
    categoryCount: sortedCategories.length,
    industryCount: sortedIndustries.length,
    categories: sortedCategories,
    industries: sortedIndustries,
    rows: allRows,
  };
  
  fs.writeFileSync(dataFile, JSON.stringify(outputData));
  console.log(`数据已保存到: ${dataFile}`);
  console.log(`文件大小: ${(fs.statSync(dataFile).size / 1024 / 1024).toFixed(2)} MB`);

  // 更新周索引
  const weeksFile = path.join(dataDir, 'weeks.json');
  let weeksIndex = [];
  if (fs.existsSync(weeksFile)) {
    weeksIndex = JSON.parse(fs.readFileSync(weeksFile, 'utf-8'));
  }
  
  const existingIdx = weeksIndex.findIndex(w => w.week === weekLabel);
  const weekMeta = {
    week: weekLabel,
    file: `week-${weekLabel}.json`,
    generatedAt: new Date().toISOString(),
    totalCount: allRows.length,
    categoryCount: sortedCategories.length,
    industryCount: sortedIndustries.length,
  };
  
  if (existingIdx >= 0) {
    weeksIndex[existingIdx] = weekMeta;
  } else {
    weeksIndex.push(weekMeta);
  }
  weeksIndex.sort((a, b) => b.week.localeCompare(a.week));
  
  fs.writeFileSync(weeksFile, JSON.stringify(weeksIndex, null, 2));
  console.log(`周索引已更新: ${weeksFile}`);
  console.log('完成！');
}

// 命令行入口
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('用法: node scripts/process-csv.mjs <csv文件路径> [周标签]');
  console.error('示例: node scripts/process-csv.mjs ~/Downloads/数据集.csv 2026-W09');
  process.exit(1);
}

const csvPath = args[0];
const weekLabel = args[1] || getCurrentWeekLabel();

if (!fs.existsSync(csvPath)) {
  console.error(`文件不存在: ${csvPath}`);
  process.exit(1);
}

processCSV(csvPath, weekLabel);
