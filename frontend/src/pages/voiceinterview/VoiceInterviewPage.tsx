import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { request } from '../../api/request';

interface CreateSessionResponse {
  sessionId: number;
}

export default function VoiceInterviewPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'ai'; text: string}[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!sessionId || sessionId === 'new') {
      // Create new session
      request.post<CreateSessionResponse>('/api/voice-interview/sessions', { skillId: 'java-backend', techEnabled: true })
        .then(data => {
          navigate(`/voice-interview/${data.sessionId}`, { replace: true });
        });
      return;
    }

    // Connect to existing session
    const ws = new WebSocket(`ws://localhost:8080/ws/voice-interview/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'text' || data.type === 'subtitle') {
        setMessages(prev => [...prev, { role: 'ai', text: data.content || data.text }]);
      }
    };
    ws.onclose = () => setConnected(false);

    return () => ws.close();
  }, [sessionId, navigate]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">语音面试</h1>
      <p>连接状态: {connected ? '已连接' : '未连接'}</p>
      <div className="border p-4 h-96 overflow-y-auto mb-4">
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'user' ? 'text-blue-500' : 'text-green-500'}>
            {msg.role === 'user' ? '用户' : '面试官'}: {msg.text}
          </div>
        ))}
      </div>
      <button onClick={() => navigate('/voice-interview')} className="px-4 py-2 bg-gray-500 text-white rounded">
        返回
      </button>
    </div>
  );
}