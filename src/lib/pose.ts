// Joint angles in radians. The figure faces +Z, its left side is +X.
//  - Hip/shoulder X: negative = swing forward, positive = swing back.
//  - Shoulder Z: left arm out = +, right arm out = -.
//  - Knee: positive = bend (shin goes back). Elbow X: negative = bend (forearm comes forward); elbow Z bends sideways.
//  - Spine X: positive = bend forward. Spine Z: side bend.
export type Vec3 = [number, number, number];

export type Pose = {
  spine: Vec3;
  neck: Vec3;
  lShoulder: Vec3;
  rShoulder: Vec3;
  lElbow: Vec3;
  rElbow: Vec3;
  lHip: Vec3;
  rHip: Vec3;
  lKnee: number;
  rKnee: number;
};

export const NEUTRAL: Pose = {
  spine: [0, 0, 0],
  neck: [0, 0, 0],
  lShoulder: [0, 0, 0.08],
  rShoulder: [0, 0, -0.08],
  lElbow: [-0.1, 0, 0],
  rElbow: [-0.1, 0, 0],
  lHip: [0, 0, 0],
  rHip: [0, 0, 0],
  lKnee: 0,
  rKnee: 0,
};

const ease = (t: number) => t * t * (3 - 2 * t);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerp3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

export function blendPose(a: Pose, b: Pose, t: number): Pose {
  const k = ease(Math.min(1, Math.max(0, t)));
  return {
    spine: lerp3(a.spine, b.spine, k),
    neck: lerp3(a.neck, b.neck, k),
    lShoulder: lerp3(a.lShoulder, b.lShoulder, k),
    rShoulder: lerp3(a.rShoulder, b.rShoulder, k),
    lElbow: lerp3(a.lElbow, b.lElbow, k),
    rElbow: lerp3(a.rElbow, b.rElbow, k),
    lHip: lerp3(a.lHip, b.lHip, k),
    rHip: lerp3(a.rHip, b.rHip, k),
    lKnee: lerp(a.lKnee, b.lKnee, k),
    rKnee: lerp(a.rKnee, b.rKnee, k),
  };
}

export const THIGH = 0.45;
export const SHIN = 0.47;
export const HIP_HEIGHT = THIGH + SHIN + 0.04;

// How far the pelvis must drop so the lower foot stays on the floor.
export function pelvisDrop(p: Pose): number {
  const legHeight = (hip: Vec3, knee: number) =>
    THIGH * Math.cos(hip[0]) * Math.cos(hip[2]) + SHIN * Math.cos(hip[0] + knee) * Math.cos(hip[2]);
  const tallest = Math.max(legHeight(p.lHip, p.lKnee), legHeight(p.rHip, p.rKnee));
  return THIGH + SHIN - tallest;
}
