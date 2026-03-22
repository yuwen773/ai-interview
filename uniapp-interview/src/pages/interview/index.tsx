import { View, Text, Button, Textarea, ScrollView } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import { interviewApi } from '../../api/interview';
import { resumeApi } from '../../api/resume';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import type { InterviewSession, JobRole, Question } from '../../types/interview';
import './index.scss';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Interview() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [jobLabel, setJobLabel] = useState('');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 5 });

  useEffect(() => {
    const params = router.params || {};
    const resumeId = params.resumeId || Taro.getStorageSync('currentResumeId');
    const sessionIdParam = params.sessionId;
    const jobRole = (params.jobRole || Taro.getStorageSync('currentInterviewJobRole')) as JobRole | '';
    const forceCreate = params.forceCreate === 'true';

    if (sessionIdParam) {
      void restoreSession(sessionIdParam);
      return;
    }

    if (!resumeId) {
      return;
    }

    if (!jobRole) {
      Taro.navigateTo({ url: `/pages/interview-config/index?resumeId=${resumeId}` });
      return;
    }

    void createSession(String(resumeId), jobRole, forceCreate);
  }, [router.params]);

  const applySession = (session: InterviewSession) => {
    const currentQuestion = session.questions?.[session.currentQuestionIndex] ?? null;
    setSessionId(session.sessionId);
    setJobLabel(session.jobLabel);
    setQuestion(currentQuestion);
    setAnswer(currentQuestion?.userAnswer || '');
    setProgress({
      current: Math.min(session.currentQuestionIndex + 1, session.totalQuestions),
      total: session.totalQuestions || 5,
    });

    const restoredMessages: Message[] = [];
    session.questions.forEach((item, index) => {
      if (index > session.currentQuestionIndex) {
        return;
      }
      restoredMessages.push({ role: 'assistant', content: item.question });
      if (item.userAnswer) {
        restoredMessages.push({ role: 'user', content: item.userAnswer });
      }
    });

    setMessages(restoredMessages);
  };

  const restoreSession = async (currentSessionId: string) => {
    setLoading(true);
    try {
      const session = await interviewApi.getSession(currentSessionId);
      Taro.setStorageSync('currentInterviewJobRole', session.jobRole);
      applySession(session);
    } catch (error) {
      console.error('恢复面试失败:', error);
      Taro.showToast({ title: '恢复面试失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (resumeId: string, jobRole: JobRole, forceCreate = false) => {
    setLoading(true);
    try {
      const resumeDetail = await resumeApi.getDetail(resumeId);
      const resumeText = resumeDetail.resumeText;

      if (!resumeText) {
        Taro.showToast({ title: '简历内容为空', icon: 'none' });
        return;
      }

      const session = await interviewApi.createSession({
        resumeId: Number(resumeId),
        resumeText,
        questionCount: 5,
        jobRole,
        forceCreate,
      });

      Taro.setStorageSync('currentResumeId', resumeId);
      Taro.setStorageSync('currentInterviewJobRole', session.jobRole);
      applySession(session);
    } catch (error) {
      console.error('创建面试失败:', error);
      Taro.showToast({ title: '创建面试失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !question) {
      Taro.showToast({ title: '请输入答案', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      const currentAnswer = answer;
      setMessages((prev) => [...prev, { role: 'user', content: currentAnswer }]);

      const res = await interviewApi.submitAnswer({
        sessionId,
        answer: currentAnswer,
        questionIndex: question.questionIndex,
      });

      if (!res.hasNextQuestion || !res.nextQuestion) {
        Taro.navigateTo({ url: `/pages/interview-report/index?sessionId=${sessionId}` });
        return;
      }

      setQuestion(res.nextQuestion);
      setProgress({ current: res.currentIndex + 1, total: res.totalQuestions || 5 });
      setMessages((prev) => [...prev, { role: 'assistant', content: res.nextQuestion?.question || '' }]);
      setAnswer('');
    } catch (error) {
      console.error('提交答案失败:', error);
      Taro.showToast({ title: '提交失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !question) {
    return <Loading text="准备面试中..." />;
  }

  if (!question && !sessionId) {
    return (
      <Empty
        text="请先从岗位选择页开始面试"
        actionText="选择岗位"
        onAction={() => Taro.switchTab({ url: '/pages/index/index' })}
      />
    );
  }

  return (
    <ScrollView className="interview-page" scrollY>
      <View className="progress">
        <View className="progress-info">
          <Text className="job-label">{jobLabel || '模拟面试'}</Text>
          <Text className="progress-text">第 {progress.current} 题 / 共 {progress.total} 题</Text>
        </View>
        <View className="progress-bar">
          <View className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }}></View>
        </View>
      </View>

      {messages.length > 0 && (
        <View className="message-list">
          {messages.map((msg, index) => (
            <View className={`message-item ${msg.role}`} key={index}>
              <View className="message-bubble">
                <Text>{msg.content}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      <View className="question-card">
        <Text className="question-label">面试问题</Text>
        <Text className="question-content">{question?.question || ''}</Text>
      </View>

      <View className="answer-area">
        <Textarea
          className="answer-input"
          value={answer}
          onInput={(e) => setAnswer(e.detail.value)}
          placeholder="请输入你的答案..."
          maxLength={2000}
        />
      </View>

      <View className="actions">
        <Button
          className="submit-btn"
          onClick={handleSubmitAnswer}
          disabled={loading || !answer.trim()}
        >
          <Text className="btn-text">{loading ? '提交中...' : '提交答案'}</Text>
        </Button>
      </View>
    </ScrollView>
  );
}
