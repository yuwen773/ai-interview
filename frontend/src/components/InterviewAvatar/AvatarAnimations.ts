import * as THREE from 'three';

export class AvatarAnimations {
  private vrm: any;
  private clock: THREE.Clock;
  private blinkTimer: number = 0;
  private nextBlinkTime: number = 0;

  constructor(vrm: any) {
    this.vrm = vrm;
    this.clock = new THREE.Clock();
  }

  update() {
    if (!this.vrm) return;

    const delta = this.clock.getDelta();
    this.updateBlink(delta);
  }

  private updateBlink(delta: number) {
    this.blinkTimer += delta;

    if (this.blinkTimer >= this.nextBlinkTime) {
      // 执行眨眼
      this.performBlink();
      this.blinkTimer = 0;
      // 确定性振荡：使用 clock.elapsedTime 产生有规律的 2-5 秒眨眼间隔
      this.nextBlinkTime = 2 + (Math.sin(this.clock.elapsedTime * 0.5) * 0.5 + 0.5) * 3;
    }
  }

  private performBlink() {
    if (!this.vrm?.blendShapeProxy) return;

    // 眨眼动画逻辑 - 获取当前眨眼值
    this.vrm.blendShapeProxy.getValue('BLINK_L');
    // 简化实现：略
  }

  setExpression(expression: string) {
    if (!this.vrm?.blendShapeProxy) return;

    // 重置所有表情
    const presets = ['Happy', 'Sad', 'Angry', 'Neutral'];
    presets.forEach(preset => {
      this.vrm.blendShapeProxy.setValue(preset, 0);
    });

    // 设置目标表情
    if (expression !== 'neutral') {
      this.vrm.blendShapeProxy.setValue(expression, 1.0);
    }

    this.vrm.blendShapeProxy.apply();
  }
}
