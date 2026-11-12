// 慢慢郁嘅活動（循環動作，唔使停住）：收下巴、夾膊胛、轉膊、轉胸、坐椅貓牛、企直後仰，
// 加兩個寫字樓腰背拉筋（坐椅四字、企姿拉髖前）。
// 研究指出淨係拉筋唔夠，配合輕鬆主動活動，頸膊同腰痛改善得更好。
import { Exercise, P } from '../types';

const SIT = P({ lHip: [-1.57, 0, 0.04], rHip: [-1.57, 0, -0.04], lKnee: 1.57, rKnee: 1.57 });
// 坐椅，雙手放大腿
const SIT_HANDS = P({ ...SIT, lShoulder: [-0.5, 0, 0.12], rShoulder: [-0.5, 0, -0.12], lElbow: [-0.9, 0, 0], rElbow: [-0.9, 0, 0] });
// 坐椅，雙手交叉搭膊頭
const SIT_CROSS = P({ ...SIT, lShoulder: [-1.3, 0, -0.35], rShoulder: [-1.3, 0, 0.35], lElbow: [-2.1, 0, 0], rElbow: [-2.1, 0, 0] });
// 坐椅，手肘屈 90 度喺身邊（W 字）
const SIT_W = P({ ...SIT, lShoulder: [0, 0, 0.5], rShoulder: [0, 0, -0.5], lElbow: [-1.6, 0, 0], rElbow: [-1.6, 0, 0] });
// 企直，雙手托住後腰
const HANDS_BACK = P({ lShoulder: [0.45, 0, 0.3], rShoulder: [0.45, 0, -0.3], lElbow: [-1.3, 0, 0], rElbow: [-1.3, 0, 0] });

const STOP = '有痛就停，唔好忍。';

type Def = Omit<Exercise, 'level'> & { level?: Exercise['level'] };
const make = (d: Def): Exercise => ({ level: 1, ...d }) as Exercise;

