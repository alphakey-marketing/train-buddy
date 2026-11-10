// Joint angles in radians. The figure faces +Z, its left side is +X.
//  - Hip/shoulder X: negative = swing forward, positive = swing back.
//  - Shoulder Z: left arm out = +, right arm out = -.
//  - Knee: positive = bend (shin goes back). Elbow X: negative = bend (forearm comes forward); elbow Z bends sideways.
//  - Spine X: positive = bend forward. Spine Z: side bend. Spine Y: positive = turn to own left.
//  - Ankle: positive = point toes down (heel up, 踮腳). Negative = toes up.
//  - Toe: positive = curl toes down (屈趾 / 握拳), negative = lift toes up (反趾).
//    企喺地踮腳時，腳趾會自動放平貼地。
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
  lToe: number;
  rToe: number;
  tilt: number;
  twist: number;
  shift: number;
  lift: number;
  seat: number;
};

export const NEUTRAL: Pose = {
  spine: [0, 0, 0],
  neck: [0, 0, 0],
  lShoulder: [0, 0, 0.17], // 手微微打開，唔好插入大髀
  rShoulder: [0, 0, -0.17],
  lElbow: [-0.1, 0, 0],
  rElbow: [-0.1, 0, 0],
  lHip: [0, 0, 0],
  rHip: [0, 0, 0],
  lKnee: 0,
  rKnee: 0,
  lAnkle: 0,
  rAnkle: 0,
  lToe: 0,
  rToe: 0,
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
    lToe: lerp(a.lToe, b.lToe, k),
    rToe: lerp(a.rToe, b.rToe, k),
    tilt: lerp(a.tilt, b.tilt, k),
    twist: lerp(a.twist, b.twist, k),
    shift: lerp(a.shift, b.shift, k),
    lift: lerp(a.lift, b.lift, k),
    seat: lerp(a.seat, b.seat, k),
  };
}

// 尺寸由 assets/models/coach-f.glb 量出嚟（tools/measure_figure.py）。換模型要重新量。
export const THIGH = 0.403;
export const SHIN = 0.427;
// 腳掌尺寸：腳踝去拇趾球（向前）、腳踝離地（向下）
export const BALL_Z = 0.143;
export const SOLE = 0.113;
export const HIP_HEIGHT = THIGH + SHIN + SOLE;
// 坐地時髖關節離地高度
export const SEAT_HEIGHT = 0.11;

// How far the pelvis must drop so the lower foot stays on the floor.
// Negative = pelvis goes up (e.g. standing on tiptoe).
export function pelvisDrop(p: Pose): number {
  const legHeight = (hip: Vec3, knee: number, ankle: number) =>
    THIGH * Math.cos(hip[0]) * Math.cos(hip[2]) +
    SHIN * Math.cos(hip[0] + knee) * Math.cos(hip[2]) +
    // 踮腳：以拇趾球做支點，腳踝升高
    (ankle > 0 ? BALL_Z * Math.sin(ankle) + SOLE * (Math.cos(ankle) - 1) : 0);
  const tallest = Math.max(legHeight(p.lHip, p.lKnee, p.lAnkle), legHeight(p.rHip, p.rKnee, p.rAnkle));
  return THIGH + SHIN - tallest;
}

// Pelvis height above the floor for this pose.
export function rootHeight(p: Pose): number {
  const standing = (HIP_HEIGHT - pelvisDrop(p)) * Math.cos(p.tilt);
  return lerp(standing, SEAT_HEIGHT, p.seat) + p.lift;
}

// 腳趾關節實際角度：企喺地踮腳時，腳趾反向屈返，保持貼地。
export function toeAngle(toe: number, ankle: number, seat: number): number {
  return toe - Math.max(0, ankle) * (1 - seat);
}
