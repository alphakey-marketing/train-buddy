const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} }; cache.set(file,module);
  const source = ts.transpileModule(fs.readFileSync(file,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const req = name => name.endsWith('/storage') || name === './storage' ? {load:(_,fallback)=>fallback,save:()=>{}} : name.startsWith('.') ? load(path.resolve(path.dirname(file),name)+'.ts') : require(name);
  new Function('require','module','exports',source)(req,module,module.exports);
  return module.exports;
}
const {EXERCISES} = load('src/data/exercises.ts');
const {sampleExercise} = load('src/lib/motion.ts');
const {prescribe,routineSeconds,weekMinutes,available,secondsOf} = load('src/lib/prescribe.ts');
const breath = EXERCISES.find(e=>e.id==='slow-breath');
for (let i=0;i<4;i++) {
  assert.match(sampleExercise(breath,3+i*10).cue,/吸氣/);
  assert.match(sampleExercise(breath,7+i*10).cue,/呼氣/);
}
for (const minutes of [2,5,10]) {
  const plan={areas:['neck'],setting:'office',minutes,equipment:['chair'],seatedOnly:true};
  const routine=prescribe({},plan,[]);
  assert.equal(routine.at(-1).exercise.id,'natural-breath');
  assert.ok(routineSeconds(routine)<=minutes*60);
  assert.ok(routine.every(i=>available(i.exercise,plan)));
  const neck = routine.filter(i=>['upper-trap-stretch','levator-stretch'].includes(i.exercise.id));
  assert.ok(neck.length<=1);
}
const week=weekMinutes([{at:Date.now(),ids:['slow-breath','upper-trap-stretch'],before:null,after:null}]);
assert.equal(week.neck,1);
const lunch=['shoulder-roll','upper-trap-stretch','wrist-extensor-stretch'].map(id=>EXERCISES.find(e=>e.id===id)).map(exercise=>({exercise,seconds:secondsOf(exercise)}));
assert.equal(routineSeconds(lunch),176);
console.log('Breathing phases, bounded routines, equipment, neck overlap, hold accounting and elapsed time passed.');
