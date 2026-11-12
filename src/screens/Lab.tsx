// 開發用：?lab=動作id&t=秒&v=front|side|back 定住某一秒睇姿勢，同埋顯示手腳離目標幾遠、最低點離地幾高。
// 之後可以用 #lab=id&t=秒&v=角度 即時換動作（唔使重載）；#list=1 列晒所有動作同循環長度。
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { EXERCISES } from '../data/exercises';
import { TrainerScene } from '../components/Demo';
import { C } from '../ui/theme';
import type { ViewAngle } from '../components/TrainerScene';

const fromHash = () => new URLSearchParams(typeof location !== 'undefined' ? location.hash.slice(1) : '');

export function Lab({ query }: { query: URLSearchParams }) {
  const [q, setQ] = useState(() => {
    const h = fromHash();
    return h.has('lab') || h.has('list') ? h : query;
  });
  useEffect(() => {
    const f = () => {
      const h = fromHash();
      if (h.has('lab') || h.has('list')) setQ(h);
    };
    window.addEventListener('hashchange', f);
    return () => window.removeEventListener('hashchange', f);
  }, []);
  const [st, setSt] = useState({ err: 0, low: 0 });
  if (q.has('list')) {
    const rows = EXERCISES.map((e) => ({
      id: e.id,
      name: e.name,
      cycle: e.hold ? e.hold.seconds : e.keyframes[e.keyframes.length - 1].at,
      hold: !!e.hold,
      view: e.view ?? 'front',
    }));
    return <Text testID="list">{'LIST' + JSON.stringify(rows)}</Text>;
  }
  const ex = EXERCISES.find((e) => e.id === q.get('lab')) ?? EXERCISES[0];
  const t = Number(q.get('t') ?? 8);
  const v = (q.get('v') ?? ex.view ?? 'front') as ViewAngle;
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {/* clean=1：影縮圖用，唔顯示數字 */}
      {!q.has('clean') && (
        <Text style={{ padding: 8, color: C.text }}>
          {ex.id} t={t} v={v} 手離目標={(st.err * 100).toFixed(1)}cm 最低點離地={(st.low * 100).toFixed(1)}cm
        </Text>
      )}
      <TrainerScene exercise={ex} playing={false} speed={1} view={v} onCue={() => {}} onRep={() => {}} hold={ex.hold?.seconds} freeze={t} onStats={setSt} />
    </View>
  );
}
