// frontend/src/components/InterviewRoom/Interviewer2D.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';

type InterviewMode = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Interviewer2DProps {
  mode: InterviewMode;
  mouthOpen: number;
  className?: string;
}

export function Interviewer2D({ mode, mouthOpen, className = '' }: Interviewer2DProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const [thinkingAngle, setThinkingAngle] = useState(0);

  // 随机眨眼 (2-6秒间隔)
  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };

    const scheduleNextBlink = () => {
      const delay = 2000 + Math.random() * 4000;
      const timer = setTimeout(() => {
        blink();
        scheduleNextBlink();
      }, delay);
      return timer;
    };

    const timer = scheduleNextBlink();
    return () => clearTimeout(timer);
  }, []);

  // 呼吸动画
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathPhase(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // 思考时头部微动
  useEffect(() => {
    if (mode !== 'thinking') return;

    const interval = setInterval(() => {
      setThinkingAngle(Math.sin(Date.now() / 1000) * 3);
    }, 50);
    return () => clearInterval(interval);
  }, [mode]);

  // 计算头部倾斜角度
  const headTilt = useMemo(() => {
    if (mode === 'thinking') {
      return thinkingAngle;
    } else if (mode === 'listening') {
      return 2;
    }
    return 0;
  }, [mode, thinkingAngle]);

  // 计算呼吸的垂直偏移
  const breathOffset = Math.sin(breathPhase * 0.1) * 2;

  // 获取不同状态的滤镜
  const filterStyle = useMemo(() => {
    switch (mode) {
      case 'listening':
        return 'brightness(1.05)';
      case 'thinking':
        return 'brightness(0.98)';
      case 'speaking':
        return 'brightness(1.02)';
      default:
        return 'brightness(1)';
    }
  }, [mode]);

  return (
    <div className={`relative ${className}`}>
      {/* 人物容器 */}
      <motion.div
        className="relative"
        animate={{
          rotate: headTilt,
          y: breathOffset,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ filter: filterStyle }}
      >
        {/* 主人物图片 */}
        <div className="relative w-full h-full overflow-hidden rounded-t-3xl">
          <img
            src="/images/interviewer-portrait.png"
            alt="Interviewer"
            className="w-full h-full object-cover object-top"
            onError={(e) => {
              // 图片加载失败时显示占位符
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />

          {/* 眼睛遮罩（眨眼效果） */}
          <AnimatePresence>
            {isBlinking && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fcd5b8]/20 to-transparent"
                style={{
                  clipPath: 'polygon(0 35%, 100% 35%, 100% 42%, 0 42%)',
                }}
              />
            )}
          </AnimatePresence>

          {/* 说话时嘴部动态效果 */}
          {mode === 'speaking' && mouthOpen > 0.1 && (
            <motion.div
              className="absolute bottom-[30%] left-1/2 -translate-x-1/2"
              animate={{
                scale: [1, 1 + mouthOpen * 0.1, 1],
                opacity: mouthOpen * 0.3,
              }}
              transition={{
                duration: 0.15,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <div className="w-8 h-4 bg-gradient-to-b from-[#c94a4a]/30 to-transparent rounded-full blur-sm" />
            </motion.div>
          )}

          {/* 思考时的光影效果 */}
          {mode === 'thinking' && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent"
              animate={{ opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}

          {/* 倾听时的光影效果 */}
          {mode === 'listening' && (
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-transparent" />
          )}
        </div>
      </motion.div>

      {/* 桌子前景（遮罩效果） */}
      <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-slate-800 via-slate-800/80 to-transparent">
        {/* 桌面反光效果 */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-700/50 to-transparent" />
      </div>

      {/* 状态指示器 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
        >
          <div
            className={`px-5 py-2.5 rounded-full backdrop-blur-md border shadow-lg ${
              mode === 'speaking'
                ? 'bg-green-500/20 text-green-300 border-green-500/40 shadow-green-500/20'
                : mode === 'listening'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-blue-500/20'
                : mode === 'thinking'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-500/20'
                : 'bg-slate-500/20 text-slate-300 border-slate-500/40 shadow-slate-500/20'
            }`}
          >
            <span className="text-sm font-medium flex items-center gap-2">
              {mode === 'speaking' && (
                <>
                  <SpeakingIndicator />
                  提问中
                </>
              )}
              {mode === 'listening' && (
                <>
                  <ListeningIndicator />
                  倾听中
                </>
              )}
              {mode === 'thinking' && (
                <>
                  <ThinkingIndicator />
                  思考中
                </>
              )}
              {mode === 'idle' && (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  待机中
                </>
              )}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// 说话动画指示器
function SpeakingIndicator() {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1 bg-green-400 rounded-full"
          animate={{
            height: ['4px', '12px', '4px'],
          }}
          transition={{
            duration: 0.4,
            repeat: Infinity,
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
}

// 倾听动画指示器
function ListeningIndicator() {
  return (
    <motion.div
      className="w-4 h-4 rounded-full border-2 border-blue-400"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
      }}
    />
  );
}

// 思考动画指示器
function ThinkingIndicator() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'linear',
      }}
      className="w-4 h-4"
    >
      <div className="w-full h-full rounded-full border-2 border-amber-400 border-t-transparent" />
    </motion.div>
  );
}

// 导出类型
export type { InterviewMode };
