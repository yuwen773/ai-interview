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
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-stone-700 to-stone-900">
          <div className="w-full h-full rounded-t-3xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
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
      {/* 说话时整体面部光晕（提升"活感"） */}
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

      {/* === 重新设计的自然口型 === */}
      {/* 嘴部区域容器（定位基准点） */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '70px',
          height: '40px',
        }}
      >
        {/* 下唇（微微凸起的弧形） */}
        <div
          style={{
            position: 'absolute',
            bottom: '2px',
            left: '50%',
            transform: `translateX(-50%) scaleX(${1 + openness * 0.5}) scaleY(${1 + openness * 2})`,
            width: '28px',
            height: '4px',
            background: openness < 0.05
              ? 'rgba(160,80,60,0.3)'
              : `linear-gradient(to bottom, rgba(180,90,70,0.7) 0%, rgba(140,60,50,0.85) 50%, rgba(100,40,35,0.9) 100%)`,
            borderRadius: '50%',
            transition: 'background 50ms ease',
          }}
        />

        {/* 口腔开口（深色椭圆形，模拟张嘴） */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '50%',
            transform: `translateX(-50%) scaleX(${1 + openness * 1.11}) scaleY(${Math.max(openness, 0.06) * 1})`,
            transformOrigin: 'center top',
            width: '18px',
            height: '26px',
            background: openness < 0.06
              ? 'rgba(20,5,5,0)'
              : `radial-gradient(ellipse at 50% 30%, rgba(25,5,5,0.95) 0%, rgba(60,10,10,0.8) 60%, rgba(40,8,8,0.6) 100%)`,
            borderRadius: '50%',
            opacity: openness < 0.06 ? 0 : 1,
            transition: 'opacity 45ms ease, background 45ms ease',
          }}
        />

        {/* 上唇（两侧翼 + 唇弓） */}
        <div
          style={{
            position: 'absolute',
            top: '6px',
            left: '50%',
            transform: `translateX(-50%) scaleX(${1 + openness * 0.727}) scaleY(${1 + openness * 2})`,
            transformOrigin: 'center bottom',
            width: '22px',
            height: '3px',
            background: openness < 0.05
              ? 'rgba(170,85,65,0.25)'
              : `linear-gradient(to bottom, rgba(190,95,70,0.8) 0%, rgba(170,80,60,0.9) 100%)`,
            borderRadius: openness < 0.1 ? '50%' : `${50 + (1 - openness) * 50}%`,
            clipPath: openness < 0.1 ? 'none' : 'inset(0 15% 40% 15% round 50%)',
            transition: 'background 50ms ease',
          }}
        />

        {/* 上唇唇弓高光（左右两个小高光点） */}
        <div style={{ position: 'absolute', top: '5px', left: '50%', transform: 'translateX(-50%)', width: '30px', height: '8px' }}>
          <div style={{
            position: 'absolute', left: '2px', top: '2px',
            width: '6px', height: '3px',
            background: `rgba(255,200,180,${openness * 0.5})`,
            borderRadius: '50%',
            transition: 'background 50ms ease',
          }} />
          <div style={{
            position: 'absolute', right: '2px', top: '2px',
            width: '6px', height: '3px',
            background: `rgba(255,200,180,${openness * 0.5})`,
            borderRadius: '50%',
            transition: 'background 50ms ease',
          }} />
        </div>

        {/* 牙齿（张嘴较大时可见） */}
        {openness > 0.55 && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: `translateX(-50%) scaleX(${0.8 + openness * 0.73}) scaleY(${openness})`,
              transformOrigin: 'center top',
              width: '12px',
              height: '10px',
              background: 'linear-gradient(to bottom, rgba(245,240,235,0.95) 0%, rgba(230,225,220,0.9) 100%)',
              borderRadius: '2px 2px 1px 1px',
              opacity: 0.85,
              transition: 'opacity 40ms ease, background 40ms ease',
            }}
          />
        )}
      </div>

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
            className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-transparent"
            animate={{ opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* 倾听时光效 */}
        {mode === 'listening' && (
          <div className="absolute inset-0 bg-gradient-to-t from-sky-500/6 via-transparent to-transparent" />
        )}
      </motion.div>

      {/* 桌子前景 */}
      <div className="absolute bottom-0 left-0 right-0 h-[22%] bg-gradient-to-t from-stone-800 via-stone-800/70 to-transparent" />

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
            mode === 'speaking'  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
            : mode === 'listening' ? 'bg-sky-500/15 text-blue-300 border-blue-500/35'
            : mode === 'thinking'  ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
            : 'bg-stone-500/15 text-stone-400 border-stone-500/30'
          }`}>
            {mode === 'speaking'  && <><SpeakingIndicator />提问中</>}
            {mode === 'listening' && <><ListeningIndicator />倾听中</>}
            {mode === 'thinking'  && <><ThinkingIndicator />思考中</>}
            {mode === 'idle'      && <><span className="w-1.5 h-1.5 rounded-full bg-stone-500" />待机</>}
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
        <motion.div key={i} className="w-0.5 bg-emerald-400 rounded-full"
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
