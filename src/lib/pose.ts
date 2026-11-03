// Joint angles in radians. The figure faces +Z, its left side is +X.
//  - Hip/shoulder X: negative = swing forward, positive = swing back.
//  - Shoulder Z: left arm out = +, right arm out = -.
//  - Knee: positive = bend (shin goes back). Elbow X: negative = bend (forearm comes forward); elbow Z bends sideways.
//  - Spine X: positive = bend forward. Spine Z: side bend. Spine Y: positive = turn to own left.
//  - Ankle: positive = point toes down (heel up, 踮腳). Negative = toes up.
// Whole-body controls (成個身一齊郁):
//  - tilt: lean whole body forward around the pelvis (~1.4 = 俯臥).
//  - twist: turn whole body around vertical axis, positive = turn to own left (骨盤回旋).
//  - shift: slide sideways, + = to own left (橫向移動).
//  - lift: extra height above the floor (跳起).
//  - seat: 0 = standing on feet, 1 = pelvis sits on the floor (坐地).
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
  lAnkle: number;
  rAnkle: number;
  tilt: number;
  twist: number;
  shift: number;
  lift: number;
  seat: number;
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
  lAnkle: 0,
  rAnkle: 0,
  tilt: 0,
  twist: 0,
  shift: 0,
  lift: 0,
  seat: 0,
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
    lAnkle: lerp(a.lAnkle, b.lAnkle, k),
    rAnkle: lerp(a.rAnkle, b.rAnkle, k),
    tilt: lerp(a.tilt, b.tilt, k),
    twist: lerp(a.twist, b.twist, k),
    shift: lerp(a.shift, b.shift, k),
    lift: lerp(a.lift, b.lift, k),
    seat: lerp(a.seat, b.seat, k),
  };
}

export const THIGH = 0.45;
export const SHIN = 0.47;
export const HIP_HEIGHT = THIGH + SHIN + 0.04;
// 踮腳時腳尖比腳踝低幾多（大約腳掌前半長度）
export const TOE_REACH = 0.15;
// 坐地時盤骨中心離地高度
export const SEAT_HEIGHT = 0.11;

// How far the pelvis must drop so the lower foot stays on the floor.
// Negative = pelvis goes up (e.g. standing on tiptoe).
export function pelvisDrop(p: Pose): number {
  const legHeight = (hip: Vec3, knee: number, ankle: number) =>
    THIGH * Math.cos(hip[0]) * Math.cos(hip[2]) +
    SHIN * Math.cos(hip[0] + knee) * Math.cos(hip[2]) +
    TOE_REACH * Math.sin(Math.max(0, ankle));
  const tallest = Math.max(legHeight(p.lHip, p.lKnee, p.lAnkle), legHeight(p.rHip, p.rKnee, p.rAnkle));
  return THIGH + SHIN - tallest;
}

// Pelvis height above the floor for this pose.
export function rootHeight(p: Pose): number {
  const standing = (HIP_HEIGHT - pelvisDrop(p)) * Math.cos(p.tilt);
  return lerp(standing, SEAT_HEIGHT, p.seat) + p.lift;
}
