import { View, Text } from '@tarojs/components';
import { useEffect, useState } from 'react';
import './ReportGenerating.scss';

interface ReportGeneratingProps {
  onAction?: () => void;
}

const STEPS = [
  '正在深度分析您的回答...',
  '评估各项核心技能水平...',
  '计算本次面试综合得分...',
  '正在由 AI 生成优化建议...',
  '正在整理最终面试报告...',
];

export default function ReportGenerating({ onAction }: ReportGeneratingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 2500);

    return () => clearInterval(timer);
  }, []);

  return (
    <View className="report-generating">
      <View className="report-generating__card">
        <View className="report-generating__icon-wrapper">
          <View className="report-generating__icon">
            <View className="report-generating__pulse" />
            <View className="report-generating__paper" />
            <View className="report-generating__magnifier" />
          </View>
        </View>

        <View className="report-generating__status">
          <Text className="report-generating__title">报告正在精心生成中</Text>
          <Text className="report-generating__desc">AI 正在根据您的面试表现进行全面评估</Text>
        </View>

        <View className="report-generating__steps">
          {STEPS.map((step, index) => {
            let statusClass = 'step-pending';
            if (index < currentStep) statusClass = 'step-done';
            if (index === currentStep) statusClass = 'step-active';

            return (
              <View key={step} className={`report-generating__step ${statusClass}`}>
                <View className="step-dot" />
                <Text className="step-text">{step}</Text>
              </View>
            );
          })}
        </View>

        <View className="report-generating__progress">
          <View 
            className="report-generating__progress-inner" 
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </View>

        <View className="report-generating__footer" onClick={onAction}>
          <Text className="footer-action">点击重试</Text>
        </View>
      </View>
    </View>
  );
}
