import { useState } from 'react';
import { Tag, Statistic, Space } from 'tdesign-react';
import { CategoryResult } from '../types';
import CategoryTable from './CategoryTable';
import { maskOrderAmount, maskRoi } from '../utils/analyzer';

interface ResultViewProps {
  results: CategoryResult[];
}

export default function ResultView({ results }: ResultViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>(
    results.find(r => r.rows.length > 0)?.config.key || results[0].config.key
  );

  const activeResult = results.find(r => r.config.key === activeCategory);
  const totalRows = results.reduce((s, r) => s + r.rows.length, 0);
  const totalOrderAmount = results.reduce((s, r) => s + r.totalOrderAmount, 0);
  const totalConsumption = results.reduce((s, r) => s + r.totalConsumption, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <Statistic title="分析类目" value={results.filter(r => r.rows.length > 0).length} suffix={`/ ${results.length}`} />
        </div>
        <div className="glass-card p-5">
          <Statistic title="竞品视频号" value={totalRows} suffix="个" />
        </div>
        <div className="glass-card p-5">
          <Statistic title="总下单金额(脱敏)" value={maskOrderAmount(totalOrderAmount) as any} />
        </div>
        <div className="glass-card p-5">
          <Statistic title="总体ROI(脱敏)" value={(totalConsumption > 0 ? maskRoi(totalOrderAmount / totalConsumption) : '-') as any} />
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-700">类目分析结果</h3>
          <Space size="small">
            {results.map((r) => (
              <Tag
                key={r.config.key}
                theme={r.config.key === activeCategory ? 'primary' : 'default'}
                variant={r.config.key === activeCategory ? 'dark' : 'outline'}
                onClick={() => setActiveCategory(r.config.key)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 20,
                  background: r.config.key === activeCategory
                    ? `linear-gradient(135deg, ${r.config.color}, ${r.config.color}CC)`
                    : undefined,
                  borderColor: r.config.key === activeCategory ? r.config.color : undefined,
                }}
              >
                {r.config.icon} {r.config.label}
                <span className="ml-1 opacity-70">({r.rows.length})</span>
              </Tag>
            ))}
          </Space>
        </div>

        {activeResult && activeResult.rows.length > 0 ? (
          <CategoryTable result={activeResult} />
        ) : (
          <div className="py-20 text-center text-gray-300">
            <p className="text-4xl mb-3">📭</p>
            <p>该类目未匹配到数据</p>
          </div>
        )}
      </div>
    </div>
  );
}
