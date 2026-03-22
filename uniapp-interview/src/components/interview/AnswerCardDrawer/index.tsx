import { View, Text } from '@tarojs/components';
import { useEffect, useRef } from 'react';
import Taro from '@tarojs/taro';
import type { AnswerCardItem as AnswerCardItemType } from '../../../types/interview';
import AnswerCardItem from '../AnswerCardItem';
import './index.scss';

interface Props {
  visible: boolean;
  items: AnswerCardItemType[];
  currentIndex: number;
  onClose: () => void;
  onSaveAnswer?: (questionIndex: number, answer: string) => void;
}

export default function AnswerCardDrawer({ visible, items, currentIndex, onClose, onSaveAnswer }: Props) {
  const startX = useRef(0);
  const startY = useRef(0);

  useEffect(() => {
    if (visible) {
      Taro.setNavigationBarTitle({ title: '' });
    }
  }, [visible]);

  const handleTouchStart = (e: any) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: any) => {
    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < Math.abs(deltaX)) {
      if (deltaX < 0) {
        onClose();
      }
    }
  };

  const handleOverlayClick = () => {
    onClose();
  };

  if (!visible) return null;

  return (
    <View className="answer-card-drawer">
      <View className="answer-card-drawer__overlay" onClick={handleOverlayClick} />
      <View
        className="answer-card-drawer__content"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <View className="answer-card-drawer__header">
          <Text className="answer-card-drawer__title">答题卡</Text>
          <View className="answer-card-drawer__legend">
            <View className="answer-card-drawer__legend-item">
              <View className="answer-card-drawer__legend-dot" style={{ backgroundColor: '#22c55e' }} />
              <Text>已答</Text>
            </View>
            <View className="answer-card-drawer__legend-item">
              <View className="answer-card-drawer__legend-dot" style={{ backgroundColor: '#eab308' }} />
              <Text>暂存</Text>
            </View>
            <View className="answer-card-drawer__legend-item">
              <View className="answer-card-drawer__legend-dot" style={{ backgroundColor: '#ef4444' }} />
              <Text>未答</Text>
            </View>
          </View>
        </View>

        <View className="answer-card-drawer__list">
          {items.map((item) => (
            <View key={`card-${item.questionIndex}`}>
              <AnswerCardItem
                item={item}
                isCurrent={item.questionIndex === currentIndex}
                onSaveAnswer={onSaveAnswer}
              />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
