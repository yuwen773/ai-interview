import { Button, ScrollView, Text, View } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import { useState } from 'react';
import { historyApi, type ResumeListItem } from '../../api/history';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import './index.scss';

type StatusMeta = {
  label: string;
  className: string;
  description: string;
};

function formatDateTime(value?: string | null) {
  if (!value) {
    return '刚刚更新';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value.replace('T', ' ').slice(0, 16);
  }

  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hour = `${date.getHours()}`.padStart(2, '0');
  const minute = `${date.getMinutes()}`.padStart(2, '0');
  return `${month}-${day} ${hour}:${minute}`;
}

function formatFileSize(bytes?: number | null) {
  if (!bytes || bytes <= 0) {
    return '未知大小';
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getStatusMeta(item: ResumeListItem): StatusMeta {
  if (typeof item.latestScore === 'number') {
    return {
      label: '已完成分析',
      className: 'status-pill status-pill--success',
      description: `最近一次分析时间 ${formatDateTime(item.lastAnalyzedAt)}`,
    };
  }

  return {
    label: '待查看详情',
    className: 'status-pill status-pill--info',
    description: '上传后若仍在处理或失败，请进入详情页查看实时状态',
  };
}

export default function ResumeListPage() {
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<ResumeListItem[]>([]);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const data = await historyApi.getResumes();
      setResumes(data);
    } catch (error) {
      console.error('加载简历列表失败', error);
      Taro.showToast({ title: '加载简历失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  useDidShow(() => {
    void loadResumes();
  });

  const handleUpload = () => {
    Taro.navigateTo({ url: '/pages/upload/index' });
  };

  const handleOpenDetail = (resumeId: number) => {
    Taro.setStorageSync('currentResumeId', String(resumeId));
    Taro.navigateTo({ url: `/pages/resume-detail/index?id=${resumeId}` });
  };

  const handleStartInterview = (resumeId: number) => {
    Taro.setStorageSync('currentResumeId', String(resumeId));
    Taro.navigateTo({ url: `/pages/interview-config/index?resumeId=${resumeId}` });
  };

  const handleDelete = async (resumeId: number, filename: string) => {
    const result = await Taro.showModal({
      title: '删除简历',
      content: `确认删除“${filename}”吗？相关面试记录也会一起移除。`,
      confirmText: '删除',
      confirmColor: '#ef4444',
    });

    if (!result.confirm) {
      return;
    }

    try {
      await historyApi.deleteResume(resumeId);
      Taro.showToast({ title: '已删除', icon: 'success' });
      setResumes((current) => current.filter((item) => item.id !== resumeId));
    } catch (error) {
      console.error('删除简历失败', error);
      Taro.showToast({ title: '删除失败', icon: 'none' });
    }
  };

  if (loading) {
    return (
      <View className="resume-list-page page-shell">
        <Loading text="正在加载你的简历档案..." fullPage />
      </View>
    );
  }

  return (
    <View className="resume-list-page page-shell">
      <View className="resume-list-page__hero section-shell section-shell--primary">
        <Text className="resume-list-page__eyebrow">简历档案</Text>
        <Text className="resume-list-page__title">把每份简历都沉淀成可继续训练的起点</Text>
        <Text className="resume-list-page__desc">
          在这里集中管理上传记录、分析结果和关联练习，后续可以直接进入详情页继续面试或导出报告。
        </Text>
        <View className="resume-list-page__hero-stats">
          <View className="stat-block">
            <Text className="stat-block__value">{resumes.length}</Text>
            <Text className="stat-block__label">简历总数</Text>
            <Text className="stat-block__hint">当前已接入真实列表接口</Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">
              {resumes.reduce((sum, item) => sum + item.interviewCount, 0)}
            </Text>
            <Text className="stat-block__label">关联练习</Text>
            <Text className="stat-block__hint">帮助你快速回到最近一次训练</Text>
          </View>
        </View>
      </View>

      <View className="task-card task-card--info resume-list-page__upload-card" onClick={handleUpload}>
        <Text className="task-card__eyebrow">上传入口</Text>
        <Text className="task-card__title">新增一份简历，继续扩充训练样本</Text>
        <Text className="task-card__desc">
          支持 PDF 和 Word。上传后会自动进入分析流程，详情页里可以查看状态、导出分析和发起面试。
        </Text>
        <Text className="resume-list-page__upload-cta">去上传新简历</Text>
      </View>

      {resumes.length === 0 ? (
        <Empty
          text="还没有简历档案。先上传一份简历，再开始后续分析和模拟面试。"
          actionText="上传简历"
          onAction={handleUpload}
        />
      ) : (
        <View className="resume-list-page__list">
          {resumes.map((item) => {
            const statusMeta = getStatusMeta(item);
            return (
              <View key={item.id} className="task-card resume-list-page__card">
                <View className="resume-list-page__card-head">
                  <View>
                    <Text className="task-card__eyebrow">上传于 {formatDateTime(item.uploadedAt)}</Text>
                    <Text className="resume-list-page__filename text-truncate">{item.filename}</Text>
                  </View>
                  <View className={statusMeta.className}>{statusMeta.label}</View>
                </View>

                <Text className="resume-list-page__meta">
                  {formatFileSize(item.fileSize)} · 浏览 {item.accessCount ?? 0} 次
                </Text>
                <Text className="task-card__desc">{statusMeta.description}</Text>

                <View className="resume-list-page__stats">
                  <View className="resume-list-page__stat">
                    <Text className="resume-list-page__stat-value">{item.latestScore ?? '--'}</Text>
                    <Text className="resume-list-page__stat-label">最近得分</Text>
                  </View>
                  <View className="resume-list-page__stat">
                    <Text className="resume-list-page__stat-value">{item.interviewCount}</Text>
                    <Text className="resume-list-page__stat-label">面试次数</Text>
                  </View>
                </View>

                <View className="resume-list-page__actions">
                  <Button
                    className="action-chip resume-list-page__action"
                    onClick={() => handleOpenDetail(item.id)}
                  >
                    查看详情
                  </Button>
                  <Button
                    className="action-chip action-chip--secondary resume-list-page__action"
                    onClick={() => handleStartInterview(item.id)}
                  >
                    开始面试
                  </Button>
                  <Button
                    className="action-chip action-chip--danger resume-list-page__delete"
                    onClick={() => handleDelete(item.id, item.filename)}
                  >
                    删除
                  </Button>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
