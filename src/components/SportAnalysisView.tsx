import { useEffect, useRef, useState } from 'react';

type StageKey = 'first3' | 'mid' | 'end';

interface StageExample {
  rank: number;
  name: string;
  video: string;
  time: number;
  productType: string;
}

interface StageItem {
  label: string;
  count: number;
  costShare: number;
  exampleRank: number;
  exampleName: string;
  exampleVideo: string;
  exampleTime: number;
  exampleProductType: string;
  examples?: StageExample[];
  desc?: string;
  hasSample?: boolean;
}

interface KeyframeAnalysis {
  time: number;
  phase: string;
  objective: string;
}

interface MaterialItem {
  rank: number;
  id: string;
  customerKey: string;
  ind: string;
  ca: string;
  pn: string;
  ml: string;
  ctr: number;
  cvr: number;
  vtr: number;
  dur: number;
  roi: number;
  tags: {
    first3: string;
    mid: string;
    midDesc: string;
    end: string;
    productType: string;
  };
  keyframes: KeyframeAnalysis[];
}

interface StageFormula {
  title: string;
  first3: StageItem[];
  mid: StageItem[];
  end: StageItem[];
  suggestion: string;
}

interface BenchmarkData {
  name: string;
  analysisCount: number;
  breakdownCount: number;
  topItems: MaterialItem[];
  stageAnalysis: Record<StageKey, StageItem[]>;
  stageFormula: StageFormula;
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
  analysisCount: number;
  breakdownCount: number;
  topItems: MaterialItem[];
  stageAnalysis: Record<StageKey, StageItem[]>;
  stageFormula: StageFormula;
  apparelBenchmark: BenchmarkData;
}

const STAGES: { key: StageKey; title: string; subtitle: string; icon: string; tone: string; desc: string }[] = [
  {
    key: 'first3',
    title: '前三秒',
    subtitle: '抓停用户',
    icon: '⚡',
    tone: 'purple',
    desc: '看开头是靠明星达人、微剧情、口播推荐、痛点还是产品视觉抓住注意力。',
  },
  {
    key: 'mid',
    title: '视频中段',
    subtitle: '卖点展示',
    icon: '🎥',
    tone: 'blue',
    desc: '根据具体产品拆卖点：功能型卖点、版型材质、舒适体验、情绪价值、场景功能等。',
  },
  {
    key: 'end',
    title: '视频结尾',
    subtitle: '转化收口',
    icon: '🎯',
    tone: 'green',
    desc: '看结尾是走价格机制、权益赠品、信任背书、行动引导，还是其他营销收口。',
  },
];

