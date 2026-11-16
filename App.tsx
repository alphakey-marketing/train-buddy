import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { EXERCISES } from './src/data/exercises';
import { markDone, nextDay, Program, QUICKS } from './src/data/programs';
import { Area } from './src/data/types';
import { Answers, avoidedAreas, computeTightness, Tightness } from './src/lib/bodyTest';
import { addSession, sessions, streak } from './src/lib/history';
import { DEFAULT_PLAN, Plan, prescribe, RoutineItem, secondsOf, Setting, available } from './src/lib/prescribe';
import { load, save, storageUnavailable, track } from './src/lib/storage';
import { Backup } from './src/screens/Backup';
import { Done, RateAfter } from './src/screens/Finish';
import { Lab } from './src/screens/Lab';
import Library from './src/screens/Library';
import { HubNike } from './src/screens/HubNike';
import { ProgramDetail } from './src/screens/Programs';
import { Ask, BodyMap, PlanScreen, Preview, Test, Welcome } from './src/screens/Onboarding';
import { Player } from './src/screens/Player';

type Profile = { pain?: Area; setting?: Setting; answers: Answers; tightness: Tightness; at: number };
type Screen = 'welcome' | 'ask' | 'test' | 'hub' | 'program' | 'map' | 'plan' | 'preview' | 'play' | 'rate' | 'done' | 'library' | 'backup';

const labQuery = (() => {
  try {
    const q = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
    return q.has('lab') ? q : null;
  } catch {
    return null;
  }
})();

export default function App() {
  if (labQuery) return <Lab query={labQuery} />;
  return <Main />;
}

