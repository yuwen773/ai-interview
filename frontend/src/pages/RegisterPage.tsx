import { useState } from 'react';
import { authApi } from '../api/auth';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const resp = await authApi.register(email, password, nickname);
      localStorage.setItem('token', resp.token);
      localStorage.setItem('nickname', resp.nickname);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-xl font-bold mb-4">注册</h2>
        {error && <p className="text-red-500 mb-2">{error}</p>}
        <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} className="w-full border p-2 mb-2 rounded" required />
        <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 mb-2 rounded" required minLength={8} />
        <input type="text" placeholder="昵称" value={nickname} onChange={e => setNickname(e.target.value)} className="w-full border p-2 mb-4 rounded" required />
        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50">
          {loading ? '注册中...' : '注册'}
        </button>
        <p className="mt-2 text-sm text-center">
          已有账号？<a href="/login" className="text-blue-600">登录</a>
        </p>
      </form>
    </div>
  );
}
