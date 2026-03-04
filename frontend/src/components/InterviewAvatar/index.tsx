import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { LipSyncController } from './LipSync';
import { AvatarAnimations } from './AvatarAnimations';
import type { InterviewAvatarProps } from './types';

export function InterviewAvatar({
  modelUrl = '/models/avatar.vrm',
  isSpeaking = false,
  expression = 'neutral',
  onLoad,
  onError,
}: InterviewAvatarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scene] = useState(() => new THREE.Scene());
  const [camera] = useState(() => new THREE.PerspectiveCamera(75, 1, 0.1, 1000));

  const vrmRef = useRef<any>(null);
  const lipSyncRef = useRef<LipSyncController | null>(null);
  const animationsRef = useRef<AvatarAnimations | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化 Three.js
  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(400, 400);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);

    // 场景设置
    scene.background = new THREE.Color(0xf5f5f5);

    // 相机设置
    camera.position.set(0, 1.2, 2);
    camera.lookAt(0, 1, 0);

    // 光照
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(directionalLight);

    // 渲染循环
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // 更新动画
      animationsRef.current?.update();

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, [scene, camera]);

  // 加载 VRM 模型
  useEffect(() => {
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      modelUrl,
      (gltf) => {
        const vrm = gltf.userData.vrm;
        if (vrm) {
          vrm.scene.position.set(0, 0, 0);
          vrm.scene.scale.set(1, 1, 1);
          scene.add(vrm.scene);

          vrmRef.current = vrm;
          lipSyncRef.current = new LipSyncController(vrm);
          animationsRef.current = new AvatarAnimations(vrm);

          onLoad?.();
        }
      },
      undefined,
      (error: unknown) => {
        onError?.(error as Error);
      }
    );
  }, [modelUrl, scene, onLoad, onError]);

  // 说话状态变化时更新嘴型
  useEffect(() => {
    if (isSpeaking && lipSyncRef.current) {
      lipSyncRef.current.start();
    } else {
      lipSyncRef.current?.stop();
    }
  }, [isSpeaking]);

  // 表情变化
  useEffect(() => {
    animationsRef.current?.setExpression(expression);
  }, [expression]);

  return (
    <div>
      <div ref={containerRef} style={{ width: '400px', height: '400px' }} />
      <audio ref={audioRef} />
    </div>
  );
}