function Main() {
  const [storageError, setStorageError] = useState(storageUnavailable);
  const [openedAt] = useState(() => Date.now());
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onError = () => setStorageError(true);
    window.addEventListener('train-buddy-storage-error', onError);
    return () => window.removeEventListener('train-buddy-storage-error', onError);
  }, []);
  const [profile, setProfile] = useState<Profile | null>(() => load<Profile | null>('profile', null));
  // 返嚟嘅用家直接去主頁，唔使再撳一次
  const [screen, setScreen] = useState<Screen>(() => (load<Profile | null>('profile', null) ? 'hub' : 'welcome'));
  const [pain, setPain] = useState<Area | undefined>(() => profile?.pain);
  const [setting, setSetting] = useState<Setting>(() => profile?.setting ?? 'office');
  const [before, setBefore] = useState<number | null>(null);
  const [tensionBefore, setTensionBefore] = useState<number | null>(null);
  const [tensionAfter, setTensionAfter] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);

  useEffect(() => track('open'), []);

  const [plan, setPlan] = useState<Plan>(() => ({ ...DEFAULT_PLAN, ...load<Partial<Plan>>('plan', {}) }));
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  const [filtered, setFiltered] = useState(false);
  const [avoidedIds, setAvoidedIds] = useState<string[]>(() => load<string[]>('avoidedExercises', []));
  const [prog, setProg] = useState<Program | null>(null);
  const [day, setDay] = useState<number | null>(null); // 課程第幾日（null = 快練／自訂）
  const [back, setBack] = useState<Screen>('hub');
  const toRoutine = (ids: string[]): RoutineItem[] =>
    ids.flatMap((id) => {
      const exercise = EXERCISES.find((e) => e.id === id);
      const blocked = avoidedAreas(profile?.answers ?? {});
      return exercise && !avoidedIds.includes(id) && (exercise.kind === '放鬆' || !exercise.areas.some((a) => blocked.includes(a))) ? [{ exercise, seconds: secondsOf(exercise) }] : [];
    });
  const alternativeFor = (item: RoutineItem) => EXERCISES.find((e) =>
    e.id !== item.exercise.id && !routine.some((r) => r.exercise.id === e.id)
    && e.kind === item.exercise.kind && e.level <= item.exercise.level
    && available(e, plan) && e.prop?.kind === item.exercise.prop?.kind && e.floor === item.exercise.floor && (!item.exercise.desk || e.desk)
    && e.areas.some((a) => item.exercise.areas.includes(a))
    && !avoidedIds.includes(e.id) && !e.areas.some((a) => avoidedAreas(profile?.answers ?? {}).includes(a)),
  );
  const begin = (ids: string[], d: number | null, from: Screen) => {
    setCompleted([]);
    setBefore(null);
    setTensionBefore(null); setTensionAfter(null);
    const selected = toRoutine(ids);
    setFiltered(selected.length !== ids.length);
    setRoutine(selected);
    setDay(selected.length === ids.length ? d : null);
    setBack(from);
    setScreen('preview');
  };
  const log = load<{ at: number; avg: number }[]>('testlog', []);
  const hint = (() => {
    if (!log.length) return undefined;
    const last = log[log.length - 1];
    const days = Math.max(0, Math.floor((openedAt - last.at) / 86400000));
    const prev = log.length > 1 ? log[log.length - 2] : null;
    const diff = prev ? ` · 同上次比${last.avg < prev.avg - 0.02 ? '鬆咗' : last.avg > prev.avg + 0.02 ? '緊咗啲' : '差唔多'}` : '';
    return `上次測試：${days === 0 ? '今日' : `${days} 日前`}${diff}${days >= 14 ? ' · 建議重新測試' : ''}`;
  })();

  const finishTest = (answers: Answers) => {
    const p: Profile = { pain, setting, answers, tightness: computeTightness(answers, pain), at: Date.now() };
    save('profile', p);
    const vals = Object.values(p.tightness).map((v) => v ?? 0);
    save('testlog', [...log, { at: p.at, avg: vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length) }].slice(-50));
    setProfile(p);
    track('test_done');
    setScreen('map');
  };

  // 練完頁顯示課程進度
  const programNote = (() => {
    if (!prog || day === null || completed.length !== routine.length || (before !== null && after !== null && after > before)) return undefined;
    const n = nextDay(prog.id);
    return n >= 7 ? `${prog.name} · 七日全部完成！` : `${prog.name} · 完成第 ${day + 1} 日，聽日做第 ${n + 1} 日`;
  })();

  const body = (() => {
    switch (screen) {
      case 'welcome':
        return (
          <Welcome
            returning={!!profile}
            onQuick={() => {
              const guest: Profile = { answers: {}, tightness: {}, at: Date.now() };
              setProfile(guest);
              save('profile', guest);
              begin(QUICKS.find((q) => q.id === 'lunch-2')!.ids, null, 'hub');
            }}
            onStart={() => {
              if (profile) setScreen('hub');
              else {
                track('test_start');
                setScreen('ask');
              }
            }}
          />
        );
      case 'ask':
        return (
          <Ask
            onBack={() => setScreen(profile ? 'map' : 'welcome')}
            onNext={(a, st) => {
              setPain(a);
              setSetting(st);
              setPlan((pl) => ({ ...pl, setting: st }));
              setScreen('test');
            }}
          />
        );
      case 'test':
        return <Test onDone={finishTest} onBack={() => setScreen('ask')} />;
      case 'hub':
        return profile ? (
          <HubNike
            tightness={profile.tightness}
            pain={profile.pain}
            setting={profile.setting}
            onProgram={(p) => {
              setProg(p);
              setScreen('program');
            }}
            onQuick={(q) => begin(q.ids, null, 'hub')}
            onCustom={() => setScreen('plan')}
            onMap={() => setScreen('map')}
            onLibrary={() => setScreen('library')}
          />
        ) : null;
      case 'program':
        return prog ? (
          <ProgramDetail
            key={prog.id}
            program={prog}
            onBack={() => setScreen('hub')}
            onOpen={setProg}
            onStart={(d) => begin(prog.days[d].ids, d, 'program')}
          />
        ) : null;
      case 'map':
        return profile ? (
          <BodyMap
            tightness={profile.tightness}
            hint={hint}
            onNext={() => setScreen('hub')}
            onRetest={() => setScreen('ask')}
            onLibrary={() => setScreen('library')}
            onBackup={() => setScreen('backup')}
            avoided={avoidedIds.map((id) => ({ id, name: EXERCISES.find((e) => e.id === id)?.name ?? id }))}
            onRestore={(id) => {
              const next = avoidedIds.filter((item) => item !== id);
              setAvoidedIds(next);
              save('avoidedExercises', next);
            }}
          />
        ) : null;
      case 'plan':
        return profile ? (
          <PlanScreen
            initial={plan}
            onBack={() => setScreen('hub')}
            onNext={(pl) => {
              setPlan(pl);
              save('plan', pl);
              const blocked = avoidedAreas(profile.answers);
              const proposed = prescribe(profile.tightness, pl, sessions(), e => avoidedIds.includes(e.id) || (e.kind !== '放鬆' && e.areas.some(a => blocked.includes(a))));
              const selected = proposed.filter((r) => !avoidedIds.includes(r.exercise.id) && (r.exercise.kind === '放鬆' || !r.exercise.areas.some((a) => blocked.includes(a))));
              setFiltered(selected.length !== proposed.length);
              setRoutine(selected);
              setCompleted([]);
              setBefore(null);
    setTensionBefore(null); setTensionAfter(null);
              setDay(null);
              setBack('plan');
              setScreen('preview');
            }}
          />
        ) : null;
      case 'preview':
        return (
          <Preview
            tension={tensionBefore} onTension={setTensionBefore}
            routine={routine}
            before={before}
            filtered={filtered}
            alternatives={routine.map((item) => !!alternativeFor(item))}
            onReplace={(index) => {
              const replacement = alternativeFor(routine[index]);
              if (!replacement) return;
              setRoutine((items) => items.map((item, i) => i === index ? { exercise: replacement, seconds: secondsOf(replacement) } : item));
              setFiltered(true);
              setDay(null);
            }}
            onBefore={setBefore}
            onStart={() => {
              track('routine_start');
              setScreen('play');
            }}
            onBack={() => setScreen(back)}
          />
        );
      case 'play':
        return (
          <Player
            onUncomfortable={(id) => { const ids = [...new Set([...avoidedIds, id])]; setAvoidedIds(ids); save('avoidedExercises', ids); }}
            routine={routine}
            onDone={(ids) => {
              setCompleted(ids);
              track('routine_done');
              setScreen('rate');
            }}
            onQuit={(ids) => {
              setCompleted(ids);
              if (ids.length) setScreen('rate');
              else setScreen(back === 'program' ? 'program' : 'hub');
            }}
          />
        );
      case 'rate':
        return (
          <RateAfter
            tension={tensionAfter} onTension={setTensionAfter}
            before={before}
            onSubmit={(a) => {
              setAfter(a);
              if (prog && day !== null && completed.length === routine.length && !(before !== null && a !== null && a > before)) markDone(prog.id, day);
              if (completed.length) addSession({ at: Date.now(), ids: completed, before, after: a, tensionBefore, tensionAfter });
              track('rate_after');
              setScreen('done');
            }}
          />
        );
      case 'done':
        return (
          <Done
            tensionBefore={tensionBefore} tensionAfter={tensionAfter}
            before={before}
            after={after}
            streakDays={streak(sessions())}
            programNote={programNote}
            completedCount={completed.length}
            totalCount={routine.length}
            onHome={() => setScreen('hub')}
          />
        );
      case 'library':
        return <Library area={profile?.pain} onBack={() => setScreen(profile ? 'hub' : 'welcome')} />;
      case 'backup':
        return <Backup onBack={() => setScreen('map')} />;
    }
  })();

  return (
    <>
      <StatusBar style="dark" />
      {storageError && <Text accessibilityRole="alert" style={{ padding: 10, backgroundColor: '#fff0df', color: '#753800' }}>未能儲存紀錄，關閉頁面後資料可能會消失。請檢查瀏覽器儲存設定。</Text>}
      {body}
    </>
  );
}
