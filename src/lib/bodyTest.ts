// 身體測試：由用家揀嘅結果，計每組肌肉有幾「偏緊」（0..1）。
// 呢個係粗略參考，唔係診斷。
import { Area } from '../data/types';
import { MuscleId, MUSCLES } from '../data/muscles';

export type Tightness = Partial<Record<MuscleId, number>>;

export const AREAS: { id: Area; label: string; emoji: string }[] = [
  { id: 'neck', label: '頸膊', emoji: '🧣' },
  { id: 'upper-back', label: '上背', emoji: '🪑' },
  { id: 'lower-back', label: '腰', emoji: '🦴' },
  { id: 'hips-legs', label: '臀同大髀', emoji: '🦵' },
  { id: 'wrist', label: '手腕手臂', emoji: '🖐️' },
];

export type TestStep = {
  id: string;
  title: string;
  how: string;
  options: string[]; // 順序 = 愈嚟愈緊（分數 0,1,2）
  muscles: { id: MuscleId; weight: number }[];
};

export const TESTS: TestStep[] = [
  {
    id: 'chin',
    title: '低頭測試',
    how: '企直或者坐直，慢慢低頭，下巴向心口靠近。',
    options: ['下巴可以掂到心口', '差一兩隻手指', '差好遠，頸後面好緊'],
    muscles: [{ id: 'traps', weight: 1 }, { id: 'shoulders', weight: 0.3 }],
  },
  {
    id: 'overhead',
    title: '舉手測試',
    how: '背貼牆企好，雙手慢慢舉高，睇下手臂可唔可以貼住耳仔。',
    options: ['雙臂貼住耳仔，腰冇離牆', '手臂略為離開耳仔', '舉唔高，或者腰要反起身'],
    muscles: [{ id: 'chest', weight: 1 }, { id: 'lats', weight: 1 }, { id: 'shoulders', weight: 0.6 }],
  },
  {
    id: 'bend',
    title: '前彎測試',
    how: '雙腳併攏，膝頭放鬆唔使鎖死，慢慢彎腰向地。如果痛，請停止並跳過呢題。',
    options: ['手掌可以貼地', '摸到腳趾', '只到膝頭附近'],
    muscles: [{ id: 'hamstrings', weight: 1 }, { id: 'erectors', weight: 0.6 }, { id: 'calves', weight: 0.5 }],
  },
  {
    id: 'squat',
    title: '深蹲測試',
    how: '雙腳與肩同闊，慢慢蹲低，睇下腳踭有冇離地。',
    options: ['蹲到底，腳踭貼地', '腳踭離地或者要向後倒', '蹲唔低，髖位好緊'],
    muscles: [{ id: 'psoas', weight: 0.8 }, { id: 'calves', weight: 0.7 }, { id: 'glutes', weight: 0.5 }, { id: 'feet', weight: 0.3 }],
  },
  {
    id: 'wrist',
    title: '合掌測試',
    how: '胸前合掌（似祈禱），手掌貼實，慢慢將手腕向下移，前臂盡量打平。',
    options: ['前臂打得平，手掌仲貼住', '前臂斜少少先貼得住', '好快就要分開手掌'],
    muscles: [{ id: 'forearms', weight: 1 }],
  },
];

// 邊個位痛，對應嘅肌肉會加分
export type Answers = Record<string, number>; // 0..2；-1 表示測試時有痛

const TEST_AREAS: Record<string, Area[]> = {
  chin: ['neck'], overhead: ['neck', 'upper-back'], bend: ['lower-back', 'hips-legs'],
  squat: ['hips-legs'], wrist: ['wrist'],
};
export function avoidedAreas(answers: Answers): Area[] {
  return [...new Set(Object.keys(answers).filter((id) => answers[id] === -1).flatMap((id) => TEST_AREAS[id] ?? []))];
}

export function computeTightness(answers: Answers, pain?: Area): Tightness {
  const out: Tightness = {};
  const bump = (id: MuscleId, v: number) => {
    out[id] = Math.min(1, (out[id] ?? 0) + v);
  };
  for (const t of TESTS) {
    if (answers[t.id] === undefined || answers[t.id] < 0) continue;
    const score = answers[t.id] / 2;
    for (const m of t.muscles) bump(m.id, Math.min(1, score * m.weight));
  }
  // 痛位只用作選擇意向，唔推斷肌肉緊度。
  // 最少留一點底光，睇到全身；最緊嗰幾組會明顯啲
  return out;
}

export function tightList(t: Tightness, n = 3): { id: MuscleId; name: string; value: number }[] {
  return (Object.entries(t) as [MuscleId, number][])
    .filter(([, v]) => v >= 0.25)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, value]) => ({ id, name: MUSCLES[id].plain, value }));
}

export function mapSummary(t: Tightness): string {
  const top = tightList(t);
  if (top.length === 0) return '資料不足以估計活動情況。測試結果只作參考，唔係診斷。';
  const names = top.map((x) => x.name).join('、');
  return `按你嘅回答，${names}附近可能值得留意。呢個只係粗略參考，唔係肌肉測量或者診斷。`;
}
