import { View, Text } from '@tarojs/components';
import './index.scss';

interface LoadingProps {
  text?: string;
}

export default function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <View className="loading-container section-shell">
      <View className="loading-container__header">
        <View className="loading-spinner" />
        <View className="loading-container__status">
          <Text className="loading-container__title">正在准备内容</Text>
          <Text className="loading-container__text">{text}</Text>
        </View>
      </View>
      <View className="loading-container__progress">
        <View className="loading-container__progress-bar" />
      </View>
    </View>
  );
}
