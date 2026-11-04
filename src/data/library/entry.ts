// 入門動作姿勢庫：足部、骨盆、背骨、肩膀、搖動同放鬆
// 姿勢係簡化版：足趾動作用腳踝同趾關節角度代表。
import { Motion, P } from '../types';


// 坐地，左膝曲起，雙手扶住左腳（足趾動作用）
const sitHoldFoot = P({
  seat: 1,
  spine: [0.8, 0, 0],
  neck: [0.2, 0, 0],
  lHip: [-2.1, 0, 0.2],
  lKnee: 1.3,
  rHip: [-1.5, 0, -0.15],
  rKnee: 0.05,
  lShoulder: [-1.4, 0, 0.1],
  rShoulder: [-1.4, 0, 0.2],
  lElbow: [0, 0, 0],
  rElbow: [0, 0, 0],
});

// 長坐，雙手喺後面撐地
const sitLong = P({
  seat: 1,
  spine: [-0.15, 0, 0],
  lHip: [-1.5, 0, 0.1],
  rHip: [-1.5, 0, -0.1],
  lKnee: 0.15,
  rKnee: 0.15,
  lShoulder: [0.5, 0, 0.25],
  rShoulder: [0.5, 0, -0.25],
  lElbow: [0, 0, 0],
  rElbow: [0, 0, 0],
});

// 雙手指尖相對，按住心口窩
const handsOnPlexus = P({
  lShoulder: [-0.45, 0, 0.3],
  rShoulder: [-0.45, 0, -0.3],
  lElbow: [-1.9, 0, 0],
  rElbow: [-1.9, 0, 0],
});

// 曲膝坐低（單側螺旋伸展用）
const sitKnee = P({
  seat: 1,
  spine: [0.1, 0, 0],
  lHip: [-1.9, 0, 0.25],
  lKnee: 1.9,
  rHip: [-1.5, 0, -0.1],
  rKnee: 0.1,
  lShoulder: [-0.3, 0, 0.2],
  rShoulder: [0.3, 0, -0.3],
  lElbow: [-0.6, 0, 0],
  rElbow: [0, 0, 0],
});
const sitTwist = P({
  ...sitKnee,
  spine: [0.15, -0.7, 0],
  neck: [0, -0.4, 0],
  lShoulder: [-0.7, 0, 0.1],
  lElbow: [-0.9, 0, 0],
  rShoulder: [0.5, 0, -0.4],
});

// 俯臥兩肘撐地
const proneElbows = P({
  tilt: 1.4,
  spine: [-0.2, 0, 0],
  neck: [0.35, 0, 0],
  lShoulder: [-1.2, 0, 0.05],
  rShoulder: [-1.2, 0, -0.05],
  lElbow: [-1.5, 0, 0],
  rElbow: [-1.5, 0, 0],
  lAnkle: 0.6,
  rAnkle: 0.6,
});

// 左腳踏前，手指按鼠蹊部
const stepGroin = P({
  lHip: [-0.5, 0, 0.02],
  lKnee: 0.25,
  rHip: [0.2, 0, -0.02],
  rKnee: 0.05,
  lShoulder: [-0.25, 0, 0.25],
  rShoulder: [-0.25, 0, -0.25],
  lElbow: [-1.2, 0, 0],
  rElbow: [-1.2, 0, 0],
});
const hingeGroin = P({
  ...stepGroin,
  spine: [0.85, 0, 0],
  neck: [-0.3, 0, 0],
  lHip: [-1.0, 0, 0.02],
  lKnee: 0.2,
  rHip: [-0.35, 0, -0.02],
});
const hingeTap = P({ ...hingeGroin, lShoulder: [0.2, 0, 0.35], lElbow: [-0.4, 0, 0] });

