// 課程：7 日固定順序，每日約 5 分鐘。快練：單次固定順序。
import { Tightness } from '../lib/bodyTest';
import { load, save } from '../lib/storage';
import { MuscleId } from './muscles';
import { Area } from './types';

export type Program = {
  id: string;
  name: string;
  emoji: string;
  area: Area;
  setting: 'office' | 'home';
  blurb: string;
  focus: MuscleId[]; // 推薦用：呢啲肌肉越緊越推
  days: { title: string; ids: string[] }[]; // 7 日
};

export type Quick = { id: string; name: string; emoji: string; blurb: string; ids: string[] };

export const PROGRAMS: Program[] = [
  {
    id: 'neck-shoulder', name: '頸肩鬆一鬆', emoji: '🧣', area: 'neck', setting: 'office',
    blurb: '對住電腦成日，頸同膊頭好硬？坐喺度就做得。',
    focus: ['neck', 'traps', 'shoulders', 'chest'],
    days: [
      { title: '認識頸側', ids: ['upper-trap-stretch', 'levator-stretch', 'slow-breath'] },
      { title: '加膊頭', ids: ['upper-trap-stretch', 'cross-body-shoulder', 'levator-stretch', 'slow-breath'] },
      { title: '打開胸口', ids: ['doorway-pec', 'upper-trap-stretch', 'cross-body-shoulder', 'slow-breath'] },
      { title: '挺直背脊', ids: ['seated-thoracic-ext', 'doorway-pec', 'levator-stretch', 'slow-breath'] },
      { title: '頸肩全套', ids: ['upper-trap-stretch', 'levator-stretch', 'cross-body-shoulder', 'doorway-pec'] },
      { title: '胸椎加強', ids: ['seated-thoracic-ext', 'doorway-pec', 'upper-trap-stretch', 'slow-breath'] },
      { title: '總複習', ids: ['upper-trap-stretch', 'levator-stretch', 'cross-body-shoulder', 'doorway-pec', 'slow-breath'] },
    ],
  },
  {
    id: 'lower-back', name: '下背唔再緊', emoji: '🪑', area: 'lower-back', setting: 'home',
    blurb: '坐耐腰酸？髖同大腿後側鬆咗，腰就輕鬆。要瞓地。',
    focus: ['erectors', 'glutes', 'hamstrings', 'psoas'],
    days: [
      { title: '嬰兒式入門', ids: ['child-pose', 'supine-figure4', 'slow-breath'] },
      { title: '加大腿後側', ids: ['hamstring-chair', 'child-pose', 'supine-figure4', 'slow-breath'] },
      { title: '扭腰', ids: ['seated-twist', 'supine-figure4', 'child-pose', 'slow-breath'] },
      { title: '髖前側', ids: ['low-lunge', 'supine-figure4', 'child-pose', 'slow-breath'] },
      { title: '腰髖全套', ids: ['low-lunge', 'supine-figure4', 'hamstring-chair', 'child-pose'] },
      { title: '背脊活動', ids: ['seated-thoracic-ext', 'seated-twist', 'child-pose', 'slow-breath'] },
      { title: '總複習', ids: ['low-lunge', 'supine-figure4', 'hamstring-chair', 'seated-twist', 'slow-breath'] },
    ],
  },
  {
    id: 'wrist', name: '滑鼠手救援', emoji: '🖱️', area: 'wrist', setting: 'office',
    blurb: '打字、揸滑鼠成日？前臂同手腕拉一拉，順便鬆膊頭。',
    focus: ['forearms', 'shoulders', 'neck'],
    days: [
      { title: '手腕內側', ids: ['wrist-flexor-stretch', 'cross-body-shoulder', 'slow-breath'] },
      { title: '手腕外側', ids: ['wrist-extensor-stretch', 'wrist-flexor-stretch', 'slow-breath'] },
      { title: '手腕加膊頭', ids: ['wrist-flexor-stretch', 'wrist-extensor-stretch', 'cross-body-shoulder', 'slow-breath'] },
      { title: '加頸側', ids: ['wrist-flexor-stretch', 'wrist-extensor-stretch', 'upper-trap-stretch', 'slow-breath'] },
      { title: '手頸膊全套', ids: ['wrist-flexor-stretch', 'wrist-extensor-stretch', 'cross-body-shoulder', 'upper-trap-stretch'] },
      { title: '打開胸口', ids: ['wrist-flexor-stretch', 'wrist-extensor-stretch', 'doorway-pec', 'slow-breath'] },
      { title: '總複習', ids: ['wrist-flexor-stretch', 'wrist-extensor-stretch', 'cross-body-shoulder', 'upper-trap-stretch', 'slow-breath'] },
    ],
  },
  {
    id: 'hips-legs', name: '髖腿鬆開', emoji: '🦵', area: 'hips-legs', setting: 'home',
    blurb: '坐耐腳緊、行路僵？髖、大腿、小腿一齊拉。要瞓地。',
    focus: ['psoas', 'quads', 'hamstrings', 'calves', 'glutes'],
    days: [
      { title: '小腿大腿後側', ids: ['wall-calf-stretch', 'hamstring-chair', 'slow-breath'] },
      { title: '加大腿前側', ids: ['standing-quad', 'wall-calf-stretch', 'hamstring-chair', 'slow-breath'] },
      { title: '臀部', ids: ['supine-figure4', 'hamstring-chair', 'wall-calf-stretch', 'slow-breath'] },
      { title: '髖前側', ids: ['low-lunge', 'standing-quad', 'supine-figure4', 'slow-breath'] },
      { title: '髖腿全套', ids: ['low-lunge', 'standing-quad', 'hamstring-chair', 'wall-calf-stretch'] },
      { title: '加臀同腰', ids: ['supine-figure4', 'low-lunge', 'child-pose', 'slow-breath'] },
      { title: '總複習', ids: ['low-lunge', 'standing-quad', 'hamstring-chair', 'supine-figure4', 'wall-calf-stretch'] },
    ],
  },
];

