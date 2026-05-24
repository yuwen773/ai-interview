import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import * as THREE from 'three';

interface CacheEntry {
  vrm: any;
  scene: THREE.Scene;
}

const vrmCache = new Map<string, CacheEntry>();

export async function loadVRM(url: string, scene: THREE.Scene): Promise<any> {
  // Check if URL is already cached for a different scene
  if (vrmCache.has(url)) {
    const cached = vrmCache.get(url)!;
    if (cached.scene !== scene) {
      // Different scene - load fresh VRM for this scene
      vrmCache.delete(url);
    } else {
      // Same scene - return cached VRM
      return cached.vrm;
    }
  }

  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  const gltf = await loader.loadAsync(url);
  const vrm = gltf.userData.vrm;

  if (vrm) {
    vrm.scene.position.set(0, 0, 0);
    vrm.scene.scale.set(1, 1, 1);
    scene.add(vrm.scene);
    vrmCache.set(url, { vrm, scene });
  }

  return vrm;
}

export function disposeVRMCache(): void {
  vrmCache.clear();
}
