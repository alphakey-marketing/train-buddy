// 「跟住做」：全屏公仔 + 倒數 + 語音提示 + 自動轉下一個
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Demo } from '../components/Demo';
import { Exercise, needOf, plainName } from '../data/exercises';
import { buzz, hush, pickVoice, say as speak, useScreenAwake, VoicePick } from '../lib/device';
import { MOVE_IN, MOVE_OUT } from '../lib/motion';
import { RoutineItem } from '../lib/prescribe';
import { C, SERIF } from '../ui/theme';

// 準備秒數：第一個同轉姿勢（椅 → 門框 → 地）要耐啲
function readyFor(prev: Exercise | undefined, cur: Exercise): number {
  if (!prev) return 6;
  const moved = prev.floor !== cur.floor || prev.prop?.kind !== cur.prop?.kind;
  return moved ? 10 : 5;
}

// 拉筋分邊：而家第幾邊、呢邊仲剩幾秒
function sideInfo(e: Exercise, elapsed: number): { side: number; sides: number; left: number } | null {
  if (!e.hold) return null;
  const per = MOVE_IN + e.hold.seconds + MOVE_OUT;
  const side = Math.min(e.hold.sides - 1, Math.floor(elapsed / per));
  return { side, sides: e.hold.sides, left: Math.max(0, Math.ceil(per * (side + 1) - elapsed)) };
}

function say(text: string, on: boolean) {
  if (on) speak(text);
}

