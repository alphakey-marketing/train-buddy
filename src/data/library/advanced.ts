// 進階動作姿勢庫：發力傳遞、反彈、落地同複合動作
// 移動類動作喺原地做，橫向動作用 shift 簡單表示。
import { Motion, P } from '../types';


const armsUpTiptoe = P({
  lShoulder: [-3.0, 0, -0.08],
  rShoulder: [-3.0, 0, 0.08],
  lElbow: [-0.05, 0, 0],
  rElbow: [-0.05, 0, 0],
  lAnkle: 0.9,
  rAnkle: 0.9,
});

const deepSquat = P({
  spine: [0.35, 0, 0],
  lHip: [-1.9, 0, 0.08],
  rHip: [-1.9, 0, -0.08],
  lKnee: 2.4,
  rKnee: 2.4,
  lAnkle: 0.5,
  rAnkle: 0.5,
  lShoulder: [-1.3, 0, 0.12],
  rShoulder: [-1.3, 0, -0.12],
  lElbow: [-0.4, 0, 0],
  rElbow: [-0.4, 0, 0],
});
const crowLean = P({
  ...deepSquat,
  tilt: 0.45,
  spine: [0.7, 0, 0],
  lShoulder: [-1.0, 0, 0.12],
  rShoulder: [-1.0, 0, -0.12],
  lElbow: [-0.8, 0, 0],
  rElbow: [-0.8, 0, 0],
});

const plexusGroin = P({
  lShoulder: [-0.45, 0, 0.3],
  lElbow: [-1.9, 0, 0],
  rShoulder: [-0.25, 0, -0.25],
  rElbow: [-1.2, 0, 0],
});

// 左腳企，右膝提起
const oneLeg = P({ rHip: [-1.0, 0, 0], rKnee: 1.2, rAnkle: 0.3, lShoulder: [0, 0, 0.2], rShoulder: [0, 0, -0.2] });
// 支撐腳向後抽，前腳叩地
const splitDrop = P({
  lHip: [0.45, 0, 0],
  lKnee: 0.35,
  lAnkle: 0.6,
  rHip: [-0.45, 0, 0],
  rKnee: 0.15,
  spine: [0.1, 0, 0],
  lShoulder: [-0.3, 0, 0.2],
  rShoulder: [0.3, 0, -0.2],
});

const wideSquat = P({
  spine: [0.35, 0, 0],
  lHip: [-1.0, 0, 0.3],
  rHip: [-1.0, 0, -0.3],
  lKnee: 1.2,
  rKnee: 1.2,
  lShoulder: [-0.4, 0, 0.2],
  rShoulder: [-0.4, 0, -0.2],
});

// 拳擊架式：右手喺前，左拳準備
const guard = P({
  twist: 0.35,
  spine: [0.05, 0.2, 0],
  lHip: [-0.15, 0, 0.05],
  rHip: [-0.15, 0, -0.05],
  lKnee: 0.25,
  rKnee: 0.25,
  rShoulder: [-1.2, 0, 0.2],
  rElbow: [-1.3, 0, 0],
  lShoulder: [-0.4, 0, 0.35],
  lElbow: [-2.2, 0, 0],
});
const punch = P({
  ...guard,
  twist: -0.3,
  spine: [0.1, -0.35, 0],
  lShoulder: [-1.55, 0, 0.05],
  lElbow: [-0.05, 0, 0],
  rShoulder: [0.3, 0, -0.25],
  rElbow: [-1.7, 0, 0],
});

const stance = P({ lHip: [-0.1, 0, 0.12], rHip: [-0.1, 0, -0.12], lKnee: 0.25, rKnee: 0.25 });

