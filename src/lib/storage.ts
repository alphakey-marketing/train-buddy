// 本地儲存：網頁用 localStorage，用唔到（私隱模式／手機版）就退回記憶體。
// 手機版長久儲存留到第 4 階段。
const memory = new Map<string, string>();

function ls(): Storage | null {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null;
  } catch {
    return null;
  }
}

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = ls()?.getItem(key) ?? memory.get(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T) {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    ls()?.setItem(key, raw);
  } catch {
    // 儲存滿或者被擋，記憶體版已經有
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
const BACKUP_KEYS = ['profile', 'reminder', 'sessions', 'events', 'plan', 'testlog', 'programs'] as const;
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
  const b = JSON.parse(raw) as Partial<Backup>;
  if (b?.app !== 'train-buddy' || typeof b.data !== 'object' || !b.data) throw new Error('唔係身體動嘅備份檔');
  let n = 0;
  for (const k of BACKUP_KEYS) {
    if (k in b.data) {
      save(k, b.data[k]);
      n++;
    }
  }
  return n;
}
