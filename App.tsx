import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Area } from './src/data/types';
import { Answers, computeTightness, Tightness } from './src/lib/bodyTest';
import { addSession, sessions, streak } from './src/lib/history';
import { prescribe } from './src/lib/prescribe';
import { load, save, track } from './src/lib/storage';
import { Backup } from './src/screens/Backup';
import { Done, RateAfter } from './src/screens/Finish';
import Library from './src/screens/Library';
import { Ask, BodyMap, Preview, Test, Welcome } from './src/screens/Onboarding';
import { Player } from './src/screens/Player';

type Profile = { pain: Area; answers: Answers; tightness: Tightness; at: number };
type Screen = 'welcome' | 'ask' | 'test' | 'map' | 'preview' | 'play' | 'rate' | 'done' | 'library' | 'backup';

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(() => load<Profile | null>('profile', null));
  const [screen, setScreen] = useState<Screen>('welcome');
  const [pain, setPain] = useState<Area>('neck');
  const [before, setBefore] = useState(5);
  const [after, setAfter] = useState(0);
  const [reminder, setReminder] = useState<string | null>(() => load<string | null>('reminder', null));

  useEffect(() => track('open'), []);

  const routine = useMemo(() => (profile ? prescribe(profile.tightness, profile.pain) : []), [profile]);

  const finishTest = (answers: Answers) => {
    const p: Profile = { pain, answers, tightness: computeTightness(answers, pain), at: Date.now() };
    save('profile', p);
    setProfile(p);
    track('test_done');
    setScreen('map');
  };

  const body = (() => {
    switch (screen) {
      case 'welcome':
        return (
          <Welcome
            returning={!!profile}
            onStart={() => {
              if (profile) setScreen('map');
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
            onNext={(a, b) => {
              setPain(a);
              setBefore(b);
              setScreen('test');
            }}
          />
        );
      case 'test':
        return <Test onDone={finishTest} />;
      case 'map':
        return profile ? (
          <BodyMap
            tightness={profile.tightness}
            onNext={() => setScreen('preview')}
            onRetest={() => setScreen('ask')}
            onLibrary={() => setScreen('library')}
            onBackup={() => setScreen('backup')}
          />
        ) : null;
      case 'preview':
        return (
          <Preview
            routine={routine}
            onStart={() => {
              track('routine_start');
              setScreen('play');
            }}
            onBack={() => setScreen('map')}
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
            onQuit={() => setScreen('map')}
          />
        );
      case 'rate':
        return (
          <RateAfter
            before={before}
            onSubmit={(a) => {
              setAfter(a);
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
            reminder={reminder}
            onReminder={(t) => {
              setReminder(t);
              save('reminder', t);
              track('reminder_set');
            }}
            onHome={() => setScreen('map')}
          />
        );
      case 'library':
        return <Library onBack={() => setScreen(profile ? 'map' : 'welcome')} />;
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
