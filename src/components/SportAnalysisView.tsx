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
  { key: 'script', label: '脚本骨架', desc: '整条素材的内容组织方式', color: 'text-rose-700', bg: 'bg-rose-50' },
];

export default function SportAnalysisView({ data }: { data: AnalysisData }) {
  const [ownExpanded, setOwnExpanded] = useState<number | null>(0);
  const [benchExpanded, setBenchExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-8 animate-fade-in">
      <ReportHeader data={data} />

      <ElementValidation data={data} title={`${data.name}爆款元素：关键帧拆解 + 数据验证`} />

      <TimelineValidation frameStats={data.frameStats} />

      <CreativeFormulaSection data={data} />

      <CombinationStrategySection data={data} />

      <ParadigmSection title={`${data.name}可复刻脚本骨架`} paradigms={data.paradigms} />

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
      <ParadigmSection title="服饰大盘可借鉴脚本骨架" paradigms={data.apparelBenchmark.paradigms} compact />
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

function CreativeFormulaSection({ data }: { data: AnalysisData }) {
  const formulas = data.paradigms.slice(0, 5).map((p, idx) => {
    const example = data.topItems.find(item => item.rank === p.exampleRank) || data.topItems[idx];
    const mainFrames = example?.keyframes.filter(frame => [1, 3, 5, 9, 13, 15].includes(frame.time)) || [];
    return { ...p, example, mainFrames, index: idx + 1 };
  });

  return (
    <section className="glass-card p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{data.name}爆款创意公式</h2>
          <p className="text-sm text-gray-500 mt-1">
            借鉴参考页的“公式化拆解”方式，但不照搬名称：每个公式都由TOP50里的关键元素组合、消耗占比和代表素材关键帧共同验证。
          </p>
        </div>
        <div className="px-3 py-2 rounded-xl bg-primary-50 text-primary-700 text-xs font-medium whitespace-nowrap">
          公式 = 钩子 × 画面载体 × 场景 × 证明 × 收口
        </div>
      </div>

      <div className="space-y-5">
        {formulas.map(formula => {
          if (!formula.example) return null;
          return (
            <div key={`${formula.script}-${formula.hook}-${formula.role}`} className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 rounded-lg bg-primary-600 text-white text-xs font-bold">创意公式 {formula.index}</span>
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">消耗贡献 {formula.costShare}%</span>
                      <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-xs">样本 {formula.count} 条</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">
                      {formula.hook} × {formula.example.tags.visual} × {formula.example.tags.scene}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      代表素材：#{formula.example.rank} {formula.example.pn}
                    </p>
                  </div>
                  <div className="text-right text-xs text-gray-400">
                    <p>CTR {formula.example.ctr}%</p>
                    <p>3秒完播 {formula.example.vtr}%</p>
                    <p>播放时长 {formula.example.dur}s</p>
                  </div>
                </div>
              </div>

              <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-5">
                  <p className="text-sm font-bold text-gray-800 mb-2">关键帧证据</p>
                  <FormulaScreenshotStrip item={formula.example} frames={formula.mainFrames} />
                </div>

                <div className="lg:col-span-4 space-y-3">
                  <FormulaBlock
                    title="爆款关键元素"
                    items={[
                      `前3秒钩子：${formula.hook}`,
                      `出镜/角色：${formula.role}`,
                      `视觉载体：${formula.example.tags.visual}`,
                      `信任证明：${formula.example.tags.proof}`,
                    ]}
                  />
                  <FormulaBlock
                    title="按这个顺序拍"
                    items={buildFormulaSteps(formula.example)}
                  />
                </div>

                <div className="lg:col-span-3 space-y-3">
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
                    <p className="text-xs font-bold text-amber-700">不变骨架</p>
                    <p className="text-xs text-amber-700 leading-relaxed mt-1">
                      {formula.hook}抓停 → {formula.example.tags.focus}证据 → {formula.example.tags.scene}代入 → {formula.example.tags.proof} → 权益/行动收口
                    </p>
                  </div>
                  <div className="rounded-xl bg-green-50 border border-green-100 p-3">
                    <p className="text-xs font-bold text-green-700">可替换变量</p>
                    <p className="text-xs text-green-700 leading-relaxed mt-1">
                      产品SKU、目标人群、出镜角色、使用场景、证明方式、价格权益都可替换；但“钩子→证据→场景→信任→收口”的顺序不要变。
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FormulaScreenshotStrip({ item, frames }: { item: MaterialItem; frames: KeyframeAnalysis[] }) {
  const [shots, setShots] = useState<Record<number, string>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureIndexRef = useRef(0);
  const timesKey = frames.map(frame => frame.time).join(',');

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !timesKey) return;

    const times = timesKey.split(',').map(Number);
    setShots({});
    captureIndexRef.current = 0;

    const seek = () => {
      const time = times[captureIndexRef.current];
      if (Number.isFinite(time)) {
        const safeTime = video.duration ? Math.min(time, Math.max(video.duration - 0.1, 0)) : time;
        video.currentTime = safeTime;
      }
    };

    const capture = () => {
      const time = times[captureIndexRef.current];
      if (!Number.isFinite(time)) return;
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        canvas.width = video.videoWidth || 360;
        canvas.height = video.videoHeight || 640;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.68);
        if (dataUrl && dataUrl !== 'data:,') setShots(prev => ({ ...prev, [time]: dataUrl }));
      } catch {
        return;
      }
      captureIndexRef.current += 1;
      if (captureIndexRef.current < times.length) seek();
    };

    video.addEventListener('loadedmetadata', seek);
    video.addEventListener('seeked', capture);
    video.load();
    return () => {
      video.removeEventListener('loadedmetadata', seek);
      video.removeEventListener('seeked', capture);
    };
  }, [item.ml, timesKey]);

  return (
    <div>
      <video ref={videoRef} src={item.ml} className="hidden" crossOrigin="anonymous" muted playsInline preload="auto" />
      <canvas ref={canvasRef} className="hidden" />
      <div className="grid grid-cols-6 gap-2">
        {frames.map(frame => (
          <div key={frame.time} className="rounded-lg overflow-hidden border border-gray-100 bg-gray-900">
            <div className="h-28 relative flex items-center justify-center">
              {shots[frame.time] ? (
                <img src={shots[frame.time]} alt={`${frame.time}s`} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[10px] text-white/60">截帧中</span>
              )}
              <span className="absolute left-1 top-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-bold">{frame.time}s</span>
            </div>
            <div className="bg-white p-1.5">
              <p className="text-[10px] text-gray-700 font-medium truncate">{frame.phase}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FormulaBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-3">
      <p className="text-xs font-bold text-gray-800 mb-2">{title}</p>
      <ul className="space-y-1.5">
        {items.map(item => (
          <li key={item} className="text-xs text-gray-600 leading-snug flex gap-1.5">
            <span className="text-primary-500 flex-shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function buildFormulaSteps(item: MaterialItem) {
  return [
    `1秒：${item.keyframes.find(f => f.time === 1)?.objective || item.tags.hook}`,
    `3秒：把${item.tags.focus}和用户关系讲清楚`,
    `5-9秒：用${item.tags.visual}/${item.tags.proof}证明卖点`,
    `13-15秒：权益信息与行动入口同屏收口`,
  ];
}

function CombinationStrategySection({ data }: { data: AnalysisData }) {
  const topFormula = data.paradigms[0];
  const secondFormula = data.paradigms[1];
  const apparelFormula = data.apparelBenchmark.paradigms[0];
  const topHook = data.elementStats.hook?.[0]?.label || '高频钩子';
  const topProof = data.elementStats.proof?.[0]?.label || '信任证明';
  const apparelHook = data.apparelBenchmark.elementStats.hook?.[0]?.label || '服饰大盘钩子';

  const strategies = [
    {
      title: '启动测试组合',
      badge: '先跑通',
      body: `优先用“${topHook} + ${topProof}”做3-5条短素材，保持同一产品，替换开场截图和口播角度，验证CTR与3秒完播。`,
      steps: ['1个主推SKU', '3个不同前3秒钩子', '同一套权益收口', '看CTR/3秒完播决定放量'],
    },
    {
      title: '放量复制组合',
      badge: '扩大素材池',
      body: `围绕“${topFormula?.script || '最高贡献脚本'}”复制多条：不改骨架，只替换人设、场景和证明方式，避免每条都重新发明脚本。`,
      steps: ['骨架不变', '人设替换', '场景替换', '证明替换'],
    },
    {
      title: '服饰大盘迁移组合',
      badge: '跨类目借鉴',
      body: `从服饰大盘借“${apparelHook}”的开场方式，但中段必须换成${data.name}自己的产品证据，避免只学表面穿搭/颜值。`,
      steps: ['大盘钩子', `${data.name}卖点`, '本品使用场景', '本品权益收口'],
    },
    {
      title: '资源受限组合',
      badge: '低成本可拍',
      body: `如果没有明星/达人资源，优先选择“${secondFormula?.hook || topHook} + 素人/店主讲解 + 细节证明”的组合，把预算放在关键帧画面和字幕。`,
      steps: ['素人出镜', '产品细节', '对比证明', '清晰字幕'],
    },
    {
      title: '高客单/强信任组合',
      badge: '增强说服',
      body: `高客单商品不要只拼前3秒，应把9秒左右的“${topProof}”做重：口碑、认证、材质实验、使用前后对比至少选一种。`,
      steps: ['钩子不要夸张', '证明要可视化', '价格解释价值', '售后降低风险'],
    },
  ];

  return (
    <section className="glass-card p-6">
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-gray-800">组合策略建议</h2>
          <p className="text-sm text-gray-500 mt-1">把创意公式组合成可执行的拍摄与投放策略：先测钩子，再复制骨架，最后用服饰大盘元素扩展素材池。</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-bold">输出给编导/投手/广告主</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {strategies.map((strategy, idx) => (
          <div key={strategy.title} className="rounded-2xl bg-white border border-gray-100 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className="w-7 h-7 rounded-lg bg-primary-500 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium">{strategy.badge}</span>
            </div>
            <h3 className="text-sm font-bold text-gray-800">{strategy.title}</h3>
            <p className="text-xs text-gray-600 leading-relaxed mt-2">{strategy.body}</p>
            <div className="mt-3 space-y-1.5">
              {strategy.steps.map(step => (
                <div key={step} className="text-[10px] text-gray-500 bg-gray-50 rounded px-2 py-1">{step}</div>
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
      <p className="text-sm text-gray-500 mb-5">脚本骨架按「脚本结构 × 前3秒钩子 × 出镜角色」聚合，并用消耗占比排序。</p>
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
  const [selected, setSelected] = useState(0);
  const [shots, setShots] = useState<Record<number, string>>({});
  const [captureFailed, setCaptureFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureIndexRef = useRef(0);
  const timesKey = item.keyframes.map(frame => frame.time).join(',');

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const times = timesKey.split(',').map(Number);
    setShots({});
    setCaptureFailed(false);
    captureIndexRef.current = 0;

    const seekToCurrent = () => {
      const time = times[captureIndexRef.current];
      if (Number.isFinite(time)) {
        const safeTime = video.duration ? Math.min(time, Math.max(video.duration - 0.1, 0)) : time;
        video.currentTime = safeTime;
      }
    };

    const captureCurrent = () => {
      const time = times[captureIndexRef.current];
      if (!Number.isFinite(time)) return;
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas context unavailable');
        canvas.width = video.videoWidth || 360;
        canvas.height = video.videoHeight || 640;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        if (!dataUrl || dataUrl === 'data:,') throw new Error('empty snapshot');
        setShots(prev => ({ ...prev, [time]: dataUrl }));
      } catch {
        setCaptureFailed(true);
        return;
      }

      captureIndexRef.current += 1;
      if (captureIndexRef.current < times.length) {
        seekToCurrent();
      }
    };

    const onLoaded = () => seekToCurrent();
    const onSeeked = () => captureCurrent();
    const onError = () => setCaptureFailed(true);

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };
  }, [item.ml, timesKey]);

  const selectedFrame = item.keyframes[selected] || item.keyframes[0];
  const selectedShot = selectedFrame ? shots[selectedFrame.time] : undefined;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">🎬 对应帧逐秒拆解</h3>
          <p className="text-xs text-gray-400 mt-0.5">单条视频自动截取8张关键帧截图，一行看完整条素材节奏。</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="px-2 py-0.5 rounded-full bg-gray-100">1/3/5/7/9/11/13/15s</span>
          <span>{captureFailed ? '截图失败，请打开视频源核对' : `${Object.keys(shots).length}/${item.keyframes.length}帧`}</span>
        </div>
      </div>

      <video
        ref={videoRef}
        src={item.ml}
        className="hidden"
        crossOrigin="anonymous"
        muted
        playsInline
        preload="auto"
      />
      <canvas ref={canvasRef} className="hidden" />

      <div className="grid grid-cols-8 gap-3 overflow-x-auto pb-1">
        {item.keyframes.map((frame, idx) => (
          <button
            key={frame.time}
            onClick={() => setSelected(idx)}
            className={`min-w-[118px] rounded-xl overflow-hidden border text-left transition-all cursor-pointer ${
              selected === idx
                ? 'border-primary-500 ring-2 ring-primary-100 shadow-sm'
                : 'border-gray-100 hover:border-primary-200'
            }`}
          >
            <div className="h-40 bg-gray-900 relative flex items-center justify-center">
              {shots[frame.time] ? (
                <img src={shots[frame.time]} alt={`${frame.time}s关键帧`} className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-white/70">
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span className="text-[10px]">截帧中</span>
                </div>
              )}
              <span className="absolute left-2 top-2 px-2 py-0.5 rounded bg-black/65 text-white text-xs font-bold">{frame.time}s</span>
            </div>
            <div className="p-2 bg-white">
              <p className="text-[11px] font-bold text-primary-700 truncate">{frame.phase}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{frame.objective}</p>
            </div>
          </button>
        ))}
      </div>

      {selectedFrame && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3 rounded-xl bg-gray-900 overflow-hidden min-h-[300px] flex items-center justify-center">
            {selectedShot ? (
              <img src={selectedShot} alt={`${selectedFrame.time}s关键帧大图`} className="w-full h-full object-contain" />
            ) : (
              <div className="text-white/60 text-xs">正在生成截图...</div>
            )}
          </div>
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-2 gap-3">
            <FrameDetailCard title={`${selectedFrame.time}s · ${selectedFrame.phase}`} desc={selectedFrame.objective} />
            <FrameDetailCard title="画面元素" desc={selectedFrame.visualTags.join(' / ')} />
            <FrameDetailCard title="文案信息" desc={selectedFrame.copyTags.join(' / ')} />
            <FrameDetailCard title="拍法" desc={selectedFrame.shot} />
            <div className="md:col-span-2 p-3 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs text-blue-700 font-bold">复刻要点</p>
              <p className="text-xs text-blue-600 leading-relaxed mt-1">{selectedFrame.replicate}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FrameDetailCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="p-3 rounded-xl bg-white border border-gray-100">
      <p className="text-xs font-bold text-gray-800">{title}</p>
      <p className="text-xs text-gray-600 leading-relaxed mt-1">{desc}</p>
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
