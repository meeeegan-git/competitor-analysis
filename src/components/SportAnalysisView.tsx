import { useState, useRef } from 'react';

// 类型定义
interface DimItem {
  label: string;
  count: number;
  pct: number;
}

interface ExampleItem {
  pn: string;
  ml: string;
  cs: number;
  ca: string;
}

interface ComboItem {
  script: string;
  hook: string;
  persona: string;
  count: number;
  pct: number;
  example: {
    pn: string;
    ml: string;
    cs: number;
    sellingPoint: string;
  } | null;
}

interface AnalysisData {
  name: string;
  total: number;
  weeks: string[];
  dimensions: {
    hook: DimItem[];
    persona: DimItem[];
    sellingPoint: DimItem[];
    scriptStructure: DimItem[];
  };
  topCombos: ComboItem[];
  examplesByDim: {
    [dim: string]: { [label: string]: ExampleItem };
  };
}

interface SportAnalysisViewProps {
  data: AnalysisData;
  crossIndustryData?: AnalysisData; // 跨行业参考数据
}

const DIM_LABELS: Record<string, string> = {
  hook: '情绪钩子 (前3秒)',
  persona: '出镜角色',
  sellingPoint: '核心卖点',
  scriptStructure: '脚本结构',
};

const DIM_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  hook: { bg: 'bg-purple-50', text: 'text-purple-700', bar: 'bg-purple-500' },
  persona: { bg: 'bg-blue-50', text: 'text-blue-700', bar: 'bg-blue-500' },
  sellingPoint: { bg: 'bg-green-50', text: 'text-green-700', bar: 'bg-green-500' },
  scriptStructure: { bg: 'bg-orange-50', text: 'text-orange-700', bar: 'bg-orange-500' },
};

const DIM_DESCRIPTIONS: Record<string, string> = {
  hook: '素材前3秒如何抓住用户注意力',
  persona: '视频中出镜的人物类型',
  sellingPoint: '素材主打的核心卖点方向',
  scriptStructure: '视频整体的内容组织方式',
};

