import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Area, EXERCISES, Level, plainName } from '../data/exercises';
import { AREAS } from '../lib/bodyTest';
import { MUSCLES } from '../data/muscles';
import { Demo, DemoView } from '../components/Demo';
import { C, SERIF } from '../ui/theme';

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

// 揀部位：先睇針對你嗰度嘅動作
type AreaPick = Area | 'all';

export default function Library({ onBack, area: start }: { onBack: () => void; area?: Area }) {
  const [area, setArea] = useState<AreaPick>(start ?? 'all');
  const [group, setGroup] = useState<Level>(1);
  const inArea = (a: AreaPick) => EXERCISES.filter((e) => a === 'all' || e.areas.includes(a));
  // 預設：揀咗嘅部位第一個入門拉筋
  const firstOf = (a: AreaPick, g: Level) => inArea(a).find((e) => e.level === g && (e.hold || e.kind === '活化')) ?? inArea(a).find((e) => e.level === g);
  const [exerciseId, setExerciseId] = useState(() => (firstOf(start ?? 'all', 1) ?? EXERCISES[0]).id);
  const [showInfo, setShowInfo] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [view, setView] = useState<DemoView>('auto');
  const [speed, setSpeed] = useState(1);
  const [cue, setCue] = useState('');
  const [reps, setReps] = useState(0);
  const exercise = EXERCISES.find((e) => e.id === exerciseId)!;
  // 入門組：拉筋同慢慢郁嘅排先
  const list = inArea(area)
    .filter((e) => e.level === group)
    .sort((a, b) => Number(!!b.hold || b.kind === '活化') - Number(!!a.hold || a.kind === '活化'));
  const groupInfo = LEVELS.find((g) => g.id === group)!;
  const hasInfo = true;

  const pickGroup = (g: Level) => {
    setGroup(g);
    const first = firstOf(area, g);
    if (first) setExerciseId(first.id);
  };
  const pickArea = (a: AreaPick) => {
    setArea(a);
    const first = firstOf(a, group) ?? firstOf(a, 1);
    if (first) {
      setGroup(first.level);
      setExerciseId(first.id);
    }
  };
  const levels = LEVELS.filter((g) => inArea(area).some((e) => e.level === g.id));

  return (
    <View style={styles.root}>
      <View style={styles.stage}>
        <Demo
          exercise={exercise}
          playing={playing}
          speed={speed}
          view={view}
          onCue={setCue}
          onRep={setReps}
          headroom={0.3}
          footroom={0.1}
        />

        <View style={styles.header} pointerEvents="none">
          <Text style={styles.kind}>
            {exercise.kind}
          </Text>
          <Text style={styles.title} numberOfLines={2}>{exercise.name}</Text>
          {cue ? <Text style={styles.cue} numberOfLines={2}>{cue}</Text> : null}
        </View>
        {!exercise.hold && (
          <View style={styles.reps} pointerEvents="none">
            <Text style={styles.repsNum}>{reps}</Text>
            <Text style={styles.repsLabel}>次</Text>
          </View>
        )}

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
                <Text style={styles.section}>常見錯誤（唔好咁做）</Text>
                {exercise.checks.map((c, i) => (
                  <Text key={i} style={styles.infoText}>
                    ✕ {c}
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
            {exercise.caution && <Text style={styles.infoCaution}>注意：{exercise.caution}</Text>}
          </ScrollView>
        ) : (
          <>
            <Text style={styles.section}>用緊嘅肌肉</Text>
            <View style={styles.muscles}>
              {exercise.muscles.map((m) => (
                <View key={m.id} style={styles.muscle}>
                  <View style={[styles.dot, { opacity: 0.35 + 0.65 * m.weight }]} />
                  <Text style={styles.muscleText}>{MUSCLES[m.id].plain}</Text>
                  <Text style={styles.muscleSub}>{m.weight >= 1 ? '主要' : '輔助'}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupList}>
          <Pressable onPress={() => pickArea('all')} style={[styles.pill, area === 'all' && styles.pillOn]}>
            <Text style={[styles.pillText, area === 'all' && styles.pillTextOn]}>全部</Text>
          </Pressable>
          {AREAS.map((a) => (
            <Pressable key={a.id} onPress={() => pickArea(a.id)} style={[styles.pill, area === a.id && styles.pillOn]}>
              <Text style={[styles.pillText, area === a.id && styles.pillTextOn]}>{a.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupList}>
          {levels.map((g) => (
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
                {plainName(e)}
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

const ACCENT = C.accent;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  stage: { flex: 1 },
  // 半透明白底：字喺淺色 3D 背景上面都睇得清
  header: { position: 'absolute', top: 58, left: 16, right: 84, backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  kind: { color: ACCENT, fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  title: { color: C.text, fontSize: 24, fontWeight: '900', marginTop: 2, fontFamily: SERIF, lineHeight: 30 },
  cue: { color: C.sub, fontSize: 15, marginTop: 4, lineHeight: 21 },
  reps: { position: 'absolute', top: 58, right: 16, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  repsNum: { color: C.text, fontSize: 34, fontWeight: '900', fontFamily: SERIF },
  repsLabel: { color: C.mute, fontSize: 12 },
  viewSwitch: { position: 'absolute', bottom: 12, left: 0, right: 0, justifyContent: 'center', flexDirection: 'row', gap: 6 },
  back: { position: 'absolute', top: 12, left: 16 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel },
  pillOn: { backgroundColor: C.text, borderColor: C.text },
  pillText: { color: C.text, fontSize: 14, fontWeight: '600' },
  pillTextOn: { color: C.onDark },
  panel: { backgroundColor: C.panel, padding: 16, paddingBottom: 28, borderTopLeftRadius: 22, borderTopRightRadius: 22, borderTopWidth: 1, borderColor: C.line },
  section: { color: C.mute, fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 4 },
  muscles: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  muscle: { flexDirection: 'row', alignItems: 'center', gap: 6, borderBottomWidth: 2, borderColor: C.accent, paddingVertical: 3 },
  dot: { width: 0, height: 0 },
  muscleText: { color: C.text, fontSize: 14 },
  muscleSub: { color: C.mute, fontSize: 11 },
  exList: { gap: 10, paddingBottom: 12 },
  groupList: { gap: 8, paddingBottom: 6 },
  info: { maxHeight: 220, marginBottom: 8 },
  infoTarget: { color: C.text, fontSize: 14, fontWeight: '600', marginBottom: 4 },
  infoText: { color: C.sub, fontSize: 14, lineHeight: 20, marginBottom: 4 },
  infoCaution: { color: C.warn, fontSize: 13, lineHeight: 19, marginTop: 6 },
  exCard: { minWidth: 92, maxWidth: 132, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: C.line },
  exCardOn: { borderColor: C.accent, backgroundColor: C.card },
  exKind: { color: C.mute, fontSize: 11 },
  exName: { color: C.text, fontSize: 16, fontWeight: '700', marginTop: 4, fontFamily: SERIF },
  controls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  play: { flexGrow: 1, minWidth: 90, backgroundColor: C.text, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  playText: { color: C.onDark, fontSize: 15, fontWeight: '600', letterSpacing: 1 },
});