const crossLow = P({
  lHip: [-0.15, 0, 0],
  rHip: [-0.15, 0, 0],
  lKnee: 0.25,
  rKnee: 0.25,
  lShoulder: [-0.9, 0, -0.45],
  rShoulder: [-0.9, 0, 0.45],
  lElbow: [-0.2, 0, 0],
  rElbow: [-0.2, 0, 0],
});

const kneeUp = P({ lHip: [-1.0, 0, 0], lKnee: 1.3, lAnkle: 0.2 });
const overhead = P({ lShoulder: [-2.95, 0, 0.1], rShoulder: [-2.95, 0, -0.1], lElbow: [-0.1, 0, 0], rElbow: [-0.1, 0, 0] });

export const ENTRY: Motion[] = [
  // ───── 足部 ─────
  {
    id: 'toe-stretch',
    muscles: [
      { id: 'calves', weight: 1 },
      { id: 'feet', weight: 1 },
    ],
    keyframes: [
      { at: 0, pose: sitHoldFoot, effort: 0.2, cue: '坐低，雙手扶住腳趾' },
      { at: 1.5, pose: { ...sitHoldFoot, lToe: -0.8 }, effort: 0.7, cue: '由拇趾開始，逐隻向上扳' },
      { at: 3, pose: { ...sitHoldFoot, lToe: 1.0 }, effort: 0.9, cue: '再向下屈，輕手慢慢嚟' },
      { at: 4.5, pose: { ...sitHoldFoot, lToe: -0.45 }, effort: 0.6, cue: '拉開趾縫，唔好太大力' },
      { at: 6, pose: sitHoldFoot, effort: 0.2, cue: '做完換另一隻腳' },
    ],
  },
  {
    id: 'toe-curl-grip',
    muscles: [
      { id: 'feet', weight: 1 },
      { id: 'calves', weight: 0.6 },
    ],
    keyframes: [
      { at: 0, pose: sitLong, effort: 0.2, cue: '坐低，雙腳放鬆' },
      { at: 1.2, pose: { ...sitLong, lAnkle: 0.3, rAnkle: 0.3, lToe: 1.1, rToe: 1.1 }, effort: 1, cue: '腳趾握成拳頭，拇趾小趾用力' },
      { at: 2.6, pose: { ...sitLong, lAnkle: 0.35, rAnkle: 0.35, lToe: 1.2, rToe: 1.2 }, effort: 1, cue: '指根握實，停一停' },
      { at: 3.2, pose: { ...sitLong, lAnkle: -0.15, rAnkle: -0.15, lToe: -0.6, rToe: -0.6 }, effort: 0.3, cue: '一次過鬆開，攤開趾縫' },
      { at: 4.6, pose: sitLong, effort: 0.2, cue: '感受趾縫伸展' },
    ],
  },
  {
    id: 'toe-interlace-grip',
    muscles: [
      { id: 'feet', weight: 1 },
      { id: 'calves', weight: 0.5 },
    ],
    keyframes: [
      { at: 0, pose: sitHoldFoot, effort: 0.2, cue: '手指插入趾縫，按住腳底' },
      { at: 1.4, pose: { ...sitHoldFoot, lToe: 1.0 }, effort: 1, cue: '保持插住，腳趾用力握緊' },
      { at: 3, pose: { ...sitHoldFoot, lToe: 1.1 }, effort: 1, cue: '握實，停一停' },
      { at: 3.8, pose: { ...sitHoldFoot, lToe: -0.3 }, effort: 0.3, cue: '放鬆' },
      { at: 5, pose: sitHoldFoot, effort: 0.2, cue: '做完換邊，再試一次屈趾握力' },
    ],
  },
  {
    id: 'tiptoe-stand',
    muscles: [
      { id: 'feet', weight: 1 },
      { id: 'calves', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: { lHip: [0, 0, 0.03], rHip: [0, 0, -0.03] }, effort: 0.2, cue: '兩腳開一個拳頭闊，放鬆企' },
      { at: 1.5, pose: { lHip: [0, 0, 0.03], rHip: [0, 0, -0.03], lAnkle: 0.8, rAnkle: 0.8 }, effort: 0.8, cue: '踮起腳尖，用拇趾球撐' },
      { at: 4, pose: { lHip: [0, 0, 0.03], rHip: [0, 0, -0.03], lAnkle: 0.82, rAnkle: 0.82 }, effort: 1, cue: '盡量維持，足踝打直' },
      { at: 5.5, pose: { lHip: [0, 0, 0.03], rHip: [0, 0, -0.03] }, effort: 0.2, cue: '慢慢放低' },
    ],
  },
  {
    id: 'single-toe-curl-stand',
    muscles: [
      { id: 'feet', weight: 1 },
      { id: 'calves', weight: 0.4 },
      { id: 'glutes', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: { lShoulder: [0, 0, 1.3], lElbow: [0, 0, 0], lToe: 0.5 }, effort: 0.2, cue: '扶牆，左腳腳趾曲住企' },
      { at: 1.5, pose: { lShoulder: [0, 0, 1.3], lElbow: [0, 0, 0], lToe: 0.5, rAnkle: 0.75 }, effort: 0.8, cue: '右腳踮起，用拇趾球企' },
      { at: 4, pose: { lShoulder: [0, 0, 1.3], lElbow: [0, 0, 0], lToe: 0.5, rAnkle: 0.78 }, effort: 1, cue: '體重左右平均，維持' },
      { at: 5.5, pose: { lShoulder: [0, 0, 1.3], lElbow: [0, 0, 0], lToe: 0.5 }, effort: 0.2, cue: '放低，之後換邊' },
    ],
  },
  // ───── 骨盆、體幹 ─────
  {
    id: 'unilateral-spiral',
    muscles: [
      { id: 'psoas', weight: 1 },
      { id: 'obliques', weight: 1 },
      { id: 'quads', weight: 0.5 },
      { id: 'erectors', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: sitKnee, effort: 0.2, cue: '目標側膝頭曲起坐低' },
      { at: 1.6, pose: sitTwist, effort: 0.7, cue: '上半身轉去對面，面都跟住轉' },
      { at: 2.6, pose: { ...sitTwist, lElbow: [-1.2, 0, 0] }, effort: 1, cue: '同側手按摩前大腿' },
      { at: 3.6, pose: sitTwist, effort: 1, cue: '按摩大約 10 秒，腰唔好用力' },
      { at: 4.6, pose: { ...sitTwist, lElbow: [-1.2, 0, 0] }, effort: 1, cue: '之後膝頭轉 45 度、90 度再做' },
      { at: 6, pose: sitKnee, effort: 0.2, cue: '慢慢轉返正面' },
    ],
  },
  {
    id: 'lunge-groin-tap',
    muscles: [
      { id: 'hamstrings', weight: 1 },
      { id: 'glutes', weight: 0.5 },
      { id: 'psoas', weight: 0.5 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企直' },
      { at: 1.2, pose: stepGroin, effort: 0.3, cue: '左腳踏前一步，手指按住鼠蹊部' },
      { at: 2.6, pose: hingeGroin, effort: 0.8, cue: '以鼠蹊為軸，上身向前倒，屁股升起' },
      { at: 3.0, pose: hingeTap, effort: 1, cue: '輕拍大腿後側 5 下' },
      { at: 3.4, pose: hingeGroin, effort: 1, cue: '輕拍大腿後側 5 下' },
      { at: 3.8, pose: hingeTap, effort: 1, cue: '膝唔好打直，屁股唔好跌' },
      { at: 4.2, pose: hingeGroin, effort: 1, cue: '膝唔好打直，屁股唔好跌' },
      { at: 5.6, pose: {}, effort: 0.1, cue: '企返直，之後換邊' },
    ],
  },
  // ───── 背骨、肋骨、肩胛骨 ─────
  {
    id: 'figure8-spine',
    muscles: [
      { id: 'psoas', weight: 1 },
      { id: 'erectors', weight: 0.6 },
      { id: 'obliques', weight: 0.6 },
      { id: 'traps', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: handsOnPlexus, effort: 0.2, cue: '雙手按住心口窩' },
      { at: 1.4, pose: { ...handsOnPlexus, spine: [0, 0.3, 0.06], lShoulder: [-0.25, 0, 0.3], rShoulder: [-0.6, 0, -0.3] }, effort: 0.8, cue: '似背泳咁，左肩慢慢向後轉' },
      { at: 2.8, pose: { ...handsOnPlexus, spine: [0, -0.3, -0.06], lShoulder: [-0.6, 0, 0.3], rShoulder: [-0.25, 0, -0.3] }, effort: 0.8, cue: '右肩向後轉，感受背骨郁' },
      { at: 4.2, pose: { ...handsOnPlexus, spine: [0.08, -0.25, 0.05], lShoulder: [-0.7, 0, 0.3], rShoulder: [-0.3, 0, -0.3] }, effort: 0.8, cue: '似自由式咁向前轉，肩唔好用力' },
      { at: 5.6, pose: { ...handsOnPlexus, spine: [0.08, 0.25, -0.05], lShoulder: [-0.3, 0, 0.3], rShoulder: [-0.7, 0, -0.3] }, effort: 0.8, cue: '交替向前轉' },
      { at: 7, pose: handsOnPlexus, effort: 0.2, cue: '手指一直按實心口窩' },
    ],
  },
  {
    id: 'upper-rib-roll',
    muscles: [
      { id: 'chest', weight: 1 },
      { id: 'traps', weight: 0.6 },
      { id: 'rotatorCuff', weight: 0.5 },
      { id: 'shoulders', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: { rShoulder: [-0.6, 0, 0.35], rElbow: [-2.1, 0, 0] }, effort: 0.3, cue: '手指喺鎖骨中央擦肋骨' },
      { at: 1.2, pose: { rShoulder: [-0.3, 0, 0.1], rElbow: [-1.6, 0, 0], lShoulder: [-0.3, 0, -0.1], lElbow: [-1.6, 0, 0] }, effort: 0.4, cue: '拍打下部肋骨同腹部，固定佢' },
      { at: 2.6, pose: { lShoulder: [0.35, 0, 0.15], rShoulder: [-0.15, 0, -0.08] }, effort: 0.9, cue: '左肩慢慢向後轉' },
      { at: 4, pose: { lShoulder: [-0.15, 0, 0.08], rShoulder: [0.35, 0, -0.15] }, effort: 0.9, cue: '右肩向後轉，感受鎖骨中央錯位' },
      { at: 5.4, pose: { lShoulder: [0.3, 0, 0.15], rShoulder: [-0.1, 0, -0.08] }, effort: 0.9, cue: '頭唔好郁，肚唔好郁' },
      { at: 6.8, pose: { rShoulder: [-0.6, 0, 0.35], rElbow: [-2.1, 0, 0] }, effort: 0.3, cue: '軌道細啲，熟咗先加大' },
    ],
  },
  {
    id: 'cross-arm-circle',
    muscles: [
      { id: 'rotatorCuff', weight: 1 },
      { id: 'lats', weight: 0.6 },
      { id: 'shoulders', weight: 0.6 },
      { id: 'traps', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: crossLow, effort: 0.3, cue: '雙手身前交叉，腰略放低' },
      { at: 1.4, pose: { ...crossLow, lShoulder: [-1.7, 0, -0.35], rShoulder: [-1.7, 0, 0.35] }, effort: 0.7, cue: '保持交叉，手臂向上畫圈' },
      { at: 2.8, pose: { ...crossLow, lShoulder: [-2.6, 0, 0.1], rShoulder: [-2.6, 0, -0.1] }, effort: 1, cue: '畫大圈，感受後腋伸展' },
      { at: 4.2, pose: { ...crossLow, lShoulder: [-1.4, 0, 0.5], rShoulder: [-1.4, 0, -0.5] }, effort: 0.8, cue: '向外落，肩胛骨打開' },
      { at: 5.6, pose: crossLow, effort: 0.3, cue: '返到身前，之後轉反方向' },
    ],
  },
  {
    id: 'prone-scapula-spiral',
    muscles: [
      { id: 'rotatorCuff', weight: 1 },
      { id: 'lats', weight: 0.7 },
      { id: 'shoulders', weight: 0.5 },
      { id: 'triceps', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: proneElbows, effort: 0.6, cue: '俯臥，手肘喺肩正下方' },
      { at: 1.4, pose: { ...proneElbows, lShoulder: [-1.2, 0.45, 0.05], rShoulder: [-1.2, -0.45, -0.05] }, effort: 1, cue: '肩向內轉，胸口唔好跌' },
      { at: 2.8, pose: proneElbows, effort: 0.7, cue: '返中間，後腋出力' },
      { at: 4.2, pose: { ...proneElbows, lShoulder: [-1.2, -0.45, 0.05], rShoulder: [-1.2, 0.45, -0.05] }, effort: 1, cue: '肩向外轉，肩先郁，手跟住' },
      { at: 5.6, pose: proneElbows, effort: 0.6, cue: '頸放鬆，手腕唔好反曲' },
    ],
  },
  // ───── 搖動系 ─────
  {
    id: 'spine-pelvis-sway',
    muscles: [
      { id: 'erectors', weight: 1 },
      { id: 'obliques', weight: 0.8 },
      { id: 'abs', weight: 0.4 },
      { id: 'glutes', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: { spine: [0.1, 0, 0] }, effort: 0.2, cue: '企定，輕微含胸' },
      { at: 0.8, pose: { spine: [0.1, 0.05, 0.08], twist: 0.04 }, effort: 0.4, cue: '用背骨左右搖，細幅慢慢嚟' },
      { at: 1.6, pose: { spine: [0.1, -0.05, -0.08], twist: -0.04 }, effort: 0.4, cue: '唔係郁上半身，係郁背骨' },
      { at: 2.4, pose: { spine: [0.1, 0.05, 0.08], twist: 0.04 }, effort: 0.4, cue: '感受出力同拔力' },
      { at: 3.0, pose: { spine: [0.1, -0.08, -0.14], twist: -0.06 }, effort: 0.5, cue: '慢慢加大幅度、加快' },
      { at: 3.6, pose: { spine: [0.1, 0.08, 0.14], twist: 0.06 }, effort: 0.5, cue: '其他部位唔好繃緊' },
      { at: 4.2, pose: { spine: [0.1, 0, 0] }, effort: 0.2, cue: '試下前後縱搖' },
    ],
  },
  {
    id: 'leg-swing-relax',
    muscles: [
      { id: 'psoas', weight: 1 },
      { id: 'glutes', weight: 0.6 },
      { id: 'hamstrings', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: { lShoulder: [-0.3, 0, 0.3], lElbow: [-1.1, 0, 0], lHip: [0, 0, 0.3], lAnkle: 0.4 }, effort: 0.2, cue: '手按鼠蹊部，左腳向外，腳尖掂地' },
      { at: 0.9, pose: { lShoulder: [-0.3, 0, 0.3], lElbow: [-1.1, 0, 0], lHip: [-0.08, 0.3, 0.3], lAnkle: 0.4 }, effort: 0.4, cue: '唔谷力，輕輕搖隻腳' },
      { at: 1.8, pose: { lShoulder: [-0.3, 0, 0.3], lElbow: [-1.1, 0, 0], lHip: [0.05, -0.3, 0.32], lAnkle: 0.4 }, effort: 0.4, cue: '支撐腳踩實地' },
      { at: 2.7, pose: { lShoulder: [-0.3, 0, 0.3], lElbow: [-1.1, 0, 0], lHip: [-0.08, 0.3, 0.3], lAnkle: 0.4 }, effort: 0.4, cue: '似濕毛巾咁搖' },
      { at: 3.6, pose: { lShoulder: [-0.3, 0, 0.3], lElbow: [-1.1, 0, 0], lHip: [0, 0, 0.3], lAnkle: 0.4 }, effort: 0.2, cue: '慢慢搖細啲，之後換邊' },
    ],
  },
  // ───── 落下系 ─────
  {
    id: 'plexus-arm-drop',
    muscles: [
      { id: 'psoas', weight: 0.8 },
      { id: 'shoulders', weight: 0.5 },
      { id: 'traps', weight: 0.5 },
    ],
    keyframes: [
      { at: 0, pose: handsOnPlexus, effort: 0.3, cue: '手指按住心口窩' },
      { at: 1.5, pose: { ...handsOnPlexus, spine: [-0.12, 0, 0] }, effort: 0.6, cue: '鼻吸氣，心口窩向前推' },
      { at: 1.85, pose: { spine: [0.12, 0, 0], lElbow: [-0.2, 0, 0], rElbow: [-0.2, 0, 0] }, effort: 0.1, cue: '呼氣，一次過向後拔，手臂落' },
      { at: 3.2, pose: { spine: [0.05, 0, 0] }, effort: 0.1, cue: '頭唔好向前擺' },
      { at: 4.5, pose: handsOnPlexus, effort: 0.3, cue: '再按住心口窩' },
    ],
  },
  {
    id: 'leg-drop',
    muscles: [
      { id: 'psoas', weight: 1 },
      { id: 'hamstrings', weight: 0.5 },
      { id: 'quads', weight: 0.3 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企定' },
      { at: 1.0, pose: { lShoulder: [-0.2, 0, 0.35], lElbow: [-1.5, 0, 0] }, effort: 0.3, cue: '手刀喺肋骨同骨盆掃，建立斷面感' },
      { at: 1.8, pose: { lShoulder: [-0.1, 0, 0.3], lElbow: [-1.2, 0, 0] }, effort: 0.3, cue: '手刀喺肋骨同骨盆掃，建立斷面感' },
      { at: 3.0, pose: kneeUp, effort: 0.9, cue: '拎起左腳，收緊' },
      { at: 3.5, pose: kneeUp, effort: 0.9, cue: '準備……' },
      { at: 3.75, pose: {}, effort: 0.1, cue: '一次過脫力，交畀重力' },
      { at: 5, pose: {}, effort: 0.1, cue: '唔好中途煞停，之後換邊' },
    ],
  },
  {
    id: 'arms-raise-drop',
    muscles: [
      { id: 'shoulders', weight: 0.7 },
      { id: 'traps', weight: 0.6 },
      { id: 'lats', weight: 0.4 },
    ],
    keyframes: [
      { at: 0, pose: {}, effort: 0.1, cue: '企定' },
      { at: 1.6, pose: overhead, effort: 0.7, cue: '兩手舉高，吸氣' },
      { at: 2.4, pose: overhead, effort: 0.7, cue: '準備……' },
      { at: 2.65, pose: { lShoulder: [-1.9, 0, 0.15], rShoulder: [-1.9, 0, -0.15], lElbow: [-1.6, 0, 0], rElbow: [-1.6, 0, 0] }, effort: 0.2, cue: '呼氣，拔肘，一次過放鬆' },
      { at: 3.0, pose: { lKnee: 0.12, rKnee: 0.12 }, effort: 0.05, cue: '手臂自然落到底，唔好剎車' },
      { at: 4.2, pose: {}, effort: 0.1, cue: '感受全身落' },
    ],
  },
];
