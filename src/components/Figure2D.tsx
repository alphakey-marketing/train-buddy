// 2D 示範公仔：同 TrainerScene 一樣嘅介面，可以直接互換。
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Ellipse, Line, Polygon } from 'react-native-svg';
import { Exercise, repLength } from '../data/exercises';
import { buildFigure, COLORS, floorShadow, Intensity2D, Shape, View2D, VIEWBOX } from '../lib/figure2d';
import { sampleExercise } from '../lib/motion';
import { C } from '../ui/theme';

type Props = {
  exercise: Exercise;
  playing: boolean;
  speed: number;
  view: View2D;
  onCue: (cue: string) => void;
  onRep: (reps: number) => void;
  glow?: Intensity2D; // 有值就用固定發光，唔跟動作
  viewBox?: typeof VIEWBOX; // 想睇近啲就俾細啲嘅框
};

export function ShapeView({ s, k }: { s: Shape; k: number }) {
  const op = s.opacity ?? 1;
  if (s.kind === 'circle') return <Circle key={k} cx={s.c[0]} cy={s.c[1]} r={s.r} fill={s.color} opacity={op} />;
  if (s.kind === 'line') {
    const [a, b] = s.pts;
    return (
      <Line key={k} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={s.color} strokeWidth={s.width} strokeLinecap="round" opacity={op} />
    );
  }
  return (
    <Polygon
      key={k}
      points={s.pts.map((p) => `${p[0]},${p[1]}`).join(' ')}
      fill={s.color}
      stroke={s.color}
      strokeWidth={s.round * 2}
      strokeLinejoin="round"
      opacity={op}
    />
  );
}

export function Figure2D({ exercise, playing, speed, view, onCue, onRep, glow, viewBox }: Props) {
  const [time, setTime] = useState(0);
  const timeRef = useRef(0);
  const reps = useRef(0);
  const lastCue = useRef('');
  const playRef = useRef({ playing, speed });
  playRef.current = { playing, speed };

  // 換動作：由頭開始
  useEffect(() => {
    timeRef.current = 0;
    reps.current = 0;
    lastCue.current = '';
    setTime(0);
    onRep(0);
  }, [exercise.id]);

  // 每格更新時間
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
      last = now;
      if (playRef.current.playing) {
        const len = repLength(exercise);
        timeRef.current += dt * playRef.current.speed;
        if (timeRef.current >= len) {
          timeRef.current -= len;
          reps.current += 1;
          onRep(reps.current);
        }
        setTime(timeRef.current);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [exercise]);

  const sample = sampleExercise(exercise, time);
  useEffect(() => {
    if (sample.cue !== lastCue.current) {
      lastCue.current = sample.cue;
      onCue(sample.cue);
    }
  }, [sample.cue]);

  const shapes = buildFigure(sample.pose, glow ?? sample.intensity, view);
  const shadow = floorShadow(sample.pose, view);
  const vb = viewBox ?? VIEWBOX;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center' }}>
      <Svg width="100%" height="100%" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet">
        <Line x1={vb.x} y1={0} x2={vb.x + vb.w} y2={0} stroke={COLORS.floor} strokeWidth={0.012} />
        <Ellipse cx={shadow.cx} cy={0.005} rx={shadow.rx} ry={0.035} fill={COLORS.floor} />
        {shapes.map((s, i) => (
          <ShapeView key={i} s={s} k={i} />
        ))}
      </Svg>
    </View>
  );
}
