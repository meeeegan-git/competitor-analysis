export interface RawRow {
  [key: string]: string | number | undefined;
}

export interface CategoryConfig {
  key: string;
  label: string;
  color: string;
  icon: string;
  filterFn: (row: RawRow) => boolean;
}

export interface AggregatedRow {
  videoName: string;
  totalOrderAmount: number;
  orderAmountMasked: string;
  orderPrice: number;
  ctr: number;
  conversionRate: number;
  cpm: number;
  roi: number;
  roiMasked: string;
  consumption: number;
}

export interface CategoryResult {
  config: CategoryConfig;
  rows: AggregatedRow[];
  totalConsumption: number;
  totalOrderAmount: number;
  avgRoi: number;
}

export const COL_DPA_NAME = 'DPA商品名称';
export const COL_CATEGORY_V2 = '商品统一类目V2(一级～四级)';
export const COL_VIDEO_NAME = '视频号名称';
export const COL_CONSUMPTION = '消耗(元)';
export const COL_ORDER_AMOUNT = '下单金额(元)';
export const COL_ORDER_PRICE = '下单单价(元)';
export const COL_CTR = 'ctr(%)';
export const COL_CONVERSION_RATE = '综合目标转化率(%)';
export const COL_CPM = '竞价CPM(元)';
export const COL_ROI = '下单ROI';

export const REQUIRED_COLUMNS = [
  COL_DPA_NAME, COL_CATEGORY_V2, COL_VIDEO_NAME,
  COL_CONSUMPTION, COL_ORDER_AMOUNT, COL_ORDER_PRICE,
  COL_CTR, COL_CONVERSION_RATE, COL_CPM, COL_ROI,
];

export const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: 'shark_pants',
    label: '鲨鱼裤',
    color: '#6366F1',
    icon: '🦈',
    filterFn: (row) => {
      const name = String(row[COL_DPA_NAME] || '');
      return name.includes('鲨鱼裤');
    },
  },
  {
    key: 'straight_pants',
    label: '直筒裤',
    color: '#3B82F6',
    icon: '👖',
    filterFn: (row) => {
      const name = String(row[COL_DPA_NAME] || '');
      const cat = String(row[COL_CATEGORY_V2] || '');
      return name.includes('直筒') && !cat.includes('男装');
    },
  },
  {
    key: 'sweatpants',
    label: '卫裤',
    color: '#10B981',
    icon: '🩳',
    filterFn: (row) => {
      const name = String(row[COL_DPA_NAME] || '');
      const cat = String(row[COL_CATEGORY_V2] || '');
      return name.includes('卫裤') && !cat.includes('男装');
    },
  },
  {
    key: 'paratrooper_pants',
    label: '伞兵裤',
    color: '#F59E0B',
    icon: '🪂',
    filterFn: (row) => {
      const name = String(row[COL_DPA_NAME] || '');
      const cat = String(row[COL_CATEGORY_V2] || '');
      return name.includes('伞兵') && !cat.includes('男装');
    },
  },
  {
    key: 'bodysuit',
    label: '连体塑身衣',
    color: '#EC4899',
    icon: '👗',
    filterFn: (row) => {
      const cat = String(row[COL_CATEGORY_V2] || '');
      return cat.includes('服饰鞋包-内衣裤袜/睡衣/家居服-塑身衣/裤-塑身连体衣');
    },
  },
  {
    key: 'shaping_pants',
    label: '塑身裤',
    color: '#8B5CF6',
    icon: '🩱',
    filterFn: (row) => {
      const cat = String(row[COL_CATEGORY_V2] || '');
      return cat.includes('服饰鞋包-内衣裤袜/睡衣/家居服-塑身衣/裤-塑身美体裤');
    },
  },
];