export const ADVANCED: Motion[] = [
  // ───── 力嘅傳遞 ─────
  {
    id: 'tiptoe-overhead-walk',
    muscles: [
      { id: 'feet', weight: 1 },
      { id: 'abs', weight: 0.5 },
      { id: 'erectors', weight: 0.5 },
      { id: 'shoulders', weight: 0.4 },
      { id: 'calves', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: armsUpTiptoe, effort: 0.6, cue: '舉高雙手，踮腳，成一條直線' },
      { at: 0.8, pose: { ...armsUpTiptoe, lHip: [-0.35, 0, 0], lKnee: 0.4, rHip: [0.1, 0, 0] }, effort: 0.8, cue: '用拇趾球行，唔使快' },
      { at: 1.6, pose: armsUpTiptoe, effort: 0.9, cue: '骨由頭到腳連成一線' },
      { at: 2.4, pose: { ...armsUpTiptoe, rHip: [-0.35, 0, 0], rKnee: 0.4, lHip: [0.1, 0, 0] }, effort: 0.8, cue: '腳踭盡量提高' },
      { at: 3.2, pose: armsUpTiptoe, effort: 0.6, cue: '小腿攰即係做錯' },
    ],
  },
  {
    id: 'squat-shift-support',
    muscles: [
      { id: 'lats', weight: 1 },
      { id: 'rotatorCuff', weight: 0.7 },
      { id: 'triceps', weight: 0.6 },
      { id: 'abs', weight: 0.5 },
      { id: 'shoulders', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企定' },
      { at: 1.6, pose: deepSquat, effort: 0.4, cue: '閉蹲踞，拇趾球撐，雙手撐地' },
      { at: 3.0, pose: crowLean, effort: 0.8, cue: '膝放上臂，重心慢慢移前' },
      { at: 4.4, pose: { ...crowLean, tilt: 0.6, lift: 0.04 }, effort: 1, cue: '腳自然浮起，後腋承托' },
      { at: 5.6, pose: deepSquat, effort: 0.4, cue: '慢慢放返低' },
      { at: 7, pose: {}, effort: 0.1, cue: '企返起身' },
    ],
  },
  // ───── 伸張反射 ─────
  {
    id: 'single-arm-drop-rebound',
    muscles: [
      { id: 'shoulders', weight: 0.8 },
      { id: 'lats', weight: 0.6 },
      { id: 'rotatorCuff', weight: 0.5 },
      { id: 'obliques', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企定' },
      { at: 1.2, pose: { rShoulder: [-2.9, 0, -0.05], rElbow: [-0.3, 0, 0] }, effort: 0.6, cue: '手心向面，舉高右手' },
      { at: 1.6, pose: { rShoulder: [-2.9, 0, -0.05], rElbow: [-0.3, 0, 0] }, effort: 0.6, cue: '準備……' },
      { at: 1.85, pose: { rShoulder: [-0.4, 0, 0], rElbow: [-0.6, 0, 0], lKnee: 0.15, rKnee: 0.15 }, effort: 0.2, cue: '抽走手肘力，手臂跌落，膝輕輕抽' },
      { at: 2.15, pose: { rShoulder: [-1.8, -0.3, -0.25], rElbow: [-0.5, 0, 0] }, effort: 1, cue: '反動令手臂自然彈返上嚟' },
      { at: 2.6, pose: { rShoulder: [-0.2, 0, -0.05] }, effort: 0.2, cue: '再跌落，唔好自己郁' },
      { at: 3.6, pose: {}, effort: 0.1, cue: '之後換手' },
    ],
  },
  {
    id: 'spine-spiral-arm-swing',
    muscles: [
      { id: 'obliques', weight: 1 },
      { id: 'erectors', weight: 0.6 },
      { id: 'lats', weight: 0.5 },
      { id: 'shoulders', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: { lHip: [-0.2, 0, 0.05], rHip: [-0.2, 0, -0.05], lKnee: 0.25, rKnee: 0.25 }, effort: 0.2, cue: '股關節略曲，雙手放鬆' },
      { at: 0.7, pose: { lHip: [-0.2, 0, 0.05], rHip: [-0.2, 0, -0.05], lKnee: 0.25, rKnee: 0.25, spine: [0.05, 0.6, 0], lShoulder: [0.5, 0, 0.5], rShoulder: [-1.0, 0, 0.5], rElbow: [-0.4, 0, 0] }, effort: 0.6, cue: '背骨轉左，手被揈' },
      { at: 1.4, pose: { lHip: [-0.2, 0, 0.05], rHip: [-0.2, 0, -0.05], lKnee: 0.25, rKnee: 0.25, spine: [0.05, -0.6, 0], rShoulder: [0.5, 0, -0.5], lShoulder: [-1.0, 0, -0.5], lElbow: [-0.4, 0, 0] }, effort: 0.6, cue: '轉右，手好似冇力' },
      { at: 1.9, pose: { lHip: [-0.2, 0, 0.05], rHip: [-0.2, 0, -0.05], lKnee: 0.25, rKnee: 0.25, spine: [0.05, 0.65, 0], lShoulder: [0.55, 0, 0.6], rShoulder: [-1.1, 0, 0.6], rElbow: [-0.4, 0, 0] }, effort: 0.8, cue: '加快，切返要利落' },
      { at: 2.3, pose: { lHip: [-0.2, 0, 0.05], rHip: [-0.2, 0, -0.05], lKnee: 0.25, rKnee: 0.25, spine: [0.05, -0.65, 0], rShoulder: [0.55, 0, -0.6], lShoulder: [-1.1, 0, -0.6], lElbow: [-0.4, 0, 0] }, effort: 1, cue: '好似手鼓咁' },
      { at: 2.65, pose: { lHip: [-0.2, 0, 0.05], rHip: [-0.2, 0, -0.05], lKnee: 0.25, rKnee: 0.25, spine: [0.05, 0.65, 0], lShoulder: [0.55, 0, 0.6], rShoulder: [-1.1, 0, 0.6], rElbow: [-0.4, 0, 0] }, effort: 1, cue: '手臂纏住體幹' },
      { at: 3.0, pose: { lHip: [-0.2, 0, 0.05], rHip: [-0.2, 0, -0.05], lKnee: 0.25, rKnee: 0.25, spine: [0.05, -0.65, 0], rShoulder: [0.55, 0, -0.6], lShoulder: [-1.1, 0, -0.6], lElbow: [-0.4, 0, 0] }, effort: 1, cue: '手臂纏住體幹' },
      { at: 3.8, pose: { lHip: [-0.2, 0, 0.05], rHip: [-0.2, 0, -0.05], lKnee: 0.25, rKnee: 0.25 }, effort: 0.2, cue: '慢返落嚟' },
    ],
  },
  // ───── 反力 ─────
  {
    id: 'hip-catch-reaction',
    muscles: [
      { id: 'glutes', weight: 1 },
      { id: 'psoas', weight: 0.8 },
      { id: 'hamstrings', weight: 0.6 },
      { id: 'feet', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: plexusGroin, effort: 0.2, cue: '手按心口窩同鼠蹊部' },
      { at: 1.2, pose: { ...plexusGroin, spine: [0, 0, -0.05], lHip: [0, 0, -0.04], rHip: [0, 0, 0.04] }, effort: 0.5, cue: '重心移去左腳，承 7-8 成體重' },
      { at: 1.5, pose: { ...plexusGroin, lKnee: 0.35, rKnee: 0.15, lAnkle: 0.1 }, effort: 0.3, cue: '一瞬抽走膝力，跌落' },
      { at: 1.75, pose: { ...plexusGroin, lHip: [-0.8, 0, 0], lKnee: 1.0, rKnee: 0.1 }, effort: 0.6, cue: '即刻提膝' },
      { at: 1.95, pose: { ...plexusGroin, lKnee: 0.1 }, effort: 1, cue: '叩落地，用股關節接反力' },
      { at: 2.8, pose: plexusGroin, effort: 0.4, cue: '兩肩保持水平' },
      { at: 3.6, pose: plexusGroin, effort: 0.2, cue: '之後換腳' },
    ],
  },
  {
    id: 'tiptoe-heel-drop',
    muscles: [
      { id: 'feet', weight: 1 },
      { id: 'erectors', weight: 0.5 },
      { id: 'glutes', weight: 0.4 },
      { id: 'calves', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: { lHip: [0, 0, 0.08], rHip: [0, 0, -0.08] }, effort: 0.2, cue: '開肩闊，體重平均' },
      { at: 1.2, pose: { lHip: [0, 0, 0.08], rHip: [0, 0, -0.08], lAnkle: 0.8, rAnkle: 0.8 }, effort: 0.7, cue: '踮起腳尖，拇趾球撐' },
      { at: 2.0, pose: { lHip: [0, 0, 0.08], rHip: [0, 0, -0.08], lAnkle: 0.8, rAnkle: 0.8 }, effort: 0.7, cue: '穩定……' },
      { at: 2.15, pose: { lHip: [0, 0, 0.08], rHip: [0, 0, -0.08] }, effort: 1, cue: '急脫力，腳踭著地，衝擊傳上頭頂' },
      { at: 3.2, pose: { lHip: [0, 0, 0.08], rHip: [0, 0, -0.08] }, effort: 0.2, cue: '膝腰頸唔應該覺得震' },
    ],
  },
  // ───── 位置能量 ─────
  {
    id: 'drop-step-stamp',
    muscles: [
      { id: 'hamstrings', weight: 1 },
      { id: 'glutes', weight: 0.8 },
      { id: 'psoas', weight: 0.5 },
      { id: 'feet', weight: 0.5 },
    ],
    keyframes: [
      { at: 0, pose: oneLeg, effort: 0.2, cue: '左腳企，右膝提起' },
      { at: 1.6, pose: oneLeg, effort: 0.2, cue: '抽走多餘繃緊' },
      { at: 1.85, pose: splitDrop, effort: 0.8, cue: '支撐腳急抽向後，全身跌落' },
      { at: 2.0, pose: { ...splitDrop, rKnee: 0.1 }, effort: 1, cue: '前腳大力叩地' },
      { at: 3.0, pose: splitDrop, effort: 0.4, cue: '支撐腳膝頭保持高位' },
      { at: 4.4, pose: oneLeg, effort: 0.2, cue: '返回單腳企' },
    ],
  },
  {
    id: 'drop-propel-start',
    muscles: [
      { id: 'hamstrings', weight: 1 },
      { id: 'glutes', weight: 0.8 },
      { id: 'psoas', weight: 0.6 },
      { id: 'calves', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企定' },
      { at: 1.2, pose: { lShoulder: [-2.8, 0, 0.1], rShoulder: [-2.8, 0, -0.1], lAnkle: 0.3, rAnkle: 0.3 }, effort: 0.4, cue: '雙臂舉高，唔使繃直' },
      { at: 1.5, pose: { spine: [0.2, 0, 0], tilt: 0.1, rHip: [0.5, 0, 0], rKnee: 0.7, lAnkle: 0.5, lShoulder: [-0.6, 0, 0.1], rShoulder: [-0.6, 0, -0.1] }, effort: 0.7, cue: '手臂跌落，順勢抽走右腳' },
      { at: 1.8, pose: { spine: [0.25, 0, 0], tilt: 0.15, lHip: [0.5, 0, 0], lKnee: 0.8, rHip: [-0.5, 0, 0], rKnee: 0.5, rAnkle: 0.4, lShoulder: [-0.8, 0, 0.1], rShoulder: [0.5, 0, -0.1], rElbow: [-1.2, 0, 0], lElbow: [-1.2, 0, 0] }, effort: 1, cue: '抽埋左腳，全身被拋出去' },
      { at: 2.1, pose: { spine: [0.2, 0, 0], tilt: 0.12, rHip: [0.5, 0, 0], rKnee: 0.8, lHip: [-0.5, 0, 0], lKnee: 0.5, lAnkle: 0.4, rShoulder: [-0.8, 0, -0.1], lShoulder: [0.5, 0, 0.1], rElbow: [-1.2, 0, 0], lElbow: [-1.2, 0, 0] }, effort: 1, cue: '颼一聲加速' },
      { at: 2.4, pose: { spine: [0.15, 0, 0], tilt: 0.08, lHip: [0.4, 0, 0], lKnee: 0.7, rHip: [-0.4, 0, 0], rKnee: 0.4, rAnkle: 0.3, lShoulder: [-0.6, 0, 0.1], rShoulder: [0.4, 0, -0.1], rElbow: [-1.2, 0, 0], lElbow: [-1.2, 0, 0] }, effort: 0.8, cue: '順勢行幾步' },
      { at: 3.6, pose: {}, effort: 0.1, cue: '返回起點，換邊再做' },
    ],
  },
  // ───── 複合 ─────
  {
    id: 'half-squat-rebound',
    muscles: [
      { id: 'glutes', weight: 1 },
      { id: 'hamstrings', weight: 0.8 },
      { id: 'erectors', weight: 0.5 },
      { id: 'quads', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企定' },
      { at: 1.4, pose: wideSquat, effort: 0.5, cue: '兩腳打開蹲低' },
      { at: 1.8, pose: { ...wideSquat, lKnee: 1.0, rKnee: 1.0, lHip: [-0.85, 0, 0.3], rHip: [-0.85, 0, -0.3] }, effort: 0.6, cue: '上半身帶動，細幅上下郁' },
      { at: 2.2, pose: wideSquat, effort: 0.6, cue: '膝周圍唔用力' },
      { at: 2.6, pose: { ...wideSquat, lKnee: 1.0, rKnee: 1.0, lHip: [-0.85, 0, 0.3], rHip: [-0.85, 0, -0.3] }, effort: 0.6, cue: '感受反力' },
      { at: 2.95, pose: { ...wideSquat, lKnee: 1.35, rKnee: 1.35, lHip: [-1.1, 0, 0.3], rHip: [-1.1, 0, -0.3] }, effort: 1, cue: '一瞬將力撞落地' },
      { at: 3.4, pose: { lHip: [0, 0, 0.12], rHip: [0, 0, -0.12] }, effort: 0.6, cue: '借反彈，身體自己浮起身' },
      { at: 4.6, pose: {}, effort: 0.1, cue: '背挺直，唔好圓腰' },
    ],
  },
  {
    id: 'pelvis-rotation-punch',
    muscles: [
      { id: 'obliques', weight: 1 },
      { id: 'glutes', weight: 0.8 },
      { id: 'lats', weight: 0.6 },
      { id: 'shoulders', weight: 0.6 },
      { id: 'triceps', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企定' },
      { at: 1.2, pose: guard, effort: 0.4, cue: '擺架式，左肩左腰向後引' },
      { at: 2.2, pose: guard, effort: 0.4, cue: '股關節略曲，準備' },
      { at: 2.45, pose: punch, effort: 1, cue: '骨盤自己回走，一拳飛出' },
      { at: 2.8, pose: punch, effort: 0.7, cue: '最後一刻急停' },
      { at: 3.8, pose: guard, effort: 0.4, cue: '返架式' },
      { at: 4.8, pose: {}, effort: 0.1, cue: '用骨盤打，唔係用手' },
    ],
  },
  {
    id: 'drop-high-knee-jump',
    muscles: [
      { id: 'hamstrings', weight: 1 },
      { id: 'glutes', weight: 0.8 },
      { id: 'psoas', weight: 0.7 },
      { id: 'feet', weight: 0.5 },
      { id: 'shoulders', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: oneLeg, effort: 0.2, cue: '單腳企，抽走全身嘅力' },
      { at: 1.4, pose: oneLeg, effort: 0.2, cue: '準備……' },
      { at: 1.65, pose: splitDrop, effort: 0.8, cue: '軸腳急脫力，跌落' },
      { at: 1.95, pose: { lift: 0.22, rHip: [-1.7, 0, 0], rKnee: 2.0, lHip: [0.1, 0, 0], lKnee: 0.3, lAnkle: 0.7, rAnkle: 0.4, lShoulder: [-1.3, 0, 0.1], rShoulder: [0.6, 0, -0.1], lElbow: [-1.3, 0, 0], rElbow: [-1.2, 0, 0] }, effort: 1, cue: '借反動高抬腿跳，膝貼胸' },
      { at: 2.3, pose: { ...splitDrop, rHip: [-0.3, 0, 0] }, effort: 0.6, cue: '用大髀後面落地' },
      { at: 3.4, pose: oneLeg, effort: 0.2, cue: '返回單腳企，之後換邊' },
    ],
  },
  {
    id: 'drop-side-burst',
    muscles: [
      { id: 'glutes', weight: 1 },
      { id: 'hamstrings', weight: 0.8 },
      { id: 'obliques', weight: 0.5 },
      { id: 'feet', weight: 0.5 },
    ],
    keyframes: [
      { at: 0, pose: stance, effort: 0.2, cue: '自然企，膝彎住' },
      { at: 1.2, pose: stance, effort: 0.2, cue: '準備向右' },
      { at: 1.4, pose: { ...stance, rHip: [-0.1, 0, 0.12], lKnee: 0.4, rKnee: 0.45, rAnkle: 0.3 }, effort: 0.6, cue: '抽走右腳，頭唔郁' },
      { at: 1.65, pose: { shift: -0.3, spine: [0.1, 0, -0.15], lHip: [-0.1, 0, 0.4], rHip: [-0.2, 0, -0.25], lKnee: 0.15, rKnee: 0.5, lAnkle: 0.5 }, effort: 1, cue: '落下之後一瞬蹬地，衝出去' },
      { at: 1.95, pose: { shift: -0.42, lHip: [-0.15, 0, 0.25], rHip: [-0.15, 0, -0.25], lKnee: 0.5, rKnee: 0.5 }, effort: 0.8, cue: '急停' },
      { at: 3.0, pose: { shift: -0.42, lHip: [-0.15, 0, 0.25], rHip: [-0.15, 0, -0.25], lKnee: 0.5, rKnee: 0.5 }, effort: 0.3, cue: '冇谷力蹬地，係被拋出去' },
      { at: 4.2, pose: stance, effort: 0.2, cue: '返起點，試其他方向' },
    ],
  },
  {
    id: 'single-leg-z-jump',
    muscles: [
      { id: 'hamstrings', weight: 1 },
      { id: 'glutes', weight: 0.9 },
      { id: 'feet', weight: 0.6 },
      { id: 'shoulders', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: { shift: 0.15, rHip: [-0.6, 0, 0], rKnee: 0.9, rAnkle: 0.3 }, effort: 0.2, cue: '左腳企' },
      { at: 0.8, pose: { shift: 0.15, spine: [0.3, 0, 0], lHip: [-0.4, 0, 0], lKnee: 0.4, rHip: [0.3, 0, 0], rKnee: 0.8, lShoulder: [0.4, 0, 0.1], rShoulder: [0.4, 0, -0.1] }, effort: 0.7, cue: '股關節脫力落下，大髀後面接住' },
      { at: 1.1, pose: { shift: 0, lift: 0.16, spine: [0.15, 0, 0], lHip: [0.1, 0, 0], lKnee: 0.4, lAnkle: 0.7, rHip: [-0.7, 0, 0], rKnee: 0.9, lShoulder: [-1.4, 0, 0.1], rShoulder: [-1.4, 0, -0.1] }, effort: 1, cue: '斜前跳，手用力揈' },
      { at: 1.4, pose: { shift: -0.15, lHip: [-0.6, 0, 0], lKnee: 0.9, lAnkle: 0.3 }, effort: 0.5, cue: '右腳落地' },
      { at: 2.2, pose: { shift: -0.15, spine: [0.3, 0, 0], rHip: [-0.4, 0, 0], rKnee: 0.4, lHip: [0.3, 0, 0], lKnee: 0.8, lShoulder: [0.4, 0, 0.1], rShoulder: [0.4, 0, -0.1] }, effort: 0.7, cue: '再脫力落下，膝唔好向前' },
      { at: 2.5, pose: { shift: 0, lift: 0.16, spine: [0.15, 0, 0], rHip: [0.1, 0, 0], rKnee: 0.4, rAnkle: 0.7, lHip: [-0.7, 0, 0], lKnee: 0.9, lShoulder: [-1.4, 0, 0.1], rShoulder: [-1.4, 0, -0.1] }, effort: 1, cue: '向另一邊斜前跳' },
      { at: 2.8, pose: { shift: 0.15, rHip: [-0.6, 0, 0], rKnee: 0.9, rAnkle: 0.3 }, effort: 0.2, cue: '左腳落地，成 Z 字' },
    ],
  },
];