export default function SportAnalysisView({ data, crossIndustryData }: SportAnalysisViewProps) {
  const [activeDim, setActiveDim] = useState<string>('hook');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 概览卡片 */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-800">{data.name} 爆款素材拆解</h2>
            <p className="text-sm text-gray-500 mt-1">
              基于近4周 <span className="font-semibold text-primary-600">{data.total}</span> 条爆款素材的标签分析，帮助广告主快速复刻高消耗素材
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">数据周期</p>
            <p className="text-sm font-medium text-gray-600">{data.weeks[data.weeks.length-1]} ~ {data.weeks[0]}</p>
          </div>
        </div>

        {/* 四维度概览 */}
        <div className="grid grid-cols-4 gap-3 mt-4">
          {(['hook', 'persona', 'sellingPoint', 'scriptStructure'] as const).map(dim => {
            const items = data.dimensions[dim];
            const top = items[0];
            const colors = DIM_COLORS[dim];
            return (
              <button
                key={dim}
                onClick={() => setActiveDim(dim)}
                className={`p-4 rounded-xl border transition-all text-left cursor-pointer ${
                  activeDim === dim
                    ? `${colors.bg} border-current ring-2 ring-offset-1 ${colors.text} ring-current/20`
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <p className={`text-xs font-medium ${activeDim === dim ? colors.text : 'text-gray-500'}`}>
                  {DIM_LABELS[dim]}
                </p>
                <p className={`text-lg font-bold mt-1 ${activeDim === dim ? colors.text : 'text-gray-800'}`}>
                  {top?.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">占比 {top?.pct}%</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 元素标签 + 数据占比 + 代表案例 */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-lg font-semibold text-gray-800">元素标签分布</h3>
          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${DIM_COLORS[activeDim].bg} ${DIM_COLORS[activeDim].text}`}>
            {DIM_LABELS[activeDim]}
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-5">{DIM_DESCRIPTIONS[activeDim]}</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左侧：占比条形图 */}
          <div className="space-y-3">
            {data.dimensions[activeDim].map((item, idx) => (
              <DimensionBar
                key={item.label}
                item={item}
                rank={idx}
                color={DIM_COLORS[activeDim]}
                total={data.total}
              />
            ))}
          </div>

          {/* 右侧：代表案例视频 */}
          <div>
            <p className="text-sm font-medium text-gray-600 mb-3">TOP 代表案例</p>
            <div className="space-y-3">
              {data.dimensions[activeDim].slice(0, 4).map(item => {
                const example = data.examplesByDim[activeDim]?.[item.label];
                if (!example) return null;
                return (
                  <ExampleCard
                    key={item.label}
                    tagLabel={item.label}
                    tagPct={item.pct}
                    example={example}
                    color={DIM_COLORS[activeDim]}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 脚本模板 + 拍法建议 + 可替换元素 */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-1">爆款脚本模板</h3>
        <p className="text-xs text-gray-400 mb-5">
          基于「脚本结构 × 情绪钩子 × 出镜角色」的高频组合，提炼可复用的拍摄模板
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.topCombos.slice(0, 6).map((combo, idx) => (
            <ScriptTemplateCard key={idx} combo={combo} rank={idx} />
          ))}
        </div>
      </div>

      {/* 跨行业借鉴 */}
      {crossIndustryData && (
        <div className="glass-card p-6 border-l-4 border-l-amber-400">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">💡</span>
            <h3 className="text-lg font-semibold text-gray-800">
              来自「{crossIndustryData.name}」的可借鉴元素
            </h3>
          </div>
          <p className="text-xs text-gray-400 mb-5">
            {data.name === '运动鞋服'
              ? '服饰大盘中验证过的高效元素，可灵活嫁接到运动鞋服素材中'
              : '服饰行业爆款元素参考，适合用品类商家借鉴创意方向'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(['hook', 'persona', 'sellingPoint', 'scriptStructure'] as const).map(dim => {
              const crossItems = crossIndustryData.dimensions[dim];
              const myItems = new Set(data.dimensions[dim].slice(0, 3).map(i => i.label));
              // 找出跨行业有、但本行业不那么突出的元素
              const diff = crossItems.filter(i => !myItems.has(i.label)).slice(0, 3);
              const colors = DIM_COLORS[dim];
              return (
                <div key={dim} className="bg-amber-50/50 rounded-xl p-3 border border-amber-100">
                  <p className={`text-xs font-medium ${colors.text} mb-2`}>{DIM_LABELS[dim]}</p>
                  <div className="space-y-1.5">
                    {diff.map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-xs text-gray-700">{item.label}</span>
                        <span className="text-[10px] text-amber-600 font-medium">{item.pct}%</span>
                      </div>
                    ))}
                    {diff.length === 0 && (
                      <p className="text-[11px] text-gray-400 italic">元素趋同</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// === 子组件 ===

function DimensionBar({ item, rank, color, total }: {
  item: DimItem;
  rank: number;
  color: { bg: string; text: string; bar: string };
  total: number;
}) {
  const maxPct = 60; // 最大宽度对应的百分比
  const barWidth = Math.min((item.pct / maxPct) * 100, 100);

  return (
    <div className="flex items-center gap-3">
      <span className={`w-5 text-right text-xs font-medium ${rank < 3 ? color.text : 'text-gray-400'}`}>
        {rank + 1}
      </span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={`text-sm ${rank < 3 ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
            {item.label}
          </span>
          <span className="text-xs text-gray-400">{item.count}条 ({item.pct}%)</span>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${rank < 3 ? color.bar : 'bg-gray-300'}`}
            style={{ width: `${barWidth}%`, opacity: rank < 3 ? 1 : 0.6 }}
          />
        </div>
      </div>
    </div>
  );
}

function ExampleCard({ tagLabel, tagPct, example, color }: {
  tagLabel: string;
  tagPct: number;
  example: ExampleItem;
  color: { bg: string; text: string; bar: string };
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    if (!example.ml) return;
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play().catch(() => {});
      setPlaying(true);
    }
  };

  return (
    <div className="flex gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:shadow-sm transition-shadow">
      {/* 视频预览 */}
      <div
        className="w-20 h-28 rounded-lg bg-black overflow-hidden flex-shrink-0 cursor-pointer relative group"
        onClick={handlePlay}
      >
        {example.ml ? (
          <>
            <video
              ref={videoRef}
              src={`${example.ml}#t=2`}
              className="w-full h-full object-contain"
              muted
              loop
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            />
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <div className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-gray-400 text-xs">暂无</span>
          </div>
        )}
      </div>

      {/* 信息 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${color.bg} ${color.text}`}>
            {tagLabel}
          </span>
          <span className="text-[10px] text-gray-400">{tagPct}%</span>
        </div>
        <p className="text-xs text-gray-800 font-medium line-clamp-2 leading-snug">{example.pn}</p>
        <p className="text-[10px] text-gray-400 mt-1 truncate">{example.ca}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">
          消耗 <span className="font-medium text-primary-600">{(example.cs / 10000).toFixed(1)}万</span>
        </p>
      </div>
    </div>
  );
}

function ScriptTemplateCard({ combo, rank }: { combo: ComboItem; rank: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    if (!combo.example?.ml) return;
    if (playing) {
      videoRef.current?.pause();
      setPlaying(false);
    } else {
      videoRef.current?.play().catch(() => {});
      setPlaying(true);
    }
  };

  // 根据组合生成拍法建议
  const getShootingTips = (combo: ComboItem): string[] => {
    const tips: string[] = [];

    // 基于脚本结构
    switch (combo.script) {
      case '快速展示型':
        tips.push('节奏紧凑，3-5个镜头快速切换展示产品');
        tips.push('建议15秒内完成核心信息传递');
        break;
      case '明星带货型':
        tips.push('明星/KOL口播推荐 + 产品特写穿插');
        tips.push('利用明星同款标签增加信任感');
        break;
      case '场景种草型':
        tips.push('在真实使用场景中展示产品');
        tips.push('先铺设场景氛围，再自然引出产品');
        break;
      case '痛点解决型':
        tips.push('先展示痛点场景引发共鸣');
        tips.push('再用产品功能逐一解决，形成对比');
        break;
      case '产品展示型':
        tips.push('聚焦产品细节与工艺');
        tips.push('多角度、多光线展示材质质感');
        break;
      case '详细讲解型':
        tips.push('口播讲解产品功能/成分/工艺');
        tips.push('适合高客单价或需要教育的品类');
        break;
      default:
        tips.push('根据产品特性选择合适节奏');
    }

    // 基于角色
    if (combo.persona.includes('运动达人')) {
      tips.push('选择体型好、运动感强的模特');
    } else if (combo.persona.includes('青少年')) {
      tips.push('突出活力、成长、亲子互动场景');
    } else if (combo.persona.includes('情侣')) {
      tips.push('双人互动增加故事性和情感温度');
    }

    return tips;
  };

  // 可替换元素建议
  const getReplaceable = (combo: ComboItem): string[] => {
    const items: string[] = [];
    items.push(`钩子可替换：${combo.hook} → 其他钩子类型`);
    items.push(`角色可替换：${combo.persona} → 适配品牌调性的模特`);
    if (combo.example?.sellingPoint) {
      items.push(`卖点可替换：${combo.example.sellingPoint} → 你的产品核心卖点`);
    }
    return items;
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-4 hover:shadow-md transition-shadow">
      {/* 模板头部 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            rank < 3 ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-500'
          }`}>
            {rank + 1}
          </span>
          <div>
            <p className="text-sm font-semibold text-gray-800">{combo.script}</p>
            <p className="text-[10px] text-gray-400">占比 {combo.pct}% · {combo.count}条素材</p>
          </div>
        </div>
      </div>

      {/* 标签组合 */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-600 border border-purple-100">
          {combo.hook}
        </span>
        <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
          {combo.persona}
        </span>
        {combo.example?.sellingPoint && (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-green-50 text-green-600 border border-green-100">
            {combo.example.sellingPoint}
          </span>
        )}
      </div>

      {/* 代表案例 + 拍法建议 */}
      <div className="flex gap-3">
        {/* 视频 */}
        {combo.example?.ml && (
          <div
            className="w-16 h-24 rounded-lg bg-black overflow-hidden flex-shrink-0 cursor-pointer relative group"
            onClick={handlePlay}
          >
            <video
              ref={videoRef}
              src={`${combo.example.ml}#t=2`}
              className="w-full h-full object-contain"
              muted
              loop
              playsInline
              preload="metadata"
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            />
            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors">
                <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                  <svg className="w-3 h-3 text-gray-700 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 拍法建议 */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-gray-600 mb-1.5">拍法建议</p>
          <ul className="space-y-1">
            {getShootingTips(combo).map((tip, i) => (
              <li key={i} className="text-[11px] text-gray-500 leading-snug flex gap-1">
                <span className="text-primary-400 flex-shrink-0">•</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* 可替换元素 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-[11px] font-medium text-gray-500 mb-1.5">🔄 可替换元素</p>
        <div className="space-y-1">
          {getReplaceable(combo).map((item, i) => (
            <p key={i} className="text-[10px] text-gray-400 leading-snug">{item}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
