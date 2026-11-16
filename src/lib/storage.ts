// 網頁保留 localStorage 格式；原生版每個 key 使用獨立檔案。
import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
const memory = new Map<string, string>();
let storageFailed = false;
export const storageUnavailable = () => storageFailed;

function ls(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function load<T>(key: string, fallback: T): T {
  try {
    const file = Platform.OS === 'web' ? null : new File(Paths.document, `train-buddy-${key}.json`);
    const raw = memory.get(key) ?? (file ? (file.exists ? file.textSync() : null) : ls()?.getItem(key));
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    if (Platform.OS === 'web') {
      const storage = ls();
      if (!storage) throw new Error('storage unavailable');
      storage.setItem(key, raw);
    }
    else {
      const file = new File(Paths.document, `train-buddy-${key}.json`);
      if (!file.exists) file.create();
      file.writeSync(raw);
    }
  } catch {
    storageFailed = true;
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('train-buddy-storage-error'));
  }
}

// ───── 本地事件紀錄（未有後端，先記喺本機，之後可以上傳） ─────
export type EventName =
  | 'open'
  | 'test_start'
  | 'test_done'
  | 'routine_start'
  | 'routine_done'
  | 'rate_after'
  | 'reminder_set';

type EventRow = { name: EventName; at: number };

export function track(name: EventName) {
  const rows = load<EventRow[]>('events', []);
  rows.push({ name, at: Date.now() });
  save('events', rows.slice(-500));
}

// ───── 備份：匯出／匯入全部紀錄 ─────
// 網頁版清咗瀏覽器資料就會冇晒，所以俾用家自己存一份
const BACKUP_KEYS = ['profile', 'reminder', 'sessions', 'events', 'plan', 'testlog', 'programs', 'avoidedExercises'] as const;
export type Backup = { app: 'train-buddy'; v: 1; at: number; data: Record<string, unknown> };

export function exportData(): Backup {
  const data: Record<string, unknown> = {};
  for (const k of BACKUP_KEYS) {
    const v = load<unknown>(k, null);
    if (v != null) data[k] = v;
  }
  return { app: 'train-buddy', v: 1, at: Date.now(), data };
}

// 成功返回幾多項；檔案唔啱就 throw
export function importData(raw: string): number {
  const b: unknown = JSON.parse(raw);
  if (!isObject(b) || b.app !== 'train-buddy' || b.v !== 1 || !isObject(b.data)) throw new Error('唔係支援嘅身體動備份檔');
  const data = b.data;
  const keys = BACKUP_KEYS.filter((k) => Object.prototype.hasOwnProperty.call(data, k));
  if (!keys.length || keys.some((k) => !validEntry(k, data[k]))) throw new Error('備份資料格式有問題，原有資料未有改動');
  if (Platform.OS !== 'web') throw new Error('手機 app 版暫未支援匯入備份');
  const storage = ls();
  if (!storage) throw new Error('瀏覽器儲存空間無法使用，原有資料未有改動');
  const previous = new Map(keys.map((k) => [k, storage.getItem(k)]));
  try {
    for (const k of keys) storage.setItem(k, JSON.stringify(data[k]));
  } catch {
    for (const [k, value] of previous) {
      try { if (value === null) storage.removeItem(k); else storage.setItem(k, value); } catch { /* storage may remain unavailable */ }
    }
    throw new Error('儲存失敗，請檢查瀏覽器空間，重新開啟 app 並核對原有資料');
  }
  for (const k of keys) memory.set(k, JSON.stringify(data[k]));
  return keys.length;
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const validScore = (v: unknown) => v === null || (finite(v) && v >= 0 && v <= 10);
const strings = (v: unknown) => Array.isArray(v) && v.every((x) => typeof x === 'string');
const isArea = (v: unknown) => typeof v === 'string' && ['neck', 'upper-back', 'lower-back', 'hips-legs', 'wrist'].includes(v);

function validEntry(key: string, value: unknown): boolean {
  switch (key) {
    case 'profile':
      return isObject(value) && isObject(value.answers) && isObject(value.tightness) && finite(value.at)
        && (value.pain === undefined || isArea(value.pain))
        && (value.setting === undefined || value.setting === 'office' || value.setting === 'home')
        && Object.values(value.answers).every((v) => finite(v) && Number.isInteger(v) && v >= -1 && v <= 2)
        && Object.values(value.tightness).every((v) => finite(v) && v >= 0 && v <= 1);
    case 'sessions':
      return Array.isArray(value) && value.every((v) => isObject(v) && finite(v.at) && strings(v.ids) && validScore(v.before) && validScore(v.after));
    case 'events': return Array.isArray(value) && value.every((v) => isObject(v) && typeof v.name === 'string' && finite(v.at));
    case 'testlog': return Array.isArray(value) && value.every((v) => isObject(v) && finite(v.at) && finite(v.avg));
    case 'avoidedExercises': return strings(value);
    case 'programs':
      return isObject(value) && Object.values(value).every((v) => isObject(v) && finite(v.start) && Array.isArray(v.done)
        && v.done.every((day: unknown) => Number.isInteger(day) && (day as number) >= 0 && (day as number) < 7));
    case 'plan': return isObject(value) && Array.isArray(value.areas) && value.areas.every(isArea) && (value.setting === 'office' || value.setting === 'home')
      && finite(value.minutes) && value.minutes > 0 && value.minutes <= 120;
    case 'reminder': return isObject(value);
    default: return false;
  }
}
