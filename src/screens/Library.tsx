import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EXERCISES, Level } from '../data/exercises';
import { MUSCLES } from '../data/muscles';
import { Demo, DemoMode, DemoView } from '../components/Demo';

const VIEWS: { id: DemoView; label: string }[] = [
  { id: 'auto', label: '自動' },
  { id: 'back', label: '背面' },
  { id: 'side', label: '側面' },
  { id: 'front', label: '正面' },
];
const SPEEDS = [0.5, 1, 1.5];
const LEVELS: { id: Level; label: string; sub: string }[] = [
  { id: 1, label: '入門', sub: '簡單、輕鬆，寫字樓都做到' },
  { id: 2, label: '初級', sub: '需要多啲空間同平衡' },
  { id: 3, label: '進階', sub: '爆發、落地同地上動作' },
];

export default function Library({ onBack }: { onBack: () => void }) {
  const [group, setGroup] = useState<Level>(1);
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [showInfo, setShowInfo] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [mode, setMode] = useState<DemoMode>('2d');
  const [view, setView] = useState<DemoView>('auto');
  const [speed, setSpeed] = useState(1);
  const [cue, setCue] = useState('');
  const [reps, setReps] = useState(0);
  const exercise = EXERCISES.find((e) => e.id === exerciseId)!;
  const list = EXERCISES.filter((e) => e.level === group);
  const groupInfo = LEVELS.find((g) => g.id === group)!;
  const hasInfo = true;

  const pickGroup = (g: Level) => {
    setGroup(g);
    const first = EXERCISES.find((e) => e.level === g);
    if (first) setExerciseId(first.id);
  };

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        <Demo
          mode={mode}
          exercise={exercise}
          playing={playing}
          speed={speed}
          view={view}
          onCue={setCue}
          onRep={setReps}
        />

        <View style={styles.header} pointerEvents="none">
          <Text style={styles.kind}>
            {exercise.kind}
          </Text>
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.cue}>{cue}</Text>
        </View>
        <View style={styles.reps} pointerEvents="none">
          <Text style={styles.repsNum}>{reps}</Text>
          <Text style={styles.repsLabel}>次</Text>
        </View>

        <Pressable onPress={() => setMode((m) => (m === '2d' ? '3d' : '2d'))} style={[styles.pill, styles.mode]}>
          <Text style={styles.pillText}>{mode === '2d' ? '2D · 轉 3D' : '3D · 轉 2D'}</Text>
        </Pressable>

        <Pressable onPress={onBack} style={[styles.pill, styles.back]}>
          <Text style={styles.pillText}>‹ 返回</Text>
        </Pressable>
        <View style={styles.viewSwitch}>
          {VIEWS.map((v) => (
            <Pressable key={v.id} onPress={() => setView(v.id)} style={[styles.pill, view === v.id && styles.pillOn]}>
              <Text style={[styles.pillText, view === v.id && styles.pillTextOn]}>{v.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        {showInfo && hasInfo ? (
          <ScrollView style={styles.info} contentContainerStyle={{ paddingBottom: 8 }}>
            {exercise.steps && (
              <>
                <Text style={styles.section}>步驟</Text>
                {exercise.steps.map((s, i) => (
                  <Text key={i} style={styles.infoText}>
                    {i + 1}. {s}
                  </Text>
                ))}
              </>
            )}
            {exercise.checks && (
              <>
                <Text style={styles.section}>檢查點</Text>
                {exercise.checks.map((c, i) => (
                  <Text key={i} style={styles.infoText}>
                    ✓ {c}
                  </Text>
                ))}
              </>
            )}
            {exercise.why && (
              <>
                <Text style={styles.section}>點解要做</Text>
                <Text style={styles.infoText}>{exercise.why}</Text>
              </>
            )}
            {exercise.caution && <Text style={styles.infoCaution}>⚠️ {exercise.caution}</Text>}
          </ScrollView>
        ) : (
          <>
            <Text style={styles.section}>用緊嘅肌肉</Text>
            <View style={styles.muscles}>
              {exercise.muscles.map((m) => (
                <View key={m.id} style={styles.muscle}>
                  <View style={[styles.dot, { opacity: 0.35 + 0.65 * m.weight }]} />
                  <Text style={styles.muscleText}>{MUSCLES[m.id].name}</Text>
                  <Text style={styles.muscleSub}>{m.weight >= 1 ? '主要' : '輔助'}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupList}>
          {LEVELS.map((g) => (
            <Pressable key={g.id} onPress={() => pickGroup(g.id)} style={[styles.pill, group === g.id && styles.pillOn]}>
              <Text style={[styles.pillText, group === g.id && styles.pillTextOn]}>{g.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.section}>{groupInfo.sub}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exList}>
          {list.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => setExerciseId(e.id)}
              style={[styles.exCard, e.id === exerciseId && styles.exCardOn]}
            >
              <Text style={styles.exKind}>{e.kind}</Text>
              <Text style={styles.exName} numberOfLines={2}>
                {e.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.controls}>
          <Pressable onPress={() => setPlaying((p) => !p)} style={styles.play}>
            <Text style={styles.playText}>{playing ? '暫停' : '開始'}</Text>
          </Pressable>
          {hasInfo && (
            <Pressable onPress={() => setShowInfo((v) => !v)} style={[styles.pill, showInfo && styles.pillOn]}>
              <Text style={[styles.pillText, showInfo && styles.pillTextOn]}>說明</Text>
            </Pressable>
          )}
          {SPEEDS.map((s) => (
            <Pressable key={s} onPress={() => setSpeed(s)} style={[styles.pill, speed === s && styles.pillOn]}>
              <Text style={[styles.pillText, speed === s && styles.pillTextOn]}>{s}x</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const ACCENT = '#ff3b30';

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14161c' },
  stage: { flex: 1 },
  header: { position: 'absolute', top: 56, left: 20, right: 90 },
  kind: { color: ACCENT, fontSize: 13, fontWeight: '600' },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 2 },
  cue: { color: '#c9cfdb', fontSize: 16, marginTop: 8 },
  reps: { position: 'absolute', top: 56, right: 20, alignItems: 'center' },
  repsNum: { color: '#fff', fontSize: 34, fontWeight: '700' },
  repsLabel: { color: '#8a92a3', fontSize: 12 },
  viewSwitch: { position: 'absolute', bottom: 12, left: 0, right: 0, justifyContent: 'center', flexDirection: 'row', gap: 6 },
  back: { position: 'absolute', top: 12, left: 16 },
  mode: { position: 'absolute', top: 116, right: 16 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: '#262a33' },
  pillOn: { backgroundColor: '#fff' },
  pillText: { color: '#c9cfdb', fontSize: 14, fontWeight: '600' },
  pillTextOn: { color: '#14161c' },
  panel: { backgroundColor: '#1c1f27', padding: 16, paddingBottom: 32, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  section: { color: '#8a92a3', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  muscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  muscle: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#262a33', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT },
  muscleText: { color: '#fff', fontSize: 14 },
  muscleSub: { color: '#8a92a3', fontSize: 11 },
  exList: { gap: 10, paddingBottom: 12 },
  groupList: { gap: 8, paddingBottom: 6 },
  info: { maxHeight: 220, marginBottom: 8 },
  infoTarget: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  infoText: { color: '#c9cfdb', fontSize: 14, lineHeight: 20, marginBottom: 4 },
  infoCaution: { color: '#ffb340', fontSize: 13, lineHeight: 19, marginTop: 6 },
  exCard: { minWidth: 92, maxWidth: 132, padding: 12, borderRadius: 14, backgroundColor: '#262a33', borderWidth: 2, borderColor: 'transparent' },
  exCardOn: { borderColor: ACCENT },
  exKind: { color: '#8a92a3', fontSize: 11 },
  exName: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  play: { flex: 1, backgroundColor: ACCENT, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  playText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
