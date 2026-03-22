import { View, Text } from '@tarojs/components';
import type { InterviewReport } from '@/types/interview';
import './index.scss';

interface Props {
  data: InterviewReport;
}

export default function DetailTab({ data }: Props) {
  const { overallFeedback, strengths, improvements } = data;

  return (
    <View className="detail-tab">
      {/* 总体评价 */}
      <View className="detail-tab__section">
        <Text className="detail-tab__section-title">总体评价</Text>
        <View className="detail-tab__feedback">
          <Text className="detail-tab__feedback-text">{overallFeedback || '暂无总体评价。'}</Text>
        </View>
      </View>

      {/* 优势/改进双栏 */}
      <View className="detail-tab__columns">
        <View className="detail-tab__column">
          <View className="detail-tab__column-header detail-tab__column-header--success">
            <Text>优势亮点</Text>
          </View>
          {strengths?.length ? (
            strengths.map((item, index) => (
              <View key={index} className="detail-tab__list-item detail-tab__list-item--success">
                <Text className="detail-tab__list-marker">+</Text>
                <Text className="detail-tab__list-text">{item}</Text>
              </View>
            ))
          ) : (
            <Text className="detail-tab__placeholder">当前没有提炼出明确亮点。</Text>
          )}
        </View>

        <View className="detail-tab__column">
          <View className="detail-tab__column-header detail-tab__column-header--warning">
            <Text>改进建议</Text>
          </View>
          {improvements?.length ? (
            improvements.map((item, index) => (
              <View key={index} className="detail-tab__list-item detail-tab__list-item--warning">
                <Text className="detail-tab__list-marker">•</Text>
                <Text className="detail-tab__list-text">{item}</Text>
              </View>
            ))
          ) : (
            <Text className="detail-tab__placeholder">当前没有额外改进建议。</Text>
          )}
        </View>
      </View>
    </View>
  );
}