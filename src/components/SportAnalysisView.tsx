import { useEffect, useRef, useState } from 'react';

interface ElementTags {
  hook: string;
  scene: string;
  role: string;
  proof: string;
  script: string;
  visual: string;
  focus: string;
}

interface KeyframeAnalysis {
  time: number;
  phase: string;
  objective: string;
  visualTags: string[];
  copyTags: string[];
  shot: string;
  replicate: string;
}

interface MaterialItem {
  rank: number;
  id: string;
  customerKey: string;
  ind: string;
  ca: string;
  pn: string;
  ml: string;
  cs: number;
  ctr: number;
  cvr: number;
  vtr: number;
  dur: number;
  roi: number;
  tags: ElementTags;
  keyframes: KeyframeAnalysis[];
}

interface ElementStat {
  label: string;
  count: number;
  pct: number;
  costShare: number;
  exampleRank: number;
  exampleName: string;
  exampleVideo: string;
  exampleTime: number;
}

interface FrameStat {
  time: number;
  topElements: { label: string; count: number; pct: number; costShare: number }[];
}

interface Paradigm {
  script: string;
  hook: string;
  role: string;
  count: number;
  pct: number;
  costShare: number;
  exampleRank: number;
  exampleName: string;
}

interface BenchmarkData {
  name: string;
  topItems: MaterialItem[];
  elementStats: Record<DimKey, ElementStat[]>;
  frameStats: FrameStat[];
  paradigms: Paradigm[];
}

interface AnalysisData {
  name: string;
  week: string;
  dataRules: {
    rawRows: number;
    validRowsAfterBlankRemoval: number;
    dedupeRule: string;
    customerCapRule: string;
    benchmarkRule: string;
    keyframeTimes: number[];
  };
  totalCountAfterRules: number;
  topItems: MaterialItem[];
  elementStats: Record<DimKey, ElementStat[]>;
  frameStats: FrameStat[];
  paradigms: Paradigm[];
  apparelBenchmark: BenchmarkData;
}

type DimKey = 'hook' | 'scene' | 'role' | 'focus' | 'proof' | 'script' | 'visual';

const DIMENSIONS: { key: DimKey; label: string; desc: string; color: string; bg: string }[] = [
  { key: 'hook', label: '前3秒钩子', desc: '素材最先用什么抓停用户', color: 'text-purple-700', bg: 'bg-purple-50' },
  { key: 'visual', label: '视觉载体', desc: '画面主要依靠什么呈现', color: 'text-blue-700', bg: 'bg-blue-50' },
  { key: 'scene', label: '场景', desc: '用户被带入的使用场景', color: 'text-cyan-700', bg: 'bg-cyan-50' },
  { key: 'role', label: '出镜角色', desc: '谁在视频里完成种草/演示', color: 'text-indigo-700', bg: 'bg-indigo-50' },
  { key: 'focus', label: '核心卖点', desc: '主打哪类产品利益点', color: 'text-green-700', bg: 'bg-green-50' },
  { key: 'proof', label: '信任证明', desc: '用什么证据降低购买顾虑', color: 'text-amber-700', bg: 'bg-amber-50' },
  { key: 'script', label: '脚本范式', desc: '整条素材的内容骨架', color: 'text-rose-700', bg: 'bg-rose-50' },
];

