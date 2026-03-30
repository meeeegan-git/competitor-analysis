import { useState, useMemo, useRef, useCallback } from 'react';
import { Pagination, Select, Input } from 'tdesign-react';
import { SearchIcon } from 'tdesign-icons-react';
import { WeekData, CompactRow } from '../types';

interface RankingViewProps {
  data: WeekData;
}

const PAGE_SIZE = 20;

export default function RankingView({ data }: RankingViewProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // 行业选项
  const industryOptions = useMemo(() => {
    return data.industries.map((ind) => ({
      label: ind,
      value: ind,
    }));
  }, [data.industries]);

  // 筛选后的数据（行业 + 商品名称模糊搜索）
  const filteredRows = useMemo(() => {
    let rows = data.rows;
    if (selectedIndustries.length > 0) {
      const indSet = new Set(selectedIndustries);
      rows = rows.filter(r => indSet.has(r.ind));
    }
    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      rows = rows.filter(r => r.pn && r.pn.toLowerCase().includes(kw));
    }
    return rows;
  }, [data.rows, selectedIndustries, searchKeyword]);

  // 分页
  const pagedRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredRows.slice(start, start + PAGE_SIZE);
  }, [filteredRows, currentPage]);

  const handleIndustryChange = useCallback((val: string[]) => {
    setSelectedIndustries(val);
    setCurrentPage(1);
  }, []);

  const globalIndex = (pageIdx: number) => (currentPage - 1) * PAGE_SIZE + pageIdx;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* 筛选工具栏 */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-1 min-w-[320px]">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">行业</span>
            <Select
              value={selectedIndustries}
              onChange={(val) => handleIndustryChange(val as string[])}
              options={industryOptions}
              multiple
              filterable
              clearable
              placeholder="搜索并选择行业..."
              style={{ flex: 1 }}
              popupProps={{ overlayInnerStyle: { maxHeight: 320 } }}
              minCollapsedNum={3}
            />
          </div>
          <div className="flex items-center gap-2 min-w-[280px]">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">商品</span>
            <Input
              value={searchKeyword}
              onChange={(val) => { setSearchKeyword(val as string); setCurrentPage(1); }}
              prefixIcon={<SearchIcon />}
              clearable
              placeholder="搜索商品名称..."
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>

      {/* 榜单表格 */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-700">服饰运动素材爆款榜单</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              按DPA商品名称去重，每个行业取TOP100，按消耗降序 · 数据周期 {data.week}
            </p>
          </div>

        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-primary-50 to-blue-50">
                <th className="ranking-th w-12">#</th>
                <th className="ranking-th w-24">商品主图</th>
                <th className="ranking-th min-w-[220px]">商品名称</th>
                <th className="ranking-th w-24">行业</th>
                <th className="ranking-th w-24">下单单价</th>
                <th className="ranking-th w-24">下单ROI</th>
                <th className="ranking-th w-28">3秒完播率</th>
                <th className="ranking-th w-28">平均播放时长</th>
                <th className="ranking-th w-20">CTR</th>
                <th className="ranking-th min-w-[180px]">素材分析</th>
                <th className="ranking-th w-32">素材</th>
              </tr>
            </thead>
            <tbody>
              {pagedRows.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-16 text-gray-300">
                    <p className="text-3xl mb-2">📭</p>
                    <p>暂无匹配的素材数据</p>
                  </td>
                </tr>
              ) : (
                pagedRows.map((row, idx) => {
                  const gIdx = globalIndex(idx);
                  return <RowItem key={`${data.week}-${gIdx}`} row={row} rank={gIdx} />;
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredRows.length > PAGE_SIZE && (
          <div className="flex justify-center mt-4">
            <Pagination
              current={currentPage}
              total={filteredRows.length}
              pageSize={PAGE_SIZE}
              onChange={(pageInfo) => setCurrentPage(pageInfo.current)}
              showJumper
            />
          </div>
        )}
      </div>
    </div>
  );
}

function isVideoUrl(url: string): boolean {
  return !!url && (url.startsWith('http://') || url.startsWith('https://'));
}

function RowItem({ row, rank }: { row: CompactRow; rank: number }) {
  const thumbVideoRef = useRef<HTMLVideoElement>(null);
  const materialVideoRef = useRef<HTMLVideoElement>(null);
  const materialContainerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const hasVideo = isVideoUrl(row.ml);

  const handleThumbMouseEnter = () => {
    if (thumbVideoRef.current) {
      thumbVideoRef.current.currentTime = 0;
      thumbVideoRef.current.load();
      thumbVideoRef.current.play().catch(() => {});
    }
  };

  const handleThumbMouseLeave = () => {
    if (thumbVideoRef.current) {
      thumbVideoRef.current.pause();
    }
  };

  // 素材列：点击开始播放（放大250%）/ 暂停（恢复原位）
  const handleMaterialClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasVideo) return;
    if (isPlaying) {
      if (materialVideoRef.current) {
        materialVideoRef.current.pause();
      }
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  // 素材列：悬停静音预览（仅未播放状态）
  const handleMaterialMouseEnter = () => {
    if (!hasVideo || isPlaying) return;
    if (materialVideoRef.current) {
      materialVideoRef.current.currentTime = 0;
      materialVideoRef.current.load();
      materialVideoRef.current.play().catch(() => {});
    }
  };

  const handleMaterialMouseLeave = () => {
    if (!hasVideo || isPlaying) return;
    if (materialVideoRef.current) {
      materialVideoRef.current.pause();
    }
  };

  // 点击放大播放区域外部关闭
  const handleOverlayClick = () => {
    if (materialVideoRef.current) {
      materialVideoRef.current.pause();
    }
    setIsPlaying(false);
  };

  // 根据排名决定徽章样式：金银铜
  const getRankBadge = (r: number) => {
    if (r === 0) return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-sm shadow-amber-200';
    if (r === 1) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-sm';
    if (r === 2) return 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-sm';
    return 'bg-gray-100 text-gray-500';
  };

  const analysisTags = row.an ? [
    { label: '前3秒亮点', value: row.an.hook, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { label: '人物形象', value: row.an.persona, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { label: '卖点', value: row.an.sellingPoint, color: 'bg-green-50 text-green-600 border-green-200' },
    { label: '脚本结构', value: row.an.scriptStructure, color: 'bg-orange-50 text-orange-600 border-orange-200' },
  ] : [];

  return (
    <tr className="ranking-tr group">
      <td className="ranking-td text-center">
        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getRankBadge(rank)}`}>
          {rank + 1}
        </span>
      </td>
      <td className="ranking-td text-center">
        <div
          className="w-20 h-20 rounded-lg bg-gray-100 mx-auto overflow-hidden relative cursor-pointer group/thumb"
          onMouseEnter={handleThumbMouseEnter}
          onMouseLeave={handleThumbMouseLeave}
        >
          {hasVideo ? (
            <>
              <video
                ref={thumbVideoRef}
                src={`${row.ml}#t=2`}
                className="w-full h-full object-cover select-none"
                muted
                loop
                playsInline
                preload="none"
                controlsList="nodownload"
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/thumb:opacity-100 transition-opacity pointer-events-none">
                <svg className="w-6 h-6 text-white drop-shadow" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border border-dashed border-gray-200 rounded-lg">
              <span className="text-xl text-gray-300">📷</span>
              <span className="text-[10px] text-gray-300 mt-0.5">暂无</span>
            </div>
          )}
        </div>
      </td>
      <td className="ranking-td">
        <div className="max-w-[280px]">
          <p className="font-medium text-gray-800 line-clamp-2 text-[13px] leading-snug" title={row.pn}>{row.pn}</p>
          <p className="text-xs text-gray-400 truncate mt-1" title={row.ca}>{row.ca}</p>
        </div>
      </td>
      <td className="ranking-td text-center">
        {row.ind ? (
          <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-600">
            {row.ind}
          </span>
        ) : (
          <span className="text-xs text-gray-300">-</span>
        )}
      </td>
      <td className="ranking-td text-right number-cell">
        {row.op > 0 ? `¥${row.op}` : '-'}
      </td>
      <td className="ranking-td text-center">
        <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${
          row.or >= 2 ? 'bg-green-50 text-green-600' : row.or >= 1 ? 'bg-yellow-50 text-yellow-600' : 'bg-red-50 text-red-600'
        }`}>
          {row.or > 0 ? row.or.toFixed(2) : '-'}
        </span>
      </td>
      <td className="ranking-td text-right number-cell">
        {row.v3 > 0 ? `${row.v3}%` : '-'}
      </td>
      <td className="ranking-td text-right number-cell">
        {row.ap > 0 ? `${row.ap}s` : '-'}
      </td>
      <td className="ranking-td text-right number-cell">
        {row.ct > 0 ? `${row.ct}%` : '-'}
      </td>
      <td className="ranking-td">
        {row.an?.summary ? (
          <div
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <p className="text-[12px] leading-relaxed text-gray-700 cursor-default max-w-[200px]">
              {row.an.summary}
            </p>
            {showTooltip && analysisTags.length > 0 && (
              <div className="absolute z-50 bottom-full left-0 mb-2 w-[220px] bg-white rounded-lg shadow-xl border border-gray-100 p-3 space-y-1.5">
                {analysisTags.map((tag) => (
                  <div key={tag.label} className="flex items-start gap-1.5">
                    <span className={`shrink-0 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border ${tag.color}`}>
                      {tag.label}
                    </span>
                    <span className="text-[11px] text-gray-600 leading-snug">{tag.value}</span>
                  </div>
                ))}
                <div className="absolute left-6 top-full w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-white" />
              </div>
            )}
          </div>
        ) : (
          <span className="text-xs text-gray-300 italic">-</span>
        )}
      </td>
      {/* 素材列：展示视频首帧缩略图，悬停预览/点击放大250%播放 */}
      <td className="ranking-td text-center">
        {hasVideo ? (
          <div className="relative" ref={materialContainerRef}>
            <div
              className="w-[120px] h-[160px] rounded-lg bg-black mx-auto overflow-hidden relative cursor-pointer group/material"
              onClick={handleMaterialClick}
              onMouseEnter={handleMaterialMouseEnter}
              onMouseLeave={handleMaterialMouseLeave}
            >
              {!isPlaying && (
                <>
                  <video
                    ref={!isPlaying ? materialVideoRef : undefined}
                    src={`${row.ml}#t=2`}
                    className="w-full h-full object-contain select-none"
                    muted
                    loop
                    playsInline
                    preload="none"
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/material:opacity-100 transition-opacity pointer-events-none">
                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-primary-600 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </>
              )}
              {isPlaying && (
                <div className="w-full h-full flex items-center justify-center bg-black/80">
                  <span className="text-white text-xs">播放中...</span>
                </div>
              )}
            </div>
            {/* 放大250%的浮层播放器 */}
            {isPlaying && (
              <>
                <div className="fixed inset-0 bg-black/40 z-[998]" onClick={handleOverlayClick} />
                <div
                  className="absolute z-[999] rounded-xl overflow-hidden shadow-2xl border-2 border-white/80"
                  style={{
                    width: 300,
                    height: 400,
                    right: '100%',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    marginRight: 12,
                  }}
                >
                  <video
                    ref={materialVideoRef}
                    src={row.ml}
                    className="w-full h-full object-contain bg-black select-none"
                    loop
                    playsInline
                    muted
                    controls
                    controlsList="nodownload"
                    onContextMenu={(e) => e.preventDefault()}
                    autoPlay
                    onEnded={() => setIsPlaying(false)}
                  />
                  <button
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors text-sm"
                    onClick={(e) => { e.stopPropagation(); handleOverlayClick(); }}
                  >
                    ✕
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-[120px] h-[80px] mx-auto flex flex-col items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-lg">
            <span className="text-lg text-gray-300">🎬</span>
            <span className="text-[10px] text-gray-300 mt-0.5">暂无素材</span>
          </div>
        )}
      </td>
    </tr>
  );
}
