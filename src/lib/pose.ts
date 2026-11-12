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
  // 手腕：左手 Z 正數 = 手背方向反（伸腕），右手相反
  lWrist: Vec3;
  rWrist: Vec3;
  // 聳膊（正數 = 膊頭升高）
  lShrug: number;
  rShrug: number;
  // 1 = 用最低接觸點落地（跪、瞓、四足、坐椅都得）；0 = 舊計法（淨係腳）
  ground: number;
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
  lWrist: [0, 0, 0],
  rWrist: [0, 0, 0],
  lShrug: 0,
  rShrug: 0,
  ground: 0,
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
  const out = {} as Record<string, unknown>;
  for (const key of Object.keys(NEUTRAL) as (keyof Pose)[]) {
    const x = a[key];
    const y = b[key];
    // 手肘慢啲先屈：手臂先抬起，之後先摺，唔會中途收埋喺個頭後面
    const kk = key === 'lElbow' || key === 'rElbow' ? ease(Math.min(1, Math.max(0, (t - 0.35) / 0.65))) : k;
    out[key] = typeof x === 'number' ? lerp(x, y as number, kk) : lerp3(x, y as Vec3, kk);
  }
  return out as Pose;
}

// 左右對調（單邊動作換邊用）
export function mirrorPose(p: Pose): Pose {
  const m = (v: Vec3): Vec3 => [v[0], -v[1], -v[2]];
  return {
    ...p,
    spine: m(p.spine), neck: m(p.neck),
    lShoulder: m(p.rShoulder), rShoulder: m(p.lShoulder),
    lElbow: m(p.rElbow), rElbow: m(p.lElbow),
    lWrist: m(p.rWrist), rWrist: m(p.lWrist),
    lHip: m(p.rHip), rHip: m(p.lHip),
    lKnee: p.rKnee, rKnee: p.lKnee,
    lAnkle: p.rAnkle, rAnkle: p.lAnkle,
    lToe: p.rToe, rToe: p.lToe,
    lShrug: p.rShrug, rShrug: p.lShrug,
    twist: -p.twist, shift: -p.shift,
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
