import { useState } from 'react';
import { authApi } from '../api/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await authApi.login(email, password);
      localStorage.setItem('token', resp.token);
      localStorage.setItem('nickname', resp.nickname);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4">登录</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 mb-2 rounded" required />
        <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 mb-4 rounded" required />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50">
          {loading ? '登录中...' : '登录'}
        </button>
        <p className="mt-2 text-sm text-center">
          没有账号？<a href="/register" className="text-blue-600">注册</a>
        </p>
      </form>
    </div>
  );
}
