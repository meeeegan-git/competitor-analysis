import { useState, useRef, useEffect, useCallback } from 'react';

// ==================== 类型定义 ====================
interface MaterialItem {
  rank: number;
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
  keyframes: number[];
}

interface AnalysisData {
  name: string;
  week: string;
  totalCount: number;
  topItems: MaterialItem[];
  apparelBenchmark: MaterialItem[];
}

interface SportAnalysisViewProps {
  data: AnalysisData;
}

// ==================== 主组件 ====================
export default function SportAnalysisView({ data }: SportAnalysisViewProps) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [apparelExpanded, setApparelExpanded] = useState<number | null>(null);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ===== 顶部概览 ===== */}
      <OverviewSection data={data} />

      {/* ===== 本行业TOP爆款素材逐帧拆解 ===== */}
      <section className="space-y-4">
        <div className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🔬</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">{data.name} TOP爆款素材·逐帧拆解</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                基于消耗排名TOP20素材，逐帧分析关键画面元素，提炼可复用的创意范式
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
            <span>📊 数据周期：{data.week}</span>
            <span>📦 行业素材池：{data.totalCount.toLocaleString()} 条</span>
            <span>🎯 拆解素材：TOP {data.topItems.length}</span>
          </div>
        </div>

        {/* 素材列表 */}
        {data.topItems.map((item, idx) => (
          <MaterialCard
            key={idx}
            item={item}
            expanded={expandedItem === idx}
            onToggle={() => setExpandedItem(expandedItem === idx ? null : idx)}
          />
        ))}
      </section>

      {/* ===== 服饰大盘爆款素材·元素拆解 ===== */}
      <section className="space-y-4">
        <div className="glass-card p-6 border-l-4 border-l-amber-400">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">💡</span>
            <div>
              <h2 className="text-xl font-bold text-gray-800">服饰大盘爆款素材·元素拆解</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                排除{data.name}自身，服饰大盘消耗TOP50素材的关键帧拆解，可作为跨品类创意借鉴
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            💡 服饰大盘的爆款元素（如情绪钩子、拍摄手法、节奏设计）往往具有跨品类复用价值
          </p>
        </div>

        {data.apparelBenchmark.map((item, idx) => (
          <MaterialCard
            key={`apparel-${idx}`}
            item={item}
            expanded={apparelExpanded === idx}
            onToggle={() => setApparelExpanded(apparelExpanded === idx ? null : idx)}
            isBenchmark
          />
        ))}
      </section>
    </div>
  );
}

