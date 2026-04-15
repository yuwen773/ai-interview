import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { interviewApi } from '../api/interview';
import { request } from '../api/request';
import ConfirmDialog from '../components/ConfirmDialog';
import type { InterviewReport } from '../types/interview';
import { getErrorMessage } from '../api/request';

interface InterviewReportPageProps {
  onBack: () => void;
}

// Score threshold below which a question is considered a weak point
const WEAK_POINT_SCORE_THRESHOLD = 6;

export default function InterviewReportPage({ onBack }: InterviewReportPageProps) {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollSuccess, setEnrollSuccess] = useState(false);

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

  const handleEnrollWeakPoints = useCallback(async () => {
    if (!report || !sessionId) return;
    setEnrolling(true);
    try {
      // Extract weak points: questions with score < 6
      const weakItems = report.questionDetails
        .filter(q => q.score < WEAK_POINT_SCORE_THRESHOLD)
        .map(q => ({
          topic: q.category,
          questionText: q.question,
          answerSummary: q.feedback,
          score: q.score,
          source: 'INTERVIEW'
          // sessionId intentionally omitted — numeric ID not available from UUID sessionId
        }));
      if (weakItems.length === 0) {
        setEnrollSuccess(true);
        setShowConfirm(false);
        setEnrolling(false);
        return;
      }
      await request.post('/api/review/enroll', {
        userId: 'current', // TODO: get from auth context
        items: weakItems
      });
      setEnrollSuccess(true);
      setShowConfirm(false);
    } catch {
      setError('录入失败，请重试');
    } finally {
      setEnrolling(false);
    }
  }, [report, sessionId]);

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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--color-text)]">面试报告</h1>
        <button onClick={onBack} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">返回</button>
      </div>

      {/* Score overview */}
      <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white ${report.overallScore >= 80 ? 'bg-green-500' : report.overallScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}>
            {report.overallScore}
          </div>
          <div>
            <div className="text-lg font-semibold text-[var(--color-text)]">{report.jobLabel}</div>
            <div className="text-sm text-[var(--color-text-muted)]">{report.totalQuestions} 道题目</div>
          </div>
        </div>
        {/* Category scores */}
        <div className="grid grid-cols-2 gap-3">
          {report.categoryScores.map(cs => (
            <div key={cs.category} className="flex justify-between items-center p-3 bg-[var(--color-bg)] rounded-lg">
              <span className="text-sm text-[var(--color-text)]">{cs.category}</span>
              <span className={`text-sm font-semibold ${cs.score >= 80 ? 'text-green-500' : cs.score >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{cs.score}分</span>
            </div>
          ))}
        </div>
      </div>

      {/* Overall feedback */}
      {report.overallFeedback && (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] mb-2">综合评价</h3>
          <p className="text-sm text-[var(--color-text-muted)]">{report.overallFeedback}</p>
        </div>
      )}

      {/* Strengths */}
      {report.strengths.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] mb-2">优势</h3>
          <ul className="list-disc pl-5 space-y-1">
            {report.strengths.map((s, i) => <li key={i} className="text-sm text-[var(--color-text-muted)]">{s}</li>)}
          </ul>
        </div>
      )}

      {/* Improvements */}
      {report.improvements.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-[var(--color-text)] mb-2">改进建议</h3>
          <ul className="list-disc pl-5 space-y-1">
            {report.improvements.map((im, i) => <li key={i} className="text-sm text-[var(--color-text-muted)]">{im}</li>)}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setShowConfirm(true)}
          disabled={enrollSuccess}
          className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${enrollSuccess ? 'bg-green-500 text-white cursor-default' : 'bg-[var(--color-primary)] text-white hover:opacity-90'}`}
        >
          {enrollSuccess ? '已录入复习计划' : '录入复习计划'}
        </button>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        open={showConfirm}
        title="录入复习计划"
        message="是否将本次面试中得分较低的题目（&lt;6分）录入复习计划？系统将在适当的时间安排复习。"
        confirmText="确认录入"
        cancelText="取消"
        onConfirm={handleEnrollWeakPoints}
        onCancel={() => setShowConfirm(false)}
        loading={enrolling}
      />
    </div>
  );
}
