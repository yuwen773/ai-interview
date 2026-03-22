import { View, Text, Button } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { historyApi } from '../../api/history';
import Loading from '../../components/common/Loading';
import './index.scss';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [resumeCount, setResumeCount] = useState(0);
  const [interviewCount, setInterviewCount] = useState(0);
  const [defaultResumeId, setDefaultResumeId] = useState<number | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const resumes = await historyApi.getResumes();
      if (resumes && Array.isArray(resumes)) {
        const totalInterview = resumes.reduce((sum: number, r: any) => sum + (r.interviewCount || 0), 0);
        setResumeCount(resumes.length);
        setInterviewCount(totalInterview);
        const storedResumeId = Number(Taro.getStorageSync('currentResumeId'));
        const matchedResume = resumes.find((item) => item.id === storedResumeId);
        setDefaultResumeId(matchedResume?.id ?? resumes[0]?.id ?? null);
      }
    } catch (err) {
      console.error('加载统计数据失败:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadResume = () => {
    Taro.navigateTo({ url: '/pages/upload/index' });
  };

  const handleStartInterview = () => {
    if (!defaultResumeId) {
      Taro.showToast({ title: '请先进入简历详情选择简历', icon: 'none' });
      return;
    }
    Taro.setStorageSync('currentResumeId', String(defaultResumeId));
    Taro.navigateTo({ url: `/pages/interview-config/index?resumeId=${defaultResumeId}` });
  };

  return (
    <View className="index-page">
      <View className="header">
        <Text className="title">AI面试助手</Text>
        <Text className="subtitle">智能面试准备，提升求职竞争力</Text>
      </View>

      {loading ? (
        <Loading text="加载中..." />
      ) : (
        <View className="stats-card">
          <View className="stat-item">
            <Text className="stat-value">{resumeCount}</Text>
            <Text className="stat-label">简历数</Text>
          </View>
          <View className="stat-item">
            <Text className="stat-value">{interviewCount}</Text>
            <Text className="stat-label">面试次数</Text>
          </View>
        </View>
      )}

      <View className="actions">
        <Button className="action-btn primary" onClick={handleUploadResume}>
          <Text className="btn-text">上传简历</Text>
        </Button>
        <Button className="action-btn secondary" onClick={handleStartInterview}>
          <Text className="btn-text secondary">开始面试</Text>
        </Button>
      </View>

      <View className="features">
        <View className="feature-item">
          <View className="feature-icon-wrapper">
            <Text className="feature-icon-text">📄</Text>
          </View>
          <Text className="feature-title">智能简历分析</Text>
          <Text className="feature-desc">AI分析简历，提供优化建议</Text>
        </View>
        <View className="feature-item">
          <View className="feature-icon-wrapper">
            <Text className="feature-icon-text">💬</Text>
          </View>
          <Text className="feature-title">模拟面试</Text>
          <Text className="feature-desc">与AI面试官进行实战演练</Text>
        </View>
        <View className="feature-item">
          <View className="feature-icon-wrapper">
            <Text className="feature-icon-text">📊</Text>
          </View>
          <Text className="feature-title">能力评估</Text>
          <Text className="feature-desc">多维度评估，提升面试技巧</Text>
        </View>
      </View>
    </View>
  );
}
