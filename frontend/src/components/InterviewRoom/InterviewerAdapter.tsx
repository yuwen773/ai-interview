// frontend/src/components/InterviewRoom/InterviewerAdapter.tsx
import type { InterviewMode } from './Interviewer2D';
import type { AvatarId } from '../../config/avatar-config';
import { Interviewer2D } from './Interviewer2D';

// 预留 3D 面试官接口
// interface Interviewer3DProps {
//   mode: InterviewMode;
//   mouthOpen: number;
//   className?: string;
// }

type InterviewerType = '2d' | '3d';

interface InterviewerAdapterProps {
  type: InterviewerType;
  avatarId?: string;
  mode: InterviewMode;
  mouthOpen: number;
  className?: string;
}

export function InterviewerAdapter({ type, avatarId = 'navtalk.Ethan', mode, mouthOpen, className }: InterviewerAdapterProps) {
  // 当前只支持 2D
  if (type === '3d') {
    // TODO: 实现 3D 面试官
    console.warn('3D interviewer not implemented yet, falling back to 2D');
  }

  return <Interviewer2D avatarId={avatarId as AvatarId} mode={mode} mouthOpen={mouthOpen} className={className} />;
}

// 添加环境变量支持
const DEFAULT_INTERVIEWER_TYPE: InterviewerType =
  (import.meta.env.VITE_DEFAULT_INTERVIEWER_TYPE as InterviewerType) || '2d';

export { DEFAULT_INTERVIEWER_TYPE };
export type { InterviewerType };