export default function SportAnalysisView({ data }: { data: AnalysisData }) {
  const [ownExpanded, setOwnExpanded] = useState<number | null>(0);
  const [benchExpanded, setBenchExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-8 animate-fade-in">
      <ReportHeader data={data} />

      <ElementValidation data={data} title={`${data.name}爆款元素：关键帧拆解 + 数据验证`} />

      <TimelineValidation frameStats={data.frameStats} />

      <ParadigmSection title={`${data.name}可复刻脚本范式`} paradigms={data.paradigms} />

      <MaterialList
        title={`${data.name} TOP50 爆款素材逐帧拆解`}
        subtitle="每条素材均按第1/3/5/7/9/11/13/15秒对应帧拆解；重复素材只保留一次，同一客户最多3条。"
        items={data.topItems}
        expanded={ownExpanded}
        setExpanded={setOwnExpanded}
      />

      <div className="glass-card p-6 border-l-4 border-l-amber-400">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">💡</span>
          <div>
            <h2 className="text-xl font-bold text-gray-800">服饰大盘爆款素材元素拆解</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              这里不是另一个运动子类目，而是排除运动鞋服与运动用品后的服饰大盘TOP50，可作为{data.name}商家借鉴的创意库。
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-3 text-xs">
          <RulePill label="大盘规则" value="排除运动鞋服/运动用品" />
          <RulePill label="拆解数量" value="TOP50" />
          <RulePill label="重复素材" value="MD5去重" />
          <RulePill label="客户限额" value="同客户≤3条" />
        </div>
      </div>

      <ElementValidation data={data.apparelBenchmark} title="服饰大盘可借鉴元素：数据占比 + 代表帧" compact />
      <TimelineValidation frameStats={data.apparelBenchmark.frameStats} compact />
      <ParadigmSection title="服饰大盘可借鉴脚本范式" paradigms={data.apparelBenchmark.paradigms} compact />
      <MaterialList
        title="服饰大盘 TOP50 爆款素材逐帧拆解"
        subtitle="这些素材已排除运动鞋服/运动用品自身，用来找跨品类可迁移的钩子、场景、证明方式和收口节奏。"
        items={data.apparelBenchmark.topItems}
        expanded={benchExpanded}
        setExpanded={setBenchExpanded}
        benchmark
      />
    </div>
  );
}

function ReportHeader({ data }: { data: AnalysisData }) {
  const totalCost = data.topItems.reduce((sum, item) => sum + item.cs, 0);
  const avgCtr = avg(data.topItems.map(i => i.ctr));
  const avgVtr = avg(data.topItems.map(i => i.vtr));
  const avgDur = avg(data.topItems.map(i => i.dur));

  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{data.name === '运动鞋服' ? '👟' : '🏋️'}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{data.name}爆款素材创意白皮书</h1>
              <p className="text-sm text-gray-500 mt-1">基于 {data.week} 表格数据，按关键帧和消耗表现反推可复刻元素</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
            <p>原始行数：{data.dataRules.rawRows.toLocaleString()} 行</p>
            <p>有效行数：{data.dataRules.validRowsAfterBlankRemoval.toLocaleString()} 行</p>
            <p>素材池：{data.totalCountAfterRules.toLocaleString()} 条</p>
            <p>关键帧：{data.dataRules.keyframeTimes.join(' / ')} 秒</p>
            <p className="col-span-2">去重：{data.dataRules.dedupeRule}</p>
            <p className="col-span-2">客户限制：{data.dataRules.customerCapRule}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 min-w-[360px]">
          <MetricCard label="TOP50总消耗" value={`${(totalCost / 10000).toFixed(1)}万`} tone="red" />
          <MetricCard label="平均CTR" value={`${avgCtr.toFixed(2)}%`} tone="green" />
          <MetricCard label="平均3秒完播" value={`${avgVtr.toFixed(1)}%`} tone="purple" />
          <MetricCard label="平均播放时长" value={`${avgDur.toFixed(1)}s`} tone="blue" />
        </div>
      </div>
    </div>
  );
}

