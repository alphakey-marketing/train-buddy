import { MuscleId } from './muscles';
import { Pose } from '../lib/pose';

export type Keyframe = {
  at: number; // seconds from start of one rep
  pose: Partial<Pose>;
  effort: number; // 0..1, how hard the target muscles work at this moment
  cue: string; // coaching cue shown on screen
};

export type ExerciseKind = '伸展' | '訓練' | '活化' | '脫力' | '傳遞' | '反射' | '反力' | '位置能量' | '複合';

export type ExerciseGroup = 'basic' | 'p0' | 'p1' | 'p2' | 'p3';

export type Exercise = {
  id: string;
  name: string;
  kind: ExerciseKind;
  group: ExerciseGroup;
  muscles: { id: MuscleId; weight: number }[]; // weight 1 = main, 0.5 = support
  keyframes: Keyframe[]; // last keyframe should return to the first pose so it loops
  // 以下係動作說明（身體操作書 ch4 / ch5），基本動作可以冇
  source?: string; // 出處，例如「ch4-01」
  target?: string; // 書入面講嘅目標部位（可能比 3D 肌肉更細）
  steps?: string[];
  checks?: string[]; // 檢查點 / NG
  why?: string;
  caution?: string;
};

export const GROUPS: { id: ExerciseGroup; label: string; sub: string }[] = [
  { id: 'basic', label: '基本', sub: '基本伸展同訓練' },
  { id: 'p0', label: '初級 P0', sub: 'Phase 0 基盤調整：足部、骨盆、肋骨、肩胛' },
  { id: 'p1', label: '初級 P1', sub: 'Phase 1 搖動同落下：練脫力' },
  { id: 'p2', label: '發展 P2', sub: 'Phase 2 四要素：傳遞、伸張反射、反力、位置能量' },
  { id: 'p3', label: '發展 P3', sub: 'Phase 3 複合：四要素一齊用' },
];

// 細 helper：寫姿勢時有型別檢查
export const P = (p: Partial<Pose>): Partial<Pose> => p;
