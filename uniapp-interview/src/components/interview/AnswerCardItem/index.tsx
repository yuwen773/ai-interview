import { View, Text } from '@tarojs/components';
import type { AnswerCardItem as AnswerCardItemType } from '../../../types/interview';
import './index.scss';

interface Props {
  item: AnswerCardItemType;
  isActive: boolean;
  isSelected: boolean;
  canJump: boolean;  // 是否可跳转（真实当前题之前的已答/暂存题目）
  onJump: (questionIndex: number) => void;
}

const STATUS_COLORS = {
  answered: '#22c55e',  // 绿色
  saved: '#eab308',     // 黄色
  unanswered: '#ef4444', // 红色
};

export default function AnswerCardItem({ item, isActive, isSelected, canJump, onJump }: Props) {
  const bgColor = STATUS_COLORS[item.status];

  const handleClick = () => {
    if (canJump) {
      onJump(item.questionIndex);
    }
  };

  return (
    <View
      className={`answer-card-item ${isSelected ? 'answer-card-item--selected' : ''} ${canJump ? 'answer-card-item--clickable' : ''}`}
      style={{ backgroundColor: bgColor }}
      onClick={handleClick}
    >
      <Text className="answer-card-item__index">Q{item.displayIndex}</Text>
      {isActive && <View className="answer-card-item__current-dot" />}
    </View>
  );
}
