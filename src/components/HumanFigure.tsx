import { MutableRefObject, use, useRef } from 'react';
import { Platform } from 'react-native';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import MODEL from '../../assets/models/figure.glb';
import { MuscleId } from '../data/muscles';
import { Pose } from '../lib/pose';
import { Rig, Segment } from '../lib/retarget';

export type Intensity = Partial<Record<MuscleId, number>>;

type Props = {
  poseRef: MutableRefObject<Pose>;
  intensityRef: MutableRefObject<Intensity>;
};

type V3 = [number, number, number];

const MUSCLE_HOT = new THREE.Color('#ff3b30');
const skin = new THREE.MeshStandardMaterial({ color: '#b4bccb', roughness: 0.6, metalness: 0.02 });
const sphere = new THREE.SphereGeometry(1, 20, 14);

// 載一次模型，順手起好骨架轉換（要喺未郁骨之前讀靜止姿勢）
let loading: Promise<{ gltf: GLTF; rig: Rig }> | null = null;
function loadFigure() {
  loading ??= (async () => {
    const asset = Asset.fromModule(MODEL);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    const buf =
      Platform.OS === 'web' ? await (await fetch(uri)).arrayBuffer() : await new File(uri).arrayBuffer();
    const gltf = await new Promise<GLTF>((res, rej) => new GLTFLoader().parse(buf, '', res, rej));
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.material = skin;
      // 趴低、坐低時原本個包圍球唔準，唔好裁走
      mesh.frustumCulled = false;
    });
    return { gltf, rig: new Rig(gltf.scene) };
  })();
  return loading;
}

// 肌肉：埋喺皮膚入面嘅橢圓球，用力時凸出皮膚嗰部分發紅光。
// 位置以關節做原點，方向跟 app 靜止姿勢（手腳垂直向下、面向 +Z）。
// 左邊寫一次，右邊自動鏡像。
type MuscleSpot = [MuscleId, Segment, V3, V3];
const CENTER: MuscleSpot[] = [
  ['abs', 'spine0', [0, 0.02, 0.1], [0.075, 0.13, 0.05]],
  ['traps', 'spine2', [0, 0.12, -0.065], [0.13, 0.05, 0.05]],
];
const LEFT: MuscleSpot[] = [
  ['glutes', 'hips', [0.075, -0.09, -0.095], [0.075, 0.08, 0.05]],
  ['psoas', 'hips', [0.07, -0.05, 0.1], [0.04, 0.07, 0.035]],
  ['obliques', 'spine0', [0.135, 0.0, 0.03], [0.035, 0.1, 0.06]],
  ['erectors', 'spine0', [0.04, 0.03, -0.07], [0.03, 0.13, 0.03]],
  ['chest', 'spine2', [0.08, 0.02, 0.11], [0.08, 0.06, 0.05]],
  ['lats', 'spine2', [0.11, -0.04, -0.1], [0.07, 0.13, 0.05]],
  ['rotatorCuff', 'spine2', [0.12, 0.06, -0.11], [0.06, 0.05, 0.04]],
  ['shoulders', 'lArm', [0.03, -0.04, 0], [0.06, 0.08, 0.065]],
  ['biceps', 'lArm', [0, -0.14, 0.03], [0.038, 0.08, 0.03]],
  ['triceps', 'lArm', [0, -0.14, -0.035], [0.04, 0.09, 0.032]],
  ['quads', 'lThigh', [0, -0.22, 0.06], [0.065, 0.15, 0.045]],
  ['hamstrings', 'lThigh', [0, -0.22, -0.06], [0.06, 0.14, 0.042]],
  ['calves', 'lShin', [0, -0.15, -0.08], [0.045, 0.1, 0.055]],
  ['feet', 'lFoot', [0, -0.095, 0.07], [0.04, 0.02, 0.07]],
];
const mirror = (s: Segment) => (s[0] === 'l' ? (('r' + s.slice(1)) as Segment) : s);
const SPOTS: MuscleSpot[] = [
  ...CENTER,
  ...LEFT,
  ...LEFT.map(([id, seg, [x, y, z], scale]): MuscleSpot => [id, mirror(seg), [-x, y, z], scale]),
];
const SEGMENTS = [...new Set(SPOTS.map((s) => s[1]))];

function Muscle({
  id,
  intensityRef,
  position,
  scale,
}: {
  id: MuscleId;
  intensityRef: MutableRefObject<Intensity>;
  position: V3;
  scale: V3;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!mat.current || !mesh.current) return;
    const v = intensityRef.current[id] ?? 0;
    mesh.current.visible = v > 0.02;
    mat.current.opacity = Math.min(0.9, 0.2 + v * 0.75);
    mat.current.emissive.copy(MUSCLE_HOT).multiplyScalar(v * 0.6);
  });
  return (
    <mesh ref={mesh} geometry={sphere} position={position} scale={scale} renderOrder={1}>
      <meshStandardMaterial ref={mat} color={MUSCLE_HOT} roughness={0.45} transparent depthWrite={false} />
    </mesh>
  );
}

export function HumanFigure({ poseRef, intensityRef }: Props) {
  const { gltf, rig } = use(loadFigure());
  const frames = useRef<Partial<Record<Segment, THREE.Group | null>>>({});

  useFrame(() => {
    rig.apply(poseRef.current);
    // 肌肉跟住骨：位置 = 關節，方向 = 嗰段身體喺 app 嘅旋轉
    for (const seg of SEGMENTS) {
      const g = frames.current[seg];
      if (!g) continue;
      rig.bones[seg].getWorldPosition(g.position);
      g.quaternion.copy(rig.seg[seg]);
    }
  });

  return (
    <group>
      <primitive object={gltf.scene} />
      {SEGMENTS.map((seg) => (
        <group
          key={seg}
          ref={(g) => {
            frames.current[seg] = g;
          }}
        >
          {SPOTS.filter((s) => s[1] === seg).map(([id, , position, scale], i) => (
            <Muscle key={`${id}-${i}`} id={id} intensityRef={intensityRef} position={position} scale={scale} />
          ))}
        </group>
      ))}
    </group>
  );
}
