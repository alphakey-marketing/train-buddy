// 練完：打分 → 前後對比 → 連續日數
import { useState } from 'react';
import { Platform, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Button, C, HAIR, SERIF } from '../ui/theme';
import { Scale } from './Onboarding';

export function RateAfter({ before, onSubmit, tension, onTension }: { tension: number | null; onTension: (n: number) => void; before: number | null; onSubmit: (after: number | null) => void }) {
  const [after, setAfter] = useState<number | null>(null);
  return (
    <ScrollView contentContainerStyle={s.root}>
      <Text style={s.h1}>做完喇</Text>
      <Text style={s.p}>而家繃緊感？0 = 放鬆，10 = 非常繃緊（可略過）</Text>
      <Scale label="繃緊感 " value={tension} onChange={onTension} />
      <Text style={s.p}>而家痛楚有幾多分？（0 = 冇痛，10 = 非常痛）</Text>
      {before !== null && <Text style={s.hint}>做之前你打咗 {before} 分。請揀返而家嘅感覺。</Text>}
      <Scale value={after} onChange={setAfter} />
      <Button label="睇結果" onPress={() => onSubmit(after)} />
      <Button label="唔評分，繼續" kind="ghost" onPress={() => onSubmit(null)} />
    </ScrollView>
  );
}

export function Done({
  tensionBefore, tensionAfter,
  before,
  after,
  streakDays,
  programNote,
  completedCount,
  totalCount,
  onHome,
}: {
  tensionBefore: number | null; tensionAfter: number | null;
  before: number | null;
  after: number | null;
  streakDays: number;
  programNote?: string; // 課程進度一句，例如「頸肩鬆一鬆 · 完成第 3 / 7 日」
  completedCount: number;
  totalCount: number;
  onHome: () => void;
}) {
  const diff = before !== null && after !== null ? before - after : null;
  const title = diff === null ? '今次練習結束' : diff > 0 ? `由 ${before} 分跌到 ${after} 分` : diff < 0 ? '今次唔適增加咗' : '多謝你練完';
  const body =
    diff === null ? '留意身體感覺，唔舒服就停低。' : diff > 0
      ? '分數反映你此刻嘅感覺；繼續留意身體反應。'
      : diff < 0
        ? '今次唔適增加咗，請停止相關練習，並向醫生或物理治療師尋求意見。'
        : '留意身體反應；如有不適，請停低。';
  return (
    <ScrollView contentContainerStyle={s.root}>
      <Text style={s.h1}>{tensionBefore !== null && tensionAfter !== null ? tensionAfter < tensionBefore ? '鬆咗啲' : tensionAfter === tensionBefore ? '繃緊感差唔多' : '繃緊感增加，今日先休息' : title}</Text>
      {tensionBefore !== null && tensionAfter !== null && <Text style={s.p}>繃緊感 {tensionBefore} → {tensionAfter}；只反映此刻自評。</Text>}
      <Text style={s.p}>{body}</Text>
      <Text style={s.hint}>完成 {completedCount}／{totalCount} 個動作；跳過嘅動作唔計入紀錄。</Text>
      <View style={s.card}>
        <Text style={s.big}>{streakDays ? `連續第 ${streakDays} 日` : '未有完成動作紀錄'}</Text>
        {programNote ? <Text style={s.hint}>{programNote}</Text> : null}
        {diff !== null && diff >= 0 && completedCount > 0 && <Text style={s.hint}>今日做到呢度都可以，休息都係照顧身體。</Text>}
      </View>
      {Platform.OS === 'web' && <Text style={s.tip}>小貼士：撳瀏覽器「加到主畫面」，下次一撳就開。</Text>}
      <Button label="返主頁" onPress={onHome} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flexGrow: 1, backgroundColor: C.bg, padding: 24, paddingTop: 80, gap: 16 },
  h1: { color: C.text, fontSize: 32, fontWeight: '900', fontFamily: SERIF, lineHeight: 40 },
  p: { color: C.sub, fontSize: 16, lineHeight: 24 },
  hint: { color: C.mute, fontSize: 13, lineHeight: 19 },
  tip: { color: C.mute, fontSize: 13, lineHeight: 19 },
  card: { borderTopWidth: 1, borderBottomWidth: HAIR, borderColor: C.line, paddingVertical: 16, gap: 4 },
  big: { color: C.text, fontSize: 24, fontWeight: '800', fontFamily: SERIF },
});
