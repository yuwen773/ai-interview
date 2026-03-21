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
    return <Loading text="加载岗位配置中..." />;
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
    <ScrollView className="interview-config-page" scrollY>
      <View className="hero">
        <Text className="title">选择目标岗位</Text>
        <Text className="subtitle">
          根据岗位生成更贴近真实场景的题目。开始面试前，先确认这次要模拟的方向。
        </Text>
      </View>

      {unfinishedSession && (
        <View className="status-card">
          <Text className="status-title">检测到未完成面试</Text>
          <Text className="status-text">
            当前简历已有未完成面试，岗位为“{unfinishedSession.jobLabel}”，已完成
            {unfinishedSession.currentQuestionIndex} / {unfinishedSession.totalQuestions} 题。
          </Text>
          <View className="status-actions">
            <Button className="status-btn secondary" onClick={handleContinueUnfinished}>
              继续该面试
            </Button>
            <Button className="status-btn primary" onClick={handleStartInterview}>
              开始新的
            </Button>
          </View>
        </View>
      )}

      <View className="resume-card">
        <Text className="resume-title">当前简历</Text>
        <Text className="resume-name">{resumeName || `简历 #${resumeId}`}</Text>
        <Text className="resume-preview">
          {resumePreview ? `${resumePreview}${resumePreview.length >= 120 ? '...' : ''}` : '暂无简历摘要'}
        </Text>
      </View>

      <View className="role-list">
        {roles.map((role) => (
          <JobRoleCard
            key={role.code}
            role={role}
            selected={selectedRole === role.code}
            onSelect={setSelectedRole}
          />
        ))}
      </View>

      <View className="footer">
        <Text className="hint">
          {selectedRoleLabel ? `已选择：${selectedRoleLabel}` : '请选择岗位后开始面试'}
        </Text>
        <Button className="start-btn" onClick={handleStartInterview} disabled={!selectedRole}>
          {unfinishedSession ? '开始新的岗位面试' : '开始面试'}
        </Button>
      </View>
    </ScrollView>
  );
}
