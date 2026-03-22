import { Button, ScrollView, Text, View } from '@tarojs/components';
import Taro from '@tarojs/taro';
import './index.scss';

const APP_VERSION = '1.0.0';

type ActionItem = {
  title: string;
  description: string;
  actionText: string;
  onClick: () => void;
};

export default function ProfilePage() {
  const actionItems: ActionItem[] = [
    {
      title: '产品说明',
      description: '了解当前小程序围绕简历分析、模拟面试、报告复盘和成长曲线构建的训练闭环。',
      actionText: '查看首页',
      onClick: () => Taro.switchTab({ url: '/pages/index/index' }),
    },
    {
      title: '帮助与反馈',
      description: '如果你遇到上传、报告导出或页面异常，可以先记录问题场景，再反馈给开发同学。',
      actionText: '反馈说明',
      onClick: () =>
        Taro.showModal({
          title: '帮助与反馈',
          content: '当前阶段请整理复现步骤、页面路径和截图，统一反馈给项目维护者。',
          showCancel: false,
          confirmText: '知道了',
        }),
    },
    {
      title: '继续训练',
      description: '从简历库、面试记录或成长曲线回到训练主链路，保持最近一次练习的连续性。',
      actionText: '去简历库',
      onClick: () => Taro.switchTab({ url: '/pages/resume-list/index' }),
    },
  ];

  return (
    <View className="profile-page page-shell">
      <View className="profile-page__hero section-shell section-shell--primary">
        <Text className="profile-page__eyebrow">我的</Text>
        <Text className="profile-page__title">把训练工具、反馈入口和版本信息放在一个轻量页里</Text>
        <Text className="profile-page__desc">
          当前阶段不扩展复杂设置，而是保留必要的产品说明、帮助反馈和本地构建信息，避免打断主流程。
        </Text>
        <View className="profile-page__hero-stats">
          <View className="stat-block">
            <Text className="stat-block__value">4</Text>
            <Text className="stat-block__label">核心 Tab</Text>
            <Text className="stat-block__hint">首页、简历库、面试记录、我的</Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">6</Text>
            <Text className="stat-block__label">流程页</Text>
            <Text className="stat-block__hint">覆盖上传、面试、报告和成长曲线</Text>
          </View>
          <View className="stat-block">
            <Text className="stat-block__value">v{APP_VERSION}</Text>
            <Text className="stat-block__label">当前版本</Text>
            <Text className="stat-block__hint">来源于本地 mini-program package 信息</Text>
          </View>
        </View>
      </View>

      <View className="section-shell profile-page__section">
        <View className="profile-page__section-head">
          <Text className="profile-page__section-title">产品定位</Text>
          <Text className="surface-note">聚焦校招训练闭环，而不是做设置繁多的管理中心。</Text>
        </View>
        <View className="profile-page__intro-list">
          <View className="profile-page__intro-item">
            <Text className="profile-page__intro-title">简历驱动训练</Text>
            <Text className="profile-page__intro-text">
              从上传简历开始，串起分析、岗位选择、模拟面试和报告复盘。
            </Text>
          </View>
          <View className="profile-page__intro-item">
            <Text className="profile-page__intro-title">结果沉淀复盘</Text>
            <Text className="profile-page__intro-text">
              每次练习都可以在面试记录和成长曲线里继续查看，不丢失上下文。
            </Text>
          </View>
          <View className="profile-page__intro-item">
            <Text className="profile-page__intro-title">轻量移动端体验</Text>
            <Text className="profile-page__intro-text">
              第一阶段优先保证核心流程顺畅，不引入额外复杂配置或重型工作台交互。
            </Text>
          </View>
        </View>
      </View>

      <View className="profile-page__actions">
        {actionItems.map((item) => (
          <View key={item.title} className="task-card task-card--info profile-page__action-card">
            <Text className="task-card__title">{item.title}</Text>
            <Text className="task-card__desc">{item.description}</Text>
            <Button className="action-chip action-chip--secondary profile-page__action-btn" onClick={item.onClick}>
              {item.actionText}
            </Button>
          </View>
        ))}
      </View>

      <View className="section-shell profile-page__section">
        <View className="profile-page__section-head">
          <Text className="profile-page__section-title">本地构建信息</Text>
          <Text className="surface-note">用于确认当前安装、运行环境和构建目标。</Text>
        </View>
        <View className="profile-page__meta-list">
          <View className="profile-page__meta-row">
            <Text className="profile-page__meta-label">小程序版本</Text>
            <Text className="profile-page__meta-value">v{APP_VERSION}</Text>
          </View>
          <View className="profile-page__meta-row">
            <Text className="profile-page__meta-label">运行框架</Text>
            <Text className="profile-page__meta-value">Taro 3 + React 18</Text>
          </View>
          <View className="profile-page__meta-row">
            <Text className="profile-page__meta-label">构建目标</Text>
            <Text className="profile-page__meta-value">WeChat Mini Program</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
