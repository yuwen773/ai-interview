import { View, Text } from '@tarojs/components';
import './index.scss';

interface LoadingProps {
  text?: string;
  fullPage?: boolean;
}

export default function Loading({ text = '加载中...', fullPage = false }: LoadingProps) {
  const containerClass = `loading-container ${fullPage ? 'loading-container--full' : 'section-shell'}`;

  return (
    <View className={containerClass}>
      <View className="loading-container__content">
        <View className="loading-spinner" />
        <View className="loading-container__status">
          <Text className="loading-container__title">正在准备内容</Text>
          <Text className="loading-container__text">{text}</Text>
        </View>
        <View className="loading-container__progress">
          <View className="loading-container__progress-bar" />
        </View>
      </View>
    </View>
  );
}