export const QUICKS: Quick[] = [
  { id: 'office-reset', name: '寫字樓重設', emoji: '🏢', blurb: '頸 → 膊 → 胸 → 手腕 → 扭腰', ids: ['upper-trap-stretch', 'cross-body-shoulder', 'doorway-pec', 'wrist-flexor-stretch', 'seated-twist'] },
  { id: 'lunch-2', name: '午休 2 分鐘', emoji: '🔄', blurb: '頸側 + 手腕', ids: ['upper-trap-stretch', 'wrist-extensor-stretch'] },
  { id: 'home-relax', name: '屋企放鬆', emoji: '🏠', blurb: '髖 → 腿 → 腰 → 呼吸', ids: ['low-lunge', 'hamstring-chair', 'supine-figure4', 'child-pose', 'slow-breath'] },
  { id: 'bedtime', name: '睡前', emoji: '🌙', blurb: '嬰兒式、拉臀、慢呼吸', ids: ['child-pose', 'supine-figure4', 'slow-breath'] },
];

// 推薦：邊個課程對應嘅肌肉最緊
export function recommend(t: Tightness): Program {
  const sc = (p: Program) => p.focus.reduce((s, m) => s + (t[m] ?? 0), 0) / p.focus.length;
  return [...PROGRAMS].sort((a, b) => sc(b) - sc(a))[0];
}

// 進度：start = 開始時間，done = 已完成嘅日（0 起）
export type Progress = Record<string, { start: number; done: number[] }>;
export const progress = () => load<Progress>('programs', {});
export function markDone(programId: string, day: number) {
  const all = progress();
  const p = all[programId] ?? { start: Date.now(), done: [] };
  if (!p.done.includes(day)) p.done = [...p.done, day];
  save('programs', { ...all, [programId]: p });
}
export function resetProgram(programId: string) {
  const { [programId]: _, ...rest } = progress();
  save('programs', rest);
}
// 下一個未做嘅日（0–6），全做晒返回 7
export const nextDay = (programId: string) => {
  const done = progress()[programId]?.done ?? [];
  for (let i = 0; i < 7; i++) if (!done.includes(i)) return i;
  return 7;
};
