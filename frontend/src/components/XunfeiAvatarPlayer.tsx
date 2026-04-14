import { useEffect, useRef, useState, useCallback } from 'react';
import { xunfeiApi } from '../api/xunfei';

/**
 * 讯飞虚拟人播放器组件
 *
 * 使用方式:
 * <XunfeiAvatarPlayer
 *   interviewSessionId="xxx"
 *   onReady={(streamUrl) => console.log('Stream ready:', streamUrl)}
 *   onError={(err) => console.error('Error:', err)}
 * />
 */
export function XunfeiAvatarPlayer({
  interviewSessionId,
  className,
  style,
  onReady,
  onError,
}: {
  interviewSessionId: string;
  className?: string;
  style?: React.CSSProperties;
  onReady?: (streamUrl: string) => void;
  onError?: (error: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initPlayer = useCallback(async () => {
    if (!containerRef.current || !interviewSessionId) return;

    try {
      setIsLoading(true);
      setError(null);

      // 动态加载 RTCPlayer SDK
      let RTCPlayer = (window as any).RTCPlayer;
      if (!RTCPlayer) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = '/lib/rtcplayer/rtcplayer.esm.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load RTCPlayer SDK'));
          document.head.appendChild(script);
        });
        RTCPlayer = (window as any).RTCPlayer;
      }

      const player = new RTCPlayer();
      player.container = containerRef.current;
      player.videoSize = { width: 720, height: 1280 };

      player
        .on('play', () => console.log('[XunfeiAvatar] Play'))
        .on('playing', () => { setIsLoading(false); })
        .on('waiting', () => console.log('[XunfeiAvatar] Waiting'))
        .on('error', (e: any) => {
          setError(String(e));
          onError?.(String(e));
        })
        .on('not-allowed', () => { player.resume(); });

      playerRef.current = player;

      // 调用后端接口创建会话
      const resp = await xunfeiApi.createSession(interviewSessionId);
      const { streamUrl, streamExtend } = resp;
      const extendObj = streamExtend ? JSON.parse(streamExtend) : null;

      if (extendObj && Object.keys(extendObj).length > 0) {
        // xRTC 协议
        player.playerType = 12;
        player.stream = {
          sid: extendObj.sid,
          server: extendObj.server,
          auth: extendObj.auth,
          appid: extendObj.appid,
          userId: extendObj.userId,
          roomId: extendObj.roomId,
          timeStr: extendObj.timeStr,
        };
      } else {
        // WebRTC 协议
        player.playerType = 6;
        player.stream = { streamUrl };
      }

      player.play();
      onReady?.(streamUrl);

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(errMsg);
      onError?.(errMsg);
      setIsLoading(false);
    }
  }, [interviewSessionId, onReady, onError]);

  useEffect(() => {
    initPlayer();

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy?.(); } catch {}
        playerRef.current = null;
      }
      // 通知后端销毁会话
      if (interviewSessionId) {
        xunfeiApi.destroySession(interviewSessionId).catch(console.error);
      }
    };
  }, [initPlayer, interviewSessionId]);

  return (
    <div className={className} style={style}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#1a1a2e', position: 'relative' }} />

      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <span>正在连接数字人...</span>
          </div>
        </div>
      )}

      {error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', color: '#ff6b6b' }}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ marginBottom: 8 }}>连接失败</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{error}</div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
