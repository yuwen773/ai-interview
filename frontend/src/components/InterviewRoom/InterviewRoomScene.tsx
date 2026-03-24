// frontend/src/components/InterviewRoom/InterviewRoomScene.tsx
import { motion } from 'framer-motion';
import { Interviewer2D, InterviewMode } from './Interviewer2D';
import './interviewRoom.css';

interface InterviewRoomSceneProps {
  mode: InterviewMode;
  mouthOpen: number;
  className?: string;
  children?: React.ReactNode;
}

export function InterviewRoomScene({
  mode,
  mouthOpen,
  className = '',
  children
}: InterviewRoomSceneProps) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 背景层 - 面试室图片 */}
      <div className="absolute inset-0">
        <img
          src="/images/interview-room.png"
          alt="Interview Room"
          className="w-full h-full object-cover"
        />
        {/* 背景遮罩 */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/30 via-slate-900/10 to-slate-900/50" />
      </div>

      {/* 环境光效 */}
      <div className="absolute inset-0 pointer-events-none">
        {/* 顶部灯光 */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-radial from-white/10 to-transparent blur-2xl" />
        {/* 左侧暖光 */}
        <div className="absolute top-1/3 left-0 w-64 h-64 bg-gradient-radial from-amber-500/5 to-transparent blur-3xl" />
        {/* 右侧冷光 */}
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-gradient-radial from-blue-500/5 to-transparent blur-3xl" />
      </div>

      {/* 面试官区域 */}
      <div className="absolute inset-0 flex items-end justify-center pb-0">
        <motion.div
          className="relative w-[280px] md:w-[350px] lg:w-[400px] h-[70%] md:h-[75%]"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          <Interviewer2D mode={mode} mouthOpen={mouthOpen} />
        </motion.div>
      </div>

      {/* 桌面层（前景遮罩） */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] pointer-events-none">
        {/* 桌面渐变 */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-800/90 to-transparent" />

        {/* 桌面反光 */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-700/30 to-transparent"
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* 桌面上的物品轮廓（装饰） */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-end gap-8 opacity-20">
          {/* 简历/文件 */}
          <div className="w-12 h-16 bg-white/10 rounded shadow-lg transform -rotate-3" />
          {/* 笔 */}
          <div className="w-2 h-14 bg-gradient-to-t from-slate-600 to-slate-400 rounded-full transform rotate-12" />
          {/* 水杯 */}
          <div className="w-6 h-8 bg-gradient-to-t from-slate-600 to-slate-500 rounded-b-lg" />
        </div>
      </div>

      {/* 边框装饰 */}
      <div className="absolute inset-0 border-4 border-slate-800/50 rounded-3xl pointer-events-none" />

      {/* 角落装饰 */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-slate-600/30 rounded-tl-lg" />
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-slate-600/30 rounded-tr-lg" />
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-slate-600/30 rounded-bl-lg" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-slate-600/30 rounded-br-lg" />

      {/* 子元素（底部控制栏） */}
      {children && (
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900/90 to-transparent">
          {children}
        </div>
      )}
    </div>
  );
}

export type { InterviewMode };
