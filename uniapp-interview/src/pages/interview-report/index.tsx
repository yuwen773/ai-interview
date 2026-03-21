import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useState, useEffect } from 'react';
import Taro from '@tarojs/taro';
import interviewApi from '../../api/interview';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import type { InterviewReport } from '../../types/interview';
import './index.scss';

export default function InterviewReport() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const sessionId = Taro.getCurrentInstance().router?.params.sessionId;

  useEffect(() => {
    if (sessionId) {
      loadReport();
    }
  }, [sessionId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await interviewApi.getReport(sessionId);
      setReport(res);
    } catch (err) {
      Taro.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPdf = async () => {
    try {
      const filePath = await interviewApi.exportReport(sessionId);
      Taro.openDocument({
        filePath,
        fileType: 'pdf',
      });
    } catch (err) {
      Taro.showToast({ title: '导出失败', icon: 'none' });
    }
  };

  if (loading) {
    return <Loading text="生成报告中..." />;
  }

  if (!report) {
    return <Empty text="报告不存在" />;
  }

  return (
    <ScrollView className="report-page" scrollY>
      <View className="header">
        <Text className="title">面试评估报告</Text>
        <Text className="job-tag">{report.jobLabel}</Text>
      </View>

      <View className="section">
        <Text className="section-title">综合得分</Text>
        <View className="score-display">
          <Text className="score-value">{report.overallScore}</Text>
          <Text className="score-max">/100</Text>
        </View>
      </View>

      <View className="section">
        <Text className="section-title">分类得分</Text>
        <View className="dimensions">
          {report.categoryScores?.map((item) => (
            <View className="dimension-item" key={item.category}>
              <View className="dimension-header">
                <Text className="dimension-name">
                  {item.category} · {item.questionCount} 题
                </Text>
                <Text className="dimension-score">{item.score}</Text>
              </View>
              <View className="dimension-bar">
                <View className="dimension-fill" style={{ width: `${item.score}%` }}></View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View className="section">
        <Text className="section-title">总体评价</Text>
        <View className="summary-card">
          <Text className="summary-text">{report.overallFeedback || '暂无总体评价'}</Text>
        </View>
      </View>

      <View className="section">
        <Text className="section-title">优势亮点</Text>
        <View className="suggestions">
          {report.strengths?.map((item: string, index: number) => (
            <View className="suggestion-item" key={`strength-${index}`}>
              <Text className="suggestion-icon">+</Text>
              <Text className="suggestion-text">{item}</Text>
            </View>
          ))}
          {!report.strengths?.length && <Text className="empty-text">暂无优势总结</Text>}
        </View>
      </View>

      <View className="section">
        <Text className="section-title">改进建议</Text>
        <View className="suggestions">
          {report.improvements?.map((item: string, index: number) => (
            <View className="suggestion-item" key={index}>
              <Text className="suggestion-icon">*</Text>
              <Text className="suggestion-text">{item}</Text>
            </View>
          ))}
          {!report.improvements?.length && <Text className="empty-text">暂无改进建议</Text>}
        </View>
      </View>

      <View className="actions">
        <Button className="action-btn" onClick={handleExportPdf}>
          导出PDF报告
        </Button>
      </View>
    </ScrollView>
  );
}
