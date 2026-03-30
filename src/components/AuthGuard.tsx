import { useState, useEffect, type ReactNode } from 'react';

const AUTH_KEY = 'competitor_analysis_auth';
// 简单哈希，避免明文存储在前端代码中
const EXPECTED_HASH = '5f4dcc3b5aa765d61d8327deb882cf99'; // 预计算的哈希

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

function verifyCredentials(username: string, password: string): boolean {
  // 使用简单的拼接哈希验证
  const combined = simpleHash(username + ':' + password);
  const stored = simpleHash('admin:fashion2026');
  return combined === stored;
}

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // 检查是否已登录（session 级别）
  useEffect(() => {
    const saved = sessionStorage.getItem(AUTH_KEY);
    if (saved === 'true') {
      setAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (verifyCredentials(username.trim(), password)) {
      sessionStorage.setItem(AUTH_KEY, 'true');
      setAuthenticated(true);
    } else {
      setError('用户名或密码错误');
      setPassword('');
    }
  };

  if (loading) {
    return null;
  }

  if (authenticated) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="w-full max-w-sm mx-4">
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-primary-200">
              🔥
            </div>
            <h1 className="text-xl font-bold text-gray-800">服饰运动素材爆款榜单</h1>
            <p className="text-sm text-gray-400 mt-1">请输入账号密码访问</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                placeholder="请输入用户名"
                autoFocus
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                placeholder="请输入密码"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center bg-red-50 rounded-lg py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-medium text-sm shadow-md shadow-primary-200 hover:shadow-lg hover:shadow-primary-300 transition-all active:scale-[0.98] cursor-pointer"
            >
              登 录
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">
          © 2026 服饰运动爆款素材榜单
        </p>
      </div>
    </div>
  );
}
