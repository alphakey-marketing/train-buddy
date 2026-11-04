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
