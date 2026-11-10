// 動作示範：2D 或者 3D 公仔，同一個介面
import { lazy, Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Exercise } from '../data/exercises';
import { viewFor } from '../lib/motion';
import { C } from '../ui/theme';
import { Figure2D } from './Figure2D';
import type { ViewAngle } from './TrainerScene';

// 3D 好重（three.js + 模型），撳轉 3D 先載入
const TrainerScene = lazy(() => import('./TrainerScene').then((m) => ({ default: m.TrainerScene })));

export type DemoMode = '2d' | '3d';
export type DemoView = ViewAngle | 'auto';

type Props = {
  mode: DemoMode;
  exercise: Exercise;
  playing: boolean;
  speed: number;
  view: DemoView;
  onCue: (cue: string) => void;
  onRep: (reps: number) => void;
};

function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );
}

export function Demo({ mode, view, ...rest }: Props) {
  if (mode === '2d') return <Figure2D {...rest} view={view === 'auto' ? viewFor(rest.exercise) : view} />;
  // 3D 自動：用背面（原本預設）
  return (
    <Suspense fallback={<Loading />}>
      <TrainerScene {...rest} view={view === 'auto' ? 'back' : view} />
    </Suspense>
  );
}
