// 新用家流程：歡迎 → 一問 → 身體測試 → 身體地圖 → 今日練習
import { ReactNode, Suspense, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Loading, TrainerScene } from '../components/Demo';
import { EXERCISES } from '../data/exercises';
import { Area } from '../data/types';
import { Answers, AREAS, mapSummary, TESTS, Tightness, tightList } from '../lib/bodyTest';
import { sessions, streak, weekDays, WEEK_GOAL } from '../lib/history';
import { Plan, RoutineItem, routineSeconds, Setting, weekMinutes, WEEK_TARGET_MIN } from '../lib/prescribe';
import { Button, C, DISCLAIMER } from '../ui/theme';

const IDLE = EXERCISES[0];

// 3D 公仔做背景，下面疊一張面板
const noop = () => {};
function Backdrop({ glow, children, tall }: { glow?: Tightness; children: ReactNode; tall?: boolean }) {
  return (
    <View style={s.root}>
      <View style={s.stage}>
        <Suspense fallback={<Loading />}>
          <TrainerScene exercise={IDLE} playing={false} speed={1} view="front" onCue={noop} onRep={noop} glow={glow} />
        </Suspense>
      </View>
      <View style={[s.sheet, tall && { maxHeight: '62%' }]}>{children}</View>
    </View>
  );
}

export function Welcome({ returning, onStart }: { returning: boolean; onStart: () => void }) {
  return (
    <Backdrop>
      <Text style={s.h1}>身體動</Text>
      <Text style={s.p}>
        {returning ? '歡迎返嚟。今日都練 5 分鐘，鬆返個身。' : '寫字樓坐耐咗，頸膊腰都緊？2 分鐘問你幾條問題，幫你度身揀一套 5 分鐘練習。'}
      </Text>
      <Button label={returning ? '睇我嘅身體地圖' : '開始（約 2 分鐘）'} onPress={onStart} />
      <Text style={s.fine}>{DISCLAIMER}</Text>
    </Backdrop>
  );
}

