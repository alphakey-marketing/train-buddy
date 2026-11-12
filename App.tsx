import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { EXERCISES } from './src/data/exercises';
import { markDone, nextDay, Program } from './src/data/programs';
import { Area } from './src/data/types';
import { Answers, computeTightness, Tightness } from './src/lib/bodyTest';
import { addSession, sessions, streak } from './src/lib/history';
import { DEFAULT_PLAN, Plan, prescribe, RoutineItem, secondsOf, Setting } from './src/lib/prescribe';
import { load, save, track } from './src/lib/storage';
import { Backup } from './src/screens/Backup';
import { Done, RateAfter } from './src/screens/Finish';
import { Lab } from './src/screens/Lab';
import Library from './src/screens/Library';
import { HubNike } from './src/screens/HubNike';
import { ProgramDetail } from './src/screens/Programs';
import { Ask, BodyMap, PlanScreen, Preview, Test, Welcome } from './src/screens/Onboarding';
import { Player } from './src/screens/Player';

type Profile = { pain: Area; setting?: Setting; answers: Answers; tightness: Tightness; at: number };
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
  const [profile, setProfile] = useState<Profile | null>(() => load<Profile | null>('profile', null));
  // 返嚟嘅用家直接去主頁，唔使再撳一次
  const [screen, setScreen] = useState<Screen>(() => (load<Profile | null>('profile', null) ? 'hub' : 'welcome'));
  const [pain, setPain] = useState<Area>(() => profile?.pain ?? 'neck');
  const [setting, setSetting] = useState<Setting>(() => profile?.setting ?? 'office');
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(0);

  useEffect(() => track('open'), []);

  const [plan, setPlan] = useState<Plan>(() => ({ ...DEFAULT_PLAN, ...load<Partial<Plan>>('plan', {}) }));
  const [routine, setRoutine] = useState<RoutineItem[]>([]);
  const [prog, setProg] = useState<Program | null>(null);
  const [day, setDay] = useState<number | null>(null); // 課程第幾日（null = 快練／自訂）
  const [back, setBack] = useState<Screen>('hub');
  const toRoutine = (ids: string[]): RoutineItem[] =>
    ids.flatMap((id) => {
      const exercise = EXERCISES.find((e) => e.id === id);
      return exercise ? [{ exercise, seconds: secondsOf(exercise) }] : [];
    });
  const begin = (ids: string[], d: number | null, from: Screen) => {
    setRoutine(toRoutine(ids));
    setDay(d);
    setBack(from);
    setScreen('preview');
  };
  const log = load<{ at: number; avg: number }[]>('testlog', []);
  const hint = (() => {
    if (!log.length) return undefined;
    const last = log[log.length - 1];
    const days = Math.max(0, Math.floor((Date.now() - last.at) / 86400000));
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
    if (!prog || day === null) return undefined;
    const n = nextDay(prog.id);
    return n >= 7 ? `${prog.name} · 七日全部完成！` : `${prog.name} · 完成第 ${day + 1} 日，聽日做第 ${n + 1} 日`;
  })();

  const body = (() => {
    switch (screen) {
      case 'welcome':
        return (
          <Welcome
            returning={!!profile}
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
            onNext={(a, b, st) => {
              setPain(a);
              setBefore(b);
              setSetting(st);
              setPlan((pl) => ({ ...pl, setting: st }));
              setScreen('test');
            }}
          />
        );
      case 'test':
        return <Test onDone={finishTest} />;
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
          />
        ) : null;
      case 'plan':
        return profile ? (
          <PlanScreen
            initial={plan}
            onBack={() => setScreen('map')}
            onNext={(pl) => {
              setPlan(pl);
              save('plan', pl);
              setRoutine(prescribe(profile.tightness, pl));
              setDay(null);
              setBack('plan');
              setScreen('preview');
            }}
          />
        ) : null;
      case 'preview':
        return (
          <Preview
            routine={routine}
            before={before}
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
            routine={routine}
            onDone={() => {
              track('routine_done');
              setScreen('rate');
            }}
            onQuit={() => setScreen(back === 'program' ? 'program' : 'hub')}
          />
        );
      case 'rate':
        return (
          <RateAfter
            before={before}
            onSubmit={(a) => {
              setAfter(a);
              if (prog && day !== null) markDone(prog.id, day);
              addSession({ at: Date.now(), ids: routine.map((r) => r.exercise.id), before, after: a });
              track('rate_after');
              setScreen('done');
            }}
          />
        );
      case 'done':
        return (
          <Done
            before={before}
            after={after}
            streakDays={streak(sessions())}
            programNote={programNote}
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
      {body}
    </>
  );
}
