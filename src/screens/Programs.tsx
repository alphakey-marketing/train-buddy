// 主頁：今日推薦、我嘅課程、快練、自訂。課程詳情：7 日列表。
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EXERCISES } from '../data/exercises';
import { PROGRAMS, Program, Quick, QUICKS, nextDay, progress, recommend } from '../data/programs';
import { Tightness } from '../lib/bodyTest';
import { secondsOf } from '../lib/prescribe';
import { Button, C } from '../ui/theme';

export const minutesOf = (ids: string[]) =>
  Math.max(1, Math.round(ids.reduce((s, id) => s + secondsOf(EXERCISES.find((e) => e.id === id)!), 0) / 60));

function Card({ title, sub, onPress, accent }: { title: string; sub: string; onPress: () => void; accent?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[s.card, accent && s.cardAccent]}>
      <Text style={[s.cardTitle, accent && { color: C.onDark }]}>{title}</Text>
      <Text style={[s.cardSub, accent && { color: C.onDark }]}>{sub}</Text>
    </Pressable>
  );
}

export function Hub({
  tightness,
  onProgram,
  onQuick,
  onCustom,
  onMap,
  onLibrary,
}: {
  tightness: Tightness;
  onProgram: (p: Program) => void;
  onQuick: (q: Quick) => void;
  onCustom: () => void;
  onMap: () => void;
  onLibrary: () => void;
}) {
  const rec = recommend(tightness);
  const prog = progress();
  const mine = PROGRAMS.filter((p) => prog[p.id]);
  const label = (p: Program) => {
    const n = nextDay(p.id);
    return n >= 7 ? '已完成 7/7 ✅' : `第 ${n + 1} 日 · ${p.days[n].title} · 已做 ${prog[p.id]?.done.length ?? 0}/7`;
  };
  return (
    <ScrollView style={s.root} contentContainerStyle={s.pad}>
      <Text style={s.h1}>今日練咩？</Text>
      <Text style={s.h3}>為你推薦</Text>
      <Card accent title={`${rec.emoji} ${rec.name}`} sub={prog[rec.id] ? label(rec) : `7 日課程 · 每日 3–5 分鐘 · ${rec.blurb}`} onPress={() => onProgram(rec)} />
      {mine.length > 0 && (
        <>
          <Text style={s.h3}>我嘅課程</Text>
          {mine.map((p) => (
            <Card key={p.id} title={`${p.emoji} ${p.name}`} sub={label(p)} onPress={() => onProgram(p)} />
          ))}
        </>
      )}
      <Text style={s.h3}>全部課程（7 日）</Text>
      {PROGRAMS.filter((p) => p.id !== rec.id && !prog[p.id]).map((p) => (
        <Card key={p.id} title={`${p.emoji} ${p.name}`} sub={`${p.setting === 'office' ? '🏢 寫字樓' : '🏠 屋企'} · ${p.blurb}`} onPress={() => onProgram(p)} />
      ))}
      <Text style={s.h3}>快練（一次過）</Text>
      {QUICKS.map((q) => (
        <Card key={q.id} title={`${q.emoji} ${q.name} · ${minutesOf(q.ids)} 分鐘`} sub={q.blurb} onPress={() => onQuick(q)} />
      ))}
      <View style={{ height: 8 }} />
      <Button label="自訂（揀部位、地點、時間）" kind="ghost" onPress={onCustom} />
      <Button label="身體地圖／重新測試" kind="ghost" onPress={onMap} />
      <Button label="動作庫" kind="ghost" onPress={onLibrary} />
    </ScrollView>
  );
}

export function ProgramDetail({ program, onStart, onBack }: { program: Program; onStart: (day: number) => void; onBack: () => void }) {
  const done = progress()[program.id]?.done ?? [];
  const next = nextDay(program.id);
  return (
    <ScrollView style={s.root} contentContainerStyle={s.pad}>
      <Text style={s.h1}>
        {program.emoji} {program.name}
      </Text>
      <Text style={s.p}>{program.blurb}</Text>
      <Text style={s.p}>每日約 3–5 分鐘，每個動作每邊停 20–40 秒，唔痛先繼續。一日做一課，隔日做都得。</Text>
      {program.days.map((d, i) => {
        const ok = done.includes(i);
        return (
          <Pressable key={i} onPress={() => onStart(i)} style={[s.card, i === next && s.cardAccent]}>
            <Text style={[s.cardTitle, i === next && { color: C.onDark }]}>
              {ok ? '✅' : i === next ? '▶️' : '⚪'} 第 {i + 1} 日 · {d.title} · {minutesOf(d.ids)} 分鐘
            </Text>
            <Text style={[s.cardSub, i === next && { color: C.onDark }]}>{d.ids.map((id) => EXERCISES.find((e) => e.id === id)?.name).join(' · ')}</Text>
          </Pressable>
        );
      })}
      <Button label={next >= 7 ? '再做一次第 7 日' : `開始第 ${next + 1} 日`} onPress={() => onStart(Math.min(next, 6))} />
      <Button label="返回" kind="ghost" onPress={onBack} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  pad: { padding: 16, paddingTop: 48, gap: 10 },
  h1: { fontSize: 26, fontWeight: '800', color: C.text },
  h3: { fontSize: 15, fontWeight: '700', color: C.sub, marginTop: 8 },
  p: { fontSize: 15, color: C.sub, lineHeight: 22 },
  card: { backgroundColor: C.card, borderRadius: 16, padding: 14, gap: 4 },
  cardAccent: { backgroundColor: C.text },
  cardTitle: { fontSize: 17, fontWeight: '700', color: C.text },
  cardSub: { fontSize: 14, color: C.sub, lineHeight: 20 },
});
