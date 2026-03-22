import { View, Text, Button } from '@tarojs/components';
import './index.scss';

interface EmptyProps {
  text?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function Empty({ text = '暂时还没有内容', actionText, onAction }: EmptyProps) {
  return (
    <View className="empty-container section-shell">
      <View className="empty-container__badge status-pill status-pill--info">等待下一步</View>
      <Text className="empty-container__title">内容稍后就绪</Text>
      <Text className="empty-container__text">{text}</Text>
      {actionText && onAction && (
        <Button className="empty-container__action action-chip" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  );
}
