declare module 'rtcplayer' {
  export class RTCPlayer {
    playerType: number;
    stream: any;
    videoSize: { width: number; height: number };
    container: HTMLElement;
    on(event: string, handler: Function): RTCPlayer;
    play(): void;
    resume(): void;
    destroy(): void;
  }
}
