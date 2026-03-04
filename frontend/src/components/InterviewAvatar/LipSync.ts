export class LipSyncController {
  private vrm: any;
  private isSpeaking: boolean = false;
  private audioElement: HTMLAudioElement | null = null;
  private animationFrameId: number = 0;

  // VRM blendshape 索引
  private readonly BLENDSHAPE_MOUTH_OPEN = 'aa';

  constructor(vrm: any) {
    this.vrm = vrm;
  }

  setAudioElement(audio: HTMLAudioElement) {
    this.audioElement = audio;
  }

  start() {
    this.isSpeaking = true;
    this.update();
  }

  stop() {
    this.isSpeaking = false;
    cancelAnimationFrame(this.animationFrameId);
    this.resetMouth();
  }

  private update() {
    if (!this.isSpeaking || !this.audioElement || !this.vrm?.blendShapeProxy) {
      return;
    }

    // 获取当前音量 (简化实现)
    // 实际应使用 Web Audio API 分析
    const volume = this.getVolume();

    // 根据音量设置嘴型
    if (volume > 0.1) {
      this.setMouthOpen(volume);
    } else {
      this.resetMouth();
    }

    this.animationFrameId = requestAnimationFrame(() => this.update());
  }

  private getVolume(): number {
    // 简化：使用 audio 元素的 currentTime 检测是否有声音
    // 实际应使用 AnalyserNode
    return this.audioElement && !this.audioElement.paused ? 0.5 : 0;
  }

  private setMouthOpen(value: number) {
    if (!this.vrm.blendShapeProxy) return;

    // 设置嘴张开程度
    this.vrm.blendShapeProxy.setValue(this.BLENDSHAPE_MOUTH_OPEN, value);
    this.vrm.blendShapeProxy.apply();
  }

  private resetMouth() {
    if (!this.vrm.blendShapeProxy) return;

    this.vrm.blendShapeProxy.setValue(this.BLENDSHAPE_MOUTH_OPEN, 0);
    this.vrm.blendShapeProxy.apply();
  }
}
