// 每個動作嘅名、標籤同說明。全部自己寫。
import { Copy } from './types';

const STOP = '痛、暈或者企唔穩就即刻停，唔好谷住做。';

export const COPY: Record<string, Copy> = {
  // ───── 基本 ─────
  squat: {
    name: '深蹲', kind: '訓練', level: 1, areas: ['hips-legs', 'lower-back'], floor: false, desk: true,
    steps: ['雙腳同肩一樣闊，腳尖微微向外', '似坐落椅咁，屁股向後再向下', '膝頭對住腳尖方向，背挺直', '腳踭踩實地，推返企起'],
    checks: ['膝頭向內夾', '腳踭離地', '腰圓咗'],
    why: '坐耐咗臀部會「瞓著」，深蹲叫醒佢，腰就唔使代做。', caution: STOP,
  },
  'side-reach': {
    name: '側腰拉長', kind: '伸展', level: 1, areas: ['upper-back', 'lower-back'], floor: false, desk: true,
    steps: ['企直，雙手舉過頭', '慢慢向一邊彎，成個人好似喺兩塊玻璃中間', '停 3 秒，鼻呼吸', '返中間，再換邊'],
    checks: ['身向前傾', '聳高膊頭'],
    why: '一直坐住，腰側同背闊肌好少郁，呢個動作可以拉鬆佢。', caution: STOP,
  },
  'toe-touch': {
    name: '彎腰摸地', kind: '伸展', level: 1, areas: ['lower-back', 'hips-legs'], floor: false, desk: true,
    steps: ['雙腳開髖闊，膝頭微曲', '由髖位折前，唔係由腰彎', '雙手垂向地下，頸放鬆', '一節一節脊骨捲返上嚟'],
    checks: ['膝頭鎖死', '用力拉落去'],
    why: '大腿後側緊，坐耐咗盤骨會被拉後，腰就容易痛。', caution: '腰有舊患或者頭暈嘅人，彎到舒服位置就夠。',
  },
  'shoulder-press': {
    name: '舉手過頂推', kind: '訓練', level: 1, areas: ['neck', 'upper-back'], floor: false, desk: true,
    steps: ['手肘屈成直角，拳頭向天', '向上推直，耳仔貼住上臂', '停 1 秒', '慢慢放返落嚟'],
    checks: ['腰過度反起', '聳高膊頭'],
    why: '推手過頭要膊胛骨向上轉，打字駝背嘅人最缺呢個動作。', caution: STOP,
  },
  lunge: {
    name: '前踏弓步', kind: '訓練', level: 2, areas: ['hips-legs'], floor: false, desk: false,
    steps: ['企直，單腳向前踏一大步', '兩邊膝頭屈到差唔多 90 度', '上身保持直', '前腳踩地推返起身，換腳'],
    checks: ['前膝推過腳尖好多', '上身前傾'],
    why: '拉開前後髖位，鬆開坐骨同髖屈肌，同時練腳力。', caution: STOP,
  },

  // ───── 入門 ─────
  'toe-stretch': {
    name: '腳趾逐隻扳', kind: '活化', level: 1, areas: ['hips-legs'], floor: true, desk: true,
    steps: ['坐低，將腳放上膝頭', '用手逐隻腳趾向上扳，停 3 秒', '再向下屈，停 3 秒', '換另一隻腳'],
    checks: ['用力過猛', '拉開趾縫太大力'],
    why: '腳趾好少活動，扳開之後平衡同行路都會穩啲。', caution: '輕手，感覺微微拉住就夠。',
  },
  'toe-curl-grip': {
    name: '腳趾握拳', kind: '活化', level: 1, areas: ['hips-legs'], floor: true, desk: true,
    steps: ['坐低，雙腳放鬆', '腳趾用力握成拳頭，停 3 秒', '一下子放開，攤開所有趾', '重複幾次'],
    why: '訓練腳底細肌肉，令腳掌更有力。', caution: '腳抽筋就即刻放鬆，用手按住腳底。',
  },
  'toe-interlace-grip': {
    name: '手指穿趾縫夾', kind: '活化', level: 1, areas: ['hips-legs'], floor: true, desk: true,
    steps: ['手指插入腳趾縫，輕輕按住', '腳趾夾實手指，停 3 秒', '放鬆', '換邊重複'],
    why: '令腳趾學識分開同夾實，腳底拱形更穩。', caution: STOP,
  },
  'tiptoe-stand': {
    name: '踮腳站', kind: '訓練', level: 1, areas: ['hips-legs'], floor: false, desk: true,
    steps: ['雙腳開一個拳頭闊', '踮高，用腳趾根部承重', '停留，腳踝企直', '慢慢落返地'],
    checks: ['腳踝向外歪', '膝頭彎'],
    why: '小腿同腳掌有力，行路先會輕鬆。', caution: '企唔穩就扶枱邊。',
  },
  'single-toe-curl-stand': {
    name: '扶牆單腳踮', kind: '訓練', level: 2, areas: ['hips-legs'], floor: false, desk: true,
    steps: ['一手扶牆，一隻腳腳趾抓地企好', '另一隻腳踮高', '左右平均承重，停留', '放低，換邊'],
    why: '單腳控制力係平衡嘅基礎。', caution: '一定要扶穩，唔好閉眼。',
  },
  'unilateral-spiral': {
    name: '坐姿扭身按大腿', kind: '伸展', level: 2, areas: ['lower-back', 'hips-legs'], floor: true, desk: false,
    steps: ['一邊膝頭曲起坐低', '上身向反方向轉，頭跟住轉', '同邊手輕輕按摩前大腿，約 10 秒', '慢慢轉返正面，換邊'],
    checks: ['腰用力頂住'],
    why: '鬆開前大腿同髖位，減輕坐耐咗嘅壓迫感。', caution: STOP,
  },
  'lunge-groin-tap': {
    name: '踏前折髖拍腿', kind: '伸展', level: 2, areas: ['lower-back', 'hips-legs'], floor: false, desk: false,
    steps: ['企直，單腳向前踏一步', '手指按住鼠蹊，由嗰度折前', '屁股向後，輕拍大腿後側 5 下', '企返直，換邊'],
    checks: ['膝頭鎖死', '屁股跌低'],
    why: '學識由髖位折，而唔係由腰彎，保護腰。', caution: STOP,
  },
  'figure8-spine': {
    name: '胸口畫圈轉膊', kind: '放鬆', level: 1, areas: ['upper-back', 'lower-back'], floor: false, desk: true,
    steps: ['雙手按住心口位', '一邊膊頭向後畫圈，再換另一邊', '再試向前畫圈', '動作細、慢，唔好繃緊'],
    why: '打字令背骨僵硬，輕柔轉動可以令佢鬆返。', caution: STOP,
  },
  'upper-rib-roll': {
    name: '鎖骨轉膊鬆胸', kind: '放鬆', level: 2, areas: ['neck', 'upper-back'], floor: false, desk: true,
    steps: ['手指按住鎖骨中間', '輕拍下肋骨同肚，令下半身穩定', '一邊膊頭向後畫圈，再換邊', '頭同肚都唔好郁'],
    why: '胸口打開，頸膊先會輕鬆。', caution: STOP,
  },
  'cross-arm-circle': {
    name: '交叉手畫圈', kind: '伸展', level: 1, areas: ['neck', 'upper-back'], floor: false, desk: true,
    steps: ['雙手喺身前交叉，身體略向前', '保持交叉，手向上畫大圈', '向外向下收返身前', '轉方向再畫'],
    why: '拉鬆背後膊胛骨周圍，緩解膊頭同上背緊。', caution: STOP,
  },
  'prone-scapula-spiral': {
    name: '俯撐轉膊胛', kind: '活化', level: 3, areas: ['upper-back', 'neck'], floor: true, desk: false,
    steps: ['伏低，兩肘撐地喺肩下面', '膊胛骨向內轉，胸口唔好跌', '返中間，再向外轉', '頸放鬆，手腕唔好反折'],
    why: '叫醒膊胛骨周圍嘅穩定肌肉，改善圓膊。', caution: '手腕或者膊頭痛就唔好做。',
  },
  'spine-pelvis-sway': {
    name: '脊骨左右搖', kind: '放鬆', level: 1, areas: ['lower-back', 'upper-back'], floor: false, desk: true,
    steps: ['企定，身體略放鬆', '背骨由下至上左右波浪咁搖', '幅度先細後大', '其他位置唔好繃緊'],
    why: '令僵咗嘅背骨重新郁返，好似加油咁。', caution: STOP,
  },
  'leg-swing-relax': {
    name: '甩腳放鬆', kind: '放鬆', level: 1, areas: ['lower-back', 'hips-legs'], floor: false, desk: true,
    steps: ['手按住鼠蹊，單腳輕輕點地', '另一隻腳完全放鬆，輕輕搖', '搖幅慢慢收細', '換邊'],
    why: '令髖關節學識放鬆，唔使用力都郁到。', caution: '企唔穩就扶枱邊。',
  },
  'plexus-arm-drop': {
    name: '吸氣呼氣放手', kind: '放鬆', level: 1, areas: ['neck', 'upper-back'], floor: false, desk: true,
    steps: ['手指輕按心口位', '鼻吸氣，心口向前頂', '呼氣，心口向後收，手臂自然落下', '頭唔好向前探'],
    why: '配合呼吸放鬆膊頸，係最簡單嘅減壓動作。', caution: STOP,
  },
  'leg-drop': {
    name: '提腳放落', kind: '放鬆', level: 2, areas: ['lower-back', 'hips-legs'], floor: false, desk: false,
    steps: ['企定，用手掃肋骨同盤骨之間，感受腰位', '提起一隻腳，收緊', '一下子放鬆，將重量交俾重力', '唔好中途剎車，換邊'],
    why: '學識「放」比「收」更重要，髖位唔再長期繃緊。', caution: '企唔穩就扶枱邊。',
  },
  'arms-raise-drop': {
    name: '舉手放鬆落', kind: '放鬆', level: 1, areas: ['neck', 'upper-back'], floor: false, desk: true,
    steps: ['企定，雙手舉高，吸氣', '呼氣，手肘向後拔，一下子放鬆', '手臂自然落到底，唔好剎車', '感受成個人沉落去'],
    why: '最快將繃緊嘅膊頭放鬆嘅方法。', caution: STOP,
  },

  // ───── 進階 ─────
  'tiptoe-overhead-walk': {
    name: '舉手踮腳行', kind: '訓練', level: 2, areas: ['hips-legs', 'upper-back'], floor: false, desk: false,
    steps: ['雙手舉高，踮腳', '用腳趾根部慢慢行', '由頭到腳成一條直線', '腳踭盡量提高'],
    checks: ['小腿過度辛苦代表姿勢未啱'],
    why: '同時拉長上身同練小腿，坐低後最好嘅對沖。', caution: STOP,
  },
  'squat-shift-support': {
    name: '蹲低雙手撐地', kind: '訓練', level: 3, areas: ['upper-back', 'hips-legs'], floor: true, desk: false,
    steps: ['企定，蹲低到手可以撐地', '膝頭放喺上臂', '重心慢慢移前，腳自然浮起', '慢慢放返低，企起身'],
    why: '訓練上身承重同平衡。', caution: '手腕有傷唔好做，先用地毯。',
  },
  'single-arm-drop-rebound': {
    name: '單手放落彈返', kind: '爆發', level: 3, areas: ['neck', 'upper-back'], floor: false, desk: false,
    steps: ['手心向面，舉高一隻手', '突然放鬆手肘，手臂落下', '借反彈令手臂自然彈返上嚟', '換手'],
    why: '學識放鬆再借力，唔使死谷。', caution: STOP,
  },
  'spine-spiral-arm-swing': {
    name: '扭身甩手', kind: '爆發', level: 2, areas: ['lower-back', 'upper-back'], floor: false, desk: true,
    steps: ['膝微曲，雙手放鬆', '背骨左右扭，手跟住被甩', '逐漸加快，轉向要利落', '手臂纏住身體，似手鼓'],
    why: '扭轉令背部鬆開，同時練傳力。', caution: STOP,
  },
  'hip-catch-reaction': {
    name: '提膝落地接力', kind: '爆發', level: 3, areas: ['hips-legs', 'lower-back'], floor: false, desk: false,
    steps: ['一隻手按心口，一隻手按鼠蹊', '重心移去一隻腳，約承 7、8 成體重', '一下子放鬆，向下落', '用髖關節接住衝力，換腳'],
    why: '練髖位吸收衝力，膝頭同腰就少受震。', caution: '膝頭痛唔好做。',
  },
  'tiptoe-heel-drop': {
    name: '踮腳跟落地', kind: '爆發', level: 2, areas: ['hips-legs'], floor: false, desk: false,
    steps: ['開肩闊，體重平均', '踮高腳尖', '突然放鬆，腳踭落地', '膝、腰、頸都唔應該覺得震'],
    why: '練習分散落地衝力。', caution: '有骨質疏鬆或者腳踭痛唔好做。',
  },
  'drop-step-stamp': {
    name: '抽腳落地踏', kind: '爆發', level: 3, areas: ['hips-legs'], floor: false, desk: false,
    steps: ['左腳企，右膝提起', '放鬆支撐腳，全身向下', '前腳大力踏地', '返單腳企，換邊'],
    why: '用重力發力，唔係用肌肉硬推。', caution: STOP,
  },
  'drop-propel-start': {
    name: '放手前衝起步', kind: '爆發', level: 3, areas: ['hips-legs'], floor: false, desk: false,
    steps: ['企定，雙手舉高', '手放落，順勢抽走一隻腳', '再抽另一隻，向前衝出去', '行幾步，返起點'],
    why: '練習起步嘅傳力。', caution: STOP,
  },
  'half-squat-rebound': {
    name: '半蹲彈起', kind: '爆發', level: 2, areas: ['hips-legs', 'lower-back'], floor: false, desk: false,
    steps: ['兩腳打開，蹲低一半', '上半身帶動，細幅上下郁', '膝頭周圍唔使用力', '借地面反力彈起'],
    checks: ['腰圓咗'],
    why: '練彈性，令落地唔再重。', caution: '膝頭痛就停。',
  },
  'pelvis-rotation-punch': {
    name: '轉腰出拳', kind: '爆發', level: 2, areas: ['lower-back', 'upper-back'], floor: false, desk: false,
    steps: ['擺好架式，一邊膊同腰向後引', '盤骨自己轉返嚟，帶住一拳出', '最後一刻急停', '返架式，換邊'],
    why: '學識用盤骨發力，唔使靠手。', caution: STOP,
  },
  'drop-high-knee-jump': {
    name: '落地高抬腿跳', kind: '爆發', level: 3, areas: ['hips-legs'], floor: false, desk: false,
    steps: ['單腳企，全身放鬆', '支撐腳突然放鬆向下', '借反動高抬腿跳，膝貼向胸', '用大腿後面落地，換邊'],
    why: '練爆發力同落地控制。', caution: '膝頭有傷唔好做。',
  },
  'drop-side-burst': {
    name: '側向衝步', kind: '爆發', level: 3, areas: ['hips-legs'], floor: false, desk: false,
    steps: ['自然企，膝微曲', '向一邊抽腳，頭唔好郁', '落低之後一瞬蹬地衝出去', '急停，返起點'],
    why: '橫向移動嘅爆發訓練。', caution: '地面要平，唔好穿滑鞋。',
  },
  'single-leg-z-jump': {
    name: '單腳Z字跳', kind: '爆發', level: 3, areas: ['hips-legs'], floor: false, desk: false,
    steps: ['單腳企', '放鬆落低，用大腿後面接住', '斜前方跳，手用力揈', '另一隻腳落地，成 Z 字形'],
    why: '將力量變成方向轉換嘅能力。', caution: '地面要平，企唔穩唔好做。',
  },
};