export function Ask({
  onNext,
}: {
  onNext: (pain: Area, before: number) => void;
}) {
  const [pain, setPain] = useState<Area | null>(null);
  const before = 5;
  return (
    <Backdrop>
      <Text style={s.h2}>邊度最唔舒服？</Text>
      <View style={s.wrap}>
        {AREAS.map((a) => (
          <Pressable key={a.id} onPress={() => setPain(a.id)} style={[s.chip, pain === a.id && s.chipOn]}>
            <Text style={[s.chipText, pain === a.id && s.chipTextOn]}>
              {a.emoji} {a.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Button label="下一步" onPress={() => pain && onNext(pain, before)} style={pain ? undefined : { opacity: 0.4 }} />
    </Backdrop>
  );
}

export function Scale({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <View style={s.scale}>
      {Array.from({ length: 11 }, (_, i) => (
        <Pressable key={i} onPress={() => onChange(i)} style={[s.dot, value === i && s.dotOn]}>
          <Text style={[s.dotText, value === i && { color: C.onDark }]}>{i}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Test({ onDone }: { onDone: (a: Answers) => void }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const step = TESTS[i];
  const pick = (score: number) => {
    const next = { ...answers, [step.id]: score };
    setAnswers(next);
    if (i + 1 >= TESTS.length) onDone(next);
    else setI(i + 1);
  };
  return (
    <Backdrop>
      <Text style={s.fine}>
        第 {i + 1} / {TESTS.length} 條
      </Text>
      <Text style={s.h2}>{step.title}</Text>
      <Text style={s.p}>{step.how}</Text>
      {step.options.map((o, idx) => (
        <Button key={o} label={o} kind="ghost" onPress={() => pick(idx)} />
      ))}
      <Text style={s.fine}>慢慢做，有痛就停，揀最接近嗰個。</Text>
    </Backdrop>
  );
}

export function BodyMap({
  tightness,
  onNext,
  onRetest,
  onLibrary,
  onBackup,
  hint,
}: {
  hint?: string;
  tightness: Tightness;
  onNext: () => void;
  onRetest: () => void;
  onLibrary: () => void;
  onBackup: () => void;
}) {
  const list = tightList(tightness, 4);
  return (
    <Backdrop glow={tightness}>
      <Progress />
      <Text style={s.h2}>你嘅身體地圖</Text>
      <Text style={s.p}>{mapSummary(tightness)}</Text>
      {hint ? <Text style={s.fine}>{hint}</Text> : null}
      <View style={s.wrap}>
        {list.map((x) => (
          <View key={x.id} style={s.tag}>
            <View style={[s.tagDot, { opacity: 0.35 + 0.65 * x.value }]} />
            <Text style={s.tagText}>{x.name}</Text>
          </View>
        ))}
      </View>
      <Button label="去今日練習" onPress={onNext} />
      <View style={s.row}>
        <Button label="重新測試" kind="ghost" onPress={onRetest} style={s.half} />
        <Button label="動作庫" kind="ghost" onPress={onLibrary} style={s.half} />
      </View>
      <Pressable onPress={onBackup} style={s.link}>
        <Text style={s.linkText}>備份紀錄</Text>
      </Pressable>
    </Backdrop>
  );
}

// 連續日數 + 今個星期做咗幾日
const WEEK = ['一', '二', '三', '四', '五', '六', '日'];
function Progress() {
  const n = streak();
  const week = weekDays();
  const done = week.filter(Boolean).length;
  return (
    <View style={s.prog}>
      <View style={{ flex: 1 }}>
        <Text style={s.progBig}>{n > 0 ? `🔥 連續 ${n} 日` : '今日開始第 1 日'}</Text>
        <Text style={s.progSub}>
          今個星期 {done}/{WEEK_GOAL} 日{done >= WEEK_GOAL ? ' · 達標 🎉' : ''}
        </Text>
      </View>
      <View style={s.week}>
        {WEEK.map((d, i) => (
          <View key={d} style={s.day}>
            <View style={[s.dayDot, week[i] && s.dayOn]} />
            <Text style={s.dayText}>{d}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const SETTINGS: { id: Setting; label: string }[] = [
  { id: 'office', label: '🏢 寫字樓（坐椅／企）' },
  { id: 'home', label: '🏠 屋企（可以瞓地）' },
];
const MINUTES = [2, 5, 10];

// 揀部位、地點、時間，同打而家嘅緊度（每次練前都問）
export function PlanScreen({ initial, onNext, onBack }: { initial: Plan; onNext: (p: Plan) => void; onBack: () => void }) {
  const [areas, setAreas] = useState<Area[]>(initial.areas);
  const [setting, setSetting] = useState<Setting>(initial.setting);
  const [minutes, setMinutes] = useState(initial.minutes);
  const week = weekMinutes(sessions());
  const toggle = (a: Area) => setAreas((v) => (v.includes(a) ? v.filter((x) => x !== a) : [...v, a]));
  return (
    <Backdrop tall>
      <ScrollView contentContainerStyle={{ gap: 12 }}>
        <Text style={s.h2}>今日想鬆邊度？</Text>
        <View style={s.wrap}>
          <Pressable onPress={() => setAreas([])} style={[s.chip, areas.length === 0 && s.chipOn]}>
            <Text style={[s.chipText, areas.length === 0 && s.chipTextOn]}>✨ 跟我嘅測試</Text>
          </Pressable>
          {AREAS.map((a) => (
            <Pressable key={a.id} onPress={() => toggle(a.id)} style={[s.chip, areas.includes(a.id) && s.chipOn]}>
              <Text style={[s.chipText, areas.includes(a.id) && s.chipTextOn]}>
                {a.emoji} {a.label} · {Math.round(week[a.id])}/{WEEK_TARGET_MIN}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={s.fine}>數字 = 今個星期已拉咗幾多分鐘 / 目標 {WEEK_TARGET_MIN} 分鐘</Text>
        <View style={s.wrap}>
          {SETTINGS.map((x) => (
            <Pressable key={x.id} onPress={() => setSetting(x.id)} style={[s.chip, setting === x.id && s.chipOn]}>
              <Text style={[s.chipText, setting === x.id && s.chipTextOn]}>{x.label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={s.wrap}>
          {MINUTES.map((m) => (
            <Pressable key={m} onPress={() => setMinutes(m)} style={[s.chip, minutes === m && s.chipOn]}>
              <Text style={[s.chipText, minutes === m && s.chipTextOn]}>{m} 分鐘</Text>
            </Pressable>
          ))}
        </View>
        <Button label="睇今日練習" onPress={() => onNext({ areas, setting, minutes })} />
        <Button label="返回" kind="ghost" onPress={onBack} />
      </ScrollView>
    </Backdrop>
  );
}

export function Preview({
  routine,
  before,
  onBefore,
  onStart,
  onBack,
}: {
  routine: RoutineItem[];
  before: number;
  onBefore: (n: number) => void;
  onStart: () => void;
  onBack: () => void;
}) {
  const min = Math.round(routineSeconds(routine) / 60);
  return (
    <Backdrop tall>
      <Text style={s.h2}>今日練習 · 約 {min} 分鐘</Text>
      <ScrollView style={{ maxHeight: 150 }}>
        {routine.map((r, i) => (
          <View key={r.exercise.id} style={s.item}>
            <Text style={s.itemNum}>{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{r.exercise.name}</Text>
              <Text style={s.itemSub}>
                {r.exercise.kind} · {r.exercise.hold ? `每邊停 ${r.exercise.hold.seconds} 秒${r.exercise.hold.sides === 2 ? '，左右各做' : ''}` : `${r.seconds} 秒`}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <Text style={s.label}>而家邊度有幾緊或者痛？（0 = 冇事，10 = 好痛）</Text>
      <Scale value={before} onChange={onBefore} />
      <Text style={s.fine}>會有聲音提示，記得開聲。{DISCLAIMER}</Text>
      <Button label="開始" onPress={onStart} />
      <Button label="返回" kind="ghost" onPress={onBack} />
    </Backdrop>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  stage: { flex: 1 },
  link: { alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12 },
  linkText: { color: C.mute, fontSize: 13, textDecorationLine: 'underline' },
  sheet: { backgroundColor: C.panel, padding: 20, paddingBottom: 32, gap: 12, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  h1: { color: C.text, fontSize: 32, fontWeight: '800' },
  h2: { color: C.text, fontSize: 22, fontWeight: '700' },
  p: { color: C.sub, fontSize: 15, lineHeight: 22 },
  label: { color: C.mute, fontSize: 13 },
  fine: { color: C.mute, fontSize: 12, lineHeight: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: C.card },
  chipOn: { backgroundColor: C.text },
  chipText: { color: C.sub, fontSize: 15, fontWeight: '600' },
  chipTextOn: { color: C.onDark },
  scale: { flexDirection: 'row', justifyContent: 'space-between' },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
  dotOn: { backgroundColor: C.accent },
  dotText: { color: C.sub, fontSize: 12, fontWeight: '600' },
  tag: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.card, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  tagDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent },
  tagText: { color: C.text, fontSize: 14 },
  row: { flexDirection: 'row', gap: 8 },
  prog: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.bg, borderRadius: 16, padding: 12 },
  progBig: { color: C.text, fontSize: 17, fontWeight: '800' },
  progSub: { color: C.mute, fontSize: 12, marginTop: 2 },
  week: { flexDirection: 'row', gap: 6 },
  day: { alignItems: 'center', gap: 3 },
  dayDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: C.line },
  dayOn: { backgroundColor: C.calm },
  dayText: { color: C.mute, fontSize: 10 },
  half: { flex: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  itemNum: { color: C.accent, fontSize: 18, fontWeight: '800', width: 22 },
  itemName: { color: C.text, fontSize: 16, fontWeight: '600' },
  itemSub: { color: C.mute, fontSize: 12 },
});
