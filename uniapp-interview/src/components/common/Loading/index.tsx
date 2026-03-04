import { View, Text } from '@tarojs/components';
import './index.scss';

interface LoadingProps {
  text?: string;
}

export default function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <View className="loading-container">
      <View className="loading-spinner"></View>
      <Text className="loading-text">{text}</Text>
    </View>
  );
}
