import { useRef, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { MuscleId } from '../data/muscles';
import { BALL_Z, Pose, rootHeight, SHIN, SOLE, THIGH, TOE_LEN, toeAngle } from '../lib/pose';

export type Intensity = Partial<Record<MuscleId, number>>;

type Props = {
  poseRef: MutableRefObject<Pose>;
  intensityRef: MutableRefObject<Intensity>;
};

type V3 = [number, number, number];

const MUSCLE_IDLE = new THREE.Color('#b9a49c');
const MUSCLE_HOT = new THREE.Color('#ff3b30');

// 公仔皮膚同關節材質，全部部件共用
const skin = new THREE.MeshStandardMaterial({ color: '#a3afc0', roughness: 0.55, metalness: 0.05 });
const joint = new THREE.MeshStandardMaterial({ color: '#8793a6', roughness: 0.5, metalness: 0.05 });

// 用側面輪廓 (半徑, 高度) 轉一圈整肢體，有粗有幼，似真人線條。
// 高度由細到大排，兩頭半徑係 0 先會封口。
function lathe(profile: [number, number][], segments = 24) {
  const curve = new THREE.SplineCurve(profile.map(([r, y]) => new THREE.Vector2(r, y)));
  const pts = curve.getPoints(40).map((v) => new THREE.Vector2(Math.max(0, v.x), v.y));
  return new THREE.LatheGeometry(pts, segments);
}

const sphere = new THREE.SphereGeometry(1, 20, 14);

// 肢體輪廓。關節喺 y = 0，向下伸。
const GEO = {
  torso: lathe([
    [0, -0.06],
    [0.12, -0.04],
    [0.135, 0.04],
    [0.13, 0.12],
    [0.145, 0.22],
    [0.17, 0.33],
    [0.185, 0.42],
    [0.19, 0.47],
    [0.16, 0.53],
    [0.09, 0.57],
    [0.05, 0.6],
    [0, 0.61],
  ], 32),
  neck: lathe([
    [0, -0.02],
    [0.05, 0],
    [0.044, 0.06],
    [0.047, 0.1],
    [0, 0.12],
  ]),
  thigh: lathe([
    [0, -THIGH - 0.02],
    [0.035, -THIGH - 0.015],
    [0.05, -THIGH + 0.01],
    [0.055, -0.4],
    [0.064, -0.32],
    [0.076, -0.2],
    [0.084, -0.09],
    [0.083, -0.01],
    [0.065, 0.04],
    [0, 0.06],
  ]),
  shin: lathe([
    [0, -SHIN - 0.02],
    [0.03, -SHIN - 0.015],
    [0.038, -SHIN + 0.02],
    [0.036, -0.4],
    [0.04, -0.32],
    [0.053, -0.2],
    [0.058, -0.12],
    [0.055, -0.05],
    [0.05, 0],
    [0, 0.03],
  ]),
  upperArm: lathe([
    [0, -0.32],
    [0.032, -0.315],
    [0.04, -0.29],
    [0.042, -0.24],
    [0.049, -0.15],
    [0.053, -0.07],
    [0.055, -0.01],
    [0.045, 0.03],
    [0, 0.05],
  ]),
  forearm: lathe([
    [0, -0.26],
    [0.022, -0.255],
    [0.027, -0.24],
    [0.029, -0.19],
    [0.038, -0.1],
    [0.043, -0.04],
    [0.038, 0],
    [0, 0.025],
  ]),
};

// 一件身體部件
function Part({
  geo,
  position = [0, 0, 0],
  scale = [1, 1, 1],
  rotation = [0, 0, 0],
  mat = skin,
}: {
  geo: THREE.BufferGeometry;
  position?: V3;
  scale?: V3;
  rotation?: V3;
  mat?: THREE.Material;
}) {
  return <mesh geometry={geo} material={mat} position={position} scale={scale} rotation={rotation} />;
}

// 圓波波（頭、關節、手掌、腳掌）
const Ball = (position: V3, scale: V3, mat: THREE.Material = skin) => (
  <Part geo={sphere} position={position} scale={scale} mat={mat} />
);

// A muscle is an ellipsoid stuck onto a body segment that glows red when it works.
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
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!mat.current) return;
    const v = intensityRef.current[id] ?? 0;
    mat.current.color.copy(MUSCLE_IDLE).lerp(MUSCLE_HOT, v);
    mat.current.emissive.copy(MUSCLE_HOT).multiplyScalar(v * 0.45);
  });
  return (
    <mesh geometry={sphere} position={position} scale={scale}>
      <meshStandardMaterial ref={mat} roughness={0.45} />
    </mesh>
  );
}

