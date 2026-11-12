export type MuscleId =
  | 'traps'
  | 'shoulders'
  | 'lats'
  | 'erectors'
  | 'chest'
  | 'abs'
  | 'obliques'
  | 'biceps'
  | 'triceps'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'
  | 'feet'
  | 'psoas'
  | 'rotatorCuff'
  | 'neck'
  | 'forearms'
  | 'adductors';

export type MuscleInfo = {
  id: MuscleId;
  name: string; // 中文名（專業）
  plain: string; // 日常叫法，俾用家睇
  en: string;
};

export const MUSCLES: Record<MuscleId, MuscleInfo> = {
  traps: { id: 'traps', name: '斜方肌', plain: '頸側同膊頭', en: 'Trapezius' },
  shoulders: { id: 'shoulders', name: '三角肌', plain: '膊頭', en: 'Deltoids' },
  lats: { id: 'lats', name: '背闊肌', plain: '背脊兩側', en: 'Latissimus dorsi' },
  erectors: { id: 'erectors', name: '豎脊肌', plain: '腰背', en: 'Erector spinae' },
  chest: { id: 'chest', name: '胸大肌', plain: '胸口', en: 'Pectorals' },
  abs: { id: 'abs', name: '腹直肌', plain: '肚', en: 'Rectus abdominis' },
  obliques: { id: 'obliques', name: '腹斜肌', plain: '腰側', en: 'Obliques' },
  biceps: { id: 'biceps', name: '二頭肌', plain: '手臂前面', en: 'Biceps' },
  triceps: { id: 'triceps', name: '三頭肌', plain: '手臂後面', en: 'Triceps' },
  glutes: { id: 'glutes', name: '臀大肌', plain: '屁股', en: 'Glutes' },
  quads: { id: 'quads', name: '股四頭肌', plain: '大腿前面', en: 'Quadriceps' },
  hamstrings: { id: 'hamstrings', name: '膕繩肌', plain: '大腿後面', en: 'Hamstrings' },
  calves: { id: 'calves', name: '小腿肌', plain: '小腿', en: 'Calves' },
  feet: { id: 'feet', name: '足底肌', plain: '腳板底', en: 'Foot intrinsics' },
  psoas: { id: 'psoas', name: '髂腰肌', plain: '大腿根（髖前）', en: 'Iliopsoas' },
  rotatorCuff: { id: 'rotatorCuff', name: '旋轉肌袖', plain: '膊頭後面', en: 'Rotator cuff' },
  neck: { id: 'neck', name: '頸後同提肩胛肌', plain: '後頸', en: 'Neck extensors / levator scapulae' },
  forearms: { id: 'forearms', name: '前臂肌', plain: '前臂手腕', en: 'Forearm flexors / extensors' },
  adductors: { id: 'adductors', name: '大腿內側', plain: '大腿內側', en: 'Adductors' },
};
