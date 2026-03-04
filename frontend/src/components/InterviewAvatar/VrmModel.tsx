import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { loadVRM } from '../../utils/vrmLoader';

interface VrmModelProps {
  scene: THREE.Scene;
  modelUrl: string;
  onLoad?: (vrm: any) => void;
}

export function VrmModel({ scene, modelUrl, onLoad }: VrmModelProps) {
  const vrmRef = useRef<any>(null);

  useEffect(() => {
    if (!modelUrl || !scene) return;

    loadVRM(modelUrl, scene).then((vrm) => {
      vrmRef.current = vrm;
      onLoad?.(vrm);
    });
  }, [modelUrl, scene, onLoad]);

  return null;
}
