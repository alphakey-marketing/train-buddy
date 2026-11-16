// Focused checks for backup integrity and local-calendar streaks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function moduleFrom(path, imports, globals = {}) {
  const source = fs.readFileSync(path, 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: (name) => imports[name], ...globals }, { filename: path });
  return exports;
}

const values = new Map();
let failOn = null;
const localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => { if (key === failOn) { failOn = null; throw Error('quota'); } values.set(key, value); },
  removeItem: (key) => values.delete(key),
};
const storage = moduleFrom('src/lib/storage.ts', {
  'react-native': { Platform: { OS: 'web' } },
  'expo-file-system': {},
}, { localStorage });
const backup = (data) => JSON.stringify({ app: 'train-buddy', v: 1, at: 1, data });
const profile = { answers: {}, tightness: {}, at: 1 };
storage.save('profile', profile);
assert.throws(() => storage.importData(backup({ profile: { answers: null }, sessions: [] })));
assert.deepEqual(JSON.parse(values.get('profile')), profile);
storage.save('sessions', []);
failOn = 'sessions';
assert.throws(() => storage.importData(backup({ profile: { ...profile, at: 2 }, sessions: [] })));
assert.deepEqual(JSON.parse(values.get('profile')), profile);
assert.equal(storage.importData(backup({ profile: { ...profile, at: 3 }, sessions: [] })), 2);
assert.equal(storage.load('profile', null).at, 3);

const history = moduleFrom('src/lib/history.ts', { './storage': storage });
const day = (month, date) => new Date(2026, month - 1, date, 12).getTime();
const session = (at) => ({ at, ids: ['x'], before: null, after: null });
assert.equal(history.streak([session(day(3, 7)), session(day(3, 8)), session(day(3, 9))], day(3, 9)), 3);
assert.equal(history.streak([session(day(10, 31)), session(day(11, 1)), session(day(11, 2))], day(11, 2)), 3);
console.log('Backup validation, rollback, restore and DST streak checks passed.');
