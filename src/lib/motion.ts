// 由動作嘅關鍵格，計某一秒嘅姿勢、用力程度同提示。3D 同 2D 共用。
import { Exercise, fullPose, repLength } from '../data/exercises';
import { MuscleId } from '../data/muscles';
import { bestView } from './figure2d';
import { blendPose, Pose } from './pose';

export type Sample = { pose: Pose; effort: number; cue: string; intensity: Partial<Record<MuscleId, number>> };

export function sampleExercise(ex: Exercise, time: number): Sample {
  const len = repLength(ex);
  const t = len > 0 ? ((time % len) + len) % len : 0;
  const kf = ex.keyframes;
  let i = 0;
  while (i < kf.length - 2 && t >= kf[i + 1].at) i++;
  const a = kf[i];
  const b = kf[i + 1] ?? a;
  const k = Math.min(1, Math.max(0, (t - a.at) / Math.max(0.0001, b.at - a.at)));
  const effort = a.effort + (b.effort - a.effort) * k;
  const intensity: Sample['intensity'] = {};
  for (const m of ex.muscles) intensity[m.id] = m.weight * (0.25 + 0.75 * effort);
  // 提示用緊嚟嗰格（即係郁緊去邊）
  return { pose: blendPose(fullPose(a.pose), fullPose(b.pose), k), effort, cue: b.cue, intensity };
}

// 每個動作最好用邊個角度睇（2D）
const viewCache = new Map<string, 'front' | 'side'>();
export function viewFor(ex: Exercise): 'front' | 'side' {
  let v = viewCache.get(ex.id);
  if (!v) {
    const len = repLength(ex);
    const poses = Array.from({ length: 12 }, (_, i) => sampleExercise(ex, (len * i) / 12).pose);
    v = bestView(poses);
    viewCache.set(ex.id, v);
  }
  return v;
}
