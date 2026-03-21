import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import { useRouter } from '@tarojs/taro';
import { resumeApi } from '../../api/resume';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import './index.scss';

export default function ResumeDetail() {
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();
  const id = router.params.id;

  useEffect(() => {
    console.log('ResumeDetail - router params:', router?.params);
    console.log('ResumeDetail - id:', id);
    if (id) {
      loadResume();
    } else {
      setLoading(false);
    }
  }, [id]);

  // 获取最新的分析结果
  const latestAnalysis = resume?.analyses?.[0];

  // 轮询检查分析状态
  useEffect(() => {
    if (resume?.analyzeStatus === 'PENDING' || resume?.analyzeStatus === 'PROCESSING') {
      setIsAnalyzing(true);
      const timer = setInterval(() => {
        loadResume(true);
      }, 3000); // 每3秒检查一次

      return () => clearInterval(timer);
    } else {
      setIsAnalyzing(false);
    }
  }, [resume?.analyzeStatus]);

  const loadResume = async (isPolling = false) => {
    try {
      if (!isPolling) {
        setLoading(true);
      }
      const res = await resumeApi.getDetail(id);
      setResume(res);
    } catch (err) {
      if (!isPolling) {
        Taro.showToast({ title: '加载失败', icon: 'none' });
      }
    } finally {
      if (!isPolling) {
        setLoading(false);
      }
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '等待分析';
      case 'PROCESSING':
        return '分析中...';
      case 'COMPLETED':
        return '分析完成';
      case 'FAILED':
        return '分析失败';
      default:
        return status;
    }
  };

  const handleStartInterview = () => {
    if (resume?.analyzeStatus !== 'COMPLETED') {
      Taro.showToast({ title: '请等待分析完成', icon: 'none' });
      return;
    }
    Taro.setStorageSync('currentResumeId', String(id));
    Taro.navigateTo({ url: `/pages/interview-config/index?resumeId=${id}` });
  };

  if (loading) {
    return <Loading text="加载中..." />;
  }

  if (!resume) {
    return <Empty text="简历不存在" />;
  }

  return (
    <ScrollView className="resume-detail-page" scrollY>
      <View className="header">
        <Text className="title">{resume.filename}</Text>
        <Text className={`status ${resume.analyzeStatus?.toLowerCase()}`}>
          {getStatusText(resume.analyzeStatus)}
        </Text>
      </View>

      {isAnalyzing && (
        <View className="analyzing-tip">
          <Loading text="AI正在分析简历..." />
        </View>
      )}

      <View className="section">
        <Text className="section-title">分析结果</Text>
        <View className="content">
          <Text>{latestAnalysis?.summary || '暂无分析结果'}</Text>
        </View>
      </View>

      <View className="section">
        <Text className="section-title">综合得分</Text>
        <View className="score-display">
          <Text className="score-value">{latestAnalysis?.overallScore || '-'}</Text>
          <Text className="score-max">/100</Text>
        </View>
      </View>

      <View className="section">
        <Text className="section-title">各项得分</Text>
        <View className="scores">
          {latestAnalysis && (
            <>
              <View className="score-item">
                <Text className="score-name">内容质量</Text>
                <Text className="score-value">{latestAnalysis.contentScore}</Text>
              </View>
              <View className="score-item">
                <Text className="score-name">结构规范</Text>
                <Text className="score-value">{latestAnalysis.structureScore}</Text>
              </View>
              <View className="score-item">
                <Text className="score-name">技能匹配</Text>
                <Text className="score-value">{latestAnalysis.skillMatchScore}</Text>
              </View>
              <View className="score-item">
                <Text className="score-name">项目经验</Text>
                <Text className="score-value">{latestAnalysis.projectScore}</Text>
              </View>
              <View className="score-item">
                <Text className="score-name">表达呈现</Text>
                <Text className="score-value">{latestAnalysis.expressionScore}</Text>
              </View>
            </>
          )}
          {!latestAnalysis && (
            <Text className="no-scores">暂无得分数据</Text>
          )}
        </View>
      </View>

      <View className="actions">
        <Button
          className="action-btn primary"
          onClick={handleStartInterview}
          disabled={resume.analyzeStatus !== 'COMPLETED'}
        >
          {resume.analyzeStatus === 'COMPLETED' ? '开始面试' : '等待分析完成'}
        </Button>
      </View>
    </ScrollView>
  );
}