const TONE_CLASS: Record<string, { bg: string; text: string; border: string; soft: string }> = {
  purple: { bg: 'bg-purple-600', text: 'text-purple-700', border: 'border-purple-100', soft: 'bg-purple-50' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-700', border: 'border-blue-100', soft: 'bg-blue-50' },
  green: { bg: 'bg-green-600', text: 'text-green-700', border: 'border-green-100', soft: 'bg-green-50' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-700', border: 'border-amber-100', soft: 'bg-amber-50' },
};

export default function SportAnalysisView({ data }: { data: AnalysisData }) {
  const [ownExpanded, setOwnExpanded] = useState<number | null>(0);
  const [benchExpanded, setBenchExpanded] = useState<number | null>(null);

  return (
    <div className="flex gap-6 animate-fade-in">
      <ReportSideNav />
      <div className="min-w-0 flex-1 space-y-10">
        <section id="overview" className="scroll-mt-24">
          <ReportHeader data={data} />
        </section>

        <section id="stages" className="scroll-mt-24">
          <StageAnalysisBlock title={`${data.name}三段式爆款元素拆解`} data={data} />
        </section>

        <section id="formula" className="scroll-mt-24">
          <FormulaBlock data={data} />
        </section>

        <section id="materials" className="scroll-mt-24">
          <MaterialList
            title={`${data.name} TOP10 爆款素材逐帧拆解`}
            subtitle="按前三秒 / 视频中段 / 视频结尾拆素材结构；每条素材保留1/3/5/7/9/11/13/15秒截图。"
            items={data.topItems}
            expanded={ownExpanded}
            setExpanded={setOwnExpanded}
          />
        </section>

        <section id="benchmark" className="scroll-mt-24 space-y-6">
          <BenchmarkHeader data={data} />
          <StageAnalysisBlock title="服饰运动大盘参考：三段式爆款元素" data={data.apparelBenchmark} compact />
          <FormulaBlock data={data.apparelBenchmark} compact />
          <MaterialList
            title="服饰运动大盘 TOP10 爆款素材逐帧拆解"
            subtitle="大盘样本已排除运动户外、运动鞋服、运动用品，用于参考服饰大盘爆款打法。"
            items={data.apparelBenchmark.topItems}
            expanded={benchExpanded}
            setExpanded={setBenchExpanded}
            benchmark
          />
        </section>
      </div>
    </div>
  );
}

function ReportSideNav() {
  const navItems = [
    { href: '#overview', icon: '📌', label: '报告概览', desc: '标题' },
    { href: '#stages', icon: '🧩', label: '三段拆解', desc: '前中后' },
    { href: '#formula', icon: '🔗', label: '组合公式', desc: '怎么组合' },
    { href: '#materials', icon: '🎬', label: '素材拆解', desc: 'TOP10' },
    { href: '#benchmark', icon: '💡', label: '大盘参考', desc: '排除运动' },
  ];

  return (
    <aside className="hidden xl:block w-56 flex-shrink-0">
      <div className="sticky top-24 rounded-3xl border border-gray-100 bg-white/90 backdrop-blur-xl shadow-sm p-4">
        <div className="mb-4 px-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">REPORT NAV</p>
          <p className="text-sm font-bold text-gray-900 mt-1">创意公式目录</p>
        </div>
        <nav className="space-y-1.5">
          {navItems.map(item => (
            <a
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm transition-all hover:bg-primary-50 hover:text-primary-700"
            >
              <span className="w-7 h-7 rounded-xl bg-gray-50 flex items-center justify-center text-sm group-hover:bg-white">
                {item.icon}
              </span>
              <span className="min-w-0">
                <span className="block font-semibold text-gray-700 group-hover:text-primary-700">{item.label}</span>
                <span className="block text-[10px] text-gray-400 mt-0.5">{item.desc}</span>
              </span>
            </a>
          ))}
        </nav>
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-primary-50 to-blue-50 p-3">
          <p className="text-[11px] font-bold text-primary-700">阅读路径</p>
          <p className="text-[11px] text-gray-500 leading-relaxed mt-1">先看三段公式，再展开具体素材关键帧。</p>
        </div>
      </div>
    </aside>
  );
}

function ReportHeader({ data }: { data: AnalysisData }) {
  return (
    <div className="rounded-3xl border border-primary-100 bg-gradient-to-br from-white via-primary-50/40 to-blue-50/50 p-7 shadow-sm">
      <div className="flex items-center gap-4">
        <span className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center text-3xl">
          {data.name === '运动鞋服' ? '👟' : '🏋️'}
        </span>
        <div>
          <p className="text-xs font-bold text-primary-600 tracking-wider uppercase">Creative Formula</p>
          <h1 className="text-3xl font-black text-gray-900 mt-1">{data.name}爆款创意公式拆解</h1>
        </div>
      </div>
    </div>
  );
}

function BenchmarkHeader({ data }: { data: AnalysisData }) {
  return (
    <div className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-5 mb-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h2 className="text-xl font-bold text-gray-900">服饰运动大盘参考</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-3xl">
              这里用于参考服饰大盘爆款打法，已排除“运动户外”“运动鞋服”“运动用品”素材，避免被运动品类自身数据干扰。
            </p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold whitespace-nowrap">跨品类借鉴</span>
      </div>
      <div className="grid grid-cols-4 gap-3 text-xs">
        <RulePill label="排除范围" value="运动户外/运动鞋服/运动用品" />
        <RulePill label="统计样本" value="TOP50" />
        <RulePill label="拆解数量" value="TOP10" />
        <RulePill label="去重规则" value="MD5去重，同客户≤3条" />
      </div>
    </div>
  );
}

function StageAnalysisBlock({ title, data, compact = false }: { title: string; data: AnalysisData | BenchmarkData; compact?: boolean }) {
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <p className="text-xs font-bold text-primary-600 tracking-wider mb-1">THREE-STAGE CREATIVE ANALYSIS</p>
        <h2 className="text-2xl font-black text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">按视频结构拆成“前三秒 / 视频中段 / 视频结尾”，每段只看相对贡献和代表素材，不展示原始消耗金额。</p>
      </div>
      <div className={`grid ${compact ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 xl:grid-cols-3'} gap-5`}>
        {STAGES.map(stage => (
          <StageCard key={stage.key} stage={stage} items={data.stageAnalysis[stage.key] || []} />
        ))}
      </div>
    </section>
  );
}

function StageCard({ stage, items }: { stage: typeof STAGES[number]; items: StageItem[] }) {
  const tone = TONE_CLASS[stage.tone];
  const visibleItems = items.filter(item => item.hasSample !== false && item.costShare > 0).sort((a, b) => b.costShare - a.costShare);
  const missingItems = items.filter(item => item.hasSample === false || item.costShare === 0);
  const top = visibleItems[0];
  return (
    <div className={`rounded-3xl border ${tone.border} ${tone.soft} p-4`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className={`w-11 h-11 rounded-2xl ${tone.bg} text-white flex items-center justify-center text-xl shadow-sm`}>{stage.icon}</span>
          <div>
            <h3 className={`text-2xl font-black ${tone.text}`}>{stage.title}</h3>
            <p className="text-sm font-semibold text-gray-700 mt-0.5">{stage.subtitle}</p>
          </div>
        </div>
        {top && <span className="rounded-full bg-white/80 px-2.5 py-1 text-[11px] font-bold text-gray-600">TOP {top.costShare}%</span>}
      </div>
      <p className="text-xs text-gray-500 leading-relaxed mb-4">{stage.desc}</p>
      <div className="space-y-3">
        {visibleItems.map((item, idx) => (
          <StageElement key={item.label} item={item} rank={idx + 1} tone={tone} />
        ))}
      </div>
      {missingItems.length > 0 && (
        <div className="mt-3 rounded-2xl bg-white/45 border border-white/70 px-3 py-2">
          <p className="text-[10px] font-bold text-gray-400">当前TOP50未命中标签</p>
          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">{missingItems.map(item => item.label).join(' / ')}</p>
        </div>
      )}
    </div>
  );
}

function StageElement({ item, rank, tone }: { item: StageItem; rank: number; tone: typeof TONE_CLASS[string] }) {
  const examples = item.examples?.filter(example => example.video).slice(0, 3) || [];
  return (
    <div className="rounded-2xl border px-3 py-2.5 shadow-sm bg-white/85 border-white">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${rank <= 3 ? `${tone.bg} text-white` : 'bg-gray-100 text-gray-500'}`}>{rank}</span>
          <span className="text-sm font-semibold text-gray-800 truncate">{item.label}</span>
        </div>
        <span className={`text-sm font-black ${tone.text}`}>{item.costShare}%</span>
      </div>
      {item.desc && <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">{item.desc}</p>}
      {examples.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {examples.map(example => (
            <ElementExampleFrame key={`${item.label}-${example.rank}`} example={example} tone={tone} />
          ))}
        </div>
      )}
    </div>
  );
}

function ElementExampleFrame({ example, tone }: { example: StageExample; tone: typeof TONE_CLASS[string] }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 p-1.5">
      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
        <FrameSnapshot src={example.video} time={example.time || 1} className="w-full h-full object-cover" />
      </div>
      <p className={`text-[9px] font-bold ${tone.text} mt-1 line-clamp-1`}>#{example.rank}</p>
      <p className="text-[9px] text-gray-400 line-clamp-1">{example.name}</p>
    </div>
  );
}

function FormulaBlock({ data, compact = false }: { data: AnalysisData | BenchmarkData; compact?: boolean }) {
  const f = data.stageFormula;
  return (
    <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-bold text-primary-600 tracking-wider mb-1">CREATIVE FORMULA</p>
          <h2 className="text-2xl font-black text-gray-900">{data.name}三段式组合公式</h2>
          <p className="text-sm text-gray-500 mt-1">把高贡献元素组合成可执行的拍摄结构，而不是单看某个标签。</p>
        </div>
        <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold">前 → 中 → 后</span>
      </div>
      <div className={`grid ${compact ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1 xl:grid-cols-3'} gap-4`}>
        <FormulaColumn title="前三秒" subtitle="抓停" items={f.first3} tone="purple" />
        <FormulaColumn title="视频中段" subtitle="卖点展示" items={f.mid} tone="blue" />
        <FormulaColumn title="视频结尾" subtitle="转化收口" items={f.end} tone="green" />
      </div>
      <div className="mt-5 rounded-2xl bg-primary-50 border border-primary-100 p-4">
        <p className="text-sm font-bold text-primary-700">组合策略建议</p>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{f.suggestion}</p>
      </div>
    </section>
  );
}

function FormulaColumn({ title, subtitle, items, tone }: { title: string; subtitle: string; items: StageItem[]; tone: string }) {
  const t = TONE_CLASS[tone];
  return (
    <div className={`rounded-3xl border ${t.border} ${t.soft} p-4`}>
      <p className={`text-xl font-black ${t.text}`}>{title}</p>
      <p className="text-xs text-gray-500 mb-3">{subtitle}</p>
      <div className="space-y-2">
        {items.slice(0, 5).map((item, idx) => (
          <div key={item.label} className="rounded-2xl bg-white/85 border border-white p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-800 truncate">{idx + 1}. {item.label}</span>
              <span className={`text-xs font-black ${t.text}`}>{item.costShare}%</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-1 line-clamp-1">代表：#{item.exampleRank} {item.exampleName}</p>
          </div>
        ))}
      </div>
    </div>
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
    <section className="space-y-4">
      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold text-primary-600 tracking-wider mb-1">MATERIAL BREAKDOWN</p>
        <h2 className="text-xl font-black text-gray-900">{title}</h2>
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
    <div className={`rounded-3xl border border-gray-100 bg-white shadow-sm overflow-hidden ${expanded ? 'ring-2 ring-primary-200' : ''} ${benchmark ? 'border-l-4 border-l-amber-300' : ''}`}>
      <button onClick={onToggle} className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50/80 transition-colors cursor-pointer">
        <RankBadge rank={item.rank} />
        <div className="w-14 h-20 rounded-lg bg-black overflow-hidden flex-shrink-0">
          <FrameSnapshot src={item.ml} time={1} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{item.pn}</p>
          <p className="text-xs text-gray-400 truncate mt-0.5">{item.ca}</p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <Tag>{item.tags.first3}</Tag>
            <Tag>{item.tags.mid}</Tag>
            <Tag>{item.tags.end}</Tag>
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px]">客户:{item.customerKey}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 flex-shrink-0">
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
          <MaterialStageGuide item={item} />
        </div>
      )}
    </div>
  );
}

