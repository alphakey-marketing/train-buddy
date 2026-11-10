// 2D 公仔：用同 3D 一樣嘅 Pose（關節角度），計出每段身體位置，再投影去正面／側面／背面。
// 出嚟係一堆簡單形狀（線、多邊形、圓），俾 SVG 畫。唔掂 react，node 都用到（方便出圖檢查）。
import * as THREE from 'three';
import { MuscleId } from '../data/muscles';
import { Pose, rootHeight, toeAngle, Vec3, THIGH, SHIN, BALL_Z, SOLE } from './pose';

export type View2D = 'front' | 'side' | 'back';
export type Intensity2D = Partial<Record<MuscleId, number>>;

export type Shape =
  | { kind: 'line'; pts: [number, number][]; width: number; color: string; opacity?: number; depth: number }
  | { kind: 'poly'; pts: [number, number][]; round: number; color: string; opacity?: number; depth: number }
  | { kind: 'circle'; c: [number, number]; r: number; color: string; opacity?: number; depth: number };

// 身體尺寸（米），總高約 1.75
const HIP_W = 0.09; // 髖關節離中線
const SPINE = [0.1, 0.13, 0.13, 0.14]; // 盤骨 → 腰 → 胸 → 頸底
const SHOULDER_W = 0.19;
const UPPER_ARM = 0.29;
const FOREARM = 0.26;
const NECK = 0.06;
const HEAD_R = 0.105;
const TOE_LEN = 0.05;

const W = { upperArm: 0.085, forearm: 0.07, hand: 0.045, thigh: 0.14, shin: 0.1, foot: 0.065, neck: 0.08 };

export const COLORS = {
  near: '#dfe3ea',
  far: '#9ba2b0',
  outline: '#3a3f4b',
  muscle: '#ff4d2e',
  floor: '#dccbb6',
};

// ───── 計每段身體嘅世界旋轉（同 retarget.ts 一樣嘅層級） ─────
const e = new THREE.Euler();
const qe = (v: Vec3) => new THREE.Quaternion().setFromEuler(e.set(v[0], v[1], v[2], 'XYZ'));
const qx = (a: number) => qe([a, 0, 0]);
const ID = new THREE.Quaternion();

type Frames = Record<
  'hips' | 'spine0' | 'spine1' | 'spine2' | 'neck' | 'head' | 'lArm' | 'lFore' | 'rArm' | 'rFore' | 'lThigh' | 'lShin' | 'lFoot' | 'lToe' | 'rThigh' | 'rShin' | 'rFoot' | 'rToe',
  THREE.Quaternion
>;

