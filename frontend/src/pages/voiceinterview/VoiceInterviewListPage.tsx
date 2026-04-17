import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { request } from '../../api/request';

interface SessionMeta {
  sessionId: number;
  roleType: string;
  status: string;
  currentPhase: string;
  createdAt: string;
  actualDuration?: number;
}

export default function VoiceInterviewListPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionMeta[]>([]);
  const [_loading, setLoading] = useState(true);

  useEffect(() => {
    request.get<SessionMeta[]>('/api/voice-interview/sessions')
      .then(data => {
        setSessions(data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">语音面试</h1>
      <button
        onClick={() => navigate('/voice-interview/new')}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        开始新面试
      </button>
      <div className="space-y-4">
        {sessions.map(session => (
          <div key={session.sessionId} className="border p-4 rounded">
            <p>Session #{session.sessionId}</p>
            <p>角色: {session.roleType}</p>
            <p>状态: {session.status}</p>
            <p>阶段: {session.currentPhase}</p>
          </div>
        ))}
      </div>
    </div>
  );
}