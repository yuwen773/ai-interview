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
      this.nextBlinkTime = 2 + Math.random() * 3; // 2-5秒后下一次眨眼
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
