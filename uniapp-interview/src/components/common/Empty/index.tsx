import { View, Text, Button } from '@tarojs/components';
import './index.scss';

interface EmptyProps {
  text?: string;
  title?: string;
  badge?: string;
  actionText?: string;
  onAction?: () => void;
  fullPage?: boolean;
  type?: 'default' | 'error' | 'search';
}

export default function Empty({
  text = '暂时还没有内容',
  title = '内容稍后就绪',
  badge = '等待下一步',
  actionText,
  onAction,
  fullPage = false,
  type = 'default'
}: EmptyProps) {
  const containerClass = `empty-container ${fullPage ? 'empty-container--full' : 'section-shell'} empty-container--${type}`;

  return (
    <View className={containerClass}>
      <View className="empty-container__visual">
        <View className="empty-container__circle empty-container__circle--1" />
        <View className="empty-container__circle empty-container__circle--2" />
        <View className="empty-container__icon-box">
          {type === 'error' ? '⚠️' : type === 'search' ? '🔍' : '📄'}
        </View>
      </View>
      <View className="empty-container__content">
        <View className={`empty-container__badge status-pill status-pill--${type === 'error' ? 'danger' : 'info'}`}>
          {badge}
        </View>
        <Text className="empty-container__title">{title}</Text>
        <Text className="empty-container__text">{text}</Text>
      </View>
      {actionText && onAction && (
        <Button className="empty-container__action action-chip" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </View>
  );
}
