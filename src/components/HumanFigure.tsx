import { MutableRefObject, use, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import MODEL from '../../assets/models/coach-f.glb';
import { MuscleId } from '../data/muscles';
import { NEUTRAL, Pose } from '../lib/pose';
import { Reach, Rig, Segment } from '../lib/retarget';
import { SCENE } from '../ui/theme';

export type Intensity = Partial<Record<MuscleId, number>>;

type Props = {
  poseRef: MutableRefObject<Pose>;
  intensityRef: MutableRefObject<Intensity>;
  boundsRef?: MutableRefObject<THREE.Box3>; // 每格寫低公仔而家嘅外框，鏡頭用
  reachRef?: MutableRefObject<{ reach?: Reach; w: number }>; // 手腳要掂到邊（IK）
  statsRef?: MutableRefObject<{ err: number; low: number }>; // 驗證用：手離目標幾遠、最低點離地
};

type V3 = [number, number, number];

// 肌肉位置：以關節做原點，方向跟 app 靜止姿勢（手腳垂直向下、面向 +Z）。
// 左邊寫一次，右邊自動鏡像。用嚟計皮膚邊啲位發光。
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
  ['neck', 'neck', [0.03, 0.04, -0.03], [0.03, 0.055, 0.03]],
  ['forearms', 'lFore', [0, -0.11, 0], [0.035, 0.1, 0.035]],
  ['adductors', 'lThigh', [-0.05, -0.15, 0], [0.035, 0.12, 0.04]],
];
const mirror = (s: Segment) => (s[0] === 'l' ? (('r' + s.slice(1)) as Segment) : s);
const SPOTS: MuscleSpot[] = [
  ...CENTER,
  ...LEFT,
  ...LEFT.map(([id, seg, [x, y, z], scale]): MuscleSpot => [id, mirror(seg), [-x, y, z], scale]),
];

// 手臂嘅點唔好畀身軀嘅肌肉染，相反亦然（手垂低時好近個身）
const limbOf = (s: Segment) => (/^l(Arm|Fore|Hand)$/.test(s) ? 'L' : /^r(Arm|Fore|Hand)$/.test(s) ? 'R' : 'T');

type Paint = {
  glow: THREE.BufferAttribute; // 每點發光幾多（0–1），shader 讀
  spots: { id: MuscleId; idx: Uint32Array; w: Float32Array }[];
};

// 模型自帶貼圖；加一個 glow 屬性，喺貼圖上面混入發光色（深色褲都睇到）
function glowMaterial(src: THREE.Material) {
  const m = (src as THREE.MeshStandardMaterial).clone();
  m.roughness = 0.82; // Tripo 貼圖太反光，似皮褲，調啞
  m.metalness = 0;
  m.onBeforeCompile = (sh) => {
    sh.uniforms.glowColor = { value: new THREE.Color(SCENE.glow) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 glowColor;\nvarying float vGlow;')
      .replace('#include <map_fragment>', '#include <map_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, glowColor, vGlow * 0.85);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += glowColor * vGlow * 0.25;');
  };
  m.customProgramCacheKey = () => 'glow';
  return m;
}

// 靜止姿勢下，計每粒肌肉影響邊啲點
function paint(mesh: THREE.SkinnedMesh, rig: Rig): Paint {
  const n = mesh.geometry.attributes.position.count;
  const J = {} as Record<Segment, THREE.Vector3>;
  for (const seg of Object.keys(rig.bones) as Segment[]) J[seg] = rig.bones[seg].getWorldPosition(new THREE.Vector3());

  const skinIdx = mesh.geometry.attributes.skinIndex;
  const skinW = mesh.geometry.attributes.skinWeight;
  const bones = mesh.skeleton.bones;
  const segOf: Segment[] = new Array(n);
  const pos: THREE.Vector3[] = new Array(n);
  const p = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    // 邊條骨影響最大，就當呢點屬於邊段身體
    let best = 0;
    let bw = -1;
    for (let k = 0; k < 4; k++) {
      const w = skinW.getComponent(i, k);
      if (w > bw) {
        bw = w;
        best = skinIdx.getComponent(i, k);
      }
    }
    segOf[i] = rig.segmentOf(bones[best]);
    p.fromBufferAttribute(mesh.geometry.attributes.position as THREE.BufferAttribute, i);
    mesh.applyBoneTransform(i, p);
    pos[i] = p.applyMatrix4(mesh.matrixWorld).clone();
  }

  // 每粒肌肉：橢圓入面嘅點全光，出面慢慢淡
  const inv = new THREE.Quaternion();
  const spots = SPOTS.map(([id, seg, off, scale]) => {
    const q = rig.seg[seg];
    const center = new THREE.Vector3(...off).applyQuaternion(q).add(J[seg]);
    inv.copy(q).invert();
    const idx: number[] = [];
    const ws: number[] = [];
    const v = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      if (limbOf(segOf[i]) !== limbOf(seg)) continue;
      v.copy(pos[i]).sub(center).applyQuaternion(inv);
      const d = Math.hypot(v.x / scale[0], v.y / scale[1], v.z / scale[2]);
      let w = Math.min(1, Math.max(0, (1.75 - d) / 0.85));
      if (w <= 0) continue;
      w = w * w * (3 - 2 * w);
      idx.push(i);
      ws.push(w);
    }
    return { id, idx: Uint32Array.from(idx), w: Float32Array.from(ws) };
  });

  const glow = new THREE.BufferAttribute(new Float32Array(n), 1);
  glow.setUsage(THREE.DynamicDrawUsage);
  mesh.geometry.setAttribute('glow', glow);
  return { glow, spots };
}

