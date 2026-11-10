// 出 2D 公仔預覽圖（HTML），用嚟檢查動作有冇畫錯。
// 用法：node tools/preview2d.mjs <輸出.html> [動作id,...]
import { registerHooks } from 'node:module';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';
import { fileURLToPath } from 'node:url';

// src 入面 import 冇寫副檔名，幫佢補 .ts
registerHooks({
  resolve(spec, ctx, next) {
    if ((spec.startsWith('.') || spec.startsWith('/')) && !/\.\w+$/.test(spec) && ctx.parentURL?.startsWith('file:')) {
      for (const ext of ['.ts', '.tsx']) {
        const url = new URL(spec + ext, ctx.parentURL);
        if (existsSync(fileURLToPath(url))) return next(url.href, ctx);
      }
    }
    return next(spec, ctx);
  },
  // .ts 用 TypeScript 轉做 JS（自動剷走淨係型別嘅 import）
  load(url, ctx, next) {
    if (!url.endsWith('.ts') && !url.endsWith('.tsx')) return next(url, ctx);
    const src = readFileSync(fileURLToPath(url), 'utf8');
    const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    return { format: 'module', source: js, shortCircuit: true };
  },
});

const { EXERCISES, repLength } = await import('../src/data/exercises.ts');
const { buildFigure, VIEWBOX, COLORS } = await import('../src/lib/figure2d.ts');
const { sampleExercise, viewFor } = await import('../src/lib/motion.ts');

const out = process.argv[2] ?? 'preview2d.html';
const ids = process.argv[3] ? process.argv[3].split(',') : null;
const list = ids ? ids.map((id) => EXERCISES.find((e) => e.id === id)).filter(Boolean) : EXERCISES;
const views = (process.argv[4] ?? 'front,side').split(',');
const FRAMES = 5;

const svg = (shapes) => {
  const vb = VIEWBOX;
  const body = shapes
    .map((s) => {
      const op = s.opacity ?? 1;
      if (s.kind === 'circle') return `<circle cx="${s.c[0]}" cy="${s.c[1]}" r="${s.r}" fill="${s.color}" opacity="${op}"/>`;
      if (s.kind === 'line') return `<line x1="${s.pts[0][0]}" y1="${s.pts[0][1]}" x2="${s.pts[1][0]}" y2="${s.pts[1][1]}" stroke="${s.color}" stroke-width="${s.width}" stroke-linecap="round" opacity="${op}"/>`;
      return `<polygon points="${s.pts.map((p) => p.join(',')).join(' ')}" fill="${s.color}" stroke="${s.color}" stroke-width="${s.round * 2}" stroke-linejoin="round" opacity="${op}"/>`;
    })
    .join('');
  return `<svg viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="150" height="138"><line x1="-2" y1="0" x2="2" y2="0" stroke="${COLORS.floor}" stroke-width="0.012"/>${body}</svg>`;
};

let html = `<html><body style="background:#14161c;color:#ccc;font:12px sans-serif;margin:8px">`;
for (const ex of list) {
  const len = repLength(ex);
  for (const v0 of views) {
    const v = v0 === 'auto' ? viewFor(ex) : v0;
    html += `<div style="display:flex;align-items:center"><div style="width:130px">${ex.id}<br>${ex.name}<br>${v0 === 'auto' ? 'auto→' : ''}${v}</div>`;
    for (let i = 0; i < FRAMES; i++) {
      const t = (len * i) / FRAMES;
      const s = sampleExercise(ex, t);
      html += svg(buildFigure(s.pose, s.intensity, v));
    }
    html += `</div>`;
  }
}
html += `</body></html>`;
writeFileSync(out, html);
console.log('ok', list.length, out);
