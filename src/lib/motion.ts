// 由動作資料，計某一秒嘅姿勢、用力程度同提示。
// 兩種動作：循環（keyframes 不停重複）同靜態拉筋（入位 → 停住 → 放返 → 換邊）。
import { Exercise, fullPose, repLength } from '../data/exercises';
import { MuscleId } from '../data/muscles';
import { blendPose, mirrorPose, Pose } from './pose';
import { mirrorReach, Reach } from './retarget';

export const MOVE_IN = 3; // 入位秒數
export const MOVE_OUT = 2; // 放返秒數
export const DEMO_HOLD = 5; // 動作庫示範時停幾耐

export type Phase = 'loop' | 'in' | 'hold' | 'out';
export type Sample = {
  pose: Pose;
  effort: number;
  cue: string;
  intensity: Partial<Record<MuscleId, number>>;
  reach?: Reach;
  reachW: number; // 0..1 手腳貼目標嘅程度
  phase: Phase;
  side: 0 | 1;
  left: number; // 停住仲剩幾多秒（唔係停住階段 = 成段停留秒數）
};

// 一個完整循環幾長（拉筋：兩邊都做晒）
export function cycleLength(ex: Exercise, hold?: number): number {
  if (!ex.hold) return repLength(ex);
  return ex.hold.sides * (MOVE_IN + (hold ?? ex.hold.seconds) + MOVE_OUT);
}

const smooth = (t: number) => t * t * (3 - 2 * t);

// 換邊：字入面「左」「右」對調（公仔已經鏡像，字都要跟）。「左右」呢個詞唔郁
export function swapSides(text: string): string {
  return text.replace(/左右|左|右/g, (m) => (m === '左右' ? m : m === '左' ? '右' : '左'));
}
const glowOf = (ex: Exercise, effort: number) => {
  const intensity: Sample['intensity'] = {};
  for (const m of ex.muscles) intensity[m.id] = m.weight * (0.25 + 0.75 * effort);
  return intensity;
};

function sampleHold(ex: Exercise, time: number, holdSec?: number): Sample {
  const h = ex.hold!;
  const hold = holdSec ?? h.seconds;
  const per = MOVE_IN + hold + MOVE_OUT;
  const len = per * h.sides;
  const t = ((time % len) + len) % len;
  const side = (Math.min(h.sides - 1, Math.floor(t / per)) as 0 | 1);
  const u = t - side * per;
  const base = fullPose(h.base);
  const target = fullPose({ ...h.base, ...h.pose });
  let pose: Pose;
  let w: number;
  let phase: Phase;
  let cue: string;
  let left = hold;
  if (u < MOVE_IN) {
    const k = u / MOVE_IN;
    pose = blendPose(base, target, k);
    w = smooth(k);
    phase = 'in';
    cue = side ? `換另一邊。${swapSides(h.enter)}` : h.enter;
  } else if (u < MOVE_IN + hold) {
    const v = u - MOVE_IN;
    // 停住時輕輕呼吸，唔好似石像
    const breath = Math.sin((v / 5) * Math.PI * 2);
    pose = { ...target, spine: [target.spine[0] - 0.012 * breath, target.spine[1], target.spine[2]], lShrug: target.lShrug + 0.02 * breath, rShrug: target.rShrug + 0.02 * breath };
    w = 1;
    phase = 'hold';
    left = hold - v;
    const c = h.cues[Math.min(h.cues.length - 1, Math.floor((v / hold) * h.cues.length))] ?? '';
    cue = side ? swapSides(c) : c;
  } else {
    const k = (u - MOVE_IN - hold) / MOVE_OUT;
    pose = blendPose(target, base, k);
    w = 1 - smooth(k);
    phase = 'out';
    cue = '慢慢放返鬆';
    left = 0;
  }
  const reach = side ? mirrorReach(h.reach) : h.reach;
  return { pose: side ? mirrorPose(pose) : pose, effort: w, cue, intensity: glowOf(ex, w), reach, reachW: w, phase, side, left };
}

export function sampleExercise(ex: Exercise, time: number, hold?: number): Sample {
  if (ex.hold) return sampleHold(ex, time, hold);
  const len = repLength(ex);
  const t = len > 0 ? ((time % len) + len) % len : 0;
  const kf = ex.keyframes;
  let i = 0;
  while (i < kf.length - 2 && t >= kf[i + 1].at) i++;
  const a = kf[i];
  const b = kf[i + 1] ?? a;
  const k = Math.min(1, Math.max(0, (t - a.at) / Math.max(0.0001, b.at - a.at)));
  const effort = a.effort + (b.effort - a.effort) * k;
  // 提示用緊嚟嗰格（即係郁緊去邊）
  return {
    pose: blendPose(fullPose(a.pose), fullPose(b.pose), k),
    effort,
    cue: b.cue,
    intensity: glowOf(ex, effort),
    reach: ex.reach,
    reachW: ex.reach ? 1 : 0,
    phase: 'loop',
    side: 0,
    left: 0,
  };
}
