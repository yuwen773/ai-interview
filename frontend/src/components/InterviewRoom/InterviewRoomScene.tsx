// frontend/src/components/InterviewRoom/InterviewRoomScene.tsx
import { motion } from 'framer-motion';
import { Interviewer2D, InterviewMode } from './Interviewer2D';
import type { AvatarId } from '../../config/avatar-config';
import './interviewRoom.css';

const prefersReducedMotion =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

interface InterviewRoomSceneProps {
  mode: InterviewMode;
  mouthOpen: number;
  avatarId: AvatarId;
  className?: string;
  children?: React.ReactNode;
}

export function InterviewRoomScene({
  mode,
  mouthOpen,
  avatarId,
  className = '',
  children
}: InterviewRoomSceneProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 背景层 - 面试室图片 */}
      <div className="absolute inset-0">
        <img
          src="/images/interview-room.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover"
        />
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-900/20 via-stone-900/10 to-stone-900/60" />
      </div>

      {/* 环境光效 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 顶部柔和灯光 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-40 bg-gradient-to-b from-white/5 to-transparent blur-3xl" />
        {/* 底部暗角 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-stone-900/60 to-transparent" />
      </div>

      {/* 面试官区域 */}
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <motion.div
          className="relative w-[320px] md:w-[420px] lg:w-[500px] h-[78%] md:h-[85%]"
          initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Interviewer2D mode={mode} mouthOpen={mouthOpen} avatarId={avatarId} />
        </motion.div>
      </div>

      {/* 子元素（底部控制栏） */}
      {children && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-stone-900/90 to-transparent">
          {children}
        </div>
      )}
    </div>
  );
}

export type { InterviewMode };
