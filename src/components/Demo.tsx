// 動作示範：2D 或者 3D 公仔，同一個介面
import { lazy, Suspense, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Exercise } from '../data/exercises';
import { viewFor } from '../lib/motion';
import { load, save } from '../lib/storage';
import { C } from '../ui/theme';
import { Figure2D } from './Figure2D';
import type { ViewAngle } from './TrainerScene';

// 3D 好重（three.js + 模型），分開一個檔載入，揀 2D 就唔使下載
export const TrainerScene = lazy(() => import('./TrainerScene').then((m) => ({ default: m.TrainerScene })));

export type DemoMode = '2d' | '3d';

// 預設 3D（用家覺得易睇啲），記住上次揀咩
export function useDemoMode() {
  const [mode, setMode] = useState<DemoMode>(() => load<DemoMode>('demoMode', '3d'));
  const toggle = () =>
    setMode((m) => {
      const next = m === '2d' ? '3d' : '2d';
      save('demoMode', next);
      return next;
    });
  return [mode, toggle] as const;
}
export type DemoView = ViewAngle | 'auto';

type Props = {
  mode: DemoMode;
  exercise: Exercise;
  playing: boolean;
  speed: number;
  view: DemoView;
  onCue: (cue: string) => void;
  onRep: (reps: number) => void;
  headroom?: number; // 3D 畫面頂留白（畀疊喺上面嘅字）
  footroom?: number; // 3D 畫面底留白
};

export function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );
}

export function Demo({ mode, view, headroom, footroom, ...rest }: Props) {
  if (mode === '2d') return <Figure2D {...rest} view={view === 'auto' ? viewFor(rest.exercise) : view} />;
  // 3D 自動：用背面（原本預設）
  return (
    <Suspense fallback={<Loading />}>
      <TrainerScene {...rest} headroom={headroom} footroom={footroom} view={view === 'auto' ? 'back' : view} />
    </Suspense>
  );
}
