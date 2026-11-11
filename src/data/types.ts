import { MuscleId } from './muscles';
import { Pose } from '../lib/pose';
import type { Reach } from '../lib/retarget';

export type Keyframe = {
  at: number; // 一個循環入面第幾秒
  pose: Partial<Pose>;
  effort: number; // 0..1，目標肌肉呢刻幾用力
  cue: string; // 畫面同語音嘅提示
};

export type ExerciseKind = '伸展' | '訓練' | '活化' | '放鬆' | '爆發';

export type Level = 1 | 2 | 3; // 1 入門、2 初級、3 進階

// 針對嘅身體位置（對應問卷嗰五個）
export type Area = 'neck' | 'upper-back' | 'lower-back' | 'hips-legs' | 'wrist';

// 場景道具：椅、牆（z = 牆面位置）、門框、扶手柱
export type Prop =
  | { kind: 'chair' }
  | { kind: 'wall'; z: number }
  | { kind: 'door'; x: number; z: number }
  | { kind: 'post'; x: number; z: number; h: number };

// 靜態拉筋：入位 → 停住 → 放返 →（換邊）
export type Hold = {
  base: Partial<Pose>; // 起始姿勢（例如坐喺椅）
  pose: Partial<Pose>; // 拉住嗰下嘅姿勢（寫一邊，另一邊自動鏡像）
  reach?: Reach; // 手腳要掂到邊
  seconds: number; // 每邊停幾耐
  sides: 1 | 2;
  enter: string; // 入位時嘅提示
  cues: string[]; // 停住時輪住講
};

// 純動作資料：姿勢 + 肌肉
export type Motion = {
  id: string;
  muscles: { id: MuscleId; weight: number }[]; // weight 1 = 主力，0.5 = 輔助
  keyframes: Keyframe[]; // 最後一格要返到起點，先會循環
  hold?: Hold; // 有就係靜態拉筋，播放器用呢個，唔用 keyframes
  reach?: Reach; // 循環動作全程手腳要掂到邊
  prop?: Prop;
  view?: 'front' | 'side' | 'back'; // 3D 最好睇嘅角度
};

// 動作說明同標籤（自己寫，唔係抄書）
export type Copy = {
  name: string;
  kind: ExerciseKind;
  level: Level;
  areas: Area[];
  floor: boolean; // 要瞓地／坐地
  desk: boolean; // 寫字樓企起身或者坐椅都做到
  steps: string[];
  checks?: string[]; // 做錯嘅徵兆
  why: string;
  caution?: string;
};

export type Exercise = Motion & Copy;

export const KIND_NOTE: Record<ExerciseKind, string> = {
  伸展: '拉鬆緊咗嘅位',
  訓練: '加強力量',
  活化: '喚醒冇用開嘅肌肉',
  放鬆: '輕輕搖、落力放低',
  爆發: '快速發力同落地',
};

// 細 helper：寫姿勢時有型別檢查
export const P = (p: Partial<Pose>): Partial<Pose> => p;