export const ACTIVE: Exercise[] = [
  make({
    id: 'chin-tuck', name: '收下巴', kind: '活化', areas: ['neck'], floor: false, desk: true,
    muscles: [{ id: 'neck', weight: 1 }, { id: 'traps', weight: 0.4 }],
    steps: ['坐直，眼望前面', '下巴向後收，似整個「雙下巴」', '後頸拉長，停 2 秒', '放返，再嚟'],
    checks: ['低頭望地', '膊頭聳起'],
    why: '對住電腦個頭會向前探，後頸成日頂住。收下巴可以叫醒頸前面嘅肌肉，令個頭返返正位。',
    caution: '頭暈或者手麻就停。',
    prop: { kind: 'chair' }, view: 'side',
    keyframes: [
      { at: 0, pose: SIT_HANDS, effort: 0.2, cue: '坐直，眼望前面' },
      { at: 1.5, pose: { ...SIT_HANDS, neck: [0.2, 0, 0], spine: [-0.04, 0, 0] }, effort: 1, cue: '下巴向後收，後頸拉長' },
      { at: 3.5, pose: { ...SIT_HANDS, neck: [0.2, 0, 0], spine: [-0.04, 0, 0] }, effort: 1, cue: '停一停，眼仲係望前' },
      { at: 5, pose: SIT_HANDS, effort: 0.2, cue: '慢慢放返' },
    ],
  }),
  make({
    id: 'scap-squeeze', name: '夾膊胛', kind: '活化', areas: ['upper-back', 'neck'], floor: false, desk: true,
    muscles: [{ id: 'rotatorCuff', weight: 0.8 }, { id: 'traps', weight: 0.6 }, { id: 'chest', weight: 0.4 }],
    steps: ['坐直，手肘屈 90 度放身邊', '兩邊膊胛骨向後、向下夾埋', '胸口自然打開，停 3 秒', '放返，再嚟'],
    checks: ['聳膊', '反腰'],
    why: '駝背令背脊中間嘅肌肉冇力。夾膊胛可以叫醒佢哋，幫你坐直唔使諗。',
    caution: '膊頭痛就細力啲。',
    prop: { kind: 'chair' }, view: 'back',
    keyframes: [
      { at: 0, pose: SIT_W, effort: 0.2, cue: '手肘屈 90 度，放鬆' },
      { at: 1.5, pose: { ...SIT_W, lShoulder: [0.35, 0, 0.6], rShoulder: [0.35, 0, -0.6], spine: [-0.06, 0, 0] }, effort: 1, cue: '膊胛骨向後、向下夾埋' },
      { at: 4, pose: { ...SIT_W, lShoulder: [0.35, 0, 0.6], rShoulder: [0.35, 0, -0.6], spine: [-0.06, 0, 0] }, effort: 1, cue: '停住，膊頭唔好聳' },
      { at: 5.5, pose: SIT_W, effort: 0.2, cue: '慢慢放返' },
    ],
  }),
  make({
    id: 'shoulder-roll', name: '慢慢轉膊頭', kind: '放鬆', areas: ['neck', 'upper-back'], floor: false, desk: true,
    muscles: [{ id: 'traps', weight: 1 }, { id: 'shoulders', weight: 0.6 }],
    steps: ['坐直，雙手垂低放鬆', '膊頭慢慢向上提', '再向後、向下畫圈', '畫大圈、慢慢嚟'],
    checks: ['郁個頭'],
    why: '膊頭成日聳住會好攰。慢慢轉圈令膊頭周圍血液流通返。',
    caution: STOP,
    prop: { kind: 'chair' }, view: 'front',
    keyframes: [
      { at: 0, pose: SIT, effort: 0.2, cue: '雙手垂低，膊頭放鬆' },
      { at: 1.2, pose: { ...SIT, lShrug: 0.35, rShrug: 0.35 }, effort: 0.8, cue: '膊頭慢慢向上提' },
      { at: 2.4, pose: { ...SIT, lShrug: 0.2, rShrug: 0.2, lShoulder: [0.3, 0, 0.2], rShoulder: [0.3, 0, -0.2] }, effort: 0.8, cue: '向後畫圈' },
      { at: 3.6, pose: { ...SIT, lShrug: -0.1, rShrug: -0.1, lShoulder: [0.1, 0, 0.15], rShoulder: [0.1, 0, -0.15] }, effort: 0.5, cue: '向下沉，放鬆' },
      { at: 4.8, pose: SIT, effort: 0.2, cue: '再嚟，慢慢轉' },
    ],
  }),
  make({
    id: 'seated-rotation', name: '坐椅轉胸', kind: '活化', areas: ['upper-back', 'lower-back'], floor: false, desk: true,
    muscles: [{ id: 'obliques', weight: 0.8 }, { id: 'erectors', weight: 0.6 }],
    steps: ['坐直，雙手交叉搭住膊頭', '由胸口帶動，慢慢轉向左', '返中間，再轉向右', '腰坐直，屁股唔好郁'],
    checks: ['屁股跟住轉', '彎腰'],
    why: '坐成日，背脊中間轉唔郁。慢慢左右轉令背脊靈活返，腰就唔使代佢做嘢。',
    caution: STOP,
    prop: { kind: 'chair' }, view: 'front',
    keyframes: [
      { at: 0, pose: SIT_CROSS, effort: 0.2, cue: '雙手交叉搭膊頭，坐直' },
      { at: 2, pose: { ...SIT_CROSS, spine: [0, 0.65, 0], neck: [0, 0.2, 0] }, effort: 0.9, cue: '由胸口帶動，轉向左' },
      { at: 3, pose: SIT_CROSS, effort: 0.3, cue: '返中間' },
      { at: 5, pose: { ...SIT_CROSS, spine: [0, -0.65, 0], neck: [0, -0.2, 0] }, effort: 0.9, cue: '轉向右，屁股唔好郁' },
      { at: 6, pose: SIT_CROSS, effort: 0.2, cue: '返中間' },
    ],
  }),
  make({
    id: 'seated-cat-cow', name: '坐椅貓牛式', kind: '活化', areas: ['lower-back', 'upper-back'], floor: false, desk: true,
    muscles: [{ id: 'erectors', weight: 1 }, { id: 'abs', weight: 0.5 }],
    steps: ['坐喺椅邊，雙手放膝頭', '吸氣，胸口向前挺，腰微微向前', '呼氣，背慢慢拱起，低頭', '跟住呼吸慢慢嚟回'],
    checks: ['郁得太快', '腰痛都繼續'],
    why: '坐耐咗腰背好似鎖死。前後慢慢郁，等腰椎每節都郁一郁，減少僵硬。',
    caution: '腰痛加劇就停。',
    prop: { kind: 'chair' }, view: 'side',
    keyframes: [
      { at: 0, pose: SIT_HANDS, effort: 0.2, cue: '坐喺椅邊，雙手放膝頭' },
      { at: 2, pose: { ...SIT_HANDS, spine: [-0.25, 0, 0], neck: [-0.15, 0, 0] }, effort: 0.8, cue: '吸氣，胸口向前挺' },
      { at: 4.5, pose: { ...SIT_HANDS, spine: [0.45, 0, 0], neck: [0.35, 0, 0], lShoulder: [-0.7, 0, 0.12], rShoulder: [-0.7, 0, -0.12] }, effort: 0.8, cue: '呼氣，背慢慢拱起，低頭' },
      { at: 6, pose: SIT_HANDS, effort: 0.2, cue: '返中間，再嚟' },
    ],
  }),
  make({
    id: 'standing-back-ext', name: '企直托腰後仰', kind: '活化', areas: ['lower-back'], floor: false, desk: true,
    muscles: [{ id: 'erectors', weight: 0.8 }, { id: 'abs', weight: 0.5 }, { id: 'psoas', weight: 0.4 }],
    steps: ['企直，雙腳開肩寬', '雙手托住後腰', '慢慢向後仰少少，眼望前上方', '返直，再嚟'],
    checks: ['頭向後跌', '仰得太盡'],
    why: '坐耐咗成日向前彎。企起身向後仰少少，係最簡單嘅「反方向」動作。',
    caution: '向後仰時腰痛、腳麻就停，唔好再做。',
    view: 'side',
    keyframes: [
      { at: 0, pose: HANDS_BACK, effort: 0.2, cue: '企直，雙手托住後腰' },
      { at: 2, pose: { ...HANDS_BACK, spine: [-0.3, 0, 0], neck: [-0.1, 0, 0], lKnee: 0.05, rKnee: 0.05 }, effort: 0.8, cue: '慢慢向後仰少少' },
      { at: 3.5, pose: { ...HANDS_BACK, spine: [-0.3, 0, 0], neck: [-0.1, 0, 0], lKnee: 0.05, rKnee: 0.05 }, effort: 0.8, cue: '停一停，呼吸' },
      { at: 5, pose: HANDS_BACK, effort: 0.2, cue: '返直' },
    ],
  }),
  make({
    id: 'seated-thoracic-ext', name: '坐椅挺胸（胸椎後伸）', kind: '活化', areas: ['upper-back', 'lower-back'], floor: false, desk: true,
    muscles: [{ id: 'erectors', weight: 0.7 }, { id: 'chest', weight: 0.6 }, { id: 'abs', weight: 0.4 }],
    steps: ['坐低，雙手托住後腦，手肘打開', '上背靠住椅背頂', '吸氣，胸口慢慢向上、向後打開', '呼氣返中間，慢慢重複'],
    checks: ['腰過度反', '下巴突出'],
    why: '駝背令上背僵硬。靠椅背慢慢後伸，可以活動返胸椎。',
    caution: '頸或者背痛就停。',
    prop: { kind: 'chair' }, view: 'side',
    reach: { lHand: { bone: 'head', at: [0.07, 0.1, -0.1] }, rHand: { bone: 'head', at: [-0.07, 0.1, -0.1] } },
    keyframes: [
      { at: 0, pose: { ...SIT, lShoulder: [0, 0, 2.0], rShoulder: [0, 0, -2.0], lElbow: [-2.0, 0, 0], rElbow: [-2.0, 0, 0] }, effort: 0.2, cue: '雙手托後腦，手肘打開' },
      { at: 2.5, pose: { ...SIT, spine: [-0.45, 0, 0], neck: [-0.1, 0, 0], lShoulder: [0, 0, 2.0], rShoulder: [0, 0, -2.0], lElbow: [-2.0, 0, 0], rElbow: [-2.0, 0, 0] }, effort: 1, cue: '吸氣，胸口慢慢向上、向後' },
      { at: 4, pose: { ...SIT, spine: [-0.45, 0, 0], neck: [-0.1, 0, 0], lShoulder: [0, 0, 2.0], rShoulder: [0, 0, -2.0], lElbow: [-2.0, 0, 0], rElbow: [-2.0, 0, 0] }, effort: 1, cue: '停一停，唔好反腰' },
      { at: 6, pose: { ...SIT, lShoulder: [0, 0, 2.0], rShoulder: [0, 0, -2.0], lElbow: [-2.0, 0, 0], rElbow: [-2.0, 0, 0] }, effort: 0.2, cue: '呼氣，慢慢返中間' },
    ],
  }),
];