function frames(p: Pose): Frames {
  const hips = qe([p.tilt, p.twist, 0]);
  const spine = qe(p.spine);
  const part = (q: THREE.Quaternion, k: number) => new THREE.Quaternion().slerpQuaternions(ID, q, k);
  const spine0 = hips.clone().multiply(part(spine, 1 / 3));
  const spine1 = hips.clone().multiply(part(spine, 2 / 3));
  const spine2 = hips.clone().multiply(spine);
  const neckQ = qe(p.neck);
  const neck = spine2.clone().multiply(part(neckQ, 0.5));
  const head = spine2.clone().multiply(neckQ);
  const lArm = spine2.clone().multiply(qe(p.lShoulder));
  const rArm = spine2.clone().multiply(qe(p.rShoulder));
  const lThigh = hips.clone().multiply(qe(p.lHip));
  const rThigh = hips.clone().multiply(qe(p.rHip));
  const lShin = lThigh.clone().multiply(qx(p.lKnee));
  const rShin = rThigh.clone().multiply(qx(p.rKnee));
  const lFoot = lShin.clone().multiply(qx(p.lAnkle));
  const rFoot = rShin.clone().multiply(qx(p.rAnkle));
  return {
    hips, spine0, spine1, spine2, neck, head,
    lArm, lFore: lArm.clone().multiply(qe(p.lElbow)),
    rArm, rFore: rArm.clone().multiply(qe(p.rElbow)),
    lThigh, lShin, lFoot, lToe: lFoot.clone().multiply(qx(toeAngle(p.lToe, p.lAnkle, p.seat))),
    rThigh, rShin, rFoot, rToe: rFoot.clone().multiply(qx(toeAngle(p.rToe, p.rAnkle, p.seat))),
  };
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const along = (from: THREE.Vector3, q: THREE.Quaternion, local: THREE.Vector3) => from.clone().add(local.clone().applyQuaternion(q));

// ───── 投影 ─────
// 正面：鏡頭喺 +Z（公仔面向你，佢左手喺你右邊）
// 側面：鏡頭喺公仔右邊，公仔面向畫面右邊
// 背面：鏡頭喺 -Z
const TO_CAMERA: Record<View2D, THREE.Vector3> = { front: V(0, 0, 1), side: V(-1, 0, 0), back: V(0, 0, -1) };

function projector(view: View2D) {
  const toCam = TO_CAMERA[view];
  const xy = (v: THREE.Vector3): [number, number] =>
    view === 'front' ? [v.x, -v.y] : view === 'back' ? [-v.x, -v.y] : [v.z, -v.y];
  const depth = (v: THREE.Vector3) => v.dot(toCam); // 愈大愈近鏡頭
  return { xy, depth, toCam };
}

// 2D 凸包（畫軀幹用）
function hull(pts: [number, number][]): [number, number][] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (p.length < 3) return p;
  const cross = (o: number[], a: number[], b: number[]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [];
  for (const x of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], x) <= 0) lower.pop();
    lower.push(x);
  }
  const upper: [number, number][] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const x = p[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], x) <= 0) upper.pop();
    upper.push(x);
  }
  return [...lower.slice(0, -1), ...upper.slice(0, -1)];
}

// 一個扁盒嘅 8 個角（軀幹橫切面）
function box(center: THREE.Vector3, q: THREE.Quaternion, hw: number, hh: number, hd: number) {
  const out: THREE.Vector3[] = [];
  for (const x of [-hw, hw]) for (const y of [-hh, hh]) for (const z of [-hd, hd]) out.push(along(center, q, V(x, y, z)));
  return out;
}

// 盒嘅其中一面（肌肉貼喺面上），normal 係本地方向
function face(center: THREE.Vector3, q: THREE.Quaternion, normal: THREE.Vector3, hw: number, hh: number, out: number) {
  // 面上兩條軸：揀同 normal 垂直嘅本地軸
  const u = Math.abs(normal.x) > 0.5 ? V(0, 0, 1) : V(1, 0, 0);
  const v = V(0, 1, 0);
  const c = center.clone().add(normal.clone().multiplyScalar(out).applyQuaternion(q));
  const pts: THREE.Vector3[] = [];
  for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    pts.push(c.clone().add(u.clone().multiplyScalar(a * hw).add(v.clone().multiplyScalar(b * hh)).applyQuaternion(q)));
  }
  return { pts, normal: normal.clone().applyQuaternion(q) };
}

// 計全身關節位置（米，世界座標）
function skeleton(p: Pose) {
  const f = frames(p);
  const pelvis = V(p.shift, rootHeight(p), 0);
  const waist = along(pelvis, f.hips, V(0, SPINE[0], 0));
  const belly = along(waist, f.spine0, V(0, SPINE[1], 0));
  const chest = along(belly, f.spine1, V(0, SPINE[2], 0));
  const neckBase = along(chest, f.spine2, V(0, SPINE[3], 0));
  const headC = along(along(neckBase, f.neck, V(0, NECK, 0)), f.head, V(0, HEAD_R + 0.01, 0.01));

  const side = (s: 1 | -1) => {
    const L = s === 1;
    const shoulder = along(neckBase, f.spine2, V(s * SHOULDER_W, -0.04, 0));
    const elbow = along(shoulder, L ? f.lArm : f.rArm, V(0, -UPPER_ARM, 0));
    const wrist = along(elbow, L ? f.lFore : f.rFore, V(0, -FOREARM, 0));
    const hand = along(wrist, L ? f.lFore : f.rFore, V(0, -0.07, 0));
    const hip = along(pelvis, f.hips, V(s * HIP_W, 0, 0));
    const knee = along(hip, L ? f.lThigh : f.rThigh, V(0, -THIGH, 0));
    const ankle = along(knee, L ? f.lShin : f.rShin, V(0, -SHIN, 0));
    const ball = along(ankle, L ? f.lFoot : f.rFoot, V(0, -SOLE * 0.6, BALL_Z));
    const heel = along(ankle, L ? f.lFoot : f.rFoot, V(0, -SOLE * 0.6, -0.04));
    const toe = along(ball, L ? f.lToe : f.rToe, V(0, 0, TOE_LEN));
    return { shoulder, elbow, wrist, hand, hip, knee, ankle, ball, heel, toe };
  };
  return { f, pelvis, waist, belly, chest, neckBase, headC, Lside: side(1), Rside: side(-1) };
}

