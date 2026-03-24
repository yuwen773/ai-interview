# InterviewRoom 组件

沉浸式面试场景组件，提供 2D 面试官和面试室背景。

## 组件列表

- `InterviewRoomScene` - 场景容器，包含背景、光效、前景层
- `Interviewer2D` - 2D 真实照片面试官，支持眨眼、呼吸、嘴型同步
- `InterviewControlPanel` - 底部控制面板
- `InterviewSubtitlePanel` - 右侧对话侧边栏
- `InterviewerAdapter` - 面试官适配器，预留 3D 模式接口

## 使用示例

```tsx
import { InterviewRoomScene } from '@/components/InterviewRoom';
import { getInterviewerMode } from '@/utils/interviewMode';

function InterviewPage() {
  const mode = getInterviewerMode(stage, isRecording, isSubmitting, isPlaying);
  const { mouthOpen } = useLipSync();

  return (
    <InterviewRoomScene mode={mode} mouthOpen={mouthOpen}>
      <InterviewControlPanel {...props} />
    </InterviewRoomScene>
  );
}
```

## 状态说明

- `idle` - 待机状态
- `listening` - 倾听中
- `thinking` - 思考中
- `speaking` - 提问中

## 资源文件

需要准备以下图片资源：
- `/public/images/interviewer-portrait.png` - 面试官照片
