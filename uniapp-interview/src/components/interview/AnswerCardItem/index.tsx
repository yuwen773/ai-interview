import { View, Text } from '@tarojs/components';
import { useState, useEffect } from 'react';
import type { AnswerCardItem as AnswerCardItemType } from '../../../types/interview';
import './index.scss';

interface Props {
  item: AnswerCardItemType;
  isCurrent: boolean;
  onSaveAnswer?: (questionIndex: number, answer: string) => void;
}

const STATUS_CONFIG = {
  answered: { label: '已答', color: '#22c55e' },
  saved: { label: '暂存', color: '#eab308' },
  unanswered: { label: '未答', color: '#ef4444' },
};

export default function AnswerCardItem({ item, isCurrent, onSaveAnswer }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editAnswer, setEditAnswer] = useState(item.savedAnswer || '');
  const config = STATUS_CONFIG[item.status];

  // 当展开时，同步最新的 savedAnswer
  useEffect(() => {
    if (expanded) {
      setEditAnswer(item.savedAnswer || '');
    }
  }, [expanded, item.savedAnswer]);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleSave = () => {
    if (onSaveAnswer && item.status === 'saved') {
      onSaveAnswer(item.questionIndex, editAnswer);  // questionIndex 是 0-based
      setExpanded(false);
    }
  };

  return (
    <View
      className={`answer-card-item ${isCurrent ? 'answer-card-item--current' : ''} answer-card-item--${item.status}`}
      onClick={handleToggle}
    >
      <View className="answer-card-item__header">
        <Text className="answer-card-item__index">Q{item.displayIndex}</Text>
        <View className="answer-card-item__status" style={{ backgroundColor: config.color }}>
          <Text className="answer-card-item__status-text">{config.label}</Text>
        </View>
      </View>

      {expanded && (
        <View className="answer-card-item__detail" onClick={(e) => e.stopPropagation()}>
          <Text className="answer-card-item__question">{item.question}</Text>
          {item.status === 'saved' && (
            <>
              <Text className="answer-card-item__answer-label">暂存的答案：</Text>
              <View className="answer-card-item__answer-input">
                <textarea
                  value={editAnswer}
                  onInput={(e) => setEditAnswer(e.detail.value)}
                  placeholder="请输入答案..."
                  maxLength={2000}
                />
              </View>
              <View className="answer-card-item__actions">
                <Text className="answer-card-item__save-btn" onClick={handleSave}>保存</Text>
              </View>
            </>
          )}
          {item.status === 'answered' && item.savedAnswer && (
            <>
              <Text className="answer-card-item__answer-label">我的回答：</Text>
              <Text className="answer-card-item__answer-text">{item.savedAnswer}</Text>
            </>
          )}
        </View>
      )}
    </View>
  );
}
