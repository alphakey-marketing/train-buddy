// 處方引擎：由偏緊程度、揀咗邊個位、喺邊度做、有幾耐，揀一套拉筋。
// 每週時間只作習慣提示，唔代表療效門檻。
import { EXERCISES, Exercise } from '../data/exercises';
import { Area } from '../data/types';
import { Tightness } from './bodyTest';
import { Session, sessions } from './history';
import { cycleLength } from './motion';

export type RoutineItem = { exercise: Exercise; seconds: number };
export type Setting = 'office' | 'home';
export type Plan = { areas: Area[]; setting: Setting; minutes: number; equipment?: string[]; seatedOnly?: boolean }; // areas 空 = 跟測試結果

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
      if (!e || e.kind !== '伸展' || !e.hold) continue;
      for (const a of e.areas) out[a] += e.hold!.seconds * e.hold!.sides / 60 / e.areas.length;
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

export function prescribe(t: Tightness, plan: Plan, list: Session[] = sessions(), exclude: (e: Exercise) => boolean = () => false): RoutineItem[] {
  const pool = EXERCISES.filter(e => ['伸展', '放鬆', '活化'].includes(e.kind) && e.level <= 2 && !exclude(e) && available(e, plan));
  const week = weekMinutes(list);
  const last = new Set(list.length ? list[list.length - 1].ids : []);
  const ranked = pool.filter(e => e.kind === '伸展').sort((a,b) => score(b,t,plan,week,last)-score(a,t,plan,week,last));
  const ending = pool.find(e => e.id === 'natural-breath');
  const chosen: Exercise[] = [];
  const fits = (e: Exercise) => routineSeconds([...chosen, e, ...(ending ? [ending] : [])].map(exercise => ({exercise,seconds: secondsOf(exercise)}))) <= plan.minutes * 60;
  const warm = pool.find(e => e.id === 'shoulder-roll') ?? pool.find(e => e.kind === '活化' && !e.hold);
  if (warm && plan.minutes >= 3 && fits(warm)) chosen.push(warm);
  for (const e of ranked) {
    if (chosen.filter(x => x.kind === '伸展').length >= 4) break;
    const primary = e.muscles.filter(m => m.weight >= 1).map(m => m.id);
    if (chosen.some(x => x.muscles.some(m => m.weight >= 1 && primary.includes(m.id)))) continue;
    if (plan.areas.length && !e.areas.some(a => plan.areas.includes(a))) continue;
    if (fits(e)) chosen.push(e);
  }
  if (ending) chosen.push(ending);
  return chosen.map(exercise => ({ exercise, seconds: secondsOf(exercise) }));
}
export function available(e: Exercise, plan: Plan): boolean {
  return (plan.setting === 'home' || (e.desk && !e.floor))
    && (!plan.seatedOnly || e.prop?.kind === 'chair')
    && (!e.prop || !plan.equipment || plan.equipment.includes(e.prop.kind));
}
export function readySeconds(prev: Exercise | undefined, cur: Exercise): number {
  return !prev ? 6 : prev.floor !== cur.floor || prev.prop?.kind !== cur.prop?.kind ? 10 : 5;
}
export const routineSeconds = (r: RoutineItem[]) => r.reduce((s,i,n) => s + i.seconds + readySeconds(r[n-1]?.exercise,i.exercise),0);
