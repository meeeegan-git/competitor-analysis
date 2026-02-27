// 素材分析标签
export interface AnalysisTags {
  hook: string;             // 前3秒亮点
  persona: string;          // 人物形象
  sellingPoint: string;     // 卖点
  scriptStructure: string;  // 素材脚本结构
  summary: string;          // 30字以内总结描述
}

// 精简后的数据行（对应 JSON 中的缩写字段）
export interface CompactRow {
  pn: string;   // productName 商品名称
  op: number;   // orderPrice 下单单价
  or: number;   // orderRoi 下单ROI
  v3: number;   // video3sRate 3秒完播率
  ap: number;   // avgPlayDuration 平均播放时长
  ct: number;   // ctr
  ml: string;   // materialLink 素材链接
  ca: string;   // category 类目
  ind: string;  // industry KPI三级行业
  cs: number;   // consumption 消耗（用于排序，前端不展示）
  an: AnalysisTags; // analysis 素材分析标签
}

// 周数据文件结构
export interface WeekData {
  week: string;
  generatedAt: string;
  totalCount: number;
  categoryCount: number;
  industryCount: number;
  categories: string[];
  industries: string[];
  rows: CompactRow[];
}

// 周索引项
export interface WeekMeta {
  week: string;
  file: string;
  generatedAt: string;
  totalCount: number;
  categoryCount: number;
  industryCount: number;
}
