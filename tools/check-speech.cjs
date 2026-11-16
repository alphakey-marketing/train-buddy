// Speech policy regression: complete current cue; never queue stale motion cues.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const spoken = [];
let stops = 0;
let finishStop;
let stopResult = Promise.resolve();
let failSpeak = false;
const speech = {
  speak(text, options) { if (failSpeak) throw Error('unavailable'); spoken.push({ text, options }); },
  stop() { stops++; return stopResult; },
};
const moduleUnderTest = { exports: {} };
const source = ts.transpileModule(fs.readFileSync('src/lib/device.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('require','exports',source)(name => name === 'expo-speech' ? speech : {}, moduleUnderTest.exports);
const {say,hush} = moduleUnderTest.exports;
const flush = async () => { for(let i=0;i<5;i++) await Promise.resolve(); };
(async () => {
  say('下巴向後收，後頸拉長');
  await flush();
  say('停一停，眼仲係望前');
  await flush();
  assert.equal(stops,0,'A new cue must not cancel the current sentence');
  assert.equal(spoken.length,1,'Busy cues must not accumulate');
  spoken[0].options.onDone();
  await flush();
  assert.equal(spoken.length,1,'Discarded cues must not replay late');
  say('慢慢放返'); await flush();
  assert.equal(spoken.length,2);
  stopResult = new Promise(resolve => { finishStop = resolve; });
  hush();
  say('下一個動作'); await flush();
  assert.equal(spoken.length,2,'Wait for asynchronous cancellation');
  finishStop(); await flush();
  assert.equal(spoken.at(-1).text,'下一個動作');
  spoken[1].options.onStopped();
  say('過時提示'); await flush();
  assert.equal(spoken.length,3,'Late callbacks must not unlock the current sentence');
  spoken[2].options.onError(Error('voice failed'));
  say('錯誤後重試'); await flush();
  assert.equal(spoken.length,4);
  hush(); say('未開始'); hush(); await flush();
  assert.equal(spoken.length,4,'Pause must cancel speech awaiting stop');
  failSpeak=true; say('unsupported'); await flush();
  failSpeak=false; say('recovered'); await flush();
  assert.equal(spoken.at(-1).text,'recovered');
  console.log('Speech completion, stale cue dropping, stop races, pause and error recovery passed.');
})().catch(error => { console.error(error); process.exitCode=1; });
