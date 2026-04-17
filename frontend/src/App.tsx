import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom';
import Layout from './components/Layout';
import { useEffect, useState, Suspense, lazy } from 'react';
import { historyApi } from './api/history';
import type { UploadKnowledgeBaseResponse } from './api/knowledgebase';
import { TaskStatusProvider } from './contexts/TaskStatusContext';
import { TaskNotification } from './components/TaskNotification';

// Lazy load components
const UploadPage = lazy(() => import('./pages/UploadPage'));
const HistoryList = lazy(() => import('./pages/HistoryPage'));
const ResumeDetailPage = lazy(() => import('./pages/ResumeDetailPage'));
const GrowthCurvePage = lazy(() => import('./pages/GrowthCurvePage'));
const Interview = lazy(() => import('./pages/InterviewPage'));
const InterviewHistoryPage = lazy(() => import('./pages/InterviewHistoryPage'));
const InterviewReportPage = lazy(() => import('./pages/InterviewReportPage'));
const KnowledgeBaseQueryPage = lazy(() => import('./pages/KnowledgeBaseQueryPage'));
const KnowledgeBaseUploadPage = lazy(() => import('./pages/KnowledgeBaseUploadPage'));
const KnowledgeBaseManagePage = lazy(() => import('./pages/KnowledgeBaseManagePage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const KnowledgeGraphPage = lazy(() => import('./pages/KnowledgeGraphPage'));
const LandingPage = lazy(() => import('./pages/landing'));
const VoiceInterviewListPage = lazy(() => import('./pages/voiceinterview/VoiceInterviewListPage'));
const VoiceInterviewPage = lazy(() => import('./pages/voiceinterview/VoiceInterviewPage'));

// Loading component
const Loading = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full animate-spin" />
  </div>
);

// 上传页面包装器
function UploadPageWrapper() {
  const navigate = useNavigate();

  const handleUploadComplete = (resumeId: number) => {
    // 异步模式：上传成功后跳转到简历库，让用户在列表中查看分析状态
    navigate('/history', { state: { newResumeId: resumeId } });
  };

  return <UploadPage onUploadComplete={handleUploadComplete} />;
}

// 历史记录列表包装器
function HistoryListWrapper() {
  const navigate = useNavigate();

  const handleSelectResume = (id: number) => {
    navigate(`/history/${id}`);
  };

  return <HistoryList onSelectResume={handleSelectResume} />;
}

// 简历详情包装器
function ResumeDetailWrapper() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();

  if (!resumeId) {
    return <Navigate to="/history" replace />;
  }

  const handleBack = () => {
    navigate('/history');
  };

  const handleStartInterview = (resumeText: string, resumeId: number) => {
    navigate(`/interview/${resumeId}`, { state: { resumeText } });
  };

  const handleViewGrowth = () => {
    navigate(`/history/${resumeId}/growth`);
  };

  return (
    <ResumeDetailPage
      resumeId={parseInt(resumeId, 10)}
      onBack={handleBack}
      onStartInterview={handleStartInterview}
      onViewGrowth={handleViewGrowth}
    />
  );
}

function GrowthCurveWrapper() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();

  if (!resumeId) {
    return <Navigate to="/history" replace />;
  }

  const handleBack = () => {
    navigate(`/history/${resumeId}`);
  };

  return (
    <GrowthCurvePage
      resumeId={parseInt(resumeId, 10)}
      onBack={handleBack}
    />
  );
}

