// 主頁：今日推薦（大卡）→ 七日課程 → 快練。暖色淺色，同其他頁一致
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EXERCISES, plainName } from '../data/exercises';
import { PROGRAMS, Program, Quick, QUICKS, isFinished, nextDay, progress, recommend } from '../data/programs';
import { THUMBS } from '../data/thumbs';
import { Area } from '../data/types';
import { Tightness } from '../lib/bodyTest';
import { streak } from '../lib/history';
import { C, SERIF } from '../ui/theme';
import { minutesOf } from './Programs';

// 課程封面：用該課程代表動作嘅相
const COVER: Record<string, string> = {
  'neck-shoulder': 'upper-trap-stretch',
  'lower-back': 'child-pose',
  'office-back': 'seated-figure4',
  wrist: 'wrist-flexor-stretch',
  'hips-legs': 'low-lunge',
  'office-reset': 'chin-tuck',
  'lunch-2': 'shoulder-roll',
  'home-relax': 'hamstring-chair',
  bedtime: 'supine-figure4',
};

function Pic({ id, style }: { id?: string; style: object }) {
  const src = id ? THUMBS[id] : undefined;
  return src ? <Image source={src} style={style} resizeMode="cover" /> : <View style={[style, { backgroundColor: C.card }]} />;
}

const nameOf = (id: string) => plainName(EXERCISES.find((e) => e.id === id) ?? { name: id });

export function HubNike({
  tightness,
  pain,
  setting,
  onProgram,
  onQuick,
  onCustom,
  onMap,
  onLibrary,
}: {
  tightness: Tightness;
  pain?: Area;
  setting?: 'office' | 'home';
  onProgram: (p: Program) => void;
  onQuick: (q: Quick) => void;
  onCustom: () => void;
  onMap: () => void;
  onLibrary: () => void;
}) {
  const rec = recommend(tightness, pain, setting);
  const prog = progress();
  const allDone = isFinished(rec.id); // 所有課程都做晒先會推薦一個做完咗嘅
  const n = Math.min(nextDay(rec.id), 6);
  const today = rec.days[n];
  const others = PROGRAMS.filter((p) => p.id !== rec.id);
  const days = streak();
  const dayOf = (p: Program) => (isFinished(p.id) ? '已完成' : prog[p.id] ? `做到第 ${nextDay(p.id) + 1} 日` : '7 日');
  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={s.bar}>
        <Text style={s.logo}>身體動</Text>
        <Text style={s.streak}>{days > 0 ? `連續 ${days} 日` : '今日開始第 1 日'}</Text>
      </View>

      <Pressable onPress={() => onProgram(rec)} style={s.hero}>
        <Pic id={COVER[rec.id]} style={s.heroImg} />
        <View style={s.shade} />
        <View style={s.heroText}>
          <Text style={s.tag}>{allDone ? '全部完成 · 可以再做一次' : `今日推薦 · 第 ${n + 1} / 7 日`}</Text>
          <Text style={s.heroTitle}>{rec.name}</Text>
          <Text style={s.heroSub}>
            {today.title} · {minutesOf(today.ids)} 分鐘
          </Text>
        </View>
      </Pressable>

      <View style={s.strip}>
        {today.ids.map((id) => (
          <View key={id} style={s.stripItem}>
            <Pic id={id} style={s.stripImg} />
            <Text style={s.stripName} numberOfLines={2}>
              {nameOf(id)}
            </Text>
          </View>
        ))}
      </View>

      <Pressable onPress={() => onProgram(rec)} style={s.cta}>
        <Text style={s.ctaText}>{prog[rec.id] && !allDone ? `繼續 · 第 ${n + 1} 日` : '開始課程'}</Text>
      </Pressable>

      <Text style={s.h}>七日課程</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList}>
        {others.map((p) => (
          <Pressable key={p.id} onPress={() => onProgram(p)} style={s.card}>
            <Pic id={COVER[p.id]} style={s.cardImg} />
            <View style={s.cardShade} />
            <Text style={s.cardTitle}>{p.name}</Text>
            <Text style={s.cardSub}>
              {p.setting === 'office' ? '寫字樓' : '屋企'} · {dayOf(p)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={s.h}>快練</Text>
      {QUICKS.map((q) => (
        <Pressable key={q.id} onPress={() => onQuick(q)} style={s.qRow}>
          <Pic id={COVER[q.id]} style={s.qImg} />
          <View style={{ flex: 1 }}>
            <Text style={s.qTitle}>{q.name}</Text>
            <Text style={s.qSub}>{q.blurb}</Text>
          </View>
          <Text style={s.qMin}>{minutesOf(q.ids)} 分</Text>
        </Pressable>
      ))}

      <View style={s.foot}>
        <Pressable onPress={onCustom}>
          <Text style={s.footLink}>自訂</Text>
        </Pressable>
        <Pressable onPress={onMap}>
          <Text style={s.footLink}>身體地圖</Text>
        </Pressable>
        <Pressable onPress={onLibrary}>
          <Text style={s.footLink}>動作庫</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 36, paddingBottom: 12 },
  logo: { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: 2, fontFamily: SERIF },
  streak: { color: C.calm, fontSize: 13, fontWeight: '800' },
  hero: { height: 340, justifyContent: 'flex-end', overflow: 'hidden', marginHorizontal: 18, borderRadius: 22, backgroundColor: C.card },
  heroImg: { ...(StyleSheet.absoluteFill as object), width: '100%', height: '100%' },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 140, backgroundColor: 'rgba(31,36,48,0.55)' },
  heroText: { padding: 18, gap: 4 },
  tag: { color: '#ffd9cc', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: '#fff', fontSize: 34, fontWeight: '900', lineHeight: 42, fontFamily: SERIF },
  heroSub: { color: '#f3eee8', fontSize: 14, fontWeight: '600' },
  strip: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingTop: 12 },
  stripItem: { flex: 1, gap: 6 },
  stripImg: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  stripName: { color: C.sub, fontSize: 11, fontWeight: '600', lineHeight: 15 },
  cta: { backgroundColor: C.accent, marginHorizontal: 18, marginTop: 16, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: C.onDark, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  h: { color: C.text, fontSize: 22, fontWeight: '900', paddingHorizontal: 18, marginTop: 30, marginBottom: 12, fontFamily: SERIF },
  hList: { gap: 10, paddingHorizontal: 18 },
  card: { width: 180, height: 230, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 18, padding: 12, backgroundColor: C.card },
  cardImg: { ...(StyleSheet.absoluteFill as object), width: '100%', height: '100%' },
  cardShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, backgroundColor: 'rgba(31,36,48,0.55)' },
  cardTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  cardSub: { color: '#f3eee8', fontSize: 12, fontWeight: '700', marginTop: 2 },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 8 },
  qImg: { width: 76, height: 76, borderRadius: 14 },
  qTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  qSub: { color: C.mute, fontSize: 12, marginTop: 3 },
  qMin: { color: C.accent, fontSize: 16, fontWeight: '900' },
  foot: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 28, paddingTop: 18, borderTopWidth: 1, borderColor: C.line, marginHorizontal: 18 },
  footLink: { color: C.text, fontSize: 14, fontWeight: '800', letterSpacing: 1, paddingVertical: 6 },
});