function KeyframeGrid({ item }: { item: MaterialItem }) {
  const [shots, setShots] = useState<Record<string, string>>({});
  const [segments, setSegments] = useState<Record<StageKey, number[]>>({ first3: [], mid: [], end: [] });
  const [captureFailed, setCaptureFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const captureQueueRef = useRef<{ key: string; time: number }[]>([]);
  const captureIndexRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    setShots({});
    setCaptureFailed(false);
    setSegments({ first3: [], mid: [], end: [] });
    captureQueueRef.current = [];
    captureIndexRef.current = 0;

    const buildTimes = (duration: number) => {
      const end = Math.max(duration || 15, 3.5);
      const firstEnd = Math.min(3, end - 0.2);
      const first3 = spreadTimes(0.25, firstEnd, 6);
      const midStart = Math.min(3.2, Math.max(end * 0.22, 3.1));
      const midEnd = Math.max(midStart + 0.5, end - Math.min(3, end * 0.2));
      const mid = spreadTimes(midStart, midEnd, 10);
      const tailStart = Math.max(0.25, end - Math.min(4, Math.max(2.5, end * 0.22)));
      const tail = spreadTimes(tailStart, Math.max(tailStart + 0.2, end - 0.15), 4);
      return { first3, mid, end: tail };
    };

    const startCapture = () => {
      const nextSegments = buildTimes(video.duration || 15);
      setSegments(nextSegments);
      captureQueueRef.current = [
        ...nextSegments.first3.map((time, idx) => ({ key: `first3-${idx}`, time })),
        ...nextSegments.mid.map((time, idx) => ({ key: `mid-${idx}`, time })),
        ...nextSegments.end.map((time, idx) => ({ key: `end-${idx}`, time })),
      ];
      captureIndexRef.current = 0;
      seekToCurrent();
    };

    const seekToCurrent = () => {
      const current = captureQueueRef.current[captureIndexRef.current];
      if (!current) return;
      const safeTime = video.duration ? Math.min(current.time, Math.max(video.duration - 0.1, 0)) : current.time;
      video.currentTime = safeTime;
    };

    const captureCurrent = () => {
      const current = captureQueueRef.current[captureIndexRef.current];
      if (!current) return;
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas context unavailable');
        canvas.width = video.videoWidth || 360;
        canvas.height = video.videoHeight || 640;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        if (!dataUrl || dataUrl === 'data:,') throw new Error('empty snapshot');
        setShots(prev => ({ ...prev, [current.key]: dataUrl }));
      } catch {
        setCaptureFailed(true);
        return;
      }
      captureIndexRef.current += 1;
      if (captureIndexRef.current < captureQueueRef.current.length) seekToCurrent();
    };

    const onError = () => setCaptureFailed(true);
    video.addEventListener('loadedmetadata', startCapture, { once: true });
    video.addEventListener('seeked', captureCurrent);
    video.addEventListener('error', onError);
    video.load();
    return () => {
      video.removeEventListener('seeked', captureCurrent);
      video.removeEventListener('error', onError);
    };
  }, [item.ml]);

  const totalFrames = segments.first3.length + segments.mid.length + segments.end.length;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-800">🎬 三段式视频画面分析</h3>
          <p className="text-xs text-gray-400 mt-0.5">前三秒完整采样，中段抽约10帧，结尾抽3-5帧，按画面判断素材结构。</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className="px-2 py-0.5 rounded-full bg-gray-100">前三秒 / 中段10帧 / 结尾4帧</span>
          <span>{captureFailed ? '截图失败，请打开视频源核对' : `${Object.keys(shots).length}/${totalFrames || 20}帧`}</span>
        </div>
      </div>
      <video ref={videoRef} src={item.ml} className="hidden" crossOrigin="anonymous" muted playsInline preload="auto" />
      <canvas ref={canvasRef} className="hidden" />
      <SegmentFrames title="前三秒完整画面" subtitle={item.tags.first3} tone="purple" times={segments.first3} shots={shots} prefix="first3" />
      <SegmentFrames title="视频中段抽帧分析" subtitle={`${item.tags.mid}：${item.tags.midDesc}`} tone="blue" times={segments.mid} shots={shots} prefix="mid" />
      <SegmentFrames title="视频结尾抽帧分析" subtitle={item.tags.end} tone="green" times={segments.end} shots={shots} prefix="end" />
    </div>
  );
}

