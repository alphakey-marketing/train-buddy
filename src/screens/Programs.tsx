// 課程詳情：7 日列表。做晒就建議下一個課程。
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EXERCISES, plainName } from '../data/exercises';
import { PROGRAMS, Program, isFinished, nextDay, progress, resetProgram } from '../data/programs';
import { secondsOf } from '../lib/prescribe';
import { Button, C, HAIR, SERIF } from '../ui/theme';

export const minutesOf = (ids: string[]) =>
  Math.max(1, Math.round(ids.reduce((s, id) => s + secondsOf(EXERCISES.find((e) => e.id === id)!), 0) / 60));

const no = (i: number) => String(i + 1).padStart(2, '0');
const nameOf = (id: string) => plainName(EXERCISES.find((e) => e.id === id) ?? { name: id });

export function ProgramDetail({
  program,
  onStart,
  onBack,
  onOpen,
}: {
  program: Program;
  onStart: (day: number) => void;
  onBack: () => void;
  onOpen: (p: Program) => void;
}) {
  const [, bump] = useState(0);
  const done = progress()[program.id]?.done ?? [];
  const next = nextDay(program.id);
  const finished = next >= 7;
  // 下一個建議：同場景、未做晒嘅課程優先
  const after = PROGRAMS.filter((p) => p.id !== program.id && !isFinished(p.id)).sort(
    (a, b) => Number(b.setting === program.setting) - Number(a.setting === program.setting),
  )[0];
  return (
    <ScrollView style={s.root} contentContainerStyle={s.pad}>
      <Pressable onPress={onBack}>
        <Text style={s.back}>‹ 主頁</Text>
      </Pressable>
      <Text style={s.kicker}>七日課程 · {program.setting === 'office' ? '寫字樓' : '屋企'}</Text>
      <Text style={s.h1}>{program.name}</Text>
      <Text style={s.p}>{program.blurb}</Text>
      <Text style={s.fine}>每日約 3–5 分鐘。拉筋每邊停 20–30 秒，活動就慢慢郁；唔痛先繼續。一日做一課，隔日做都得。</Text>
      {finished && (
        <View style={s.done}>
          <Text style={s.doneTitle}>七日完成！</Text>
          <Text style={s.doneText}>做得好。可以再做一次鞏固，或者試下一個課程。順便重新做一次身體測試，睇下有冇鬆咗。</Text>
          {after && <Button label={`下一個：${after.name}`} onPress={() => onOpen(after)} />}
          <Button
            label="由第 1 日再嚟"
            kind="ghost"
            onPress={() => {
              resetProgram(program.id);
              bump((n) => n + 1);
            }}
          />
        </View>
      )}
      <View style={s.rule} />
      {program.days.map((d, i) => {
        const ok = done.includes(i);
        return (
          <Pressable key={i} onPress={() => onStart(i)} style={s.row}>
            <Text style={[s.rowNo, ok && { color: C.calm }, i === next && { color: C.accent }]}>{no(i)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.rowTitle, ok && { color: C.mute }]}>{d.title}</Text>
              <Text style={s.rowSub}>{d.ids.map(nameOf).join('、')}</Text>
            </View>
            <Text style={[s.rowRight, ok && { color: C.calm }, i === next && { color: C.accent }]}>
              {ok ? '完成 ✓' : i === next ? '今日' : `${minutesOf(d.ids)} 分鐘`}
            </Text>
          </Pressable>
        );
      })}
      <View style={{ height: 16 }} />
      {!finished && <Button label={`開始第 ${next + 1} 日`} onPress={() => onStart(next)} />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  pad: { padding: 22, paddingTop: 44, gap: 0, paddingBottom: 48 },
  rule: { height: HAIR, backgroundColor: C.line, marginTop: 16, marginBottom: 4 },
  kicker: { fontSize: 12, color: C.accent, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'baseline', gap: 14, paddingVertical: 14, borderBottomWidth: HAIR, borderColor: C.line },
  rowNo: { fontFamily: SERIF, fontSize: 15, color: C.mute, width: 24, fontVariant: ['tabular-nums'] },
  rowTitle: { fontFamily: SERIF, fontSize: 19, fontWeight: '800', color: C.text },
  rowSub: { fontSize: 13, color: C.mute, lineHeight: 19, marginTop: 3 },
  rowRight: { fontSize: 12, color: C.mute, letterSpacing: 1 },
  back: { fontSize: 15, color: C.sub, marginBottom: 18, paddingVertical: 6 },
  h1: { fontFamily: SERIF, fontSize: 34, fontWeight: '900', color: C.text, lineHeight: 42 },
  p: { fontSize: 16, color: C.sub, lineHeight: 25, marginTop: 8 },
  fine: { fontSize: 13, color: C.mute, lineHeight: 20, marginTop: 8 },
  done: { backgroundColor: C.panel, borderRadius: 18, padding: 16, gap: 10, marginTop: 16, borderWidth: HAIR, borderColor: C.line },
  doneTitle: { fontFamily: SERIF, fontSize: 22, fontWeight: '900', color: C.calm },
  doneText: { fontSize: 14, color: C.sub, lineHeight: 21 },
});
