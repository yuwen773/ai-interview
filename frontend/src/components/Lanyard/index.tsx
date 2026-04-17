/* eslint-disable react/no-unknown-property */
import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, extend, useFrame } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
import * as THREE from 'three';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

/** 在 Canvas 上绘制 Offer 卡片纹理 */
function createCardTexture(): THREE.CanvasTexture {
  const w = 600, h = 840;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // 背景：深色渐变
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1c1e24');
  grad.addColorStop(0.5, '#22252d');
  grad.addColorStop(1, '#1c1e24');
  ctx.fillStyle = grad;
  roundRect(ctx, 0, 0, w, h, 24);
  ctx.fill();

  // 外边框：琥珀金
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 5;
  roundRect(ctx, 16, 16, w - 32, h - 32, 16);
  ctx.stroke();

  // 内装饰线
  ctx.strokeStyle = 'rgba(245,158,11,0.25)';
  ctx.lineWidth = 1;
  roundRect(ctx, 28, 28, w - 56, h - 56, 10);
  ctx.stroke();

  // 顶部小标签
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 18px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('◆  AI INTERVIEW  ◆', w / 2, 80);

  // 装饰分隔线
  const lineGrad = ctx.createLinearGradient(100, 0, w - 100, 0);
  lineGrad.addColorStop(0, 'transparent');
  lineGrad.addColorStop(0.3, '#f59e0b');
  lineGrad.addColorStop(0.7, '#f59e0b');
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(100, 105);
  ctx.lineTo(w - 100, 105);
  ctx.stroke();

  // 主标题 "OFFER"
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 96px Arial, Helvetica, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OFFER', w / 2, 240);

  // 底部装饰线
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(120, 270);
  ctx.lineTo(w - 120, 270);
  ctx.stroke();

  // 副标题
  ctx.fillStyle = '#f5f3f0';
  ctx.font = '28px Arial, Helvetica, sans-serif';
  ctx.fillText('Letter of Acceptance', w / 2, 340);

  // 装饰星星
  ctx.fillStyle = '#f59e0b';
  ctx.font = '20px Arial';
  ctx.fillText('★  ★  ★', w / 2, 400);

  // 信息区域背景
  ctx.fillStyle = 'rgba(245,158,11,0.06)';
  roundRect(ctx, 60, 440, w - 120, 200, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(245,158,11,0.15)';
  ctx.lineWidth = 1;
  roundRect(ctx, 60, 440, w - 120, 200, 12);
  ctx.stroke();

  // 信息文字
  ctx.fillStyle = '#a8a29e';
  ctx.font = '16px Arial, Helvetica, sans-serif';
  ctx.fillText('POSITION', w / 2, 480);
  ctx.fillStyle = '#f5f3f0';
  ctx.font = 'bold 26px Arial, Helvetica, sans-serif';
  ctx.fillText('Software Engineer', w / 2, 520);

  ctx.fillStyle = '#a8a29e';
  ctx.font = '16px Arial, Helvetica, sans-serif';
  ctx.fillText('DATE', w / 2, 575);
  ctx.fillStyle = '#f5f3f0';
  ctx.font = 'bold 24px Arial, Helvetica, sans-serif';
  ctx.fillText('2026', w / 2, 615);

  // 底部文字
  ctx.fillStyle = '#78716c';
  ctx.font = '14px Arial, Helvetica, sans-serif';
  ctx.fillText('Congratulations on your new journey!', w / 2, 740);

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 16;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/** 绘制挂绳纹理 */
function createBandTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#26282f';
  ctx.fillRect(0, 0, 256, 64);
  ctx.fillStyle = '#f59e0b';
  for (let x = 0; x < 256; x += 16) {
    ctx.fillRect(x, 8, 6, 48);
  }
  ctx.fillStyle = '#b45309';
  for (let x = 8; x < 256; x += 16) {
    ctx.fillRect(x, 20, 4, 24);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

interface LanyardProps {
  position?: [number, number, number];
  gravity?: [number, number, number];
  fov?: number;
}

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
}: LanyardProps) {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position, fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: true, antialias: true }}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), 0)}
      >
        <ambientLight intensity={Math.PI} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60}>
          <Band isMobile={isMobile} />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}

function Band({ maxSpeed = 50, minSpeed = 0, isMobile = false }: { maxSpeed?: number; minSpeed?: number; isMobile?: boolean }) {
  const band = useRef<any>(null);
  const fixed = useRef<any>(null);
  const j1 = useRef<any>(null);
  const j2 = useRef<any>(null);
  const j3 = useRef<any>(null);
  const card = useRef<any>(null);

  const vec = useMemo(() => new THREE.Vector3(), []);
  const ang = useMemo(() => new THREE.Vector3(), []);
  const rot = useMemo(() => new THREE.Vector3(), []);
  const dir = useMemo(() => new THREE.Vector3(), []);

  const segmentProps = {
    type: 'dynamic' as const,
    canSleep: true,
    colliders: false as const,
    angularDamping: 4,
    linearDamping: 4,
  };

  const cardTexture = useMemo(() => createCardTexture(), []);
  const bandTexture = useMemo(() => createBandTexture(), []);

  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );

  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.5, 0]]);

  // 光标样式
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => { document.body.style.cursor = 'auto'; };
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(isMobile ? 16 : 32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
      <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[2, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
        >
          <CuboidCollider args={[0.55, 0.8, 0.01]} />
          <group
            scale={1.5}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e: any) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e: any) => (
              e.target.setPointerCapture(e.pointerId),
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())))
            )}
          >
            {/* 卡片主体 */}
            <mesh>
              <boxGeometry args={[1.5, 2.1, 0.025]} />
              <meshPhysicalMaterial
                map={cardTexture}
                map-anisotropy={16}
                clearcoat={isMobile ? 0 : 1}
                clearcoatRoughness={0.15}
                roughness={0.9}
                metalness={0.8}
              />
            </mesh>
            {/* 夹扣 */}
            <mesh position={[0, 1.1, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.15, 16]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.3} />
            </mesh>
            {/* 挂环 */}
            <mesh position={[0, 1.2, 0]}>
              <torusGeometry args={[0.1, 0.025, 8, 24]} />
              <meshStandardMaterial color="#d4d4d4" metalness={0.9} roughness={0.2} />
            </mesh>
          </group>
        </RigidBody>
      </group>
      {/* 挂绳 */}
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial
          color="white"
          depthTest={false}
          resolution={isMobile ? [1000, 2000] : [1000, 1000]}
          useMap
          map={bandTexture}
          repeat={[-4, 1]}
          lineWidth={1}
        />
      </mesh>
    </>
  );
}
