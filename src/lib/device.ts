// 手機小功能：屏幕常亮、震動、語音。網頁同手機版共用。
import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import * as Speech from 'expo-speech';

// ───── 屏幕常亮 ─────
// 網頁切走再返嚟，瀏覽器會自動放開，所以要再拎過
export function useScreenAwake(tag = 'player') {
  useEffect(() => {
    const on = () => activateKeepAwakeAsync(tag).catch(() => {});
    on();
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return () => {
        deactivateKeepAwake(tag).catch(() => {});
      };
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') on();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      deactivateKeepAwake(tag).catch(() => {});
    };
  }, [tag]);
}

// ───── 震動 ─────
export function buzz(kind: 'tick' | 'change' | 'done') {
  try {
    if (kind === 'tick') Haptics.selectionAsync().catch(() => {});
    else if (kind === 'change') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    else Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {
    // 冇震動就算
  }
}

// ───── 語音 ─────
// 揀最似廣東話嘅聲：粵語 > 繁中 > 中文 > 冇
export type VoicePick = { id?: string; lang: string; name: string; cantonese: boolean };
let picked: VoicePick | null = null;
let picking: Promise<VoicePick | null> | null = null;

function score(lang: string) {
  const l = lang.toLowerCase().replace('_', '-');
  if (l.startsWith('yue') || l === 'zh-hk' || l.startsWith('zh-hk')) return 3;
  if (l.startsWith('zh-tw') || l.includes('hant')) return 2;
  if (l.startsWith('zh') || l.startsWith('cmn')) return 1;
  return 0;
}

export function pickVoice(): Promise<VoicePick | null> {
  if (picking) return picking;
  const timeout = new Promise<null>((r) => setTimeout(() => r(null), 2500));
  picking = Promise.race([Speech.getAvailableVoicesAsync(), timeout])
    .then((voices) => {
      const best = (voices ?? [])
        .map((v) => ({ v, s: score(v.language) }))
        .filter((x) => x.s > 0)
        .sort((a, b) => b.s - a.s)[0];
      picked = best
        ? { id: best.v.identifier, lang: best.v.language, name: best.v.name, cantonese: best.s === 3 }
        : null;
      return picked;
    })
    .catch(() => null);
  return picking;
}

export function say(text: string) {
  try {
    Speech.stop();
    Speech.speak(text, { language: picked?.lang ?? 'zh-HK', voice: picked?.id, rate: 0.95 });
  } catch {
    // 唔支援語音就靜音繼續
  }
}

export function hush() {
  try {
    Speech.stop();
  } catch {}
}
