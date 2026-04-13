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

  const avatarInitial = avatarId.split('.')[1]?.[0] ?? 'I';

  // 口型开度：clamp 到 [0, 1]，非说话状态归零
  const openness = mode === 'speaking' ? Math.min(Math.max(mouthOpen, 0), 1) : 0;

  return (
    <div className={`ah-character-avatar ${className}`} style={{ position: 'relative', overflow: 'hidden', width: '100%', height: '100%' }}>

      {/* 头像层 */}
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

      {/* 动态视频层（NavTalk WebRTC 接入后使用，初始隐藏） */}
      <video
        id="character-avatar-video"
        className="absolute inset-0 w-full h-full"
        style={{ objectFit: 'cover', objectPosition: 'center top', display: 'none' }}
      />

      {/* ── 口型动画层 ── */}
      {/* 说话时整体面部光晕（提升"活感"，不需要精确定位） */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '65%',
          height: '35%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(255,215,160,${openness * 0.18}) 0%, transparent 70%)`,
          transition: 'background 80ms linear',
        }}
      />

      {/* 嘴部开合叠加层：深色椭圆随 mouthOpen 放大 */}
      {/* NavTalk 角色为半身像，嘴部约在容器 top 22-25% */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '22%',
          left: '50%',
          // 宽度随开度微变，高度随开度大幅变化（模拟张嘴）
          width: `${24 + openness * 8}px`,
          height: `${Math.max(2, openness * 22)}px`,
          transform: 'translateX(-50%)',
          background: 'radial-gradient(ellipse at 50% 40%, rgba(18,6,6,0.82) 0%, rgba(90,22,22,0.35) 65%, transparent 100%)',
          borderRadius: '50%',
          opacity: openness < 0.05 ? 0 : 0.25 + openness * 0.65,
          transition: 'width 60ms linear, height 60ms linear, opacity 60ms linear',
        }}
      />

      {/* 上唇高光（增加立体感） */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '21.5%',
          left: '50%',
          width: `${20 + openness * 6}px`,
          height: '3px',
          transform: 'translateX(-50%)',
          background: `rgba(200,150,120,${openness * 0.4})`,
          borderRadius: '2px',
          transition: 'background 60ms linear, width 60ms linear',
        }}
      />

      {/* 表情动画层（眨眼 + 头部倾斜 + 环境光效） */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ rotate: headTilt }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* 眨眼遮罩 */}
        <AnimatePresence>
          {isBlinking && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(to bottom, transparent 30%, rgba(200,160,120,0.25) 37%, rgba(200,160,120,0.25) 42%, transparent 49%)',
              }}
            />
          )}
        </AnimatePresence>

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
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/8 via-transparent to-transparent" />
        )}
      </motion.div>

      {/* 桌子前景 */}
      <div className="absolute bottom-0 left-0 right-0 h-[22%] bg-gradient-to-t from-slate-800 via-slate-800/70 to-transparent" />

      {/* 状态指示器 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
        >
          <div className={`px-4 py-2 rounded-full border text-xs font-medium flex items-center gap-1.5 backdrop-blur-sm ${
            mode === 'speaking'  ? 'bg-green-500/15 text-green-300 border-green-500/35'
            : mode === 'listening' ? 'bg-blue-500/15 text-blue-300 border-blue-500/35'
            : mode === 'thinking'  ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
            : 'bg-slate-500/15 text-slate-400 border-slate-500/30'
          }`}>
            {mode === 'speaking'  && <><SpeakingIndicator />提问中</>}
            {mode === 'listening' && <><ListeningIndicator />倾听中</>}
            {mode === 'thinking'  && <><ThinkingIndicator />思考中</>}
            {mode === 'idle'      && <><span className="w-1.5 h-1.5 rounded-full bg-slate-500" />待机</>}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function SpeakingIndicator() {
  return (
    <div className="flex items-end gap-0.5 h-3">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-0.5 bg-green-400 rounded-full"
          animate={{ height: ['3px', '10px', '3px'] }}
          transition={{ duration: 0.4, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </div>
  );
}

function ListeningIndicator() {
  return (
    <motion.div className="w-3 h-3 rounded-full border border-blue-400"
      animate={{ scale: [1, 1.25, 1], opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
  );
}

function ThinkingIndicator() {
  return (
    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }} className="w-3 h-3">
      <div className="w-full h-full rounded-full border border-amber-400 border-t-transparent" />
    </motion.div>
  );
}

export type { InterviewMode };
export type { AvatarId };
