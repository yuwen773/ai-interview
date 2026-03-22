import { View, Text, ScrollView } from '@tarojs/components';
import { useState, useRef } from 'react';
import type { InterviewReport } from '@/types/interview';
import './index.scss';

interface Props {
  data: InterviewReport;
}

export default function AnswerTab({ data }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'feedback' | 'answer'>('feedback');
  const { questionDetails, referenceAnswers } = data;
  const total = questionDetails?.length ?? 0;
  const current = questionDetails?.[currentIndex];
  const currentRef = referenceAnswers?.[currentIndex];

  const touchStartX = useRef(0);

  const handleTouchStart = (e: any) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: any) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX < -50) {
      goToNext();   // 左滑 → 下一题
    }
    if (deltaX > 50) {
      goToPrev();   // 右滑 → 上一题
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const goToNext = () => {
    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
  };

  if (!current) {
    return (
      <View className="answer-tab">
        <Text className="answer-tab__empty">暂无题目数据</Text>
      </View>
    );
  }

  return (
    <View className="answer-tab" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* 题目索引列表 */}
      <ScrollView className="answer-tab__indexes" scrollX enableFlex>
        {questionDetails.map((q, index) => (
          <View
            key={index}
            className={`answer-tab__index-item ${index === currentIndex ? 'answer-tab__index-item--active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          >
            {index + 1}
          </View>
        ))}
      </ScrollView>

      {/* 题目内容卡片 */}
      <View className="answer-tab__card">
        {/* 题目 */}
        <View className="answer-tab__question">
          <Text className="answer-tab__question-label">Q{currentIndex + 1}</Text>
          <Text className="answer-tab__question-text">{current.question}</Text>
        </View>

        {/* 用户回答 */}
        <View className="answer-tab__user-answer">
          <Text className="answer-tab__user-answer-label">我的回答</Text>
          <View className="answer-tab__user-answer-content">
            <Text>{current.userAnswer || '（未回答）'}</Text>
          </View>
          <View className="answer-tab__score-pill">
            <Text>{current.score}分</Text>
          </View>
        </View>

        {/* 反馈/参考答案 Tab */}
        <View className="answer-tab__sub-tabs">
          <View
            className={`answer-tab__sub-tab ${activeSubTab === 'feedback' ? 'answer-tab__sub-tab--active' : ''}`}
            onClick={() => setActiveSubTab('feedback')}
          >
            面试反馈
          </View>
          <View
            className={`answer-tab__sub-tab ${activeSubTab === 'answer' ? 'answer-tab__sub-tab--active' : ''}`}
            onClick={() => setActiveSubTab('answer')}
          >
            参考答案
          </View>
        </View>

        <View className="answer-tab__sub-content">
          {activeSubTab === 'feedback' ? (
            <Text className="answer-tab__feedback-text">{current.feedback || '暂无反馈。'}</Text>
          ) : (
            <View>
              <Text className="answer-tab__ref-text">{currentRef?.referenceAnswer || '暂无参考答案。'}</Text>
              {currentRef?.keyPoints?.length ? (
                <View className="answer-tab__key-points">
                  {currentRef.keyPoints.map((point, i) => (
                    <View key={i} className="answer-tab__key-point">{point}</View>
                  ))}
                </View>
              ) : null}
            </View>
          )}
        </View>
      </View>

      {/* 底部导航 */}
      <View className="answer-tab__nav">
        <View
          className={`answer-tab__nav-btn ${currentIndex === 0 ? 'answer-tab__nav-btn--disabled' : ''}`}
          onClick={goToPrev}
        >
          ← 上一题
        </View>
        <Text className="answer-tab__nav-indicator">{currentIndex + 1}/{total}</Text>
        <View
          className={`answer-tab__nav-btn ${currentIndex === total - 1 ? 'answer-tab__nav-btn--disabled' : ''}`}
          onClick={goToNext}
        >
          下一题 →
        </View>
      </View>
    </View>
  );
}