// ==================== 概览板块 ====================
function OverviewSection({ data }: { data: AnalysisData }) {
  // 计算汇总指标
  const items = data.topItems;
  const avgCtr = items.reduce((s, i) => s + i.ctr, 0) / items.length;
  const avgVtr = items.reduce((s, i) => s + i.vtr, 0) / items.length;
  const avgDur = items.reduce((s, i) => s + i.dur, 0) / items.length;
  const totalCs = items.reduce((s, i) => s + i.cs, 0);

  const metrics = [
    { label: '素材池规模', value: data.totalCount.toLocaleString(), unit: '条', color: 'text-blue-600' },
    { label: 'TOP20总消耗', value: (totalCs / 10000).toFixed(1), unit: '万', color: 'text-red-600' },
    { label: '平均CTR', value: avgCtr.toFixed(2), unit: '%', color: 'text-green-600' },
    { label: '平均3秒完播', value: avgVtr.toFixed(1), unit: '%', color: 'text-purple-600' },
    { label: '平均播放时长', value: avgDur.toFixed(1), unit: 's', color: 'text-orange-600' },
  ];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg shadow-md">
          {data.name === '运动鞋服' ? '👟' : '🏋️'}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">{data.name} 创意白皮书</h2>
          <p className="text-sm text-gray-500">基于 {data.week} 周 · {data.totalCount.toLocaleString()} 条素材的深度拆解</p>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-3">
        {metrics.map(m => (
          <div key={m.label} className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className={`text-lg font-bold ${m.color}`}>
              {m.value}<span className="text-xs font-normal text-gray-400 ml-0.5">{m.unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 素材卡片（含逐帧拆解） ====================
function MaterialCard({
  item,
  expanded,
  onToggle,
  isBenchmark = false,
}: {
  item: MaterialItem;
  expanded: boolean;
  onToggle: () => void;
  isBenchmark?: boolean;
}) {
  return (
    <div className={`glass-card overflow-hidden transition-all ${
      expanded ? 'ring-2 ring-primary-200' : ''
    } ${isBenchmark ? 'border-l-3 border-l-amber-300' : ''}`}>
      {/* 概览行 */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50/50 transition-colors"
        onClick={onToggle}
      >
        {/* 排名 */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
          item.rank <= 3
            ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-sm'
            : 'bg-gray-100 text-gray-500'
        }`}>
          {item.rank}
        </div>

        {/* 视频缩略图 */}
        <div className="w-12 h-16 rounded-lg bg-black overflow-hidden flex-shrink-0">
          <video
            src={`${item.ml}#t=2`}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
        </div>

        {/* 商品信息 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{item.pn}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{item.ca}</span>
            {isBenchmark && (
              <span className="px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded font-medium">
                {item.ind}
              </span>
            )}
          </div>
        </div>

        {/* 关键指标 */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <MetricBadge label="消耗" value={`${(item.cs / 10000).toFixed(1)}万`} color="red" />
          <MetricBadge label="CTR" value={`${item.ctr}%`} color="green" />
          <MetricBadge label="3秒完播" value={`${item.vtr.toFixed(1)}%`} color="purple" />
          <MetricBadge label="播放时长" value={`${item.dur}s`} color="blue" />
          {item.roi > 0 && <MetricBadge label="ROI" value={item.roi.toFixed(2)} color="orange" />}
        </div>

        {/* 展开箭头 */}
        <div className={`w-6 h-6 flex items-center justify-center text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* 展开详情：逐帧拆解 */}
      {expanded && (
        <div className="border-t border-gray-100 p-5 bg-gray-50/30 space-y-6 animate-fade-in">
          {/* 关键帧时间线 */}
          <KeyframeTimeline item={item} />

          {/* 创意拆解 */}
          <CreativeBreakdown item={item} />
        </div>
      )}
    </div>
  );
}

// ==================== 关键帧时间线 ====================
function KeyframeTimeline({ item }: { item: MaterialItem }) {
  const [frames, setFrames] = useState<{ time: number; dataUrl: string | null }[]>(
    item.keyframes.map(t => ({ time: t, dataUrl: null }))
  );
  const [activeFrame, setActiveFrame] = useState<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturing, setCapturing] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const captureIndex = useRef(0);
  const previewVideoRef = useRef<HTMLVideoElement>(null);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) { setUseFallback(true); setCapturing(false); return; }

      canvas.width = video.videoWidth || 360;
      canvas.height = video.videoHeight || 640;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      // 检查是否真的能导出（CORS限制时会产生空白图）
      if (dataUrl === 'data:,') {
        setUseFallback(true);
        setCapturing(false);
        return;
      }

      const idx = captureIndex.current;
      setFrames(prev => {
        const next = [...prev];
        if (next[idx]) next[idx] = { ...next[idx], dataUrl };
        return next;
      });

      captureIndex.current++;
      if (captureIndex.current < item.keyframes.length) {
        video.currentTime = item.keyframes[captureIndex.current];
      } else {
        setCapturing(false);
      }
    } catch {
      // canvas被污染（tainted），使用fallback方案
      setUseFallback(true);
      setCapturing(false);
    }
  }, [item.keyframes]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleSeeked = () => captureFrame();
    const handleLoadedMetadata = () => {
      captureIndex.current = 0;
      video.currentTime = item.keyframes[0];
    };
    const handleError = () => {
      setUseFallback(true);
      setCapturing(false);
    };

    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('error', handleError);
    };
  }, [captureFrame, item.keyframes]);

  // Fallback模式下，点击某帧时让preview video seek到对应时间
  const handleFrameClick = (idx: number) => {
    setActiveFrame(idx);
    if (useFallback && previewVideoRef.current) {
      previewVideoRef.current.currentTime = item.keyframes[idx];
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm font-semibold text-gray-700">🎬 关键帧拆解</span>
        <span className="text-xs text-gray-400">
          {capturing ? '正在截取关键帧...' : useFallback ? '点击时间点查看对应画面' : `${frames.filter(f => f.dataUrl).length} 帧已截取`}
        </span>
      </div>

      {/* 隐藏的视频和画布（用于截帧） */}
      <video
        ref={videoRef}
        src={item.ml}
        className="hidden"
        crossOrigin="anonymous"
        preload="auto"
        muted
        playsInline
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* 帧缩略图时间线 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {frames.map((frame, idx) => (
          <button
            key={idx}
            onClick={() => handleFrameClick(idx)}
            className={`flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
              activeFrame === idx
                ? 'border-primary-500 ring-2 ring-primary-200 scale-105'
                : 'border-transparent hover:border-gray-300'
            }`}
          >
            <div className="w-16 h-28 bg-gray-200 relative">
              {frame.dataUrl ? (
                <img src={frame.dataUrl} alt={`${frame.time}s`} className="w-full h-full object-cover" />
              ) : useFallback ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-800">
                  <span className="text-white text-xs font-bold">{frame.time}s</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] text-center py-0.5">
                {frame.time}s
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* 选中帧大图 + 分析 */}
      <div className="mt-3 flex gap-4">
        <div className="w-48 h-80 rounded-xl overflow-hidden bg-black shadow-lg flex-shrink-0">
          {useFallback ? (
            <video
              ref={previewVideoRef}
              src={`${item.ml}#t=${item.keyframes[activeFrame]}`}
              className="w-full h-full object-contain"
              muted
              playsInline
              preload="auto"
            />
          ) : frames[activeFrame]?.dataUrl ? (
            <img
              src={frames[activeFrame].dataUrl!}
              alt={`第${frames[activeFrame].time}秒`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-white/50 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <FrameAnalysis time={frames[activeFrame].time} item={item} frameIndex={activeFrame} />
        </div>
      </div>
    </div>
  );
}

// ==================== 单帧分析 ====================
function FrameAnalysis({ time, item, frameIndex }: { time: number; item: MaterialItem; frameIndex: number }) {
  // 根据时间点和商品类型生成分析（基于行业经验的先验知识）
  const analysis = getFrameAnalysis(time, item, frameIndex);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 bg-primary-50 text-primary-700 text-xs font-bold rounded">
          第 {time} 秒
        </span>
        <span className="text-xs text-gray-500">{analysis.phase}</span>
      </div>

      <div className="space-y-2">
        <AnalysisRow icon="🎯" label="画面目标" value={analysis.objective} />
        <AnalysisRow icon="📐" label="构图/拍法" value={analysis.composition} />
        <AnalysisRow icon="👤" label="出镜元素" value={analysis.elements} />
        <AnalysisRow icon="💬" label="文案/口播" value={analysis.copy} />
        <AnalysisRow icon="⚡" label="节奏设计" value={analysis.rhythm} />
      </div>

      <div className="mt-3 p-2.5 bg-blue-50 rounded-lg">
        <p className="text-[11px] text-blue-700 font-medium">💡 复刻要点</p>
        <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">{analysis.replicateTip}</p>
      </div>
    </div>
  );
}

function AnalysisRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-sm flex-shrink-0">{icon}</span>
      <div>
        <span className="text-[11px] text-gray-500 font-medium">{label}：</span>
        <span className="text-[11px] text-gray-700 leading-relaxed">{value}</span>
      </div>
    </div>
  );
}

// ==================== 创意拆解（脚本+拍法+可替换元素） ====================
function CreativeBreakdown({ item }: { item: MaterialItem }) {
  const breakdown = getCreativeBreakdown(item);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 脚本结构 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <span className="text-base">📝</span> 脚本结构
        </h4>
        <div className="space-y-2">
          {breakdown.scriptSteps.map((step, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-700">{step.name}</p>
                <p className="text-[11px] text-gray-500 leading-snug">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 拍法建议 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <span className="text-base">🎥</span> 拍法建议
        </h4>
        <div className="space-y-2">
          {breakdown.shootingTips.map((tip, i) => (
            <div key={i} className="flex gap-1.5 items-start">
              <span className="text-primary-400 text-xs mt-0.5">▸</span>
              <p className="text-xs text-gray-600 leading-snug">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 可替换元素 */}
      <div className="bg-white rounded-xl p-4 border border-gray-100">
        <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-1.5">
          <span className="text-base">🔄</span> 可替换元素
        </h4>
        <div className="space-y-2">
          {breakdown.replaceableElements.map((el, i) => (
            <div key={i} className="p-2 bg-gray-50 rounded-lg">
              <p className="text-[11px] font-medium text-gray-700">{el.category}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">
                原始：<span className="text-gray-700">{el.original}</span>
              </p>
              <p className="text-[10px] text-green-600 mt-0.5">
                可替换为：{el.alternatives}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 p-2 bg-amber-50 rounded-lg">
          <p className="text-[10px] text-amber-700 font-medium">⚠️ 骨架不变</p>
          <p className="text-[10px] text-amber-600 mt-0.5">{breakdown.coreStructure}</p>
        </div>
      </div>
    </div>
  );
}

// ==================== 指标徽章 ====================
function MetricBadge({ label, value, color }: { label: string; value: string; color: string }) {
  const colorMap: Record<string, string> = {
    red: 'text-red-600',
    green: 'text-green-600',
    purple: 'text-purple-600',
    blue: 'text-blue-600',
    orange: 'text-orange-600',
  };

  return (
    <div className="text-center">
      <p className="text-[10px] text-gray-400">{label}</p>
      <p className={`text-xs font-semibold ${colorMap[color] || 'text-gray-700'}`}>{value}</p>
    </div>
  );
}

// ==================== 数据分析逻辑 ====================

function getFrameAnalysis(time: number, item: MaterialItem, _frameIndex: number) {
  const ca = item.ca.toLowerCase();
  const pn = item.pn.toLowerCase();

  // 根据品类判断素材类型
  const isApparel = ca.includes('服饰') || ca.includes('女装') || ca.includes('男装') || ca.includes('裤');
  const isFitness = ca.includes('健身') || ca.includes('瑜伽') || pn.includes('健腹') || pn.includes('跑步机');
  const isProtective = ca.includes('护具') || pn.includes('护膝') || pn.includes('髌骨');
  const isOutdoor = ca.includes('露营') || ca.includes('帐篷') || ca.includes('钓');
  const isUnderwear = ca.includes('内衣') || ca.includes('文胸') || pn.includes('内裤');
  const hasCeleb = pn.includes('同款') || pn.includes('明星') || pn.includes('杨幂') || pn.includes('樊少皇');

  // 基于时间段的通用范式
  if (time <= 1) {
    return {
      phase: '黄金1秒 · 注意力捕获',
      objective: hasCeleb ? '明星同款/名人背书开场，制造权威感' : '强视觉冲击开场，0.5秒内锁定滑动中的用户',
      composition: isApparel ? '全身/半身竖构图，鲜明背景色对比' : isFitness ? '动态运动画面或产品特写，高饱和度' : '产品核心功能的极致特写',
      elements: hasCeleb ? '明星同款标签、品牌Logo、信任符号' : isApparel ? '模特穿搭展示、场景氛围' : '产品+使用者/使用场景',
      copy: isApparel ? '悬念文案/价格锚点/限时标签' : isFitness ? '痛点场景描述/效果对比预告' : '核心卖点一句话文案',
      rhythm: '快切入/无过渡直接开始/强节奏BGM起拍',
      replicateTip: '前1秒决定用户是否继续观看。核心是制造"信息差"或"视觉冲击"，让用户产生"这是什么"的好奇心。避免慢节奏品牌Logo开场。',
    };
  } else if (time <= 3) {
    return {
      phase: '黄金3秒 · 钩子强化',
      objective: '巩固注意力，传递核心利益点，让用户决定继续看',
      composition: isApparel ? '切换角度展示版型/材质质感' : isFitness ? '展示使用效果或对比画面' : '产品功能可视化呈现',
      elements: isApparel ? '面料特写、版型线条、色彩搭配' : isProtective ? '痛点场景（跑步膝盖疼痛等）→ 产品解决' : '功能演示+数据/效果标注',
      copy: hasCeleb ? '强调明星同款/同品质/同工厂' : '核心卖点展开：材质/功能/价格优势',
      rhythm: '信息密度高但节奏可控，避免信息过载',
      replicateTip: '3秒内必须让用户理解"这个视频在讲什么+和我有什么关系"。最有效的方式：痛点共鸣 或 利益承诺。',
    };
  } else if (time <= 5) {
    return {
      phase: '卖点展开 · 功能证实',
      objective: '深入展示产品核心功能/材质/工艺',
      composition: isApparel ? '不同穿搭场景切换 或 细节对比镜头' : isFitness ? '使用过程全景+关键动作特写' : '产品细节微距/结构解剖',
      elements: isApparel ? '多色展示、正侧背多角度、弹力/透气演示' : isFitness ? '使用者运动画面、肌肉发力展示、计数' : '产品材质/工艺/包装细节',
      copy: '功能利益点逐一罗列，配合画面节奏出字幕',
      rhythm: '中等节奏，每2-3秒一个信息点',
      replicateTip: '这是用户评估"值不值得买"的关键窗口。用具体可感知的证据（如弹力测试、材质对比）替代抽象描述。',
    };
  } else if (time <= 7) {
    return {
      phase: '场景种草 · 使用想象',
      objective: '帮用户构建"拥有后"的使用场景',
      composition: isApparel ? '通勤/约会/运动等场景穿搭展示' : isOutdoor ? '户外实景展示使用全过程' : '家庭/办公室等真实场景中使用',
      elements: isApparel ? '场景化背景、配饰搭配、氛围光影' : isFitness ? '家庭场景中轻松使用、不占空间' : '真实生活场景植入产品',
      copy: isApparel ? '"通勤穿""约会穿""运动穿"场景标签' : '使用场景描述 + 效果感受',
      rhythm: '节奏稍缓，给用户代入想象的时间',
      replicateTip: '场景越具体，种草越强。避免泛泛地说"适合多场景"，要用具体画面证明。',
    };
  } else if (time <= 9) {
    return {
      phase: '信任构建 · 口碑背书',
      objective: '消除购买顾虑，构建产品/品牌信任',
      composition: '证言画面/数据展示/对比画面',
      elements: hasCeleb ? '明星穿戴画面/代言海报/销量数据' : isProtective ? '专业认证标志/医疗级材质说明/用户好评' : '用户评价/销量数据/权威认证',
      copy: '好评截图/销量战报/权威认证/专利说明',
      rhythm: '信息密集但结构清晰，配合信任音效',
      replicateTip: '信任元素不需要太多但要真实可信。销量数据、好评截图、专利证书、明星同款都是有效信任锚。',
    };
  } else if (time <= 11) {
    return {
      phase: '对比说服 · 差异化',
      objective: '通过对比强化本品优势',
      composition: '左右对比/前后对比/价格对比',
      elements: isApparel ? '同价位对比、面料差异对比、版型对比' : isFitness ? '传统健身方式vs本产品 效果对比' : '竞品对比/使用前后对比',
      copy: '对比文案："别人家""但这个""只要XX就能"',
      rhythm: '信息密度中等，重点突出差异',
      replicateTip: '对比是最直观的说服方式。找到一个用户最关心的对比维度，用可视化方式呈现差异。',
    };
  } else if (time <= 13) {
    return {
      phase: '促销收口 · 利益加码',
      objective: '释放促销信息，制造紧迫感',
      composition: '价格标签大字/倒计时/赠品展示',
      elements: '价格对比（划线价vs到手价）、赠品实物、限时限量标签',
      copy: '"现在下单""限时""买一送一""只剩XX件"',
      rhythm: '节奏加快，倒计时感强化',
      replicateTip: '促销不等于低价。核心是"价值感" - 让用户觉得此刻买到就是赚到。赠品可视化比文字描述有效10倍。',
    };
  } else {
    return {
      phase: '行动引导 · 转化收口',
      objective: '明确告诉用户该做什么（下单/点击/领券）',
      composition: '指引手势/按钮动画/二维码/最终产品全景',
      elements: '行动按钮、优惠码、操作指引动画',
      copy: '"点击下方""立即购买""先领券再下单"',
      rhythm: '收束节奏，明确单一行动指令',
      replicateTip: '收口只做一件事：告诉用户下一步动作。不要在最后引入新信息。手势引导+按钮高亮是最有效的行动引导。',
    };
  }
}

function getCreativeBreakdown(item: MaterialItem) {
  const ca = item.ca.toLowerCase();
  const pn = item.pn.toLowerCase();

  const isApparel = ca.includes('服饰') || ca.includes('女装') || ca.includes('男装') || ca.includes('裤') || ca.includes('鞋');
  const isFitness = ca.includes('健身') || ca.includes('瑜伽') || pn.includes('健腹') || pn.includes('跑步机') || pn.includes('筋膜');
  const isProtective = ca.includes('护具') || pn.includes('护膝') || pn.includes('髌骨');
  const isUnderwear = ca.includes('内衣') || ca.includes('文胸') || pn.includes('内裤');
  const hasCeleb = pn.includes('同款') || pn.includes('明星') || pn.includes('杨幂') || pn.includes('樊少皇');

  // 脚本结构
  let scriptSteps;
  if (hasCeleb) {
    scriptSteps = [
      { name: '明星/名人引入', desc: '明星同款标签+穿戴画面，快速建立权威和关注' },
      { name: '产品亮点展示', desc: '展示与明星同款的核心卖点，建立品质关联' },
      { name: '场景演绎', desc: '真实场景中展示产品效果，帮用户想象拥有后的体验' },
      { name: '信任加码', desc: '销量数据/好评/品牌背书，消除"网红割韭菜"顾虑' },
      { name: '促销收口', desc: '限时价格+赠品+行动引导，制造紧迫感推动下单' },
    ];
  } else if (isFitness) {
    scriptSteps = [
      { name: '痛点场景', desc: '展示目标人群的运动/身材焦虑，引发共鸣' },
      { name: '产品出场', desc: '自然引出产品作为解决方案，展示核心功能' },
      { name: '效果演示', desc: '真人使用+效果可视化（数据/对比），建立信服感' },
      { name: '使用便捷性', desc: '强调在家即可、不占空间、操作简单，降低使用门槛' },
      { name: '促销转化', desc: '价格锚点+限时优惠+行动按钮引导' },
    ];
  } else if (isProtective) {
    scriptSteps = [
      { name: '痛点场景', desc: '运动中膝盖/关节疼痛的真实场景，唤起共鸣' },
      { name: '产品解决', desc: '产品佩戴过程+防护原理可视化' },
      { name: '专业背书', desc: '材质说明/医疗级认证/运动员推荐' },
      { name: '使用体验', desc: '透气/不闷汗/不移位等实际使用感受' },
      { name: '促销收口', desc: '多件优惠+退换保障+立即购买引导' },
    ];
  } else if (isUnderwear) {
    scriptSteps = [
      { name: '痛点引入', desc: '勒痕/闷热/下垂等女性真实困扰' },
      { name: '产品亮点', desc: '面料/钢圈/设计工艺等核心差异点' },
      { name: '上身效果', desc: '穿着效果展示（聚拢/无痕/舒适）' },
      { name: '细节证实', desc: '拉扯测试/透气测试/对比实验' },
      { name: '促销转化', desc: '多件优惠+尺码保障+立即下单' },
    ];
  } else {
    scriptSteps = [
      { name: '注意力捕获', desc: '强视觉/痛点/悬念/名人开场，1秒锁定用户' },
      { name: '核心卖点', desc: '产品最大差异化优势的可视化展示' },
      { name: '场景种草', desc: '真实使用场景中的产品表现' },
      { name: '信任背书', desc: '销量/好评/认证/对比等信任元素' },
      { name: '促销收口', desc: '价格利益+紧迫感+明确行动引导' },
    ];
  }

  // 拍法建议
  let shootingTips;
  if (isApparel) {
    shootingTips = [
      '竖屏全身构图，模特身高比例>2/3画面',
      hasCeleb ? '开场叠加明星同款标签/代言画面' : '前1秒用动态换装/色彩冲击吸睛',
      '多角度转身展示版型：正面→侧面→背面',
      '面料质感用自然光+微距特写（弹力、垂坠感）',
      '3-4个场景快切展示搭配多样性',
      '结尾用商品平铺+价格标签+行动按钮',
    ];
  } else if (isFitness) {
    shootingTips = [
      '竖屏居家场景，展示产品不占空间',
      '真人使用全过程：拆箱→组装→使用→效果',
      '运动画面用慢动作+力量感BGM',
      '效果对比用分屏或前后画面（使用前/后）',
      '穿插数据可视化（卡路里/次数/时间）',
      '结尾强调"在家轻松练"+价格利益',
    ];
  } else if (isProtective) {
    shootingTips = [
      '痛点场景用主观视角（跑步膝盖疼痛特写）',
      '产品佩戴过程用慢动作+细节特写',
      '面料/工艺用微距镜头展示',
      '运动场景中佩戴效果（跑步/打球/爬山）',
      '对比画面：佩戴前后运动表现差异',
      '字幕标注关键参数（弹力值/透气率/尺码）',
    ];
  } else if (isUnderwear) {
    shootingTips = [
      '柔和打光+干净背景，突出产品质感',
      '上身效果用侧面/正面对比展示聚拢/无痕',
      '面料测试：弹力拉伸/透气/亲肤测试',
      '穿着体验用生活化场景（办公/运动/睡眠）',
      '细节特写：蕾丝工艺/无钢圈设计/加宽肩带',
      '多色展示用快速换装/平铺排列',
    ];
  } else {
    shootingTips = [
      '竖屏拍摄，主体占画面2/3以上',
      '前1秒制造视觉冲击或信息差',
      '核心功能用可视化方式呈现（测试/对比/数据）',
      '真实场景植入增加代入感',
      '节奏控制：前快后缓，信息密度递减',
      '结尾单一行动引导，不引入新信息',
    ];
  }

  // 可替换元素
  let replaceableElements;
  if (hasCeleb) {
    replaceableElements = [
      { category: '🌟 名人/IP', original: pn.includes('杨幂') ? '杨幂同款' : pn.includes('樊少皇') ? '樊少皇推荐' : '明星同款', alternatives: '其他当红明星/运动员/KOL同款，或替换为"XX万人已购"等社会证明' },
      { category: '👗 产品款式', original: item.pn.substring(0, 15), alternatives: '替换为你的产品核心SKU，保留"同款"概念框架' },
      { category: '🎬 场景', original: '明星穿搭场景', alternatives: '街拍/通勤/运动/约会等目标人群高频场景' },
      { category: '💰 促销机制', original: '限时折扣', alternatives: '买赠/满减/限量/会员专享等其他促销形式' },
    ];
  } else if (isFitness) {
    replaceableElements = [
      { category: '😫 痛点方向', original: '运动/身材焦虑', alternatives: '时间不足/健身房太远/关节保护/产后恢复等其他痛点' },
      { category: '🏋️ 产品功能', original: item.pn.substring(0, 15), alternatives: '替换为你产品的核心训练功能/部位' },
      { category: '👤 出镜人设', original: '运动达人/健身教练', alternatives: '普通上班族/宝妈/中年人等不同用户画像' },
      { category: '📍 使用场景', original: '家庭健身', alternatives: '办公室/户外/酒店/宿舍等碎片化场景' },
    ];
  } else if (isProtective) {
    replaceableElements = [
      { category: '🦵 适用部位', original: '膝盖/髌骨', alternatives: '腰部/脚踝/手腕/肩部等其他关节部位' },
      { category: '🏃 运动场景', original: '跑步/球类', alternatives: '登山/骑行/瑜伽/日常步行等其他运动' },
      { category: '👥 目标人群', original: '运动爱好者', alternatives: '中老年/久站人群/产后恢复/关节炎患者' },
      { category: '🔬 信任背书', original: '专业级/医疗级', alternatives: '运动员推荐/医生建议/XX万人复购' },
    ];
  } else {
    replaceableElements = [
      { category: '🎯 核心卖点', original: item.pn.substring(0, 15), alternatives: '替换为你产品最具差异化的核心卖点' },
      { category: '👤 出镜角色', original: '模特/真人', alternatives: '匹配你品牌调性的模特/素人/KOL' },
      { category: '🎬 使用场景', original: '通用场景', alternatives: '你的目标用户最高频的使用场景' },
      { category: '💰 价格锚点', original: '限时优惠', alternatives: '对比价/日均成本/赠品价值等不同锚定方式' },
    ];
  }

  // 核心骨架
  const coreStructure = hasCeleb
    ? '名人背书 → 产品展示 → 场景验证 → 信任加码 → 促销收口（5步链路不变，替换其中元素即可复刻）'
    : isFitness
    ? '痛点引入 → 产品解决 → 效果证实 → 便捷性展示 → 促销转化（先让用户"想要"，再让用户"能买"）'
    : '注意力捕获 → 卖点展开 → 场景种草 → 信任构建 → 促销收口（核心5步框架不变）';

  return { scriptSteps, shootingTips, replaceableElements, coreStructure };
}
