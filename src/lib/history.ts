// 練習紀錄：做前做後打分、連續日數
import { load, save } from './storage';

export type Session = { at: number; ids: string[]; before: number; after: number };

const key = 'sessions';
export const sessions = () => load<Session[]>(key, []);
export const addSession = (s: Session) => save(key, [...sessions(), s].slice(-300));

const dayOf = (t: number) => {
  const d = new Date(t);
  return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000);
};

// 連續日數：由今日（或者尋日）向前數，每日最少練一次
export function streak(list: Session[] = sessions(), now = Date.now()): number {
  const days = new Set(list.map((x) => dayOf(x.at)));
  let d = dayOf(now);
  if (!days.has(d)) d -= 1;
  let n = 0;
  while (days.has(d)) {
    n++;
    d--;
  }
  return n;
}

// 每星期目標日數（研究：每星期 5 日或以上效果好）
export const WEEK_GOAL = 5;

// 今個星期（一至日）每日有冇練：[一, 二, ..., 日]
export function weekDays(list: Session[] = sessions(), now = Date.now()): boolean[] {
  const days = new Set(list.map((x) => dayOf(x.at)));
  const today = dayOf(now);
  const monday = today - ((new Date(now).getDay() + 6) % 7);
  return Array.from({ length: 7 }, (_, i) => days.has(monday + i));
}
