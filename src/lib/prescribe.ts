// 處方引擎：由偏緊程度同痛位，揀一套約 5 分鐘嘅練習。
import { EXERCISES, Exercise } from '../data/exercises';
import { Area } from '../data/types';
import { Tightness } from './bodyTest';

export type RoutineItem = { exercise: Exercise; seconds: number };

const SECONDS = 55;
const COUNT = 5;

function score(e: Exercise, t: Tightness, pain: Area): number {
  const total = e.muscles.reduce((s, m) => s + m.weight, 0) || 1;
  const hit = e.muscles.reduce((s, m) => s + m.weight * (t[m.id] ?? 0), 0) / total;
  let v = hit * 2;
  if (e.areas.includes(pain)) v += 0.6;
  if (e.kind === '伸展' || e.kind === '放鬆') v += 0.3;
  if (e.kind === '爆發') v -= 2;
  return v;
}

// 第一次用：企起身或者坐椅都做到，唔使瞓地，入門／初級。
export function prescribe(t: Tightness, pain: Area, opts: { desk?: boolean } = {}): RoutineItem[] {
  const desk = opts.desk ?? true;
  const pool = EXERCISES.filter((e) => e.level <= 2 && !e.floor && (!desk || e.desk));
  const chosen: Exercise[] = [];
  const used = new Set<string>(); // 已經練過嘅主力肌肉
  while (chosen.length < COUNT && pool.length) {
    let best: Exercise | null = null;
    let bestScore = -Infinity;
    for (const e of pool) {
      if (chosen.includes(e)) continue;
      const mainMuscle = [...e.muscles].sort((a, b) => b.weight - a.weight)[0].id;
      // 同組肌肉扣分，避免成套都係同一個位
      const s = score(e, t, pain) - (used.has(mainMuscle) ? 0.5 : 0);
      if (s > bestScore) {
        bestScore = s;
        best = e;
      }
    }
    if (!best) break;
    chosen.push(best);
    used.add([...best.muscles].sort((a, b) => b.weight - a.weight)[0].id);
  }
  // 放鬆類放最後，由拉筋開始
  chosen.sort((a, b) => Number(a.kind === '放鬆') - Number(b.kind === '放鬆'));
  return chosen.map((exercise) => ({ exercise, seconds: SECONDS }));
}

export const routineSeconds = (r: RoutineItem[]) => r.reduce((s, i) => s + i.seconds, 0);
