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
import './index.scss';

export default function InterviewReportPage() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [errorText, setErrorText] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const sessionId = Taro.getCurrentInstance().router?.params.sessionId;

  const tabs = ['概览', '详情', '答题'];

  const loadReport = async () => {
    if (!sessionId) {
      setLoading(false);
      setErrorText('缺少会话编号，暂时无法加载报告。');
      return;
    }

    try {
      setLoading(true);
      setErrorText('');
      const nextReport = await interviewApi.getReport(sessionId);
      setReport(nextReport);
    } catch (error) {
      console.error('加载面试报告失败', error);
      setReport(null);
      setErrorText('报告暂时还不可用，可能还在生成中，也可能本地服务尚未启动。');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadReport();
  }, [sessionId]);

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
        <Loading text="正在整理本场面试反馈..." fullPage />
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
