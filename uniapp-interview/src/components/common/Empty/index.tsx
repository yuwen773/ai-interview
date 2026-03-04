import { View, Text, Button } from '@tarojs/components';
import './index.scss';

interface EmptyProps {
  text?: string;
  actionText?: string;
  onAction?: () => void;
}

export default function Empty({ text = '暂无数据', actionText, onAction }: EmptyProps) {
  return (
    <View className="empty-container">
      <Text className="empty-text">{text}</Text>
      {actionText && onAction && (
        <Button className="empty-action" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  );
}
