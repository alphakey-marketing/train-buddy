// 練完：打分 → 前後對比 → 連續日數
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, C, HAIR, SERIF } from '../ui/theme';
import { Scale } from './Onboarding';

export function RateAfter({ before, onSubmit }: { before: number; onSubmit: (after: number) => void }) {
  // 預設同做前一樣，唔好幫用家「估」佢鬆咗
  const [after, setAfter] = useState(before);
  return (
    <View style={s.root}>
      <Text style={s.h1}>做完喇</Text>
      <Text style={s.p}>而家嗰度有幾緊或者痛？（0 = 冇事，10 = 好痛）</Text>
      <Text style={s.hint}>做之前你打咗 {before} 分，冇變就直接撳下面。</Text>
      <Scale value={after} onChange={setAfter} />
      <Button label="睇結果" onPress={() => onSubmit(after)} />
    </View>
  );
}

export function Done({
  before,
  after,
  streakDays,
  programNote,
  onHome,
}: {
  before: number;
  after: number;
  streakDays: number;
  programNote?: string; // 課程進度一句，例如「頸肩鬆一鬆 · 完成第 3 / 7 日」
  onHome: () => void;
}) {
  const diff = before - after;
  const title = diff > 0 ? `由 ${before} 分跌到 ${after} 分` : diff < 0 ? '今次好似緊咗少少' : '多謝你練完';
  const body =
    diff > 0
      ? '鬆咗就啱。每日做少少，效果會慢慢疊上去。'
      : diff < 0
        ? '可能動作太大力，下次輕啲、拉到「有感覺」就夠。如果持續痛或者愈嚟愈痛，請問醫生或者物理治療師。'
        : '一次未必覺得分別，連續做一個星期再比較。';
  return (
    <View style={s.root}>
      <Text style={s.h1}>{title}</Text>
      <Text style={s.p}>{body}</Text>
      <View style={s.card}>
        <Text style={s.big}>連續第 {streakDays} 日</Text>
        {programNote ? <Text style={s.hint}>{programNote}</Text> : null}
        <Text style={s.hint}>聽日再嚟，每次 3–5 分鐘就夠。</Text>
      </View>
      <Text style={s.tip}>小貼士：撳瀏覽器「加到主畫面」，下次一撳就開，冇網都用到。</Text>
      <Button label="返主頁" onPress={onHome} />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 24, paddingTop: 80, gap: 16 },
  h1: { color: C.text, fontSize: 32, fontWeight: '900', fontFamily: SERIF, lineHeight: 40 },
  p: { color: C.sub, fontSize: 16, lineHeight: 24 },
  hint: { color: C.mute, fontSize: 13, lineHeight: 19 },
  tip: { color: C.mute, fontSize: 13, lineHeight: 19 },
  card: { borderTopWidth: 1, borderBottomWidth: HAIR, borderColor: C.line, paddingVertical: 16, gap: 4 },
  big: { color: C.text, fontSize: 24, fontWeight: '800', fontFamily: SERIF },
});
