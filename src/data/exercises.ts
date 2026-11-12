import { NEUTRAL, Pose } from '../lib/pose';
import { Exercise, Motion, P } from './types';
import { COPY } from './copy';
import { ENTRY } from './library/entry';
import { ADVANCED } from './library/advanced';
import { STRETCH } from './library/stretch';
import { ACTIVE } from './library/active';

export type { Exercise, Keyframe, ExerciseKind, Area, Level } from './types';

const squatDown = P({
  spine: [0.45, 0, 0],
  lHip: [-1.45, 0, 0.12],
  rHip: [-1.45, 0, -0.12],
  lKnee: 1.75,
  rKnee: 1.75,
  lShoulder: [-1.5, 0, 0.1],
  rShoulder: [-1.5, 0, -0.1],
  lElbow: [0, 0, 0],
  rElbow: [0, 0, 0],
});

const BASIC: Motion[] = [
  {
    id: 'squat',
    muscles: [
      { id: 'quads', weight: 1 },
      { id: 'glutes', weight: 1 },
      { id: 'hamstrings', weight: 0.5 },
      { id: 'erectors', weight: 0.5 },
      { id: 'calves', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.2, cue: '雙腳打開與肩同寬' },
      { at: 1.6, pose: squatDown, effort: 0.7, cue: '慢慢向下蹲，膝頭對住腳尖' },
      { at: 2.2, pose: squatDown, effort: 1, cue: '停一停，背部保持挺直' },
      { at: 3.4, pose: {}, effort: 0.6, cue: '腳跟發力企返起身' },
    ],
  },
  {
    id: 'side-reach',
    muscles: [
      { id: 'obliques', weight: 1 },
      { id: 'lats', weight: 1 },
      { id: 'shoulders', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企直，深呼吸' },
      {
        at: 1.2,
        pose: { lShoulder: [0, 0, 2.9], rShoulder: [0, 0, -2.9], lElbow: [0, 0, 0], rElbow: [0, 0, 0] },
        effort: 0.3,
        cue: '雙手舉高過頭',
      },
      {
        at: 2.6,
        pose: { spine: [0, 0, 0.4], lShoulder: [0, 0, 2.9], rShoulder: [0, 0, -2.6], lElbow: [0, 0, 0], rElbow: [0, 0, 0] },
        effort: 1,
        cue: '向右邊彎，感受左邊腰側拉長',
      },
      {
        at: 4.2,
        pose: { spine: [0, 0, -0.4], lShoulder: [0, 0, 2.6], rShoulder: [0, 0, -2.9], lElbow: [0, 0, 0], rElbow: [0, 0, 0] },
        effort: 1,
        cue: '換邊，向左邊彎',
      },
      {
        at: 5.4,
        pose: { lShoulder: [0, 0, 2.9], rShoulder: [0, 0, -2.9], lElbow: [0, 0, 0], rElbow: [0, 0, 0] },
        effort: 0.3,
        cue: '返回中間',
      },
      { at: 6.4, pose: {}, effort: 0.1, cue: '放低雙手' },
    ],
  },
  {
    id: 'toe-touch',
    muscles: [
      { id: 'hamstrings', weight: 1 },
      { id: 'erectors', weight: 0.7 },
      { id: 'calves', weight: 0.5 },
      { id: 'glutes', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企直，膝頭微曲' },
      {
        at: 2,
        pose: { spine: [1.35, 0, 0], neck: [0.3, 0, 0], lShoulder: [-1.4, 0, 0.05], rShoulder: [-1.4, 0, -0.05], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lKnee: 0.1, rKnee: 0.1 },
        effort: 1,
        cue: '由腰慢慢向前彎，手向地下伸',
      },
      {
        at: 3.5,
        pose: { spine: [1.4, 0, 0], neck: [0.3, 0, 0], lShoulder: [-1.4, 0, 0.05], rShoulder: [-1.4, 0, -0.05], lElbow: [0, 0, 0], rElbow: [0, 0, 0], lKnee: 0.1, rKnee: 0.1 },
        effort: 1,
        cue: '停留，感受大腿後側拉長',
      },
      { at: 5.5, pose: {}, effort: 0.2, cue: '一節一節脊骨捲返上嚟' },
    ],
  },
  {
    id: 'shoulder-press',
    muscles: [
      { id: 'shoulders', weight: 1 },
      { id: 'triceps', weight: 0.8 },
      { id: 'traps', weight: 0.6 },
      { id: 'abs', weight: 0.3 },
    ],
    keyframes: [
      {
        at: 0,
        pose: { lShoulder: [0, 0, 1.4], rShoulder: [0, 0, -1.4], lElbow: [0, 0, 1.6], rElbow: [0, 0, -1.6] },
        effort: 0.3,
        cue: '手肘屈90度，拳頭向上',
      },
      {
        at: 1.2,
        pose: { lShoulder: [0, 0, 2.85], rShoulder: [0, 0, -2.85], lElbow: [0, 0, 0.05], rElbow: [0, 0, -0.05] },
        effort: 1,
        cue: '向上推，手臂伸直',
      },
      {
        at: 2.8,
        pose: { lShoulder: [0, 0, 1.4], rShoulder: [0, 0, -1.4], lElbow: [0, 0, 1.6], rElbow: [0, 0, -1.6] },
        effort: 0.5,
        cue: '慢慢收返落嚟',
      },
    ],
  },
  {
    id: 'lunge',
    muscles: [
      { id: 'quads', weight: 1 },
      { id: 'glutes', weight: 1 },
      { id: 'hamstrings', weight: 0.5 },
      { id: 'calves', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.2, cue: '企直，眼望前方' },
      {
        at: 1.6,
        pose: { lHip: [-1.25, 0, 0], lKnee: 1.45, rHip: [0.4, 0, 0], rKnee: 1.2, spine: [-0.05, 0, 0] },
        effort: 1,
        cue: '左腳向前踏，兩邊膝頭屈90度',
      },
      { at: 3, pose: {}, effort: 0.4, cue: '前腳發力推返起身' },
      {
        at: 4.6,
        pose: { rHip: [-1.25, 0, 0], rKnee: 1.45, lHip: [0.4, 0, 0], lKnee: 1.2, spine: [-0.05, 0, 0] },
        effort: 1,
        cue: '換右腳向前',
      },
      { at: 6, pose: {}, effort: 0.2, cue: '返回起始位置' },
    ],
  },
];

export const EXERCISES: Exercise[] = [...BASIC, ...ENTRY, ...ADVANCED].map((m) => {
  const c = COPY[m.id];
  if (!c) throw new Error(`冇動作說明：${m.id}`);
  return { ...m, ...c };
}).concat(STRETCH, ACTIVE);

// 冇括號嘅名：語音、細卡用（「頸側拉筋（上斜方肌）」→「頸側拉筋」）
export const plainName = (e: Pick<Exercise, 'name'>) => e.name.replace(/（.*?）/g, '').trim();

// 做呢個動作要準備咩：椅／門框／牆／地墊
export function needOf(e: Exercise): string | null {
  if (e.floor) return '要瞓地，準備地墊';
  const k = e.prop?.kind;
  if (k === 'chair') return '坐椅';
  if (k === 'door') return '企去門框';
  if (k === 'wall') return '面向牆企';
  return null;
}

export function fullPose(p: Partial<Pose>): Pose {
  return { ...NEUTRAL, ...p };
}

export function repLength(ex: Exercise): number {
  return ex.keyframes[ex.keyframes.length - 1].at;
}
