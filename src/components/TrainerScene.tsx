import { MutableRefObject, Suspense, useEffect, useMemo, useRef } from 'react';
import { PanResponder, View } from 'react-native';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { Exercise } from '../data/exercises';
import { Prop } from '../data/types';
import { cycleLength, DEMO_HOLD, sampleExercise } from '../lib/motion';
import { NEUTRAL, Pose } from '../lib/pose';
import { Reach } from '../lib/retarget';
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
  hold?: number; // 拉筋停幾耐（秒）；唔俾就用示範長度
  seek?: number; // 播放器嘅時間（秒），差太遠就跟返
  freeze?: number; // 定喺呢一秒（驗證用）
  onStats?: (s: { err: number; low: number }) => void;
};

const UP = new THREE.Vector3(0, 1, 0);
const FALLBACK = new THREE.Box3(new THREE.Vector3(-0.3, 0, -0.2), new THREE.Vector3(0.3, 1.8, 0.2));

// 鏡頭：個動作郁到幾闊，就退到幾遠，全身都入鏡
function CameraRig({ view, envelope, headroom, footroom, yaw }: { view: ViewAngle; envelope: MutableRefObject<THREE.Box3>; headroom: number; footroom: number; yaw: MutableRefObject<number> }) {
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
    dir.set(...CAMERA_DIRS[view]).normalize().applyAxisAngle(UP, yaw.current);
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

// 道具：椅、牆、門框、扶手柱
const WOOD = '#c9a27c';
function Props3D({ prop, side }: { prop?: Prop; side: MutableRefObject<number> }) {
  const post = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (post.current && prop?.kind === 'post') post.current.position.x = side.current ? -prop.x : prop.x;
  });
  if (!prop) return null;
  if (prop.kind === 'chair')
    return (
      <group>
        <mesh position={[0, 0.41, 0.08]}>
          <boxGeometry args={[0.46, 0.04, 0.44]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.7, -0.16]}>
          <boxGeometry args={[0.46, 0.34, 0.03]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
        {[-0.2, 0.2].map((x) =>
          [-0.12, 0.27].map((z) => (
            <mesh key={`${x}${z}`} position={[x, z < 0 ? 0.43 : 0.2, z < 0 ? -0.16 : z]}>
              <boxGeometry args={[0.035, z < 0 ? 0.86 : 0.4, 0.035]} />
              <meshStandardMaterial color={WOOD} roughness={0.9} />
            </mesh>
          )),
        )}
      </group>
    );
  if (prop.kind === 'wall')
    return (
      <mesh position={[0, 1.1, prop.z + 0.03]}>
        <boxGeometry args={[2.2, 2.2, 0.06]} />
        <meshStandardMaterial color="#f3ebe0" roughness={1} transparent opacity={0.92} />
      </mesh>
    );
  if (prop.kind === 'door')
    return (
      <group>
        {[-prop.x, prop.x].map((x) => (
          <mesh key={x} position={[x + Math.sign(x) * 0.04, 1.02, prop.z]}>
            <boxGeometry args={[0.08, 2.04, 0.12]} />
            <meshStandardMaterial color={WOOD} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[0, 2.08, prop.z]}>
          <boxGeometry args={[prop.x * 2 + 0.16, 0.08, 0.12]} />
          <meshStandardMaterial color={WOOD} roughness={0.9} />
        </mesh>
      </group>
    );
  return (
    <mesh ref={post} position={[prop.x, prop.h / 2, prop.z]}>
      <cylinderGeometry args={[0.025, 0.025, prop.h, 12]} />
      <meshStandardMaterial color={WOOD} roughness={0.9} />
    </mesh>
  );
}

function Coach({ exercise, playing, speed, onCue, onRep, glow, envelope, hold = DEMO_HOLD, seek, freeze, onStats, side }: Omit<Props, 'view'> & { envelope: MutableRefObject<THREE.Box3>; side: MutableRefObject<number> }) {
  const poseRef = useRef<Pose>({ ...NEUTRAL });
  const intensityRef = useRef<Intensity>({});
  const reachRef = useRef<{ reach?: Reach; w: number }>({ w: 0 });
  const statsRef = useRef({ err: 0, low: 0 });
  const boundsRef = useRef(new THREE.Box3());
  const time = useRef(0);
  const reps = useRef(0);
  const frame = useRef(0);
  const lastCue = useRef('');

  useEffect(() => {
    time.current = 0;
    reps.current = 0;
    lastCue.current = '';
    envelope.current.makeEmpty();
    onRep(0);
  }, [exercise.id]);

  useFrame((_, dt) => {
    const len = cycleLength(exercise, hold);
    if (playing) time.current += Math.min(dt, 0.1) * speed;
    if (seek !== undefined && (time.current < seek - 0.3 || time.current > seek + 1.5)) time.current = seek;
    if (freeze !== undefined) time.current = freeze;
    if (time.current >= len) {
      time.current -= len;
      reps.current += 1;
      onRep(reps.current);
    }
    const sm = sampleExercise(exercise, time.current, hold);
    poseRef.current = sm.pose;
    reachRef.current = { reach: sm.reach, w: sm.reachW };
    side.current = sm.side;
    intensityRef.current = glow ?? sm.intensity;

    // 記低成個動作郁過嘅範圍（上一格嘅外框）
    if (!boundsRef.current.isEmpty()) envelope.current.union(boundsRef.current);

    if (sm.cue !== lastCue.current) {
      lastCue.current = sm.cue;
      onCue(sm.cue);
    }
    if (onStats && ++frame.current % 20 === 0) onStats(statsRef.current);
  });

  return <HumanFigure poseRef={poseRef} intensityRef={intensityRef} boundsRef={boundsRef} reachRef={reachRef} statsRef={statsRef} />;
}

export function TrainerScene({ headroom = 0.05, footroom = 0.02, ...props }: Props) {
  const envelope = useRef(new THREE.Box3());
  const side = useRef(0);
  const yaw = useRef(0);
  const start = CAMERA_DIRS[props.view];
  // 換動作或者換角度：轉返正
  useEffect(() => {
    yaw.current = 0;
  }, [props.exercise.id, props.view]);
  // 手指左右拖：轉鏡頭
  const pan = useMemo(() => {
    let from = 0;
    return PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        from = yaw.current;
      },
      onPanResponderMove: (_, g) => {
        yaw.current = from - g.dx * 0.012;
      },
    });
  }, []);
  return (
    <View style={{ flex: 1 }} {...pan.panHandlers}>
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
        <Props3D prop={props.exercise.prop} side={side} />
        <CameraRig view={props.view} envelope={envelope} headroom={headroom} footroom={footroom} yaw={yaw} />
        <Suspense fallback={null}>
          <Coach {...props} envelope={envelope} side={side} />
        </Suspense>
      </Canvas>
    </View>
  );
}
