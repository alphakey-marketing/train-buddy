// 「跟住做」：全屏公仔 + 倒數 + 語音提示 + 自動轉下一個
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Demo, useDemoMode } from '../components/Demo';
import { buzz, hush, pickVoice, say as speak, useScreenAwake, VoicePick } from '../lib/device';
import { RoutineItem } from '../lib/prescribe';
import { C } from '../ui/theme';

const READY = 4; // 每個動作前嘅準備秒數

function say(text: string, on: boolean) {
  if (on) speak(text);
}

export function Player({ routine, onDone, onQuit }: { routine: RoutineItem[]; onDone: () => void; onQuit: () => void }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'go'>('ready');
  const [left, setLeft] = useState(READY);
  const [paused, setPaused] = useState(false);
  const [voice, setVoice] = useState(true);
  const [mode, toggleMode] = useDemoMode();
  const [cue, setCue] = useState('');
  const [voiceInfo, setVoiceInfo] = useState<VoicePick | null | 'wait'>('wait');
  const voiceRef = useRef(voice);
  voiceRef.current = voice;
  useScreenAwake();

  useEffect(() => {
    pickVoice().then(setVoiceInfo);
  }, []);

  const item = routine[idx];
  const next = routine[idx + 1];

  // 轉動作：讀名
  useEffect(() => {
    setPhase('ready');
    setLeft(READY);
    setCue('');
    if (idx > 0) buzz('change');
    say(`${idx === 0 ? '開始。' : ''}${item.exercise.name}`, voiceRef.current);
  }, [idx]);

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
  }, [left]);

  // 動作提示唸出嚟（準備階段唔唸）
  const onCue = useCallback(
    (c: string) => {
      setCue(c);
      if (phase === 'go' && !paused) say(c, voiceRef.current);
    },
    [phase, paused],
  );

  const total = routine.reduce((n, r) => n + r.seconds, 0);

  return (
    <View style={s.root}>
      <Demo
        mode={mode}
        exercise={item.exercise}
        playing={phase === 'go' && !paused}
        speed={1}
        view={mode === '2d' ? 'auto' : 'front'}
        onCue={onCue}
        onRep={() => {}}
      />

      <View style={s.top} pointerEvents="none">
        <Text style={s.step}>
          {idx + 1} / {routine.length} · {item.exercise.kind}
        </Text>
        <Text style={s.title}>{item.exercise.name}</Text>
        <Text style={s.cue}>{phase === 'ready' ? item.exercise.steps[0] : cue}</Text>
        {voice && voiceInfo !== 'wait' && !voiceInfo?.cantonese && (
          <Text style={s.warn}>
            {voiceInfo ? `部機冇廣東話語音，用緊：${voiceInfo.name}` : '部機冇中文語音，只會顯示文字'}
          </Text>
        )}
      </View>

      <View style={s.center} pointerEvents="none">
        <Text style={s.big}>{phase === 'ready' ? `準備 ${Math.max(0, left)}` : Math.max(0, left)}</Text>
        {next && <Text style={s.next}>下一個：{next.exercise.name}</Text>}
      </View>

      <View style={s.bar}>
        <View style={[s.fill, { width: `${((routine.slice(0, idx).reduce((n, r) => n + r.seconds, 0) + (phase === 'go' ? item.seconds - left : 0)) / total) * 100}%` }]} />
      </View>

      <View style={s.controls}>
        <Pressable style={s.pill} onPress={onQuit}>
          <Text style={s.pillText}>結束</Text>
        </Pressable>
        <Pressable style={[s.pill, s.main]} onPress={() => setPaused((p) => !p)}>
          <Text style={[s.pillText, { color: '#fff' }]}>{paused ? '繼續' : '暫停'}</Text>
        </Pressable>
        <Pressable style={s.pill} onPress={advance}>
          <Text style={s.pillText}>跳過</Text>
        </Pressable>
        <Pressable style={s.pill} onPress={() => setVoice((v) => !v)}>
          <Text style={s.pillText}>{voice ? '🔊' : '🔇'}</Text>
        </Pressable>
        <Pressable style={s.pill} onPress={toggleMode}>
          <Text style={s.pillText}>{mode === '2d' ? '3D' : '2D'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  top: { position: 'absolute', top: 56, left: 20, right: 20 },
  step: { color: C.accent, fontSize: 13, fontWeight: '600' },
  title: { color: C.text, fontSize: 28, fontWeight: '700', marginTop: 2 },
  cue: { color: C.sub, fontSize: 16, marginTop: 8 },
  warn: { color: C.warn, fontSize: 12, marginTop: 6 },
  center: { position: 'absolute', right: 20, top: '38%', alignItems: 'flex-end' },
  big: { color: C.text, fontSize: 44, fontWeight: '800' },
  next: { color: C.mute, fontSize: 13, marginTop: 4 },
  bar: { position: 'absolute', left: 0, right: 0, bottom: 96, height: 4, backgroundColor: C.card },
  fill: { height: 4, backgroundColor: C.accent },
  controls: { position: 'absolute', bottom: 32, left: 16, right: 16, flexDirection: 'row', gap: 8, justifyContent: 'center' },
  pill: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 999, backgroundColor: C.card },
  main: { backgroundColor: C.accent },
  pillText: { color: C.sub, fontSize: 15, fontWeight: '700' },
});