export function HumanFigure({ poseRef, intensityRef }: Props) {
  const root = useRef<THREE.Group>(null);
  const spine = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const lSh = useRef<THREE.Group>(null);
  const rSh = useRef<THREE.Group>(null);
  const lEl = useRef<THREE.Group>(null);
  const rEl = useRef<THREE.Group>(null);
  const lHip = useRef<THREE.Group>(null);
  const rHip = useRef<THREE.Group>(null);
  const lKn = useRef<THREE.Group>(null);
  const rKn = useRef<THREE.Group>(null);
  const lAn = useRef<THREE.Group>(null);
  const rAn = useRef<THREE.Group>(null);
  const lTo = useRef<THREE.Group>(null);
  const rTo = useRef<THREE.Group>(null);

  useFrame(() => {
    const p = poseRef.current;
    const set = (g: THREE.Group | null, r: V3) => g?.rotation.set(r[0], r[1], r[2]);
    if (root.current) {
      root.current.position.set(p.shift, rootHeight(p), 0);
      root.current.rotation.set(p.tilt, p.twist, 0);
    }
    set(spine.current, p.spine);
    set(neck.current, p.neck);
    set(lSh.current, p.lShoulder);
    set(rSh.current, p.rShoulder);
    set(lEl.current, p.lElbow);
    set(rEl.current, p.rElbow);
    set(lHip.current, p.lHip);
    set(rHip.current, p.rHip);
    set(lKn.current, [p.lKnee, 0, 0]);
    set(rKn.current, [p.rKnee, 0, 0]);
    set(lAn.current, [p.lAnkle, 0, 0]);
    set(rAn.current, [p.rAnkle, 0, 0]);
    set(lTo.current, [toeAngle(p.lToe, p.lAnkle, p.seat), 0, 0]);
    set(rTo.current, [toeAngle(p.rToe, p.rAnkle, p.seat), 0, 0]);
  });

  const M = (id: MuscleId, position: V3, scale: V3) => (
    <Muscle key={`${id}-${position.join()}`} id={id} intensityRef={intensityRef} position={position} scale={scale} />
  );

  // 手掌：掌心向身，拇指向前
  const hand = (
    <group position={[0, -0.255, 0]}>
      {Ball([0, -0.045, 0], [0.02, 0.05, 0.042])}
      {Ball([0, -0.105, 0.004], [0.016, 0.042, 0.037])}
      <Part geo={sphere} position={[0, -0.035, 0.045]} rotation={[-0.5, 0, 0]} scale={[0.014, 0.032, 0.014]} />
    </group>
  );

  const arm = (side: 1 | -1, shoulder: typeof lSh, elbow: typeof lEl) => (
    <group ref={shoulder} position={[0.2 * side, 0.5, 0]}>
      {Ball([0, 0, 0], [0.052, 0.052, 0.052], joint)}
      <Part geo={GEO.upperArm} />
      {M('shoulders', [0.012 * side, -0.035, 0], [0.065, 0.085, 0.07])}
      {M('triceps', [0, -0.15, -0.03], [0.042, 0.095, 0.034])}
      {M('biceps', [0, -0.15, 0.03], [0.04, 0.085, 0.032])}
      <group ref={elbow} position={[0, -0.3, 0]}>
        {Ball([0, 0, 0], [0.04, 0.04, 0.04], joint)}
        <Part geo={GEO.forearm} scale={[1, 1, 0.85]} />
        {hand}
      </group>
    </group>
  );

  const foot = (side: 1 | -1, toe: typeof lTo) => (
    <>
      {Ball([0, 0, 0], [0.036, 0.036, 0.036], joint)}
      {Ball([0, -SOLE + 0.036, -0.025], [0.036, 0.036, 0.038])}
      {Ball([0, -SOLE + 0.028, 0.055], [0.045, 0.028, 0.085])}
      {M('feet', [0, -SOLE + 0.018, 0.05], [0.048, 0.02, 0.085])}
      {/* 腳趾喺拇趾球屈曲 */}
      <group ref={toe} position={[0, -SOLE + 0.018, BALL_Z]}>
        {Ball([0, 0, TOE_LEN / 2], [0.046, 0.018, TOE_LEN / 2 + 0.006])}
        {Ball([-0.019 * side, 0.002, TOE_LEN / 2 + 0.006], [0.019, 0.019, TOE_LEN / 2 + 0.004])}
      </group>
    </>
  );

  const leg = (side: 1 | -1, hip: typeof lHip, knee: typeof lKn, ankle: typeof lAn, toe: typeof lTo) => (
    <group ref={hip} position={[0.1 * side, 0, 0]}>
      <Part geo={GEO.thigh} />
      {M('quads', [0, -0.2, 0.05], [0.068, 0.16, 0.045])}
      {M('hamstrings', [0, -0.22, -0.05], [0.062, 0.15, 0.042])}
      <group ref={knee} position={[0, -THIGH, 0]}>
        {Ball([0, 0, 0], [0.052, 0.052, 0.052], joint)}
        {Ball([0, 0.005, 0.042], [0.032, 0.036, 0.022])}
        <Part geo={GEO.shin} />
        {M('calves', [0, -0.15, -0.045], [0.05, 0.11, 0.04])}
        <group ref={ankle} position={[0, -SHIN, 0]}>
          {foot(side, toe)}
        </group>
      </group>
    </group>
  );

  return (
    <group ref={root}>
      {/* pelvis */}
      {Ball([0, 0, 0], [0.182, 0.105, 0.123])}
      {M('glutes', [0.075, -0.04, -0.09], [0.08, 0.085, 0.06])}
      {M('glutes', [-0.075, -0.04, -0.09], [0.08, 0.085, 0.06])}
      {M('psoas', [0.06, 0.02, 0.1], [0.04, 0.08, 0.03])}
      {M('psoas', [-0.06, 0.02, 0.1], [0.04, 0.08, 0.03])}

      <group ref={spine} position={[0, 0.05, 0]}>
        <Part geo={GEO.torso} scale={[1, 1, 0.62]} />
        {M('traps', [0, 0.5, -0.06], [0.14, 0.06, 0.045])}
        {M('lats', [0.11, 0.32, -0.085], [0.07, 0.14, 0.045])}
        {M('lats', [-0.11, 0.32, -0.085], [0.07, 0.14, 0.045])}
        {M('rotatorCuff', [0.14, 0.42, -0.09], [0.06, 0.05, 0.03])}
        {M('rotatorCuff', [-0.14, 0.42, -0.09], [0.06, 0.05, 0.03])}
        {M('erectors', [0.04, 0.17, -0.09], [0.032, 0.14, 0.03])}
        {M('erectors', [-0.04, 0.17, -0.09], [0.032, 0.14, 0.03])}
        {M('chest', [0.08, 0.41, 0.095], [0.08, 0.06, 0.035])}
        {M('chest', [-0.08, 0.41, 0.095], [0.08, 0.06, 0.035])}
        {M('abs', [0, 0.2, 0.085], [0.075, 0.13, 0.03])}
        {M('obliques', [0.14, 0.2, 0.03], [0.035, 0.11, 0.06])}
        {M('obliques', [-0.14, 0.2, 0.03], [0.035, 0.11, 0.06])}

        <group ref={neck} position={[0, 0.56, 0]}>
          <Part geo={GEO.neck} />
          {/* 頭：蛋形頭殼 + 下巴 + 鼻 + 耳 */}
          {Ball([0, 0.18, 0.005], [0.088, 0.105, 0.1])}
          {Ball([0, 0.135, 0.03], [0.064, 0.058, 0.07])}
          {Ball([0, 0.165, 0.1], [0.014, 0.024, 0.018])}
          {Ball([0.088, 0.17, 0], [0.012, 0.028, 0.02])}
          {Ball([-0.088, 0.17, 0], [0.012, 0.028, 0.02])}
        </group>

        {arm(1, lSh, lEl)}
        {arm(-1, rSh, rEl)}
      </group>

      {leg(1, lHip, lKn, lAn, lTo)}
      {leg(-1, rHip, rKn, rAn, rTo)}
    </group>
  );
}