// 揀最睇得清楚嘅角度：邊個角度關節喺畫面上郁得最多（左右對稱嘅動作正面睇，前後郁嘅側面睇）
export function bestView(poses: Pose[]): 'front' | 'side' {
  const spread = (view: View2D) => {
    const { xy } = projector(view);
    const tracks: [number, number][][] = [];
    for (const p of poses) {
      const k = skeleton(p);
      const pts = [k.headC, ...[k.Lside, k.Rside].flatMap((s) => [s.elbow, s.hand, s.knee, s.ankle])];
      pts.forEach((v, i) => (tracks[i] ??= []).push(xy(v)));
    }
    let total = 0;
    for (const t of tracks) {
      const mx = t.reduce((a, b) => a + b[0], 0) / t.length;
      const my = t.reduce((a, b) => a + b[1], 0) / t.length;
      total += t.reduce((a, b) => a + (b[0] - mx) ** 2 + (b[1] - my) ** 2, 0) / t.length;
    }
    return total;
  };
  // 瞓地（成個身向前倒）正面睇只見到頭頂，一定用側面
  const lying = poses.reduce((a, p) => a + Math.abs(p.tilt), 0) / poses.length > 0.7;
  if (lying) return 'side';
  // 側面略為優先：多數拉筋前後郁，側面睇身形最清楚
  return spread('front') > spread('side') * 1.15 ? 'front' : 'side';
}

