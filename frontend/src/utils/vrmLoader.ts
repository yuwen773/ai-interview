import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin } from '@pixiv/three-vrm';
import * as THREE from 'three';

export async function loadVRM(url: string, scene: THREE.Scene): Promise<any> {
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  const gltf = await loader.loadAsync(url);
  const vrm = gltf.userData.vrm;

  if (vrm) {
    vrm.scene.position.set(0, 0, 0);
    vrm.scene.scale.set(1, 1, 1);
    scene.add(vrm.scene);
  }

  return vrm;
}
