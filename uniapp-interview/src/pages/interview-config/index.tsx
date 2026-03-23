import { View, Text, Button, ScrollView } from '@tarojs/components';
import { useEffect, useMemo, useState } from 'react';
import Taro, { useRouter } from '@tarojs/taro';
import JobRoleCard from '../../components/JobRoleCard';
import Loading from '../../components/common/Loading';
import Empty from '../../components/common/Empty';
import { interviewApi } from '../../api/interview';
import { resumeApi } from '../../api/resume';
import type { InterviewSession, JobRole, JobRoleDTO } from '../../types/interview';
import './index.scss';

export default function InterviewConfig() {
  const router = useRouter();
  const resumeId = router.params.resumeId || Taro.getStorageSync('currentResumeId');
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<JobRoleDTO[]>([]);
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [resumeName, setResumeName] = useState('');
  const [resumePreview, setResumePreview] = useState('');
  const [unfinishedSession, setUnfinishedSession] = useState<InterviewSession | null>(null);

  const selectedRoleLabel = useMemo(
    () => roles.find((item) => item.code === selectedRole)?.label ?? '',
    [roles, selectedRole]
  );
  const answeredCount = useMemo(() => {
    if (!unfinishedSession?.questions?.length) {
      return unfinishedSession?.currentQuestionIndex ?? 0;
    }

    return unfinishedSession.questions.filter((item) => Boolean(item.userAnswer?.trim())).length;
  }, [unfinishedSession]);

  useEffect(() => {
    if (!resumeId) {
      setLoading(false);
      return;
    }
    void loadPageData(String(resumeId));
  }, [resumeId]);

  const loadPageData = async (currentResumeId: string) => {
    setLoading(true);
    try {
      const [roleList, resumeDetail, unfinished] = await Promise.all([
        interviewApi.getJobRoles(),
        resumeApi.getDetail(currentResumeId),
        interviewApi.findUnfinishedSession(Number(currentResumeId)),
      ]);

      setRoles(roleList);
      setResumeName(resumeDetail.filename);
      setResumePreview((resumeDetail.resumeText || '').slice(0, 120));
      setUnfinishedSession(unfinished);

      const storedRole = Taro.getStorageSync('currentInterviewJobRole') as JobRole | '';
      if (unfinished?.jobRole) {
        setSelectedRole(unfinished.jobRole);
      } else if (storedRole && roleList.some((item) => item.code === storedRole)) {
        setSelectedRole(storedRole);
      } else if (roleList.length > 0) {
        setSelectedRole(roleList[0].code);
      }
    } catch (error) {
      console.error('加载岗位配置失败', error);
      Taro.showToast({ title: '加载岗位失败', icon: 'none' });
    } finally {
      setLoading(false);
    }
  };

  const navigateToInterview = (params: Record<string, string>) => {
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');
    Taro.navigateTo({ url: `/pages/interview/index?${query}` });
  };

  const handleContinueUnfinished = () => {
    if (!resumeId || !unfinishedSession) {
      return;
    }

    Taro.setStorageSync('currentResumeId', String(resumeId));
    Taro.setStorageSync('currentInterviewJobRole', unfinishedSession.jobRole);
    navigateToInterview({
      resumeId: String(resumeId),
      sessionId: unfinishedSession.sessionId,
      jobRole: unfinishedSession.jobRole,
    });
  };

  const handleStartInterview = () => {
    if (!resumeId || !selectedRole) {
      Taro.showToast({ title: '请先选择岗位', icon: 'none' });
      return;
    }

    Taro.setStorageSync('currentResumeId', String(resumeId));
    Taro.setStorageSync('currentInterviewJobRole', selectedRole);
    navigateToInterview({
      resumeId: String(resumeId),
      jobRole: selectedRole,
      forceCreate: unfinishedSession ? 'true' : 'false',
    });
  };

  if (loading) {
    return <Loading text="加载岗位配置中..." fullPage />;
  }

  if (!resumeId) {
    return (
      <Empty
        text="请先从简历详情进入岗位选择"
        actionText="去上传简历"
        onAction={() => Taro.navigateTo({ url: '/pages/upload/index' })}
      />
    );
  }

  return (
    <View className="interview-config-page page-shell">
      <View className="interview-config-page__hero section-shell section-shell--primary">
        <Text className="interview-config-page__eyebrow">岗位配置</Text>
        <Text className="interview-config-page__title">先确定这轮训练的岗位方向，再决定是恢复旧会话还是重新开始</Text>
        <Text className="interview-config-page__subtitle">
          岗位决定题目侧重点。若这份简历已有未完成面试，建议优先续上一次，避免训练记录被切散。
        </Text>
      </View>

      {unfinishedSession && (
        <View className="section-shell interview-config-page__resume-path interview-config-page__resume-path--warning">
          <View className="interview-config-page__section-head">
            <Text className="interview-config-page__section-title">检测到未完成面试</Text>
            <View className="status-pill status-pill--warning">可继续</View>
          </View>
          <Text className="interview-config-page__resume-path-text">
            当前简历已有一场 {unfinishedSession.jobLabel} 面试尚未结束，已完成 {answeredCount} /{' '}
            {unfinishedSession.totalQuestions} 题。
          </Text>
          <View className="interview-config-page__path-stats">
            <View className="stat-block">
              <Text className="stat-block__value">{answeredCount}</Text>
              <Text className="stat-block__label">已答题数</Text>
              <Text className="stat-block__hint">继续会回到当前进度</Text>
            </View>
            <View className="stat-block">
              <Text className="stat-block__value">{unfinishedSession.totalQuestions - answeredCount}</Text>
              <Text className="stat-block__label">剩余题数</Text>
              <Text className="stat-block__hint">完成后会直接进入报告页</Text>
            </View>
          </View>
          <View className="interview-config-page__path-actions">
            <Button className="action-chip action-chip--secondary interview-config-page__path-action" onClick={handleContinueUnfinished}>
              继续该面试
            </Button>
            <Button className="action-chip interview-config-page__path-action" onClick={handleStartInterview}>
              开始新的
            </Button>
          </View>
        </View>
      )}

      <View className="section-shell interview-config-page__resume-card">
        <View className="interview-config-page__section-head">
          <Text className="interview-config-page__section-title">当前简历摘要</Text>
          <Text className="surface-note">系统会基于这份简历和所选岗位生成更贴近真实场景的问题。</Text>
        </View>
        <Text className="interview-config-page__resume-name">{resumeName || `简历 #${resumeId}`}</Text>
        <Text className="interview-config-page__resume-preview">
          {resumePreview ? `${resumePreview}${resumePreview.length >= 120 ? '...' : ''}` : '暂无简历摘要'}
        </Text>
        <View className="interview-config-page__resume-meta">
          <View className="stat-block">
            <Text className="stat-block__value">{roles.length}</Text>
            <Text className="stat-block__label">可选岗位</Text>
            <Text className="stat-block__hint">岗位越明确，题目越聚焦</Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">{unfinishedSession ? '有' : '无'}</Text>
            <Text className="stat-block__label">历史续练</Text>
            <Text className="stat-block__hint">同一简历可恢复未完成会话</Text>
          </View>
        </View>
      </View>

      <View className="interview-config-page__role-section">
        <View className="interview-config-page__section-head interview-config-page__section-head--tight">
          <Text className="interview-config-page__section-title">选择目标岗位</Text>
          <Text className="surface-note">优先选择你近期最想投递的方向，后续报告会围绕该岗位给反馈。</Text>
        </View>
      </View>

      <View className="interview-config-page__role-list">
        {roles.map((role) => (
          <JobRoleCard
            key={role.code}
            role={role}
            selected={selectedRole === role.code}
            onSelect={setSelectedRole}
          />
        ))}
      </View>

      <View className="interview-config-page__footer">
        <View className="section-shell interview-config-page__footer-card">
          <Text className="interview-config-page__footer-label">当前选择</Text>
          <Text className="interview-config-page__footer-value">
            {selectedRoleLabel || '请选择岗位后开始面试'}
          </Text>
          <Text className="interview-config-page__footer-hint">
            {unfinishedSession
              ? '如果你想保留当前未完成进度，优先点“继续该面试”；开始新的会创建一场新会话。'
              : '确认岗位后立即开始，题目会按该岗位方向生成。'}
          </Text>
        </View>
        <Button className="interview-config-page__start-btn" onClick={handleStartInterview} disabled={!selectedRole}>
          {unfinishedSession ? '开始新的岗位面试' : '立即开始面试'}
        </Button>
        <Text className="interview-config-page__hint">
          {selectedRoleLabel ? `已选择：${selectedRoleLabel}` : '请选择岗位后开始面试'}
        </Text>
      </View>
    </View>
  );
}