// 模拟面试包装器
function InterviewWrapper() {
  const { resumeId } = useParams<{ resumeId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [resumeText, setResumeText] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 优先从location state获取resumeText
    const stateText = (location.state as { resumeText?: string })?.resumeText;
    if (stateText) {
      setResumeText(stateText);
      setLoading(false);
    } else if (resumeId) {
      // 如果没有，从API获取简历详情
      historyApi.getResumeDetail(parseInt(resumeId, 10))
        .then(resume => {
          setResumeText(resume.resumeText);
          setLoading(false);
        })
        .catch(err => {
          console.error('获取简历文本失败', err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [resumeId, location.state]);

  if (!resumeId) {
    return <Navigate to="/history" replace />;
  }

  const handleBack = () => {
    // 尝试返回详情页，如果失败则返回历史列表
    navigate(`/history/${resumeId}`, { replace: false });
  };

  const handleInterviewComplete = (sessionId: string) => {
    // 面试完成后跳转到面试报告页
    navigate(`/interviews/report/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[var(--color-border)] border-t-[var(--color-primary)] rounded-full mx-auto mb-4 animate-spin" />
          <p className="text-[var(--color-text-muted)]">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <Interview
      resumeText={resumeText}
      resumeId={parseInt(resumeId, 10)}
      onBack={handleBack}
      onInterviewComplete={handleInterviewComplete}
    />
  );
}

// 面试报告页面包装器
function InterviewReportPageWrapper() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  if (!sessionId) {
    return <Navigate to="/interviews" replace />;
  }

  return <InterviewReportPage onBack={() => navigate('/interviews')} />;
}

function App() {
  return (
    <BrowserRouter>
      <TaskStatusProvider>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* 着陆页 — 独立路由，不显示侧边栏 */}
            <Route path="/" element={<LandingPage />} />

            <Route path="/" element={<Layout />}>
              {/* 上传页面 */}
              <Route path="upload" element={<UploadPageWrapper />} />

              {/* 历史记录列表（简历库） */}
              <Route path="history" element={<HistoryListWrapper />} />

              {/* 简历详情 */}
              <Route path="history/:resumeId" element={<ResumeDetailWrapper />} />

              {/* 成长曲线 */}
              <Route path="history/:resumeId/growth" element={<GrowthCurveWrapper />} />

              {/* 面试记录列表 */}
              <Route path="interviews" element={<InterviewHistoryWrapper />} />

              {/* 模拟面试 */}
              <Route path="interview/:resumeId" element={<InterviewWrapper />} />

              {/* 面试报告 */}
              <Route path="interviews/report/:sessionId" element={<InterviewReportPageWrapper />} />

              {/* 知识库管理 */}
              <Route path="knowledgebase" element={<KnowledgeBaseManagePageWrapper />} />

              {/* 知识库上传 */}
              <Route path="knowledgebase/upload" element={<KnowledgeBaseUploadPageWrapper />} />

              {/* 问答助手（知识库聊天） */}
              <Route path="knowledgebase/chat" element={<KnowledgeBaseQueryPageWrapper />} />

              {/* 个人画像 */}
              <Route path="profile" element={<ProfilePage />} />

              {/* 知识图谱 */}
              <Route path="graph" element={<KnowledgeGraphPage />} />

              {/* 语音面试 */}
              <Route path="voice-interview" element={<VoiceInterviewListPage />} />
              <Route path="voice-interview/:sessionId" element={<VoiceInterviewPage />} />
            </Route>
          </Routes>
        </Suspense>
        <TaskNotification />
      </TaskStatusProvider>
    </BrowserRouter>
  );
}

// 面试记录页面包装器
function InterviewHistoryWrapper() {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/upload');
  };

  const handleViewInterview = async (sessionId: string, resumeId?: number) => {
    if (resumeId) {
      // 如果有简历ID，跳转到简历详情页的面试详情
      navigate(`/history/${resumeId}`, {
        state: { viewInterview: sessionId }
      });
    } else {
      // 否则尝试从面试详情中获取简历ID
      try {
        await historyApi.getInterviewDetail(sessionId);
        // 面试详情中没有简历ID，需要从其他地方获取
        // 暂时跳转到历史记录列表
        navigate('/history');
      } catch {
        navigate('/history');
      }
    }
  };

  const handleStartInterview = () => {
    navigate('/interview');
  };

  return <InterviewHistoryPage onBack={handleBack} onViewInterview={handleViewInterview} onStartInterview={handleStartInterview} />;
}

// 知识库管理页面包装器
function KnowledgeBaseManagePageWrapper() {
  const navigate = useNavigate();

  const handleUpload = () => {
    navigate('/knowledgebase/upload');
  };

  const handleChat = () => {
    navigate('/knowledgebase/chat');
  };

  return <KnowledgeBaseManagePage onUpload={handleUpload} onChat={handleChat} />;
}

// 知识库问答页面包装器
function KnowledgeBaseQueryPageWrapper() {
  const navigate = useNavigate();
  const location = useLocation();
  const isChatMode = location.pathname === '/knowledgebase/chat';

  const handleBack = () => {
    if (isChatMode) {
      navigate('/knowledgebase');
    } else {
      navigate('/upload');
    }
  };

  const handleUpload = () => {
    navigate('/knowledgebase/upload');
  };

  return <KnowledgeBaseQueryPage onBack={handleBack} onUpload={handleUpload} />;
}

// 知识库上传页面包装器
function KnowledgeBaseUploadPageWrapper() {
  const navigate = useNavigate();

  const handleUploadComplete = (_result: UploadKnowledgeBaseResponse) => {
    // 上传完成后返回管理页面
    navigate('/knowledgebase');
  };

  const handleBack = () => {
    navigate('/knowledgebase');
  };

  return <KnowledgeBaseUploadPage onUploadComplete={handleUploadComplete} onBack={handleBack} />;
}

export default App;
