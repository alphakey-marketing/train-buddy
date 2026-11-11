// 動作示範：3D 公仔
import { lazy, Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Exercise } from '../data/exercises';
import { C } from '../ui/theme';
import type { ViewAngle } from './TrainerScene';

// 3D 好重（three.js + 模型），分開一個檔載入
export const TrainerScene = lazy(() => import('./TrainerScene').then((m) => ({ default: m.TrainerScene })));

export type DemoView = ViewAngle | 'auto';

type Props = {
  exercise: Exercise;
  playing: boolean;
  speed: number;
  view: DemoView;
  onCue: (cue: string) => void;
  onRep: (reps: number) => void;
  headroom?: number; // 畫面頂留白（畀疊喺上面嘅字）
  footroom?: number; // 畫面底留白
  hold?: number; // 拉筋停幾耐（秒）
  seek?: number; // 播放器嘅時間
  freeze?: number;
  onStats?: (s: { err: number; low: number }) => void;
};

export function Loading() {
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={C.accent} />
    </View>
  );
}

export function Demo({ view, ...rest }: Props) {
  // 自動：用動作自己指定嘅角度，冇就用背面
  return (
    <Suspense fallback={<Loading />}>
      <TrainerScene {...rest} view={view === 'auto' ? (rest.exercise.view ?? 'back') : view} />
    </Suspense>
  );
}
