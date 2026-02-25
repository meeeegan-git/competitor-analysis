import { useState } from 'react';
import { MessagePlugin } from 'tdesign-react';
import { RawRow, CategoryResult, CATEGORY_CONFIGS } from './types';
import { parseExcel, validateColumns, processCategory } from './utils/analyzer';
import FileUpload from './components/FileUpload';
import ResultView from './components/ResultView';

export default function App() {
  const [results, setResults] = useState<CategoryResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    setFileName(file.name);

    const rows: RawRow[] = await parseExcel(file).catch((err) => {
      console.error(err);
      MessagePlugin.error('文件解析失败，请检查文件格式');
      setLoading(false);
      return [];
    });

    if (rows.length === 0) {
      setLoading(false);
      return;
    }

    const missing = validateColumns(rows);
    if (missing.length > 0) {
      MessagePlugin.error(`缺少必要列：${missing.join('、')}`);
      setLoading(false);
      return;
    }

    const categoryResults = CATEGORY_CONFIGS.map((config) =>
      processCategory(rows, config)
    );

    setResults(categoryResults);
    setLoading(false);
    MessagePlugin.success(`解析完成，共 ${rows.length} 行数据`);
  };

  const handleReset = () => {
    setResults(null);
    setFileName('');
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-primary-100/50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-lg shadow-md shadow-primary-200">
              📊
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">电商竞品数据分析</h1>
              <p className="text-xs text-gray-400 -mt-0.5">上传Excel，一键生成类目竞品分析报表</p>
            </div>
          </div>
          {results && (
            <button
              onClick={handleReset}
              className="px-4 py-2 rounded-lg text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors cursor-pointer"
            >
              重新上传
            </button>
          )}
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-6 page-enter">
        {!results ? (
          <FileUpload onFileSelect={handleFileSelect} loading={loading} fileName={fileName} />
        ) : (
          <ResultView results={results} />
        )}
      </main>
    </div>
  );
}
