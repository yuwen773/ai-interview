import { Button, ScrollView, Text, View } from '@tarojs/components';
import { useEffect, useState } from 'react';
import Taro from '@tarojs/taro';
import interviewApi from '../../api/interview';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import type { InterviewReport } from '../../types/interview';
import TabBar from './components/TabBar';
import OverviewTab from './components/OverviewTab';
import DetailTab from './components/DetailTab';
import AnswerTab from './components/AnswerTab';
import ReportGenerating from './components/ReportGenerating';
import './index.scss';

export default function InterviewReportPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [errorText, setErrorText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTab, setCurrentTab] = useState(0);
  const sessionId = Taro.getCurrentInstance().router?.params.sessionId;

  const tabs = ['概览', '详情', '答题'];

  const loadReport = async (isPoll = false) => {
    if (!sessionId) {
      setLoading(false);
      setErrorText('缺少会话编号，暂时无法加载报告。');
      return;
    }

    try {
      if (!isPoll) setLoading(true);
      setErrorText('');
      // 如果不是在生成中，或者是在轮询，则不改变 isGenerating
      if (!isPoll && !isGenerating) setIsGenerating(false);

      // 先检查会话状态
      const session = await interviewApi.getSession(sessionId);

      if (session.status === 'COMPLETED') {
        // 面试完成但未评估，显示生成中
        setIsGenerating(true);
        // 这里可以尝试再次请求报告，或者提示用户稍后刷新
        try {
          const nextReport = await interviewApi.getReport(sessionId);
          setReport(nextReport);
          setIsGenerating(false);
        } catch (e) {
          // 依然没有报告，维持 isGenerating 为 true
          console.log('报告尚在生成中...');
        }
      } else if (session.status === 'EVALUATED') {
        // 已评估，直接获取报告
        const nextReport = await interviewApi.getReport(sessionId);
        setReport(nextReport);
        setIsGenerating(false);
      } else if (session.status === 'IN_PROGRESS') {
        // 面试进行中，不能看报告
        setErrorText('面试还在进行中，请先完成面试。');
        setIsGenerating(false);
      } else {
        // 其他状态（如 CREATED）
        setErrorText('面试尚未开始，无法生成报告。');
        setIsGenerating(false);
      }
    } catch (error) {
      console.error('加载面试报告失败', error);
      
      // 处理特定的 SDK 错误或网络波动
      const isSDKError = error.errMsg && error.errMsg.includes('webapi_getwxaasyncsecinfo');
      
      if (isSDKError && isPoll) {
        // 轮询时如果是 SDK 错误，静默忽略，等待下一次尝试
        return;
      }

      // 只有在非轮询且没有报告时才设置错误
      if (!isPoll && !report) {
        setReport(null);
        setErrorText('报告暂时还不可用，可能是网络问题或服务响应超时。');
      }
    } finally {
      if (!isPoll) setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, [sessionId]);

  // 当处于生成状态且没有报告时，开启轮询
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    if (isGenerating && !report && sessionId) {
      timer = setInterval(() => {
        void loadReport(true);
      }, 5000); // 每5秒轮询一次
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isGenerating, report, sessionId]);

  const handleExportPdf = async () => {
    if (!sessionId) {
      return;
    }

    try {
      const filePath = await interviewApi.exportReport(sessionId);
      await Taro.openDocument({ filePath, fileType: 'pdf' });
    } catch (error) {
      console.error('导出面试报告失败', error);
      Taro.showToast({ title: '导出失败', icon: 'none' });
    }
  };

  if (loading) {
    return (
      <View className="report-page page-shell">
        <Loading text="正在同步面试评估结果..." fullPage />
      </View>
    );
  }

  if (!sessionId || errorText) {
    return (
      <View className="report-page page-shell">
        <Empty
          text={errorText || '报告不存在'}
          title="加载失败"
          badge="异常提示"
          type="error"
          actionText="重新加载"
          onAction={() => void loadReport()}
        />
      </View>
    );
  }

  if (isGenerating && !report) {
    return (
      <View className="report-page page-shell">
        <ReportGenerating onAction={() => void loadReport()} />
      </View>
    );
  }

  if (!report) {
    return (
      <View className="report-page page-shell">
        <Empty
          text="报告尚未生成完成，请稍后再试。"
          title="生成中"
          badge="正在处理"
          actionText="重新加载"
          onAction={() => void loadReport()}
        />
      </View>
    );
  }

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <OverviewTab data={report} />;
      case 1:
        return <DetailTab data={report} />;
      case 2:
        return <AnswerTab data={report} />;
      default:
        return null;
    }
  };

  return (
    <View className="report-page page-shell">
      <TabBar tabs={tabs} currentIndex={currentTab} onChange={setCurrentTab} />
      <ScrollView className="report-page__content" scrollY>
        {renderTabContent()}
      </ScrollView>
      <View className="report-page__actions">
        <Button className="action-chip report-page__action" onClick={handleExportPdf}>
          导出 PDF 报告
        </Button>
        <Button
          className="action-chip action-chip--secondary report-page__action"
          onClick={() => Taro.navigateBack({ delta: 1 })}
        >
          返回上一页
        </Button>
      </View>
    </View>
  );
}
