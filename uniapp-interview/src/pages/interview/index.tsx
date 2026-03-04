import { View, Text, Button, Textarea, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { interviewApi } from '../../api/interview';
import { resumeApi } from '../../api/resume';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import './index.scss';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Interview() {
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 5 });

  useEffect(() => {
    // 优先从 URL 参数获取，否则从 storage 获取
    let resumeId = Taro.getCurrentInstance().router?.params.resumeId;
    if (!resumeId) {
      resumeId = Taro.getStorageSync('currentResumeId');
    }
    if (resumeId) {
      createSession(resumeId);
    }
  }, []);

  const createSession = async (resumeId: string) => {
    setLoading(true);
    try {
      // 先获取简历详情，获取 resumeText
      const resumeDetail = await resumeApi.getDetail(resumeId);
      const resumeText = resumeDetail.resumeText;

      if (!resumeText) {
        Taro.showToast({ title: '简历内容为空', icon: 'none' });
        return;
      }

      // 创建面试会话，传递简历文本
      const res = await interviewApi.createSession({
        resumeId: Number(resumeId),
        resumeText: resumeText,
        questionCount: 5
      });
      // 从 questions 数组获取当前问题
      const firstQuestion = res.questions?.[0]?.content || '';
      setSessionId(res.sessionId);
      setQuestion(firstQuestion);
      setProgress({ current: 1, total: res.totalQuestions || 5 });
      setMessages([{ role: 'assistant', content: firstQuestion }]);
    } catch (err) {
      Taro.showToast({ title: '创建面试失败', icon: 'none' });
      console.error('创建面试失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim()) {
      Taro.showToast({ title: '请输入答案', icon: 'none' });
      return;
    }

    setLoading(true);
    try {
      setMessages([...messages, { role: 'user', content: answer }]);

      const res = await interviewApi.submitAnswer({
        sessionId,
        answer,
        questionIndex: progress.current - 1,
      });

      if (res.completed) {
        Taro.navigateTo({ url: `/pages/interview-report/index?sessionId=${sessionId}` });
      } else {
        setQuestion(res.nextQuestion || '');
        setProgress({ current: (res.currentIndex || 1) + 1, total: res.totalQuestions || 5 });
        setMessages([...messages, { role: 'user', content: answer }, { role: 'assistant', content: res.nextQuestion || '' }]);
        setAnswer('');
      }
    } catch (err) {
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
        text="请先上传简历后再开始面试"
        actionText="上传简历"
        onAction={() => Taro.navigateTo({ url: '/pages/upload/index' })}
      />
    );
  }

  return (
    <ScrollView className="interview-page" scrollY>
      <View className="progress">
        <Text>第 {progress.current} 题 / 共 {progress.total} 题</Text>
        <View className="progress-bar">
          <View className="progress-fill" style={{ width: `${(progress.current / progress.total) * 100}%` }}></View>
        </View>
      </View>

      <View className="question-card">
        <Text className="question-label">面试问题</Text>
        <Text className="question-content">{question}</Text>
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
        <Button className="submit-btn" onClick={handleSubmitAnswer} disabled={loading || !answer.trim()}>
          {loading ? '提交中...' : '提交答案'}
        </Button>
      </View>
    </ScrollView>
  );
}