export function buildFigure(p: Pose, intensity: Intensity2D, view: View2D): Shape[] {
  const { xy, depth, toCam } = projector(view);
  const shapes: Shape[] = [];
  const lit = (id: MuscleId) => Math.min(1, intensity[id] ?? 0);
  const { f, pelvis, waist, belly, chest, neckBase, headC, Lside, Rside } = skeleton(p);

  // 邊隻手腳近鏡頭：用髖／膊頭嘅深度比較
  const nearColor = (pt: THREE.Vector3, other: THREE.Vector3) =>
    view === 'side' && depth(pt) < depth(other) - 0.02 ? COLORS.far : COLORS.near;

  // 每段身體：描邊 + 填色，深度用中點
  // d：成條手腳共用一個深度，咁描邊全部喺填色之下，接頭位唔會有線切過
  const limb = (a: THREE.Vector3, b: THREE.Vector3, width: number, color: string, d: number) => {
    shapes.push({ kind: 'line', pts: [xy(a), xy(b)], width: width + 0.022, color: COLORS.outline, depth: d - 1e-4 });
    shapes.push({ kind: 'line', pts: [xy(a), xy(b)], width, color, depth: d });
  };

  // 肌肉貼喺手腳某一面：normal 指住嗰面（本地），t0..t1 係由頭去尾嘅比例
  const limbMuscle = (
    id: MuscleId, a: THREE.Vector3, b: THREE.Vector3, q: THREE.Quaternion,
    localNormal: THREE.Vector3 | null, width: number, d: number, t0 = 0.15, t1 = 0.85,
  ) => {
    const k = lit(id);
    if (k <= 0.02) return;
    let off = V(0, 0, 0);
    let facing = 1;
    if (localNormal) {
      const n = localNormal.clone().applyQuaternion(q);
      facing = n.dot(toCam);
      if (facing < -0.35) return; // 喺背後，睇唔到
      off = n.multiplyScalar(width * 0.28);
    }
    const s = a.clone().lerp(b, t0).add(off);
    const t = a.clone().lerp(b, t1).add(off);
    shapes.push({ kind: 'line', pts: [xy(s), xy(t)], width: width * (localNormal ? 0.55 : 0.75), color: COLORS.muscle, opacity: k * (0.55 + 0.45 * Math.max(0, facing)), depth: d + 2e-4 });
  };

  const torsoMuscle = (id: MuscleId, center: THREE.Vector3, q: THREE.Quaternion, n: THREE.Vector3, hw: number, hh: number, out: number, base: number) => {
    const k = lit(id);
    if (k <= 0.02) return;
    const fc = face(center, q, n, hw, hh, out);
    const facing = fc.normal.dot(toCam);
    if (facing < 0.05) return;
    shapes.push({ kind: 'poly', pts: fc.pts.map(xy), round: 0.03, color: COLORS.muscle, opacity: k * (0.4 + 0.6 * facing), depth: base + 3e-4 });
  };

  // ───── 軀幹（兩截凸包） ─────
  const pelvisBox = box(pelvis, f.hips, 0.15, 0.06, 0.1);
  const waistBox = box(belly, f.spine0, 0.13, 0.03, 0.09);
  const chestBox = box(along(neckBase, f.spine2, V(0, -0.1, 0)), f.spine2, 0.17, 0.08, 0.11);
  const torsoDepth = depth(belly) - 0.005;
  const torsoPart = (pts: THREE.Vector3[], d: number) => {
    const h = hull(pts.map(xy));
    shapes.push({ kind: 'poly', pts: h, round: 0.05, color: COLORS.outline, depth: d - 1e-4 });
    shapes.push({ kind: 'poly', pts: h, round: 0.03, color: COLORS.near, depth: d });
  };
  torsoPart([...pelvisBox, ...waistBox], torsoDepth);
  torsoPart([...waistBox, ...chestBox], torsoDepth + 1e-5);

  // 軀幹肌肉
  const F = V(0, 0, 1), B = V(0, 0, -1);
  const chestC = along(neckBase, f.spine2, V(0, -0.14, 0));
  torsoMuscle('chest', chestC, f.spine2, F, 0.13, 0.06, 0.11, torsoDepth + 1e-5);
  torsoMuscle('abs', along(belly, f.spine0, V(0, -0.02, 0)), f.spine0, F, 0.07, 0.11, 0.095, torsoDepth + 1e-5);
  torsoMuscle('obliques', along(belly, f.spine0, V(0, -0.02, 0)), f.spine0, V(1, 0, 0), 0.07, 0.09, 0.125, torsoDepth + 1e-5);
  torsoMuscle('obliques', along(belly, f.spine0, V(0, -0.02, 0)), f.spine0, V(-1, 0, 0), 0.07, 0.09, 0.125, torsoDepth + 1e-5);
  torsoMuscle('obliques', along(belly, f.spine0, V(0.1, -0.02, 0)), f.spine0, F, 0.03, 0.09, 0.09, torsoDepth + 1e-5);
  torsoMuscle('obliques', along(belly, f.spine0, V(-0.1, -0.02, 0)), f.spine0, F, 0.03, 0.09, 0.09, torsoDepth + 1e-5);
  torsoMuscle('traps', along(neckBase, f.spine2, V(0, -0.06, 0)), f.spine2, B, 0.14, 0.06, 0.1, torsoDepth + 1e-5);
  torsoMuscle('lats', along(chest, f.spine1, V(0, 0, 0)), f.spine1, B, 0.15, 0.09, 0.1, torsoDepth + 1e-5);
  torsoMuscle('erectors', along(waist, f.spine0, V(0, 0.08, 0)), f.spine0, B, 0.05, 0.14, 0.095, torsoDepth + 1e-5);
  torsoMuscle('rotatorCuff', along(neckBase, f.spine2, V(0.1, -0.13, 0)), f.spine2, B, 0.05, 0.05, 0.11, torsoDepth + 2e-5);
  torsoMuscle('rotatorCuff', along(neckBase, f.spine2, V(-0.1, -0.13, 0)), f.spine2, B, 0.05, 0.05, 0.11, torsoDepth + 2e-5);
  torsoMuscle('glutes', along(pelvis, f.hips, V(0, -0.01, 0)), f.hips, B, 0.14, 0.07, 0.1, torsoDepth + 1e-5);
  torsoMuscle('psoas', along(pelvis, f.hips, V(0, 0.02, 0)), f.hips, F, 0.11, 0.05, 0.1, torsoDepth + 1e-5);

  // ───── 頸同頭 ─────
  const neckTop = along(neckBase, f.neck, V(0, NECK + 0.02, 0));
  // 頸同頭用真深度（彎腰時背面睇會被背脊遮住），企直時略為浮喺軀幹上面
  const nd = depth(neckBase.clone().lerp(neckTop, 0.5)) + 0.03;
  limb(neckBase, neckTop, W.neck, COLORS.near, nd);
  limbMuscle('traps', neckBase, neckTop, f.neck, null, W.neck, nd, 0, 1);
  const hd = Math.max(depth(headC) + 0.03, nd + 1e-3);
  shapes.push({ kind: 'circle', c: xy(headC), r: HEAD_R + 0.011, color: COLORS.outline, depth: hd - 1e-4 });
  shapes.push({ kind: 'circle', c: xy(headC), r: HEAD_R, color: COLORS.near, depth: hd });

  // ───── 手腳 ─────
  for (const [S, O, L] of [[Lside, Rside, true], [Rside, Lside, false]] as const) {
    const armC = view === 'front' || view === 'back' ? COLORS.near : nearColor(S.shoulder, O.shoulder);
    const legC = view === 'front' || view === 'back' ? COLORS.near : nearColor(S.hip, O.hip);
    const arm = L ? f.lArm : f.rArm, fore = L ? f.lFore : f.rFore;
    const thigh = L ? f.lThigh : f.rThigh, shin = L ? f.lShin : f.rShin, foot = L ? f.lFoot : f.rFoot;

    const ad = (depth(S.shoulder) + depth(S.elbow) + depth(S.wrist)) / 3;
    limb(S.shoulder, S.elbow, W.upperArm, armC, ad);
    limb(S.elbow, S.wrist, W.forearm, armC, ad);
    limb(S.wrist, S.hand, W.hand + 0.02, armC, ad);
    limbMuscle('shoulders', S.shoulder, S.elbow, arm, null, W.upperArm, ad, 0, 0.32);
    limbMuscle('biceps', S.shoulder, S.elbow, arm, F, W.upperArm, ad, 0.3, 0.9);
    limbMuscle('triceps', S.shoulder, S.elbow, arm, B, W.upperArm, ad, 0.25, 0.9);

    const ld = (depth(S.hip) + depth(S.knee) + depth(S.ankle)) / 3;
    limb(S.hip, S.knee, W.thigh, legC, ld);
    limb(S.knee, S.ankle, W.shin, legC, ld);
    limb(S.heel, S.ball, W.foot, legC, ld);
    limb(S.ball, S.toe, W.foot * 0.85, legC, ld);
    limbMuscle('quads', S.hip, S.knee, thigh, F, W.thigh, ld, 0.12, 0.88);
    limbMuscle('hamstrings', S.hip, S.knee, thigh, B, W.thigh, ld, 0.15, 0.9);
    limbMuscle('calves', S.knee, S.ankle, shin, B, W.shin, ld, 0.1, 0.6);
    limbMuscle('feet', S.heel, S.ball, foot, null, W.foot, ld, 0.1, 0.9);
    limbMuscle('psoas', S.hip, S.knee, thigh, F, W.thigh, ld, 0, 0.18);
  }

  // 遠嘅先畫
  return shapes.sort((a, b) => a.depth - b.depth);
}

// 地面陰影：跟盤骨橫移
export function floorShadow(p: Pose, view: View2D): { cx: number; rx: number } {
  const x = view === 'side' ? 0 : view === 'front' ? p.shift : -p.shift;
  return { cx: x, rx: view === 'side' ? 0.45 : 0.35 };
}

// 畫面範圍（米）：x 左右 1.2，y 由頭頂 2.05 去地下 0.12
export const VIEWBOX = { x: -1.2, y: -2.05, w: 2.4, h: 2.2 };
