// 處方引擎：由偏緊程度、揀咗邊個位、喺邊度做、有幾耐，揀一套拉筋。
// 規則：靜態拉筋每個位置每星期累積約 5 分鐘（分幾日做）先有穩定效果，所以未夠嘅位置優先。
import { EXERCISES, Exercise } from '../data/exercises';
import { Area } from '../data/types';
import { Tightness } from './bodyTest';
import { Session, sessions } from './history';
import { cycleLength } from './motion';

export type RoutineItem = { exercise: Exercise; seconds: number };
export type Setting = 'office' | 'home';
export type Plan = { areas: Area[]; setting: Setting; minutes: number }; // areas 空 = 跟測試結果

export const DEFAULT_PLAN: Plan = { areas: [], setting: 'office', minutes: 5 };
export const WEEK_TARGET_MIN = 5;

const LOOP_SECONDS = 40; // 循環動作（唔係靜態拉筋）做幾耐
export const secondsOf = (e: Exercise) => (e.hold ? cycleLength(e) : LOOP_SECONDS);

// 今個星期（一至日）每個位置拉咗幾多分鐘
export function weekMinutes(list: Session[], now = Date.now()): Record<Area, number> {
  const d = new Date(now);
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7)).getTime();
  const out: Record<Area, number> = { neck: 0, 'upper-back': 0, 'lower-back': 0, 'hips-legs': 0, wrist: 0 };
  for (const s of list) {
    if (s.at < monday) continue;
    for (const id of s.ids) {
      const e = EXERCISES.find((x) => x.id === id);
      if (!e || (e.kind !== '伸展' && !e.hold)) continue;
      for (const a of e.areas) out[a] += secondsOf(e) / 60;
    }
  }
  return out;
}

function score(e: Exercise, t: Tightness, plan: Plan, week: Record<Area, number>, last: Set<string>): number {
  const total = e.muscles.reduce((s, m) => s + m.weight, 0) || 1;
  const hit = e.muscles.reduce((s, m) => s + m.weight * (t[m.id] ?? 0), 0) / total;
  let v = hit * 2;
  if (plan.areas.length) v += e.areas.some((a) => plan.areas.includes(a)) ? 1.2 : -1.5;
  const want = plan.areas.length ? plan.areas : (Object.keys(week) as Area[]);
  const gap = Math.max(...e.areas.filter((a) => want.includes(a)).map((a) => Math.max(0, WEEK_TARGET_MIN - week[a]) / WEEK_TARGET_MIN), 0);
  v += gap * 0.8;
  if (e.hold) v += 0.4; // 靜態拉筋優先
  if (e.kind === '放鬆') v -= 0.8;
  if (e.kind === '活化') v -= 0.3;
  if (last.has(e.id)) v -= 0.7; // 同上次唔同，唔悶
  return v;
}

export function prescribe(t: Tightness, plan: Plan, list: Session[] = sessions()): RoutineItem[] {
  const pool = EXERCISES.filter(
    (e) => (e.kind === '伸展' || e.kind === '放鬆' || e.kind === '活化') && e.level <= 2 && (plan.setting === 'home' || (e.desk && !e.floor)),
  );
  const week = weekMinutes(list);
  const last = new Set(list.length ? list[list.length - 1].ids : []);
  const byScore = (a: Exercise, b: Exercise) => score(b, t, plan, week, last) - score(a, t, plan, week, last);
  const ranked = pool.filter((e) => e.kind === '伸展').sort(byScore);
  const budget = plan.minutes * 60;
  const chosen: Exercise[] = [];
  let used = 0;
  // 先由一個慢慢郁嘅活動開始（暖身，亦都係研究建議：拉筋要配主動活動）
  const warm = pool.filter((e) => e.kind === '活化' && !e.hold).sort(byScore)[0];
  if (warm && budget >= 180) {
    chosen.push(warm);
    used += secondsOf(warm);
  }
  for (const e of ranked) {
    const len = secondsOf(e);
    if (used + len > budget * 1.1) continue;
    chosen.push(e);
    used += len;
  }
  // 時間有剩，尾段加一個放鬆
  for (const e of pool.filter((x) => x.kind === '放鬆').sort(byScore)) {
    if (used + secondsOf(e) <= budget * 1.1 && budget - used > 20) {
      chosen.push(e);
      break;
    }
  }
  if (!chosen.length && ranked.length) chosen.push(ranked[0]);
  return chosen.map((exercise) => ({ exercise, seconds: secondsOf(exercise) }));
}

export const routineSeconds = (r: RoutineItem[]) => r.reduce((s, i) => s + i.seconds, 0);
