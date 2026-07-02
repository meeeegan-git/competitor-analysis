import { useState, useEffect, useMemo } from 'react';
import { MessagePlugin, Loading } from 'tdesign-react';
import { WeekMeta, WeekData } from './types';
import RankingView from './components/RankingView';
import SportAnalysisView from './components/SportAnalysisView';
import AuthGuard from './components/AuthGuard';
import weeksIndex from './data/weeks.json';

type TabKey = 'ranking' | 'sport-shoes' | 'sport-goods';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'ranking', label: '爆款榜单', icon: '🔥' },
  { key: 'sport-shoes', label: '运动鞋服', icon: '👟' },
  { key: 'sport-goods', label: '运动用品', icon: '🏋️' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('ranking');

  // 仅保留近一个月（4周）的数据
  const weeks = useMemo<WeekMeta[]>(() => {
    const all = (weeksIndex as WeekMeta[]).sort((a, b) => b.week.localeCompare(a.week));
    return all.slice(0, 4);
  }, []);
  const [currentWeek, setCurrentWeek] = useState<string>('');
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);

  // 运动分析数据
  const [shoesAnalysis, setShoesAnalysis] = useState<any>(null);
  const [goodsAnalysis, setGoodsAnalysis] = useState<any>(null);

  // 加载指定周的数据
  const loadWeekData = async (weekLabel: string) => {
    setLoading(true);
    try {
      // 动态导入对应周的 JSON 文件
      const mod = await import(`./data/week-${weekLabel}.json`);
      const data = mod.default as WeekData;
      setWeekData(data);
      setCurrentWeek(weekLabel);
    } catch (err) {
      console.error('加载数据失败:', err);
      MessagePlugin.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载运动分析数据
  const loadSportAnalysis = async () => {
    try {
      const [shoesMod, goodsMod] = await Promise.all([
        import('./data/sport-shoes-analysis.json'),
        import('./data/sport-goods-analysis.json'),
      ]);
      setShoesAnalysis(shoesMod.default);
      setGoodsAnalysis(goodsMod.default);
    } catch (err) {
      console.error('加载运动分析数据失败:', err);
    }
  };

  // 默认加载最新一周数据
  useEffect(() => {
    if (weeks.length > 0) {
      loadWeekData(weeks[0].week);
    } else {
      setLoading(false);
    }
    loadSportAnalysis();
  }, [weeks]);

  return (
    <AuthGuard>
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-primary-100/50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg shadow-md shadow-primary-200">
              🔥
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">服饰运动素材爆款榜单</h1>
              <p className="text-xs text-gray-400 -mt-0.5">
                呈现每个行业消耗TOP100爆款素材，支持多周数据查看
              </p>
            </div>
          </div>

          {/* Tab切换 + 周选择器 */}
          <div className="flex items-center gap-4">
            {/* 顶部Tab */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="text-sm">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* 周选择器 - 仅在爆款榜单时显示 */}
            {activeTab === 'ranking' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">数据周期：</span>
                <div className="flex gap-1">
                  {weeks.map((w) => (
                    <button
                      key={w.week}
                      onClick={() => loadWeekData(w.week)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        currentWeek === w.week
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-200'
                          : 'bg-gray-50 text-gray-500 hover:bg-primary-50 hover:text-primary-600'
                      }`}
                    >
                      {w.week}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 page-enter">
        {activeTab === 'ranking' && (
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <Loading size="large" />
                <p className="mt-4 text-sm text-gray-400">正在加载数据...</p>
              </div>
            ) : weekData ? (
              <RankingView data={weekData} />
            ) : (
              <div className="flex flex-col items-center justify-center py-32 glass-card">
                <p className="text-4xl mb-4">📊</p>
                <p className="text-gray-400">暂无数据，请先运行数据处理脚本</p>
                <code className="mt-2 text-xs text-gray-300 bg-gray-50 px-3 py-1.5 rounded-lg">
                  node scripts/process-csv.mjs &lt;csv文件路径&gt; [周标签]
                </code>
              </div>
            )}
          </>
        )}

        {activeTab === 'sport-shoes' && (
          shoesAnalysis ? (
            <SportAnalysisView data={shoesAnalysis} crossIndustryData={goodsAnalysis} />
          ) : (
            <div className="flex flex-col items-center justify-center py-32">
              <Loading size="large" />
              <p className="mt-4 text-sm text-gray-400">正在加载运动鞋服分析数据...</p>
            </div>
          )
        )}

        {activeTab === 'sport-goods' && (
          goodsAnalysis ? (
            <SportAnalysisView data={goodsAnalysis} crossIndustryData={shoesAnalysis} />
          ) : (
            <div className="flex flex-col items-center justify-center py-32">
              <Loading size="large" />
              <p className="mt-4 text-sm text-gray-400">正在加载运动用品分析数据...</p>
            </div>
          )
        )}
      </main>

      <footer className="border-t border-gray-100 bg-gray-50/50 py-6 mt-auto">
        <div className="max-w-[1400px] mx-auto px-6 text-center">
          <p className="text-xs text-gray-400 mb-2">
            数据来源：
            <a
              href="https://adata.woa.com/bi/view/13453?s=28YRWo"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600 hover:underline"
            >
              服饰运动爆款素材数据
            </a>
          </p>
          <p className="text-[10px] text-gray-300">
            © 2026 服饰运动爆款素材榜单
          </p>
        </div>
      </footer>
    </div>
    </AuthGuard>
  );
}
