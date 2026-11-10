// 練完：打分 → 前後對比 → 連續日數同每日提醒
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pressable } from 'react-native';
import { Button, C } from '../ui/theme';
import { Scale } from './Onboarding';

export function RateAfter({ before, onSubmit }: { before: number; onSubmit: (after: number) => void }) {
  const [after, setAfter] = useState(Math.max(0, before - 2));
  return (
    <View style={s.root}>
      <Text style={s.h1}>做完喇 🎉</Text>
      <Text style={s.p}>而家嗰度有幾緊或者痛？（0 = 冇事，10 = 好痛）</Text>
      <Text style={s.hint}>做之前你打咗 {before} 分</Text>
      <Scale value={after} onChange={setAfter} />
      <Button label="睇結果" onPress={() => onSubmit(after)} />
    </View>
  );
}

const TIMES = ['08:30', '12:30', '15:30', '18:30'];

export function Done({
  before,
  after,
  streakDays,
  reminder,
  onReminder,
  onHome,
}: {
  before: number;
  after: number;
  streakDays: number;
  reminder: string | null;
  onReminder: (t: string) => void;
  onHome: () => void;
}) {
  const diff = before - after;
  return (
    <View style={s.root}>
      <Text style={s.h1}>{diff > 0 ? `緊度由 ${before} 跌到 ${after}` : '多謝你練完'}</Text>
      <Text style={s.p}>
        {diff > 0 ? '你感覺鬆咗，繼續每日 5 分鐘，會愈來愈鬆。' : '一次未必覺得分別，連續幾日再比較。'}
      </Text>
      <View style={s.card}>
        <Text style={s.big}>🔥 連續第 {streakDays} 日</Text>
        <Text style={s.hint}>聽日再練，我哋會幫你揀新嘅一套。</Text>
      </View>
      <Text style={s.label}>每日提醒（暫時只記低，網頁推送之後加）</Text>
      <View style={s.wrap}>
        {TIMES.map((t) => (
          <Pressable key={t} onPress={() => onReminder(t)} style={[s.chip, reminder === t && s.chipOn]}>
            <Text style={[s.chipText, reminder === t && { color: C.onDark }]}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <Button label="返主頁" onPress={onHome} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 80, gap: 16 },
  h1: { color: C.text, fontSize: 30, fontWeight: '800' },
  p: { color: C.sub, fontSize: 16, lineHeight: 24 },
  hint: { color: C.mute, fontSize: 13 },
  label: { color: C.mute, fontSize: 13 },
  card: { backgroundColor: C.panel, borderRadius: 16, padding: 16, gap: 4 },
  big: { color: C.text, fontSize: 22, fontWeight: '700' },
  wrap: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: C.card },
  chipOn: { backgroundColor: C.text },
  chipText: { color: C.sub, fontSize: 15, fontWeight: '600' },
});
