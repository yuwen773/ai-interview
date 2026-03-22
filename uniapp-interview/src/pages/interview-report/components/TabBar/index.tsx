import { View } from '@tarojs/components';
import './index.scss';

interface TabBarProps {
  tabs: string[];
  currentIndex: number;
  onChange: (index: number) => void;
}

export default function TabBar({ tabs, currentIndex, onChange }: TabBarProps) {
  return (
    <View className="tab-bar">
      {tabs.map((tab, index) => (
        <View
          key={tab}
          className={`tab-bar__item ${index === currentIndex ? 'tab-bar__item--active' : ''}`}
          onClick={() => onChange(index)}
        >
          {tab}
        </View>
      ))}
    </View>
  );
}
