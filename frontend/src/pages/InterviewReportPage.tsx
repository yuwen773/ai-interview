import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { interviewApi } from '../api/interview';
import type { InterviewReport } from '../types/interview';
import { getErrorMessage } from '../api/request';
import { getScoreProgressColor } from '../utils/score';

interface InterviewReportPageProps {
  onBack: () => void;
}

export default function InterviewReportPage({ onBack }: InterviewReportPageProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('Session ID not found');
      setLoading(false);
      return;
    }
    interviewApi.getReport(sessionId)
      .then(r => { setReport(r); setLoading(false); })
      .catch(err => { setError(getErrorMessage(err)); setLoading(false); });
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-[var(--color-text-muted)]">{error || 'Failed to load report'}</p>
        <button onClick={onBack} className="px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg">返回</button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">面试报告</h1>
        <button onClick={onBack} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">返回</button>
      </div>

      <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ${getScoreProgressColor(report.overallScore)}`}>
            {report.overallScore}
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--color-text)]">{report.jobLabel}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{report.totalQuestions} 道题目</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {report.categoryScores.map(cs => (
            <div key={cs.category} className="flex justify-between items-center p-3 bg-[var(--color-bg)] rounded-lg">
              <span className="text-sm text-[var(--color-text)]">{cs.category}</span>
              <span className={`text-sm font-semibold ${getScoreProgressColor(cs.score).replace('bg-', 'text-')}`}>{cs.score}分</span>
            </div>
          ))}
        </div>
      </div>

      {report.overallFeedback && (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] mb-2">综合评价</h3>
          <p className="text-sm text-[var(--color-text-muted)]">{report.overallFeedback}</p>
        </div>
      )}

      {report.strengths.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] mb-2">优势</h3>
          <ul className="list-disc pl-5 space-y-1">
            {report.strengths.map((s, i) => <li key={i} className="text-sm text-[var(--color-text-muted)]">{s}</li>)}
          </ul>
        </div>
      )}

      {report.improvements.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] mb-2">改进建议</h3>
          <ul className="list-disc pl-5 space-y-1">
            {report.improvements.map((im, i) => <li key={i} className="text-sm text-[var(--color-text-muted)]">{im}</li>)}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1 py-3 rounded-xl font-semibold bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-center text-sm">
          画像已自动更新
        </div>
      </div>
    </div>
  );
}