function ElementValidation({ data, title, compact = false }: { data: AnalysisData | BenchmarkData; title: string; compact?: boolean }) {
  const [active, setActive] = useState<DimKey>('hook');
  const dim = DIMENSIONS.find(d => d.key === active)!;
  const stats = data.elementStats[active] || [];
  const first = stats[0];

  return (
    <section className="glass-card p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <p className="text-sm text-gray-500 mt-1">占比=素材条数占比；消耗占比=该元素在TOP50内贡献的消耗占比。</p>
        </div>
        {first && (
          <div className={`px-4 py-2 rounded-xl ${dim.bg}`}>
            <p className={`text-xs font-medium ${dim.color}`}>当前最高频</p>
            <p className="text-sm font-bold text-gray-800">{first.label} · {first.pct}%</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-7 gap-2 mb-5">
        {DIMENSIONS.map(d => {
          const top = data.elementStats[d.key]?.[0];
          return (
            <button
              key={d.key}
              onClick={() => setActive(d.key)}
              className={`text-left rounded-xl p-3 border transition-all cursor-pointer ${
                active === d.key ? `${d.bg} border-current ${d.color}` : 'bg-white border-gray-100 hover:border-gray-200'
              }`}
            >
              <p className={`text-xs font-semibold ${active === d.key ? d.color : 'text-gray-500'}`}>{d.label}</p>
              <p className="text-xs text-gray-800 font-medium mt-1 truncate">{top?.label || '-'}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{top?.pct || 0}% / 消耗{top?.costShare || 0}%</p>
            </button>
          );
        })}
      </div>

      <div className={`grid ${compact ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-5'} gap-5`}>
        <div className={compact ? '' : 'lg:col-span-3'}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${dim.bg} ${dim.color}`}>{dim.label}</span>
            <span className="text-xs text-gray-400">{dim.desc}</span>
          </div>
          <div className="space-y-3">
            {stats.slice(0, compact ? 6 : 10).map((item, idx) => (
              <ValidatedBar key={item.label} item={item} rank={idx} color={dim.color} />
            ))}
          </div>
        </div>

        <div className={compact ? '' : 'lg:col-span-2'}>
          <p className="text-sm font-semibold text-gray-700 mb-3">代表案例帧</p>
          <div className="grid grid-cols-2 gap-3">
            {stats.slice(0, 4).map(item => (
              <div key={item.label} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="h-40 rounded-lg overflow-hidden bg-black mb-2">
                  <FrameVideo src={item.exampleVideo} time={item.exampleTime || 1} className="w-full h-full object-contain" />
                </div>
                <p className={`text-[11px] font-bold ${dim.color}`}>{item.label}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">#{item.exampleRank} {item.exampleName}</p>
                <p className="text-[10px] text-gray-500 mt-1">占比 {item.pct}% · 消耗占比 {item.costShare}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ValidatedBar({ item, rank, color }: { item: ElementStat; rank: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${rank < 3 ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{rank + 1}</span>
          <span className="text-sm font-medium text-gray-800">{item.label}</span>
        </div>
        <span className="text-xs text-gray-400">{item.count}条 · {item.pct}% · 消耗{item.costShare}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full" style={{ width: `${Math.min(item.costShare, 100)}%` }} />
      </div>
      <p className={`text-[10px] mt-1 ${color}`}>代表：#{item.exampleRank} {item.exampleName}</p>
    </div>
  );
}

function TimelineValidation({ frameStats, compact = false }: { frameStats: FrameStat[]; compact?: boolean }) {
  return (
    <section className="glass-card p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">关键帧时间线元素验证</h2>
      <p className="text-sm text-gray-500 mb-5">按第1/3/5/7/9/11/13/15秒聚合TOP50素材的帧级元素，判断哪个时间点应该放什么信息。</p>
      <div className={`grid ${compact ? 'grid-cols-4' : 'grid-cols-8'} gap-3`}>
        {frameStats.map(fs => (
          <div key={fs.time} className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-sm font-bold text-primary-600 mb-2">{fs.time}s</p>
            <div className="space-y-1.5">
              {fs.topElements.slice(0, compact ? 3 : 4).map(el => (
                <div key={el.label} className="flex items-center justify-between gap-1">
                  <span className="text-[10px] text-gray-600 truncate">{el.label}</span>
                  <span className="text-[10px] font-medium text-gray-400">{el.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ParadigmSection({ title, paradigms, compact = false }: { title: string; paradigms: Paradigm[]; compact?: boolean }) {
  return (
    <section className="glass-card p-6">
      <h2 className="text-lg font-bold text-gray-800 mb-1">{title}</h2>
      <p className="text-sm text-gray-500 mb-5">脚本范式按「脚本结构 × 前3秒钩子 × 出镜角色」聚合，并用消耗占比排序。</p>
      <div className={`grid ${compact ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'} gap-4`}>
        {paradigms.slice(0, compact ? 4 : 8).map((p, idx) => (
          <div key={`${p.script}-${p.hook}-${p.role}`} className="rounded-xl bg-white border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{idx + 1}</span>
              <span className="text-xs text-red-500 font-semibold">消耗{p.costShare}%</span>
            </div>
            <p className="text-sm font-bold text-gray-800">{p.script}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Tag>{p.hook}</Tag>
              <Tag>{p.role}</Tag>
            </div>
            <p className="text-xs text-gray-400 mt-3">{p.count}条素材 · 条数占比{p.pct}%</p>
            <p className="text-[11px] text-gray-500 mt-2 line-clamp-2">代表：#{p.exampleRank} {p.exampleName}</p>
            <div className="mt-3 p-2 bg-amber-50 rounded-lg">
              <p className="text-[10px] text-amber-700 font-medium">复刻骨架</p>
              <p className="text-[10px] text-amber-600 mt-0.5">钩子抓停 → 卖点证据 → 场景代入 → 信任证明 → 价格收口</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function MaterialList({
  title,
  subtitle,
  items,
  expanded,
  setExpanded,
  benchmark = false,
}: {
  title: string;
  subtitle: string;
  items: MaterialItem[];
  expanded: number | null;
  setExpanded: (idx: number | null) => void;
  benchmark?: boolean;
}) {
  return (
    <section className="space-y-3">
      <div className="glass-card p-5">
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
      </div>
      {items.map((item, idx) => (
        <MaterialCard
          key={item.id}
          item={item}
          expanded={expanded === idx}
          onToggle={() => setExpanded(expanded === idx ? null : idx)}
          benchmark={benchmark}
        />
      ))}
    </section>
  );
}

function MaterialCard({ item, expanded, onToggle, benchmark = false }: { item: MaterialItem; expanded: boolean; onToggle: () => void; benchmark?: boolean }) {
  return (
    <div className={`glass-card overflow-hidden ${expanded ? 'ring-2 ring-primary-200' : ''} ${benchmark ? 'border-l-4 border-l-amber-300' : ''}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors cursor-pointer">
        <RankBadge rank={item.rank} />
        <div className="w-14 h-20 rounded-lg bg-black overflow-hidden flex-shrink-0">
          <FrameVideo src={item.ml} time={1} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{item.pn}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{item.ca}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Tag>{item.tags.hook}</Tag>
            <Tag>{item.tags.scene}</Tag>
            <Tag>{item.tags.script}</Tag>
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">客户:{item.customerKey}</span>
          </div>
        </div>
        <div className="grid grid-cols-5 gap-3 flex-shrink-0">
          <MiniMetric label="消耗" value={`${(item.cs / 10000).toFixed(1)}万`} />
          <MiniMetric label="CTR" value={`${item.ctr}%`} />
          <MiniMetric label="CVR" value={`${item.cvr}%`} />
          <MiniMetric label="3秒完播" value={`${item.vtr}%`} />
          <MiniMetric label="播放" value={`${item.dur}s`} />
        </div>
        <Chevron expanded={expanded} />
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/40 space-y-5">
          <KeyframeGrid item={item} />
          <ReplicationGuide item={item} />
        </div>
      )}
    </div>
  );
}

function KeyframeGrid({ item }: { item: MaterialItem }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800">🎬 对应帧逐秒拆解</h3>
        <p className="text-xs text-gray-400">点击视频可播放核对；默认停在对应秒数。</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {item.keyframes.map(frame => (
          <div key={frame.time} className="rounded-xl bg-white border border-gray-100 overflow-hidden">
            <div className="h-56 bg-black relative">
              <FrameVideo src={item.ml} time={frame.time} className="w-full h-full object-contain" controls />
              <div className="absolute left-2 top-2 px-2 py-0.5 rounded bg-black/60 text-white text-xs font-bold">{frame.time}s</div>
            </div>
            <div className="p-3 space-y-2">
              <div>
                <p className="text-xs font-bold text-primary-700">{frame.phase}</p>
                <p className="text-[11px] text-gray-600 leading-snug mt-0.5">{frame.objective}</p>
              </div>
              <FrameLine label="画面元素" value={frame.visualTags.join(' / ')} />
              <FrameLine label="文案信息" value={frame.copyTags.join(' / ')} />
              <FrameLine label="拍法" value={frame.shot} />
              <div className="p-2 bg-blue-50 rounded-lg">
                <p className="text-[10px] text-blue-700 font-bold">复刻要点</p>
                <p className="text-[10px] text-blue-600 leading-snug mt-0.5">{frame.replicate}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReplicationGuide({ item }: { item: MaterialItem }) {
  const replacements = [
    { label: '钩子', origin: item.tags.hook, replace: '替换为你的最强人群痛点/名人背书/价格利益点' },
    { label: '场景', origin: item.tags.scene, replace: '替换为目标用户最高频的真实使用场景' },
    { label: '角色', origin: item.tags.role, replace: '替换为品牌可获得的模特、达人、素人或店主' },
    { label: '证明', origin: item.tags.proof, replace: '替换为销量、评论、认证、对比实验或真人效果' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h4 className="text-sm font-bold text-gray-800 mb-3">📝 脚本骨架</h4>
        {['1秒抓停', '3秒确认关系', '5秒卖点证据', '7-11秒场景/信任', '13-15秒促销收口'].map((step, idx) => (
          <div key={step} className="flex gap-2 mb-2 last:mb-0">
            <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0">{idx + 1}</span>
            <p className="text-xs text-gray-600 leading-snug">{step}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h4 className="text-sm font-bold text-gray-800 mb-3">🎥 拍法建议</h4>
        <ul className="space-y-2">
          <li className="text-xs text-gray-600">前3秒必须商品与钩子同屏，别先放品牌空镜。</li>
          <li className="text-xs text-gray-600">5-9秒用细节、真人使用、对比或证明补足信任。</li>
          <li className="text-xs text-gray-600">13秒后进入促销，不再引入新卖点。</li>
          <li className="text-xs text-gray-600">字幕只保留关键利益点，避免小字堆砌。</li>
        </ul>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <h4 className="text-sm font-bold text-gray-800 mb-3">🔄 可替换元素</h4>
        <div className="space-y-2">
          {replacements.map(r => (
            <div key={r.label} className="p-2 bg-gray-50 rounded-lg">
              <p className="text-[11px] font-semibold text-gray-700">{r.label}: {r.origin}</p>
              <p className="text-[10px] text-green-600 mt-0.5">可替换：{r.replace}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FrameVideo({ src, time, className, controls = false }: { src: string; time: number; className?: string; controls?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const seek = () => {
      try {
        video.currentTime = time;
        video.pause();
      } catch {
        // ignore seek failures on unloaded videos
      }
    };
    video.addEventListener('loadedmetadata', seek);
    video.addEventListener('canplay', seek, { once: true });
    seek();
    return () => {
      video.removeEventListener('loadedmetadata', seek);
    };
  }, [src, time]);

  return (
    <video
      ref={ref}
      src={`${src}#t=${time}`}
      className={className}
      muted
      playsInline
      preload="metadata"
      controls={controls}
      controlsList="nodownload"
      onContextMenu={(e) => e.preventDefault()}
    />
  );
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'red' | 'green' | 'purple' | 'blue' }) {
  const color = { red: 'text-red-600', green: 'text-green-600', purple: 'text-purple-600', blue: 'text-blue-600' }[tone];
  return (
    <div className="bg-gray-50 rounded-xl p-4 text-center">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function RulePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-amber-50 rounded-lg px-3 py-2">
      <p className="text-[10px] text-amber-600 font-medium">{label}</p>
      <p className="text-xs text-gray-700 mt-0.5">{value}</p>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${rank <= 3 ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{rank}</span>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center min-w-[52px]">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className="text-xs font-semibold text-gray-700 mt-0.5">{value}</p>
    </div>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <span className={`w-6 h-6 flex items-center justify-center text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </span>
  );
}

function FrameLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-[11px] leading-snug">
      <span className="text-gray-400">{label}：</span>
      <span className="text-gray-700">{value}</span>
    </p>
  );
}

function Tag({ children }: { children: string }) {
  return <span className="px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 text-[10px] font-medium">{children}</span>;
}

function avg(values: number[]) {
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}
