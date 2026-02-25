import * as XLSX from 'xlsx';
import {
  RawRow, AggregatedRow, CategoryResult, CategoryConfig,
  COL_VIDEO_NAME, COL_CONSUMPTION, COL_ORDER_AMOUNT,
  COL_ORDER_PRICE, COL_CTR, COL_CONVERSION_RATE,
  COL_CPM, COL_ROI, REQUIRED_COLUMNS,
} from '../types';

export function parseExcel(file: File): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) {
        reject(new Error('文件读取失败'));
        return;
      }
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<RawRow>(sheet, { defval: '' });
      resolve(rows);
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsArrayBuffer(file);
  });
}

export function validateColumns(rows: RawRow[]): string[] {
  if (rows.length === 0) return ['表格为空'];
  const headers = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));
  return missing;
}

function toNum(val: string | number | undefined): number {
  if (val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function maskOrderAmount(amount: number): string {
  if (amount >= 10000000) return '1000-1500w';
  if (amount >= 5000000) return '500-1000w';
  if (amount >= 1000000) return '100-500w';
  if (amount >= 500000) return '50-100w';
  if (amount >= 300000) return '30-50w';
  if (amount >= 100000) return '10-30w';
  if (amount >= 10000) return '1-10w';
  return '1万以下';
}

export function maskRoi(roi: number): string {
  const floor = Math.floor(roi);
  const ceil = Math.ceil(roi);
  if (floor === ceil) return `${floor}~${floor + 1}`;
  return `${floor}~${ceil}`;
}

export function processCategory(
  rows: RawRow[],
  config: CategoryConfig
): CategoryResult {
  const filtered = rows.filter(config.filterFn);

  const videoMap = new Map<string, {
    totalOrderAmount: number;
    maxConsumptionRow: RawRow;
    maxConsumption: number;
  }>();

  filtered.forEach((row) => {
    const videoName = String(row[COL_VIDEO_NAME] || '').trim();
    if (!videoName) return;

    const consumption = toNum(row[COL_CONSUMPTION]);
    const orderAmount = toNum(row[COL_ORDER_AMOUNT]);

    const existing = videoMap.get(videoName);
    if (existing) {
      existing.totalOrderAmount += orderAmount;
      if (consumption > existing.maxConsumption) {
        existing.maxConsumption = consumption;
        existing.maxConsumptionRow = row;
      }
    } else {
      videoMap.set(videoName, {
        totalOrderAmount: orderAmount,
        maxConsumptionRow: row,
        maxConsumption: consumption,
      });
    }
  });

  const aggregated: AggregatedRow[] = Array.from(videoMap.entries()).map(
    ([videoName, data]) => {
      const r = data.maxConsumptionRow;
      const roi = toNum(r[COL_ROI]);
      return {
        videoName,
        totalOrderAmount: data.totalOrderAmount,
        orderAmountMasked: maskOrderAmount(data.totalOrderAmount),
        orderPrice: Math.round(toNum(r[COL_ORDER_PRICE])),
        ctr: parseFloat(toNum(r[COL_CTR]).toFixed(2)),
        conversionRate: parseFloat(toNum(r[COL_CONVERSION_RATE]).toFixed(2)),
        cpm: parseFloat(toNum(r[COL_CPM]).toFixed(2)),
        roi,
        roiMasked: maskRoi(roi),
        consumption: data.maxConsumption,
      };
    }
  );

  aggregated.sort((a, b) => b.totalOrderAmount - a.totalOrderAmount);

  const totalConsumption = aggregated.reduce((s, r) => s + r.consumption, 0);
  const totalOrderAmount = aggregated.reduce((s, r) => s + r.totalOrderAmount, 0);
  const avgRoi = totalConsumption > 0 ? totalOrderAmount / totalConsumption : 0;

  return {
    config,
    rows: aggregated,
    totalConsumption,
    totalOrderAmount,
    avgRoi,
  };
}
