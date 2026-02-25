import { Table, Tag, Button, MessagePlugin } from 'tdesign-react';
import { DownloadIcon } from 'tdesign-icons-react';
import * as XLSX from 'xlsx';
import { CategoryResult, AggregatedRow } from '../types';

interface CategoryTableProps {
  result: CategoryResult;
}

const columns = [
  {
    colKey: 'rank',
    title: '排名',
    width: 60,
    align: 'center' as const,
    cell: ({ rowIndex }: { rowIndex: number }) => (
      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
        rowIndex < 3
          ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm'
          : 'bg-gray-100 text-gray-500'
      }`}>
        {rowIndex + 1}
      </span>
    ),
  },
  {
    colKey: 'videoName',
    title: '视频号名称',
    width: 200,
    ellipsis: true,
  },
  {
    colKey: 'orderAmountMasked',
    title: '下单金额(元)',
    width: 130,
    align: 'center' as const,
    cell: ({ row }: { row: AggregatedRow }) => (
      <Tag variant="light" theme="primary" style={{ borderRadius: 8 }}>
        {row.orderAmountMasked}
      </Tag>
    ),
  },
  {
    colKey: 'orderPrice',
    title: '下单单价(元)',
    width: 110,
    align: 'right' as const,
    cell: ({ row }: { row: AggregatedRow }) => (
      <span className="number-cell">{row.orderPrice}</span>
    ),
  },
  {
    colKey: 'ctr',
    title: 'ctr(%)',
    width: 90,
    align: 'right' as const,
    cell: ({ row }: { row: AggregatedRow }) => (
      <span className="number-cell">{row.ctr.toFixed(2)}</span>
    ),
  },
  {
    colKey: 'conversionRate',
    title: '综合目标转化率(%)',
    width: 150,
    align: 'right' as const,
    cell: ({ row }: { row: AggregatedRow }) => (
      <span className="number-cell">{row.conversionRate.toFixed(2)}</span>
    ),
  },
  {
    colKey: 'cpm',
    title: '竞价CPM(元)',
    width: 120,
    align: 'right' as const,
    cell: ({ row }: { row: AggregatedRow }) => (
      <span className="number-cell">{row.cpm.toFixed(2)}</span>
    ),
  },
  {
    colKey: 'roiMasked',
    title: '下单ROI',
    width: 100,
    align: 'center' as const,
    cell: ({ row }: { row: AggregatedRow }) => (
      <Tag
        variant="light"
        theme={row.roi >= 2 ? 'success' : row.roi >= 1 ? 'warning' : 'danger'}
        style={{ borderRadius: 8 }}
      >
        {row.roiMasked}
      </Tag>
    ),
  },
];

export default function CategoryTable({ result }: CategoryTableProps) {
  const handleExport = () => {
    const exportData = result.rows.map((row, idx) => ({
      '排名': idx + 1,
      '视频号名称': row.videoName,
      '下单金额(元)': row.orderAmountMasked,
      '下单单价(元)': row.orderPrice,
      'ctr(%)': row.ctr.toFixed(2),
      '综合目标转化率(%)': row.conversionRate.toFixed(2),
      '竞价CPM(元)': row.cpm.toFixed(2),
      '下单ROI': row.roiMasked,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, result.config.label);
    XLSX.writeFile(wb, `竞品分析_${result.config.label}.xlsx`);
    MessagePlugin.success('导出成功');
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{result.config.icon}</span>
          <div>
            <h4 className="font-semibold text-gray-800">{result.config.label}</h4>
            <p className="text-xs text-gray-400">
              共 {result.rows.length} 个竞品视频号，按下单金额降序排列
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="small"
          icon={<DownloadIcon />}
          onClick={handleExport}
          style={{ borderRadius: 8 }}
        >
          导出该类目
        </Button>
      </div>

      <Table
        data={result.rows}
        columns={columns}
        rowKey="videoName"
        size="small"
        bordered
        stripe
        hover
        maxHeight={520}
        style={{ borderRadius: 12, overflow: 'hidden' }}
      />
    </div>
  );
}
