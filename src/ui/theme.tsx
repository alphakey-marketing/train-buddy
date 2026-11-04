import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

export const C = {
  bg: '#14161c',
  panel: '#1c1f27',
  card: '#262a33',
  text: '#ffffff',
  sub: '#c9cfdb',
  mute: '#8a92a3',
  accent: '#ff3b30',
  warn: '#ffb340',
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
      <Text style={[s.btnText, kind === 'ghost' && { color: C.sub }]}>{label}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { backgroundColor: C.accent, borderRadius: 999, paddingVertical: 14, alignItems: 'center' },
  ghost: { backgroundColor: C.card },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export const DISCLAIMER = '呢個 app 只係一般保健參考，唔係醫療建議。有傷痛、懷孕或者長期病患，請先問醫生。做動作時痛、暈就即刻停。';
