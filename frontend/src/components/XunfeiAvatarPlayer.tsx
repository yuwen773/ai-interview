import { useEffect, useRef, useState, ReactNode } from 'react';
import { xunfeiApi } from '../api/xunfei';

export function XunfeiAvatarPlayer({
  interviewSessionId,
  className,
  style,
  children,
  onReady,
  onError,
  silent = false,
}: {
  interviewSessionId: string;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  onReady?: (streamUrl: string) => void;
  onError?: (error: string) => void;
  /** silent 模式下不显示加载/错误 UI，只通过回调通知父组件 */
  silent?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const mountedRef = useRef(false);
  const initVersionRef = useRef(0);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  onReadyRef.current = onReady;
  onErrorRef.current = onError;

  const [isLoading, setIsLoading] = useState(!silent);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    mountedRef.current = true;
    const sessionId = interviewSessionId;
    if (!containerRef.current || !sessionId) return;

    const version = ++initVersionRef.current;
    let destroyed = false;

    // 诊断：monkey-patch RTCPeerConnection 监控 ICE 状态
    const OrigPC = window.RTCPeerConnection;
    const pcInstances: RTCPeerConnection[] = [];
    (window as any).RTCPeerConnection = function(this: RTCPeerConnection, ...args: any[]) {
      const pc = new (OrigPC as any)(...args);
      pcInstances.push(pc);
      pc.addEventListener('iceconnectionstatechange', () => {
        console.log('[XunfeiAvatar] ICE:', pc.iceConnectionState);
      });
      pc.addEventListener('connectionstatechange', () => {
        console.log('[XunfeiAvatar] Conn:', pc.connectionState);
      });
      pc.addEventListener('icecandidate', (e: RTCPeerConnectionIceEvent) => {
        if (e.candidate) {
          console.log('[XunfeiAvatar] ICE candidate:', e.candidate.candidate.substring(0, 80));
        } else {
          console.log('[XunfeiAvatar] ICE gathering complete');
        }
      });
      return pc;
    };

    const restorePC = () => { (window as any).RTCPeerConnection = OrigPC; };

    const init = async () => {
      let loadingTimer: ReturnType<typeof setTimeout> | undefined;
      try {
        setIsLoading(true);
        setError(null);

        // 动态加载 RTCPlayer SDK (IIFE 版本，暴露全局 Interactive.RTCPlayer)
        const win = window as any;
        let RTCPlayerClass: any = win.Interactive?.RTCPlayer;

        if (!RTCPlayerClass) {
          const script = document.createElement('script');
          script.src = '/lib/rtcplayer/rtcplayer.iife.js';
          scriptRef.current = script;

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load RTCPlayer SDK'));
            document.head.appendChild(script);
          });

          if (destroyed || initVersionRef.current !== version) return;
          RTCPlayerClass = win.Interactive?.RTCPlayer;
          if (!RTCPlayerClass) {
            throw new Error('RTCPlayer not found after loading SDK');
          }
        }

        if (destroyed) return;

        const player = new RTCPlayerClass();
        player.container = containerRef.current;
        player.videoSize = { width: 720, height: 1280 };

        // 兜底超时：5秒后无论 playing 是否触发都清除加载状态
        loadingTimer = setTimeout(() => {
          if (!destroyed) setIsLoading(false);
        }, 5000);

        player
          .on('play', () => {
            console.log('[XunfeiAvatar] Play');
            if (!destroyed) { setIsLoading(false); setIsPlaying(true); }
          })
          .on('playing', () => {
            console.log('[XunfeiAvatar] Playing');
            if (!destroyed) { setIsLoading(false); setIsPlaying(true); clearTimeout(loadingTimer); }
          })
          .on('waiting', () => console.log('[XunfeiAvatar] Waiting'))
          .on('error', (e: any) => {
            if (!destroyed) {
              clearTimeout(loadingTimer);
              setError(String(e));
              onErrorRef.current?.(String(e));
            }
          })
          .on('not-allowed', () => { player.resume(); });

        playerRef.current = player;

        const resp = await xunfeiApi.createSession(sessionId);
        if (destroyed || initVersionRef.current !== version) return;

        const { streamUrl, streamExtend, cid } = resp;

        if (streamUrl.startsWith('xrtc')) {
          // xRTC 协议：xrtcs:// → https://, xrtc:// → http://（只替换协议前缀，不影响主机名）
          const scheme = streamUrl.startsWith('xrtcs://') ? 'https://' : 'http://';
          const afterScheme = streamUrl.slice(streamUrl.indexOf('//') + 2);
          const url = new URL(scheme + afterScheme);
          player.playerType = 12;
          const extendObj = streamExtend ? JSON.parse(streamExtend) : {};
          player.stream = {
            sid: cid || '',
            server: `${url.protocol}//${url.host}`,
            roomId: url.pathname.slice(1),
            auth: extendObj.user_sign || '',
            appid: extendObj.appid || '',
            userId: String(Date.now()),
            timeStr: String(Date.now()),
          };
        } else {
          // WebRTC 协议（sid 为客户端标识，使用 UUID，参考讯飞 Demo）
          player.playerType = 6;
          player.stream = {
            sid: crypto.randomUUID(),
            streamUrl,
          };
        }

        player.play();
        onReadyRef.current?.(streamUrl);

      } catch (err) {
        if (destroyed) return;
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(errMsg);
        onErrorRef.current?.(errMsg);
        setIsLoading(false);
      } finally {
        if (loadingTimer) clearTimeout(loadingTimer);
      }
    };

    init();

    return () => {
      destroyed = true;
      mountedRef.current = false;
      restorePC();
      // 打印最终 ICE 状态
      pcInstances.forEach((pc, i) => {
        console.log(`[XunfeiAvatar] PC${i} final state:`, pc.iceConnectionState, pc.connectionState);
      });

      if (playerRef.current) {
        try { playerRef.current.destroy?.(); } catch {}
        playerRef.current = null;
      }
      // 清除容器内 SDK 残留的 DOM 元素（xvideo div、video 元素等）
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      if (sessionId) {
        xunfeiApi.destroySession(sessionId).catch(console.error);
      }
      // 清理动态加载的 script 标签
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [interviewSessionId]);

  return (
    <div className={className} style={{
      ...style,
      ...(isPlaying ? { backgroundImage: 'url(/images/background.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: '#1a1a2e' }),
    }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {isLoading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <span>正在连接数字人...</span>
          </div>
        </div>
      )}

      {!silent && error && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', color: '#ff6b6b' }}>
          <div style={{ textAlign: 'center', padding: 20 }}>
            <div style={{ marginBottom: 8 }}>连接失败</div>
            <div style={{ fontSize: 12, color: '#aaa' }}>{error}</div>
          </div>
        </div>
      )}

      {children && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          {children}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
