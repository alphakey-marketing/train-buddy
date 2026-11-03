import { Suspense, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber/native';
import * as THREE from 'three';
import { Exercise, fullPose, repLength } from '../data/exercises';
import { blendPose, NEUTRAL, Pose } from '../lib/pose';
import { HumanFigure, Intensity } from './HumanFigure';

export type ViewAngle = 'back' | 'side' | 'front';

// The figure faces +Z, so the "back" camera sits on -Z.
const CAMERA_SPOTS: Record<ViewAngle, [number, number, number]> = {
  back: [0.6, 1.5, -3.1],
  side: [3.1, 1.3, 0.3],
  front: [-0.6, 1.5, 3.1],
};

type Props = {
  exercise: Exercise;
  playing: boolean;
  speed: number;
  view: ViewAngle;
  onCue: (cue: string) => void;
  onRep: (reps: number) => void;
};

function CameraRig({ view }: { view: ViewAngle }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(...CAMERA_SPOTS[view]));
  useEffect(() => {
    target.current.set(...CAMERA_SPOTS[view]);
  }, [view]);
  useFrame((_, dt) => {
    camera.position.lerp(target.current, Math.min(1, dt * 3));
    camera.lookAt(0, 0.95, 0);
  });
  return null;
}

function Coach({ exercise, playing, speed, onCue, onRep }: Omit<Props, 'view'>) {
  const poseRef = useRef<Pose>({ ...NEUTRAL });
  const intensityRef = useRef<Intensity>({});
  const time = useRef(0);
  const reps = useRef(0);
  const lastCue = useRef('');

  useEffect(() => {
    time.current = 0;
    reps.current = 0;
    lastCue.current = '';
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
    intensityRef.current = next;

    // Show the cue of the movement we're heading into.
    const cue = b.cue;
    if (cue !== lastCue.current) {
      lastCue.current = cue;
      onCue(cue);
    }
  });

  return <HumanFigure poseRef={poseRef} intensityRef={intensityRef} />;
}

export function TrainerScene(props: Props) {
  return (
    <Canvas camera={{ position: CAMERA_SPOTS[props.view], fov: 45 }} style={{ flex: 1 }}>
      <color attach="background" args={['#14161c']} />
      <hemisphereLight args={['#dfe8ff', '#30343d', 0.9]} />
      <directionalLight position={[2, 4, -3]} intensity={1.6} />
      <directionalLight position={[-2, 3, 3]} intensity={0.6} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.6, 48]} />
        <meshStandardMaterial color="#242832" />
      </mesh>
      <gridHelper args={[6, 24, '#2f3542', '#2f3542']} position={[0, 0.001, 0]} />
      <CameraRig view={props.view} />
      <Suspense fallback={null}>
        <Coach {...props} />
      </Suspense>
    </Canvas>
  );
}
