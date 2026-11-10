import { MutableRefObject, Suspense, useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { Exercise, fullPose, repLength } from '../data/exercises';
import { blendPose, NEUTRAL, Pose } from '../lib/pose';
import { SCENE } from '../ui/theme';
import { HumanFigure, Intensity } from './HumanFigure';

export type ViewAngle = 'back' | 'side' | 'front';

// 公仔面向 +Z，所以「背面」鏡頭喺 -Z。呢度只係方向，距離自動計。
const CAMERA_DIRS: Record<ViewAngle, [number, number, number]> = {
  back: [0.6, 0.55, -3.1],
  side: [3.1, 0.35, 0.3],
  front: [-0.6, 0.55, 3.1],
};

type Props = {
  exercise: Exercise;
  playing: boolean;
  speed: number;
  view: ViewAngle;
  onCue: (cue: string) => void;
  onRep: (reps: number) => void;
  glow?: Intensity; // 有值就用呢個固定發光（身體地圖），唔跟動作
  headroom?: number; // 畫面頂留幾多（0–0.4）畀疊喺上面嘅字
  footroom?: number; // 畫面底留幾多
};

const FALLBACK = new THREE.Box3(new THREE.Vector3(-0.3, 0, -0.2), new THREE.Vector3(0.3, 1.8, 0.2));

// 鏡頭：個動作郁到幾闊，就退到幾遠，全身都入鏡
function CameraRig({ view, envelope, headroom, footroom }: { view: ViewAngle; envelope: MutableRefObject<THREE.Box3>; headroom: number; footroom: number }) {
  const { camera, size } = useThree();
  const look = useRef(new THREE.Vector3(0, 0.95, 0));
  const tmp = useMemo(
    () => ({ dir: new THREE.Vector3(), right: new THREE.Vector3(), c: new THREE.Vector3(), goal: new THREE.Vector3(), aim: new THREE.Vector3() }),
    [],
  );

  useFrame((_, dt) => {
    const cam = camera as THREE.PerspectiveCamera;
    const box = envelope.current.isEmpty() ? FALLBACK : envelope.current;
    const { dir, right, c, goal, aim } = tmp;
    dir.set(...CAMERA_DIRS[view]).normalize();
    right.set(dir.z, 0, -dir.x).normalize();
    box.getCenter(c);

    // 由鏡頭睇過去，個框有幾闊、幾深
    let half = 0;
    let depth = 0;
    for (const x of [box.min.x, box.max.x])
      for (const z of [box.min.z, box.max.z]) {
        half = Math.max(half, Math.abs((x - c.x) * right.x + (z - c.z) * right.z));
        depth = Math.max(depth, Math.abs((x - c.x) * dir.x + (z - c.z) * dir.z));
      }
    const pad = 0.15;
    const h = box.max.y - Math.min(0, box.min.y) + pad * 2;
    const w = half * 2 + pad * 2;
    const tan = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const aspect = size.width / Math.max(1, size.height);
    const usable = 1 - headroom - footroom;
    const dist = Math.max(2.2, (h / usable) / 2 / tan, w / 2 / (tan * aspect)) + depth;

    // 框頂貼住留白位下面
    const visH = 2 * (dist - depth) * tan;
    const top = box.max.y + pad;
    aim.set(c.x, top + headroom * visH - visH / 2, c.z);
    goal.copy(dir).multiplyScalar(dist).add(aim);

    const k = Math.min(1, dt * 3);
    cam.position.lerp(goal, k);
    look.current.lerp(aim, k);
    cam.lookAt(look.current);
  });
  return null;
}

// 天幕：上淺下暖嘅漸變
function Sky() {
  const geo = useMemo(() => {
    const g = new THREE.SphereGeometry(30, 24, 16);
    const top = new THREE.Color(SCENE.skyTop);
    const bottom = new THREE.Color(SCENE.skyBottom);
    const n = g.attributes.position.count;
    const colors = new Float32Array(n * 3);
    const c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const y = g.attributes.position.getY(i) / 30;
      c.copy(bottom).lerp(top, Math.min(1, Math.max(0, (y + 0.05) * 2.2)));
      c.toArray(colors, i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, []);
  return (
    <mesh geometry={geo}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} fog={false} depthWrite={false} />
    </mesh>
  );
}

function Coach({ exercise, playing, speed, onCue, onRep, glow, envelope }: Omit<Props, 'view'> & { envelope: MutableRefObject<THREE.Box3> }) {
  const poseRef = useRef<Pose>({ ...NEUTRAL });
  const intensityRef = useRef<Intensity>({});
  const boundsRef = useRef(new THREE.Box3());
  const time = useRef(0);
  const reps = useRef(0);
  const lastCue = useRef('');

  useEffect(() => {
    time.current = 0;
    reps.current = 0;
    lastCue.current = '';
    envelope.current.makeEmpty();
    onRep(0);
  }, [exercise.id]);

  useFrame((_, dt) => {
    const len = repLength(exercise);
    if (playing) time.current += Math.min(dt, 0.1) * speed;
    if (time.current >= len) {
      time.current -= len;
      reps.current += 1;
      onRep(reps.current);
    }
    const t = time.current;
    const kf = exercise.keyframes;
    let i = 0;
    while (i < kf.length - 2 && t >= kf[i + 1].at) i++;
    const a = kf[i];
    const b = kf[i + 1];
    const k = (t - a.at) / Math.max(0.0001, b.at - a.at);

    poseRef.current = blendPose(fullPose(a.pose), fullPose(b.pose), k);

    const effort = a.effort + (b.effort - a.effort) * Math.min(1, Math.max(0, k));
    const next: Intensity = {};
    for (const m of exercise.muscles) next[m.id] = m.weight * (0.25 + 0.75 * effort);
    intensityRef.current = glow ?? next;

    // 記低成個動作郁過嘅範圍（上一格嘅外框）
    if (!boundsRef.current.isEmpty()) envelope.current.union(boundsRef.current);

    // Show the cue of the movement we're heading into.
    const cue = b.cue;
    if (cue !== lastCue.current) {
      lastCue.current = cue;
      onCue(cue);
    }
  });

  return <HumanFigure poseRef={poseRef} intensityRef={intensityRef} boundsRef={boundsRef} />;
}

export function TrainerScene({ headroom = 0.05, footroom = 0.02, ...props }: Props) {
  const envelope = useRef(new THREE.Box3());
  const start = CAMERA_DIRS[props.view];
  return (
    <Canvas camera={{ position: [start[0], 1.5, start[2]], fov: 40 }} style={{ flex: 1 }}>
      <color attach="background" args={[SCENE.skyBottom]} />
      <fog attach="fog" args={[SCENE.skyBottom, 7, 16]} />
      <Sky />
      <hemisphereLight args={['#fff6ec', '#c9a98a', 1.1]} />
      <directionalLight position={[-2, 4, 3]} intensity={1.5} color="#fff1e0" />
      <directionalLight position={[2, 3, -3]} intensity={0.7} color="#e6f0ff" />
      {/* 地台 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[12, 48]} />
        <meshBasicMaterial color={SCENE.floor} />
      </mesh>
      {/* 瑜伽墊 */}
      <mesh position={[0, 0.006, 0.1]}>
        <boxGeometry args={[0.66, 0.012, 1.85]} />
        <meshStandardMaterial color={SCENE.mat} roughness={0.95} />
      </mesh>
      <CameraRig view={props.view} envelope={envelope} headroom={headroom} footroom={footroom} />
      <Suspense fallback={null}>
        <Coach {...props} envelope={envelope} />
      </Suspense>
    </Canvas>
  );
}
