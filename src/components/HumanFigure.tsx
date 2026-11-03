import { useRef, MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { MuscleId } from '../data/muscles';
import { HIP_HEIGHT, Pose, pelvisDrop, SHIN, THIGH } from '../lib/pose';

export type Intensity = Partial<Record<MuscleId, number>>;

type Props = {
  poseRef: MutableRefObject<Pose>;
  intensityRef: MutableRefObject<Intensity>;
};

const SKIN = '#9aa7b8';
const MUSCLE_IDLE = new THREE.Color('#b9a49c');
const MUSCLE_HOT = new THREE.Color('#ff3b30');

function Limb({ length, radius, y }: { length: number; radius: number; y: number }) {
  return (
    <mesh position={[0, y, 0]} castShadow>
      <capsuleGeometry args={[radius, length, 6, 12]} />
      <meshStandardMaterial color={SKIN} roughness={0.7} />
    </mesh>
  );
}

// A muscle is an ellipsoid stuck onto a body segment that glows red when it works.
function Muscle({
  id,
  intensityRef,
  position,
  scale,
}: {
  id: MuscleId;
  intensityRef: MutableRefObject<Intensity>;
  position: [number, number, number];
  scale: [number, number, number];
}) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    if (!mat.current) return;
    const v = intensityRef.current[id] ?? 0;
    mat.current.color.copy(MUSCLE_IDLE).lerp(MUSCLE_HOT, v);
    mat.current.emissive.copy(MUSCLE_HOT).multiplyScalar(v * 0.45);
  });
  return (
    <mesh position={position} scale={scale}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial ref={mat} roughness={0.5} />
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

  useFrame(() => {
    const p = poseRef.current;
    const set = (g: THREE.Group | null, r: [number, number, number]) => g?.rotation.set(r[0], r[1], r[2]);
    if (root.current) root.current.position.y = HIP_HEIGHT - pelvisDrop(p);
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
  });

  const M = (id: MuscleId, position: [number, number, number], scale: [number, number, number]) => (
    <Muscle key={`${id}-${position.join()}`} id={id} intensityRef={intensityRef} position={position} scale={scale} />
  );

  const arm = (side: 1 | -1, shoulder: typeof lSh, elbow: typeof lEl) => (
    <group ref={shoulder} position={[0.2 * side, 0.5, 0]}>
      {M('shoulders', [0.01 * side, -0.02, 0], [0.075, 0.075, 0.075])}
      <Limb length={0.22} radius={0.048} y={-0.15} />
      {M('triceps', [0, -0.15, -0.035], [0.045, 0.1, 0.035])}
      {M('biceps', [0, -0.15, 0.035], [0.042, 0.09, 0.033])}
      <group ref={elbow} position={[0, -0.3, 0]}>
        <Limb length={0.2} radius={0.04} y={-0.13} />
        <mesh position={[0, -0.29, 0]}>
          <sphereGeometry args={[0.05, 12, 10]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
      </group>
    </group>
  );

  const leg = (side: 1 | -1, hip: typeof lHip, knee: typeof lKn) => (
    <group ref={hip} position={[0.1 * side, 0, 0]}>
      <Limb length={THIGH - 0.14} radius={0.07} y={-THIGH / 2} />
      {M('quads', [0, -0.2, 0.045], [0.065, 0.16, 0.05])}
      {M('hamstrings', [0, -0.22, -0.045], [0.06, 0.15, 0.045])}
      <group ref={knee} position={[0, -THIGH, 0]}>
        <Limb length={SHIN - 0.12} radius={0.055} y={-SHIN / 2} />
        {M('calves', [0, -0.13, -0.04], [0.05, 0.11, 0.04])}
        <mesh position={[0, -SHIN - 0.01, 0.05]}>
          <boxGeometry args={[0.09, 0.05, 0.22]} />
          <meshStandardMaterial color={SKIN} />
        </mesh>
      </group>
    </group>
  );

  return (
    <group ref={root}>
      {/* pelvis */}
      <mesh scale={[1.25, 0.7, 0.85]}>
        <sphereGeometry args={[0.14, 16, 12]} />
        <meshStandardMaterial color={SKIN} roughness={0.7} />
      </mesh>
      {M('glutes', [0.075, -0.04, -0.09], [0.08, 0.085, 0.06])}
      {M('glutes', [-0.075, -0.04, -0.09], [0.08, 0.085, 0.06])}

      <group ref={spine} position={[0, 0.05, 0]}>
        <mesh position={[0, 0.27, 0]} scale={[1.25, 1, 0.75]}>
          <capsuleGeometry args={[0.15, 0.25, 6, 16]} />
          <meshStandardMaterial color={SKIN} roughness={0.7} />
        </mesh>
        {M('traps', [0, 0.49, -0.07], [0.15, 0.07, 0.05])}
        {M('lats', [0.11, 0.32, -0.085], [0.07, 0.14, 0.045])}
        {M('lats', [-0.11, 0.32, -0.085], [0.07, 0.14, 0.045])}
        {M('erectors', [0.04, 0.17, -0.105], [0.032, 0.14, 0.03])}
        {M('erectors', [-0.04, 0.17, -0.105], [0.032, 0.14, 0.03])}
        {M('chest', [0.08, 0.41, 0.095], [0.08, 0.06, 0.035])}
        {M('chest', [-0.08, 0.41, 0.095], [0.08, 0.06, 0.035])}
        {M('abs', [0, 0.2, 0.105], [0.075, 0.13, 0.03])}
        {M('obliques', [0.15, 0.2, 0.04], [0.04, 0.11, 0.06])}
        {M('obliques', [-0.15, 0.2, 0.04], [0.04, 0.11, 0.06])}

        <group ref={neck} position={[0, 0.56, 0]}>
          <Limb length={0.06} radius={0.045} y={0.04} />
          <mesh position={[0, 0.17, 0.01]} scale={[0.9, 1.05, 1]}>
            <sphereGeometry args={[0.11, 20, 16]} />
            <meshStandardMaterial color={SKIN} roughness={0.7} />
          </mesh>
        </group>

        {arm(1, lSh, lEl)}
        {arm(-1, rSh, rEl)}
      </group>

      {leg(1, lHip, lKn)}
      {leg(-1, rHip, rKn)}
    </group>
  );
}
