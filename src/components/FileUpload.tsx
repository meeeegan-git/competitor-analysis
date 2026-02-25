import { useRef, useState, useCallback } from 'react';
import { Loading, Alert } from 'tdesign-react';
import { CloudUploadIcon, FileExcelIcon } from 'tdesign-icons-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  loading: boolean;
  fileName: string;
}

export default function FileUpload({ onFileSelect, loading, fileName }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
      return;
    }
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 mb-4">
            <span className="text-4xl">📊</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">上传竞品数据Excel</h2>
          <p className="text-gray-400">
            支持 .xlsx / .xls / .csv 格式，自动提取各类目竞品数据并生成分析报表
          </p>
        </div>

        <div
          className={`upload-zone p-12 text-center ${dragOver ? 'drag-over' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loading size="large" />
              <p className="text-gray-500">正在解析 <span className="font-medium text-primary-600">{fileName}</span> ...</p>
            </div>
          ) : (
            <>
              <CloudUploadIcon size="48px" className="text-primary-300 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600 mb-2">
                点击或拖拽文件到此处上传
              </p>
              <p className="text-sm text-gray-400">支持 Excel (.xlsx, .xls) 和 CSV 文件</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = '';
            }}
          />
        </div>

        <Alert
          theme="info"
          className="mt-6"
          style={{ borderRadius: 12 }}
          message={
            <div>
              <p className="font-medium mb-1">Excel表格必须包含以下列：</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  'DPA商品名称', '商品统一类目V2(一级～四级)', '视频号名称',
                  '消耗(元)', '下单金额(元)', '下单单价(元)',
                  'ctr(%)', '综合目标转化率(%)', '竞价CPM(元)', '下单ROI'
                ].map((col) => (
                  <span key={col} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-50 text-xs text-primary-700">
                    <FileExcelIcon size="12px" /> {col}
                  </span>
                ))}
              </div>
            </div>
          }
        />

        <div className="mt-6 glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">📋 自动提取6大类目</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { icon: '🦈', label: '鲨鱼裤', desc: 'DPA商品名称含"鲨鱼裤"' },
              { icon: '👖', label: '直筒裤', desc: '含"直筒"，排除男装' },
              { icon: '🩳', label: '卫裤', desc: '含"卫裤"，排除男装' },
              { icon: '🪂', label: '伞兵裤', desc: '含"伞兵"，排除男装' },
              { icon: '👗', label: '连体塑身衣', desc: '类目匹配塑身连体衣' },
              { icon: '🩱', label: '塑身裤', desc: '类目匹配塑身美体裤' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2.5 p-3 rounded-xl bg-gray-50/80">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