// 載一次模型，順手起好骨架轉換同發光（要喺未郁骨之前讀靜止姿勢）
type Loaded = { gltf: GLTF; rig: Rig; paints: Paint[]; ends: THREE.Object3D[] };
let loading: Promise<Loaded> | null = null;
function loadFigure() {
  loading ??= (async () => {
    const asset = Asset.fromModule(MODEL);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    const buf =
      Platform.OS === 'web' ? await (await fetch(uri)).arrayBuffer() : await new File(uri).arrayBuffer();
    const gltf = await new Promise<GLTF>((res, rej) => new GLTFLoader().parse(buf, '', res, rej));
    const rig = new Rig(gltf.scene);
    rig.apply(NEUTRAL);
    gltf.scene.updateMatrixWorld(true);
    const paints: Paint[] = [];
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.SkinnedMesh;
      if (!mesh.isMesh) return;
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(glowMaterial) : glowMaterial(mesh.material);
      // 趴低、坐低時原本個包圍球唔準，唔好裁走
      mesh.frustumCulled = false;
      if (mesh.isSkinnedMesh) paints.push(paint(mesh, rig));
    });
    // 外框用：頭頂、手、腳尖、膊頭
    const ends = ['HeadTop_End', 'LeftHandMiddle4', 'RightHandMiddle4', 'LeftToe_End', 'RightToe_End', 'LeftFoot', 'RightFoot', 'LeftArm', 'RightArm', 'Hips', 'LeftLeg', 'RightLeg']
      .map((name) => gltf.scene.getObjectByName(`mixamorig${name}`))
      .filter((o): o is THREE.Object3D => !!o);
    return { gltf, rig, paints, ends };
  })();
  return loading;
}

function recolor(pt: Paint, inten: Intensity) {
  const amt = pt.glow.array as Float32Array;
  amt.fill(0);
  for (const s of pt.spots) {
    const v = inten[s.id] ?? 0;
    if (v <= 0.02) continue;
    for (let k = 0; k < s.idx.length; k++) {
      const i = s.idx[k];
      const a = Math.min(1, s.w[k] * v);
      if (a > amt[i]) amt[i] = a;
    }
  }
  pt.glow.needsUpdate = true;
}

// 地上柔影：中間深，出面淡
function blobTexture() {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x - size / 2 + 0.5, y - size / 2 + 0.5) / (size / 2);
      const a = Math.max(0, 1 - d);
      const j = (y * size + x) * 4;
      data[j] = 60;
      data[j + 1] = 40;
      data[j + 2] = 30;
      data[j + 3] = Math.round(255 * a * a);
    }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.needsUpdate = true;
  return t;
}

export function HumanFigure({ poseRef, intensityRef, boundsRef, reachRef, statsRef }: Props) {
  const { gltf, rig, paints, ends } = use(loadFigure());
  const shadow = useRef<THREE.Mesh>(null);
  const lastKey = useRef('');
  const tex = useMemo(() => blobTexture(), []);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3() }), []);

  useFrame(() => {
    rig.apply(poseRef.current, reachRef?.current.reach, reachRef?.current.w ?? 0);
    if (statsRef) statsRef.current = { err: rig.reachError(reachRef?.current.reach), low: rig.lowest() };

    // 發光有變先重新染色
    const inten = intensityRef.current;
    const key = Object.keys(inten)
      .map((k) => `${k}${Math.round((inten[k as MuscleId] ?? 0) * 50)}`)
      .join();
    if (key !== lastKey.current) {
      lastKey.current = key;
      for (const pt of paints) recolor(pt, inten);
    }

    // 外框同地影
    gltf.scene.updateMatrixWorld(true);
    if (boundsRef) {
      boundsRef.current.makeEmpty();
      for (const o of ends) boundsRef.current.expandByPoint(o.getWorldPosition(tmp.a));
    }
    const s = shadow.current;
    if (s) {
      const head = rig.bones.head.getWorldPosition(tmp.a);
      const feet = rig.bones.lFoot.getWorldPosition(tmp.b).add(rig.bones.rFoot.getWorldPosition(tmp.c)).multiplyScalar(0.5);
      const dx = head.x - feet.x;
      const dz = head.z - feet.z;
      s.position.set((head.x + feet.x) / 2, 0.014, (head.z + feet.z) / 2);
      s.rotation.set(-Math.PI / 2, 0, Math.atan2(dx, dz));
      s.scale.set(0.62, Math.hypot(dx, dz) + 0.55, 1);
    }
  });

  return (
    <group>
      <primitive object={gltf.scene} />
      <mesh ref={shadow} renderOrder={1}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.4} />
      </mesh>
    </group>
  );
}
