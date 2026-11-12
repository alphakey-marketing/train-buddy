import { Platform, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

// 暖色淺色主題：似瑜伽室，放鬆、唔刺眼
export const C = {
  bg: '#f7f1e9', // 米白底
  panel: '#ffffff', // 面板
  card: '#efe7dc', // 掣、卡
  line: '#e4d9cb',
  text: '#1f2430',
  sub: '#4b5262',
  mute: '#7a7f8a',
  accent: '#e0502f', // 珊瑚橙（白字喺上面夠對比）
  calm: '#2a9d8f', // 青綠：進度、完成
  warn: '#b86e00',
  onDark: '#ffffff', // 深色／橙色底上面嘅字
};

// 標題字體
export const SERIF = Platform.select({
  web: '"Helvetica Neue",Arial,"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif',
  default: undefined,
}) as string;

export const HAIR = StyleSheet.hairlineWidth > 0.6 ? StyleSheet.hairlineWidth : 1;

// 3D 場景用（three.js 色）
export const SCENE = {
  skyTop: '#fdf8f2',
  skyBottom: '#f1e4d4',
  floor: '#efe1d0',
  mat: '#8fcfc4',
  skin: '#e2bfa3',
  shirt: '#2a9d8f',
  shorts: '#33405c',
  shoe: '#f4f1ec',
  glow: '#ff4d2e',
};

export function Button({
  label,
  onPress,
  kind = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost';
  style?: ViewStyle;
}) {
  return (
    <Pressable onPress={onPress} style={[s.btn, kind === 'ghost' && s.ghost, style]}>
      <Text style={[s.btnText, kind === 'ghost' && { color: C.text }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { backgroundColor: C.accent, borderRadius: 999, paddingVertical: 15, alignItems: 'center', borderWidth: 1, borderColor: C.accent },
  ghost: { backgroundColor: C.card, borderColor: C.line },
  btnText: { color: C.onDark, fontSize: 16, fontWeight: '700' },
});

// 紅旗：呢啲情況唔好自己拉，要睇醫生
export const RED_FLAGS = '如果有手腳麻痺、無力，夜晚痛醒，跌親或者撞親之後痛，痛到發燒，或者大小便唔受控，請先睇醫生，唔好自己做。';

export const DISCLAIMER = '呢個 app 只係一般保健參考，唔係醫療建議。有傷痛、懷孕或者長期病患，請先問醫生。做動作時痛、暈就即刻停。';
