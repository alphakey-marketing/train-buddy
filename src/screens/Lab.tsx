// 開發用：?lab=動作id&t=秒&v=front|side|back 定住某一秒睇姿勢，同埋顯示手腳離目標幾遠、最低點離地幾高。
import { useState } from 'react';
import { Text, View } from 'react-native';
import { EXERCISES } from '../data/exercises';
import { TrainerScene } from '../components/Demo';
import { C } from '../ui/theme';
import type { ViewAngle } from '../components/TrainerScene';

export function Lab({ query }: { query: URLSearchParams }) {
  const ex = EXERCISES.find((e) => e.id === query.get('lab')) ?? EXERCISES[0];
  const t = Number(query.get('t') ?? 8);
  const v = (query.get('v') ?? ex.view ?? 'front') as ViewAngle;
  const [st, setSt] = useState({ err: 0, low: 0 });
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <Text style={{ padding: 8, color: C.text }}>
        {ex.id} t={t} v={v} 手離目標={(st.err * 100).toFixed(1)}cm 最低點離地={(st.low * 100).toFixed(1)}cm
      </Text>
      <TrainerScene exercise={ex} playing={false} speed={1} view={v} onCue={() => {}} onRep={() => {}} hold={ex.hold?.seconds} freeze={t} onStats={setSt} />
    </View>
  );
}