function spreadTimes(start: number, end: number, count: number) {
  if (count <= 1) return [Number(start.toFixed(2))];
  const step = (end - start) / (count - 1 || 1);
  return Array.from({ length: count }, (_, idx) => Number((start + step * idx).toFixed(2)));
}

function SegmentFrames({
  title,
  subtitle,
  tone,
  times,
  shots,
  prefix,
}: {
  title: string;
  subtitle: string;
  tone: string;
  times: number[];
  shots: Record<string, string>;
  prefix: string;
}) {
  const t = TONE_CLASS[tone];
  return (
    <div className={`mb-5 last:mb-0 rounded-2xl border ${t.border} ${t.soft} p-3.5`}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className={`text-sm font-black ${t.text}`}>{title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{subtitle}</p>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-white/80 text-[10px] font-bold text-gray-500">{times.length || '-'}帧</span>
      </div>
      <div className={`grid gap-2 ${prefix === 'mid' ? 'grid-cols-5 xl:grid-cols-10' : 'grid-cols-4 xl:grid-cols-6'}`}>
        {times.map((time, idx) => {
          const key = `${prefix}-${idx}`;
          return (
            <div key={key} className="rounded-xl bg-black overflow-hidden relative h-28">
              {shots[key] ? (
                <img src={shots[key]} alt={`${title}-${time}s`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-white/60">截帧中</div>
              )}
              <span className="absolute left-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white font-bold">{time}s</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MaterialStageGuide({ item }: { item: MaterialItem }) {
  const cards = [
    { title: '前三秒', value: item.tags.first3, tip: '负责抓停：让用户知道为什么要继续看。' },
    { title: '视频中段', value: item.tags.mid, tip: item.tags.midDesc },
    { title: '视频结尾', value: item.tags.end, tip: '负责转化：给出行动入口、权益、机制或信任收口。' },
  ];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {cards.map(card => (
        <div key={card.title} className="bg-white rounded-xl border border-gray-100 p-4">
          <h4 className="text-sm font-bold text-gray-800 mb-2">{card.title}</h4>
          <p className="text-xs font-semibold text-primary-600">{card.value}</p>
          <p className="text-xs text-gray-500 leading-relaxed mt-2">{card.tip}</p>
        </div>
      ))}
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

function FrameSnapshot({ src, time, className }: { src: string; time: number; className?: string }) {
  const [shot, setShot] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    setShot(null);
    setFailed(false);
    const seek = () => {
      try {
        const safeTime = video.duration ? Math.min(time, Math.max(video.duration - 0.1, 0)) : time;
        video.currentTime = safeTime;
      } catch {
        setFailed(true);
      }
    };
    const capture = () => {
      try {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('canvas context unavailable');
        canvas.width = video.videoWidth || 360;
        canvas.height = video.videoHeight || 640;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.72);
        if (!dataUrl || dataUrl === 'data:,') throw new Error('empty snapshot');
        setShot(dataUrl);
      } catch {
        setFailed(true);
      }
    };
    video.addEventListener('loadedmetadata', seek);
    video.addEventListener('seeked', capture, { once: true });
    video.addEventListener('error', () => setFailed(true), { once: true });
    video.load();
    return () => {
      video.removeEventListener('loadedmetadata', seek);
    };
  }, [src, time]);

  return (
    <>
      <video ref={videoRef} src={src} className="hidden" crossOrigin="anonymous" muted playsInline preload="auto" />
      <canvas ref={canvasRef} className="hidden" />
      {shot ? (
        <img src={shot} alt={`${time}s代表帧`} className={className} />
      ) : failed ? (
        <div className={`${className || ''} flex items-center justify-center bg-gray-100 text-gray-400 text-[10px]`}>暂无截图</div>
      ) : (
        <div className={`${className || ''} flex items-center justify-center bg-gray-100 text-gray-400 text-[10px]`}>截帧中</div>
      )}
    </>
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

function Tag({ children }: { children: string }) {
  return <span className="px-1.5 py-0.5 rounded bg-primary-50 text-primary-600 text-[10px] font-medium">{children}</span>;
}
