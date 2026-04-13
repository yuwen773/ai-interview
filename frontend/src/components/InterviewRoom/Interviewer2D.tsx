// frontend/src/components/InterviewRoom/Interviewer2D.tsx
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { AvatarId, getAvatarImageUrl } from '../../config/avatar-config';

type InterviewMode = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Interviewer2DProps {
  avatarId: AvatarId;
  mode: InterviewMode;
  mouthOpen: number;
  className?: string;
}

export function Interviewer2D({ avatarId, mode, mouthOpen, className = '' }: Interviewer2DProps) {
  const [isBlinking, setIsBlinking] = useState(false);
  const [thinkingAngle, setThinkingAngle] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  // avatarId 变化时重置图片加载状态
  useEffect(() => {
    setImageFailed(false);
  }, [avatarId]);

  // 随机眨眼
  useEffect(() => {
    const blink = () => { setIsBlinking(true); setTimeout(() => setIsBlinking(false), 150); };
    const scheduleNextBlink = () => {
      const elapsed = Date.now();
      const delay = 2000 + (Math.sin(elapsed / 2000) * 0.5 + 0.5) * 4000;
      const timer = setTimeout(() => { blink(); scheduleNextBlink(); }, delay);
      return timer;
    };
    const timer = scheduleNextBlink();
    return () => clearTimeout(timer);
  }, []);

  // 思考时头部微动
  useEffect(() => {
    if (mode !== 'thinking') return;
    const interval = setInterval(() => { setThinkingAngle(Math.sin(Date.now() / 1000) * 3); }, 50);
    return () => clearInterval(interval);
  }, [mode]);

  const headTilt = useMemo(() => {
    if (mode === 'thinking') return thinkingAngle;
    if (mode === 'listening') return 2;
    return 0;
  }, [mode, thinkingAngle]);

  const filterStyle = useMemo(() => {
    switch (mode) {
      case 'listening': return 'brightness(1.05)';
      case 'thinking':   return 'brightness(0.98)';
      case 'speaking':   return 'brightness(1.02)';
      default:          return 'brightness(1)';
    }
  }, [mode]);

  const avatarInitial = avatarId.split('.')[1]?.[0] ?? 'I';

  return (
    <div className={`ah-character-avatar ${className}`} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>

      {/* 头像层：图片或 CSS fallback（始终占满容器） */}
      {imageFailed ? (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-slate-700 to-slate-900">
          <div className="w-full h-full rounded-t-3xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-8xl font-bold text-white drop-shadow-lg">{avatarInitial}</span>
          </div>
        </div>
      ) : (
        <img
          id="character-static-image"
          src={getAvatarImageUrl(avatarId)}
          alt="Interviewer"
          onError={() => setImageFailed(true)}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover', objectPosition: 'center top' }}
        />
      )}

      {/* 动态视频层（初始隐藏） */}
      <video
        id="character-avatar-video"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center top', display: 'none' }}
      />

      {/* 表情动画层 */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ rotate: headTilt }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        style={{ filter: filterStyle }}
      >
        {/* 眨眼遮罩 */}
        <AnimatePresence>
          {isBlinking && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
              className="absolute inset-0 bg-gradient-to-b from-transparent via-[#fcd5b8]/20 to-transparent"
              style={{ clipPath: 'polygon(0 35%, 100% 35%, 100% 42%, 0 42%)' }}
            />
          )}
        </AnimatePresence>

        {/* 说话时嘴部动态 */}
        {mode === 'speaking' && mouthOpen > 0.1 && (
          <motion.div
            className="absolute bottom-[28%] left-1/2 -translate-x-1/2"
            animate={{ scale: [1, 1 + mouthOpen * 0.15, 1], opacity: mouthOpen * 0.4 }}
            transition={{ duration: 0.15, repeat: Infinity, repeatType: 'reverse' }}
          >
            <div className="w-10 h-5 bg-gradient-to-b from-[#c94a4a]/40 to-transparent rounded-full blur-sm" />
          </motion.div>
        )}

        {/* 思考时光效 */}
        {mode === 'thinking' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}

        {/* 倾听时光效 */}
        {mode === 'listening' && (
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 via-transparent to-transparent" />
        )}
      </motion.div>

      {/* 桌子前景 */}
      <div className="absolute bottom-0 left-0 right-0 h-[25%] bg-gradient-to-t from-slate-800 via-slate-800/80 to-transparent">
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
          <div className={`px-5 py-2.5 rounded-full border ${
            mode === 'speaking'  ? 'bg-green-500/20 text-green-300 border-green-500/40'
            : mode === 'listening' ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
            : mode === 'thinking'  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
          }`}>
            <span className="text-sm font-medium flex items-center gap-2">
              {mode === 'speaking'  && <><SpeakingIndicator />提问中</>}
              {mode === 'listening' && <><ListeningIndicator />倾听中</>}
              {mode === 'thinking'  && <><ThinkingIndicator />思考中</>}
              {mode === 'idle'      && <><span className="w-2 h-2 rounded-full bg-slate-400" />待机中</>}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SpeakingIndicator() {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1 bg-green-400 rounded-full"
          animate={{ height: ['4px', '12px', '4px'] }}
          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.1 }}
        />
      ))}
    </div>
  );
}

function ListeningIndicator() {
  return (
    <motion.div className="w-4 h-4 rounded-full border-2 border-blue-400"
      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

function ThinkingIndicator() {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-4 h-4">
      <div className="w-full h-full rounded-full border-2 border-amber-400 border-t-transparent" />
    </motion.div>
  );
}

export type { InterviewMode };
export type { AvatarId };