export function Player({ routine, onDone, onQuit }: { routine: RoutineItem[]; onDone: () => void; onQuit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'go'>('ready');
  const [left, setLeft] = useState(() => readyFor(undefined, routine[0].exercise));
  const [paused, setPaused] = useState(false);
  const [voice, setVoice] = useState(true);
  const [cue, setCue] = useState('');
  const [quitAsk, setQuitAsk] = useState(false);
  const [voiceInfo, setVoiceInfo] = useState<VoicePick | null | 'wait'>('wait');
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  useScreenAwake();

  useEffect(() => {
    pickVoice().then(setVoiceInfo);
  }, []);

  const item = routine[idx];
  const next = routine[idx + 1];
  const need = needOf(item.exercise);

  // 轉動作：讀名，轉姿勢就講埋要準備咩
  useEffect(() => {
    const prev = routine[idx - 1]?.exercise;
    const ready = readyFor(prev, item.exercise);
    setPhase('ready');
    setLeft(ready);
    setCue('');
    if (idx > 0) buzz('change');
    const moved = ready > 5 && need ? `${need}。` : '';
    say(`${idx === 0 ? '開始。' : '下一個，'}${plainName(item.exercise)}。${moved}`, voiceRef.current);
  }, [idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // 中途離開先收聲；做完就等佢講完「好嘢」
  const finished = useRef(false);
  useEffect(() => () => {
    if (!finished.current) hush();
  }, []);

  const advance = useCallback(() => {
    if (idx + 1 >= routine.length) {
      say('做完喇，好嘢。', voiceRef.current);
      buzz('done');
      finished.current = true;
      onDone();
    } else setIdx(idx + 1);
  }, [idx, routine.length, onDone]);

  // 每秒倒數
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [paused]);

  useEffect(() => {
    // 最後 3 秒每秒震一下
    if (left > 0 && left <= 3 && !paused) buzz('tick');
    if (left > 0) return;
    if (phase === 'ready') {
      buzz('change');
      setPhase('go');
      setLeft(item.seconds);
    } else advance();
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  // 「結束」要撳兩下，免得誤觸
  useEffect(() => {
    if (!quitAsk) return;
    const t = setTimeout(() => setQuitAsk(false), 3000);
    return () => clearTimeout(t);
  }, [quitAsk]);

  // 動作提示唸出嚟（準備階段唔唸）
  const onCue = useCallback(
    (c: string) => {
      setCue(c);
      if (phase === 'go' && !paused) say(c, voiceRef.current);
    },
    [phase, paused],
  );

  const total = routine.reduce((n, r) => n + r.seconds, 0);
  const elapsed = phase === 'go' ? item.seconds - left : 0;
  const doneSec = routine.slice(0, idx).reduce((n, r) => n + r.seconds, 0) + elapsed;
  const sideNow = phase === 'go' ? sideInfo(item.exercise, elapsed) : null;
  const bigNum = phase === 'ready' ? `準備 ${Math.max(0, left)}` : String(sideNow ? sideNow.left : Math.max(0, left));

  // 上：名同提示；中：公仔；下：倒數同掣。三格分開，唔會遮住公仔
  return (
    <View style={s.root}>
      <View style={s.top}>
        <View style={s.bar}>
          <View style={[s.fill, { width: `${(doneSec / total) * 100}%` }]} />
        </View>
        <Text style={s.step}>
          {idx + 1} / {routine.length} · {item.exercise.kind}
          {need ? ` · ${need}` : ''}
        </Text>
        <Text style={s.title}>{plainName(item.exercise)}</Text>
        <Text style={s.cue} numberOfLines={2}>
          {phase === 'ready' ? (item.exercise.hold?.enter ?? item.exercise.steps[0]) : cue}
        </Text>
        {voice && voiceInfo !== 'wait' && !voiceInfo?.cantonese && (
          <Text style={s.warn}>
            {voiceInfo ? `部機冇廣東話語音，用緊：${voiceInfo.name}` : '部機冇中文語音，只會顯示文字'}
          </Text>
        )}
      </View>

      <View style={s.stage}>
        <Demo
          exercise={item.exercise}
          playing={phase === 'go' && !paused}
          speed={1}
          hold={item.exercise.hold?.seconds}
          seek={elapsed}
          view={item.exercise.view ?? 'front'}
          onCue={onCue}
          onRep={() => {}}
          headroom={0.02}
        />
        {paused && (
          <View style={s.pausedTag} pointerEvents="none">
            <Text style={s.pausedText}>暫停咗</Text>
          </View>
        )}
      </View>

      <View style={s.bottom}>
        <View style={s.timeRow}>
          <View>
            <Text style={[s.big, phase === 'ready' && { color: C.accent }]}>{bigNum}</Text>
            {sideNow && sideNow.sides === 2 ? (
              <Text style={s.side}>第 {sideNow.side + 1} 邊（共 2 邊）· 每邊 {item.exercise.hold!.seconds} 秒</Text>
            ) : phase === 'go' ? (
              <Text style={s.side}>秒</Text>
            ) : null}
          </View>
          {next && <Text style={s.next}>下一個：{plainName(next.exercise)}</Text>}
        </View>
        <View style={s.controls}>
          <Pressable
            style={[s.pill, quitAsk && s.danger]}
            onPress={() => (quitAsk ? onQuit() : setQuitAsk(true))}
          >
            <Text style={[s.pillText, quitAsk && { color: C.onDark }]}>{quitAsk ? '確定結束？' : '結束'}</Text>
          </Pressable>
          <Pressable style={[s.pill, s.main]} onPress={() => setPaused((p) => !p)}>
            <Text style={[s.pillText, { color: C.onDark }]}>{paused ? '繼續' : '暫停'}</Text>
          </Pressable>
          <Pressable style={s.pill} onPress={advance}>
            <Text style={s.pillText}>跳過</Text>
          </Pressable>
          <Pressable style={s.pill} onPress={() => setVoice((v) => !v)}>
            <Text style={s.pillText}>{voice ? '聲開' : '聲關'}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { paddingTop: 20, paddingHorizontal: 20, paddingBottom: 8, gap: 2 },
  bar: { height: 3, backgroundColor: C.line, overflow: 'hidden', marginBottom: 14 },
  fill: { height: 3, backgroundColor: C.calm },
  step: { color: C.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  title: { color: C.text, fontSize: 28, fontWeight: '900', fontFamily: SERIF },
  cue: { color: C.sub, fontSize: 16, marginTop: 4, minHeight: 44, lineHeight: 22 },
  warn: { color: C.warn, fontSize: 12, marginTop: 4 },
  stage: { flex: 1 },
  pausedTag: { position: 'absolute', top: 12, alignSelf: 'center', backgroundColor: C.text, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  pausedText: { color: C.onDark, fontSize: 14, fontWeight: '700' },
  bottom: { backgroundColor: C.panel, borderTopWidth: 1, borderColor: C.line, paddingTop: 14, paddingBottom: 28, paddingHorizontal: 16, gap: 12 },
  timeRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 6 },
  big: { color: C.text, fontSize: 48, fontWeight: '900', fontFamily: SERIF, fontVariant: ['tabular-nums'] },
  side: { color: C.mute, fontSize: 13, marginTop: -2 },
  next: { color: C.mute, fontSize: 14, flexShrink: 1, textAlign: 'right', marginLeft: 12, marginBottom: 6 },
  controls: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  pill: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.card },
  main: { backgroundColor: C.text, borderColor: C.text, paddingHorizontal: 26 },
  danger: { backgroundColor: C.accent, borderColor: C.accent },
  pillText: { color: C.text, fontSize: 15, fontWeight: '700' },
});
