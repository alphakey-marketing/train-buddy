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
  name: string; // 中文名
  en: string;
};

export const MUSCLES: Record<MuscleId, MuscleInfo> = {
  traps: { id: 'traps', name: '斜方肌', en: 'Trapezius' },
  shoulders: { id: 'shoulders', name: '三角肌', en: 'Deltoids' },
  lats: { id: 'lats', name: '背闊肌', en: 'Latissimus dorsi' },
  erectors: { id: 'erectors', name: '豎脊肌', en: 'Erector spinae' },
  chest: { id: 'chest', name: '胸大肌', en: 'Pectorals' },
  abs: { id: 'abs', name: '腹直肌', en: 'Rectus abdominis' },
  obliques: { id: 'obliques', name: '腹斜肌', en: 'Obliques' },
  biceps: { id: 'biceps', name: '二頭肌', en: 'Biceps' },
  triceps: { id: 'triceps', name: '三頭肌', en: 'Triceps' },
  glutes: { id: 'glutes', name: '臀大肌', en: 'Glutes' },
  quads: { id: 'quads', name: '股四頭肌', en: 'Quadriceps' },
  hamstrings: { id: 'hamstrings', name: '膕繩肌', en: 'Hamstrings' },
  calves: { id: 'calves', name: '小腿肌', en: 'Calves' },
  feet: { id: 'feet', name: '足底肌', en: 'Foot intrinsics' },
  psoas: { id: 'psoas', name: '髂腰肌', en: 'Iliopsoas' },
  rotatorCuff: { id: 'rotatorCuff', name: '旋轉肌袖', en: 'Rotator cuff' },
  neck: { id: 'neck', name: '頸後同提肩胛肌', en: 'Neck extensors / levator scapulae' },
  forearms: { id: 'forearms', name: '前臂肌', en: 'Forearm flexors / extensors' },
  adductors: { id: 'adductors', name: '大腿內側', en: 'Adductors' },
};
