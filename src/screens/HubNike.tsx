// 主頁：今日推薦（大卡）→ 七日課程 → 快練。暖色淺色，同其他頁一致
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { EXERCISES, plainName } from '../data/exercises';
import { PROGRAMS, Program, Quick, QUICKS, isFinished, nextDay, progress, recommend } from '../data/programs';
import { THUMBS } from '../data/thumbs';
import { Area } from '../data/types';
import { Tightness } from '../lib/bodyTest';
import { streak } from '../lib/history';
import { C, SERIF } from '../ui/theme';
import { minutesOf } from './Programs';
import { Reminder } from './Reminder';

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
  'seated-break': 'seated-cat-cow',
  'standing-break': 'wall-calf-stretch',
  'gentle-evening': 'seated-thoracic-ext',
  'seated-mobility': 'seated-rotation',
};

// The hero and program cards are much larger than the exercise thumbnails.
const PROGRAM_COVERS = {
  'neck-shoulder': require('../../assets/covers/upper-trap-stretch.jpg'),
  'lower-back': require('../../assets/covers/child-pose.jpg'),
  'office-back': require('../../assets/covers/seated-figure4.jpg'),
  wrist: require('../../assets/covers/wrist-flexor-stretch.jpg'),
  'hips-legs': require('../../assets/covers/low-lunge.jpg'),
} as Record<string, number>;

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
  const [focus, setFocus] = useState('neck');
  const [floor, setFloor] = useState(false);
  const [training, setTraining] = useState(false);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(width, 720);
  const coverHeight = Math.max(160, Math.min(260, (contentWidth - 36) / 1.35));
  const rec = recommend(tightness, pain, setting);
  const prog = progress();
  const allDone = isFinished(rec.id); // 所有課程都做晒先會推薦一個做完咗嘅
  const n = Math.min(nextDay(rec.id), 6);
  const today = rec.days[n];
  const stripHeight = Math.max(36, (contentWidth - 36 - 8 * (today.ids.length - 1)) / today.ids.length);
  const others = PROGRAMS.filter((p) => p.id !== rec.id);
  const days = streak();
  const dayOf = (p: Program) => (isFinished(p.id) ? '已完成' : prog[p.id] ? `做到第 ${nextDay(p.id) + 1} 日` : '7 日');
  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 40, width: '100%', maxWidth: 720, alignSelf: 'center' }}>
      <View style={s.bar}>
        <Text style={s.logo}>身體動</Text>
        <Text style={s.streak}>{days > 0 ? `連續 ${days} 日` : '今日開始第 1 日'}</Text>
      </View>
      <View style={s.foot}>
        <Pressable accessibilityRole="button" onPress={onCustom}><Text style={s.footLink}>自訂練習</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onMap}><Text style={s.footLink}>身體地圖</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onLibrary}><Text style={s.footLink}>動作庫</Text></Pressable>
      </View>

      <View style={{padding:18,gap:12}}>
        <Text style={s.h}>而家想鬆邊度？</Text>
        <View style={{flexDirection:'row',flexWrap:'wrap',gap:12}}>{[['neck','頸肩'],['hips','腰髖'],['all','全身']].map(([id,label]) => <Pressable key={id} accessibilityRole="radio" accessibilityState={{selected:focus===id}} onPress={() => setFocus(id)} style={{padding:12,minHeight:44,backgroundColor:focus===id?C.card:C.panel}}><Text style={{color:C.text}}>{label}</Text></Pressable>)}</View>
        <Pressable accessibilityRole="button" onPress={() => setFloor(!floor)} style={{padding:12,minHeight:44}}><Text>{floor ? '可以落地（備穩固椅）' : '坐住做（備穩固椅）'} · 撳此切換</Text></Pressable>
        <Pressable accessibilityRole="button" style={s.cta} onPress={() => onQuick(QUICKS.find(q => q.id === (focus === 'neck' ? 'seated-neck' : focus === 'hips' ? (floor ? 'bedtime' : 'seated-hips') : (floor ? 'bedtime' : 'seated-mobility')))!)}><Text style={s.ctaText}>開始單次放鬆</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => setTraining(!training)} style={{padding:12,minHeight:44}}><Text style={{color:C.accent}}>基礎鍛鍊教學 {training ? '收起' : '展開'}</Text></Pressable>
        {training && <View style={{gap:12}}><Text style={{color:C.text}}>先學動作，按能力試 1 組 5 次，每組休息 60–90 秒；有痛、暈就停。繃緊分數唔代表肌力。</Text><Text style={{color:C.sub}}>深蹲：膝跟腳尖方向、慢慢坐後；容易版扶穩固椅做淺蹲。避免膝內夾。</Text><Text style={{color:C.sub}}>肩推：唔聳肩、唔拗腰；容易版徒手、小幅度舉手。手臂唔使勉強過頭。</Text><Text style={{color:C.sub}}>弓步：扶穩固支撐、小步分腿屈膝；容易版減低幅度。避免趕快落低。</Text><Pressable accessibilityRole="button" onPress={onLibrary} style={{padding:12,minHeight:44}}><Text style={{color:C.accent}}>去動作庫睇示範及錯誤提示</Text></Pressable></View>}
      </View>
      <Pressable accessibilityRole="button" onPress={() => onProgram(rec)} style={s.hero}>
        <Image source={PROGRAM_COVERS[rec.id]} style={[s.heroImg, { height: coverHeight }]} resizeMode="contain" />
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
            <Pic id={id} style={[s.stripImg, { height: stripHeight }]} />
            <Text style={s.stripName} numberOfLines={2}>
              {nameOf(id)}
            </Text>
          </View>
        ))}
      </View>

      <Pressable accessibilityRole="button" onPress={() => onProgram(rec)} style={s.cta}>
        <Text style={s.ctaText}>{prog[rec.id] && !allDone ? `繼續 · 第 ${n + 1} 日` : '開始課程'}</Text>
      </Pressable>
      <Text style={{ color: C.sub, marginHorizontal: 18, marginTop: 10 }}>按你選擇嘅部位同地點推薦；開始前可查看動作同器材。</Text>

      <Text style={s.h}>七日課程</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hList}>
        {others.map((p) => (
          <Pressable key={p.id} accessibilityRole="button" onPress={() => onProgram(p)} style={s.card}>
            <Image source={PROGRAM_COVERS[p.id]} style={s.cardImg} resizeMode="cover" />
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
        <Pressable key={q.id} accessibilityRole="button" accessibilityLabel={q.name} onPress={() => onQuick(q)} style={s.qRow}>
          <Pic id={COVER[q.id]} style={s.qImg} />
          <View style={{ flex: 1 }}>
            <Text style={s.qTitle}>{q.name}</Text>
            <Text style={s.qSub}>{q.blurb}</Text>
          </View>
          <Text style={s.qMin}>{minutesOf(q.ids)} 分</Text>
        </Pressable>
      ))}

      <Reminder />

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  bar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 36, paddingBottom: 12 },
  logo: { color: C.text, fontSize: 22, fontWeight: '900', letterSpacing: 2, fontFamily: SERIF },
  streak: { color: C.calm, fontSize: 13, fontWeight: '800' },
  hero: { overflow: 'hidden', marginHorizontal: 18, borderRadius: 22, backgroundColor: C.card },
  heroImg: { width: '100%', backgroundColor: '#e4e2df' },
  heroText: { paddingHorizontal: 18, paddingVertical: 16, gap: 4 },
  tag: { color: C.accent, fontSize: 14, fontWeight: '800', letterSpacing: 1 },
  heroTitle: { color: C.text, fontSize: 27, fontWeight: '900', lineHeight: 36, fontFamily: SERIF },
  heroSub: { color: C.sub, fontSize: 14, fontWeight: '600' },
  strip: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingTop: 12 },
  stripItem: { flex: 1, gap: 6 },
  stripImg: { width: '100%', borderRadius: 12 },
  stripName: { color: C.sub, fontSize: 14, fontWeight: '600', lineHeight: 20 },
  cta: { backgroundColor: C.accent, marginHorizontal: 18, marginTop: 16, borderRadius: 999, paddingVertical: 16, alignItems: 'center' },
  ctaText: { color: C.onDark, fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  h: { color: C.text, fontSize: 22, fontWeight: '900', paddingHorizontal: 18, marginTop: 30, marginBottom: 12, fontFamily: SERIF },
  hList: { gap: 10, paddingHorizontal: 18 },
  card: { width: 180, height: 230, justifyContent: 'flex-end', overflow: 'hidden', borderRadius: 18, padding: 12, backgroundColor: C.card },
  cardImg: { ...(StyleSheet.absoluteFill as object), width: '100%', height: '100%' },
  cardShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 80, backgroundColor: 'rgba(31,36,48,0.55)' },
  cardTitle: { color: '#fff', fontSize: 19, fontWeight: '900' },
  cardSub: { color: '#f3eee8', fontSize: 14, fontWeight: '700', marginTop: 2 },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, paddingVertical: 8 },
  qImg: { width: 76, height: 76, borderRadius: 14 },
  qTitle: { color: C.text, fontSize: 17, fontWeight: '800' },
  qSub: { color: C.mute, fontSize: 14, marginTop: 3 },
  qMin: { color: C.accent, fontSize: 16, fontWeight: '900' },
  foot: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', columnGap: 12, marginTop: 12, marginBottom: 12, paddingTop: 8, borderTopWidth: 1, borderColor: C.line, marginHorizontal: 18 },
  footLink: { color: C.text, fontSize: 14, fontWeight: '800', paddingVertical: 12 },
});
