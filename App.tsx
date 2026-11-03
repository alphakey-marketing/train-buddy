import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EXERCISES } from './src/data/exercises';
import { MUSCLES } from './src/data/muscles';
import { TrainerScene, ViewAngle } from './src/components/TrainerScene';

const VIEWS: { id: ViewAngle; label: string }[] = [
  { id: 'back', label: '背面' },
  { id: 'side', label: '側面' },
  { id: 'front', label: '正面' },
];
const SPEEDS = [0.5, 1, 1.5];

export default function App() {
  const [exerciseId, setExerciseId] = useState(EXERCISES[0].id);
  const [playing, setPlaying] = useState(true);
  const [view, setView] = useState<ViewAngle>('back');
  const [speed, setSpeed] = useState(1);
  const [cue, setCue] = useState('');
  const [reps, setReps] = useState(0);
  const exercise = EXERCISES.find((e) => e.id === exerciseId)!;

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View style={styles.stage}>
        <TrainerScene
          exercise={exercise}
          playing={playing}
          speed={speed}
          view={view}
          onCue={setCue}
          onRep={setReps}
        />

        <View style={styles.header} pointerEvents="none">
          <Text style={styles.kind}>{exercise.kind}</Text>
          <Text style={styles.title}>{exercise.name}</Text>
          <Text style={styles.cue}>{cue}</Text>
        </View>
        <View style={styles.reps} pointerEvents="none">
          <Text style={styles.repsNum}>{reps}</Text>
          <Text style={styles.repsLabel}>次</Text>
        </View>

        <View style={styles.viewSwitch}>
          {VIEWS.map((v) => (
            <Pressable key={v.id} onPress={() => setView(v.id)} style={[styles.pill, view === v.id && styles.pillOn]}>
              <Text style={[styles.pillText, view === v.id && styles.pillTextOn]}>{v.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
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

        <Text style={styles.section}>動作</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.exList}>
          {EXERCISES.map((e) => (
            <Pressable
              key={e.id}
              onPress={() => setExerciseId(e.id)}
              style={[styles.exCard, e.id === exerciseId && styles.exCardOn]}
            >
              <Text style={styles.exKind}>{e.kind}</Text>
              <Text style={styles.exName}>{e.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.controls}>
          <Pressable onPress={() => setPlaying((p) => !p)} style={styles.play}>
            <Text style={styles.playText}>{playing ? '暫停' : '開始'}</Text>
          </Pressable>
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
  viewSwitch: { position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 8 },
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
  exCard: { width: 92, padding: 12, borderRadius: 14, backgroundColor: '#262a33', borderWidth: 2, borderColor: 'transparent' },
  exCardOn: { borderColor: ACCENT },
  exKind: { color: '#8a92a3', fontSize: 11 },
  exName: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  play: { flex: 1, backgroundColor: ACCENT, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  playText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
