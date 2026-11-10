// 備份紀錄：匯出做檔案、由檔案匯入（網頁版用）
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { sessions } from '../lib/history';
import { exportData, importData } from '../lib/storage';
import { Button, C } from '../ui/theme';

function download() {
  const b = exportData();
  const blob = new Blob([JSON.stringify(b, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `身體動備份-${new Date(b.at).toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function pickFile(onText: (text: string) => void) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.onchange = () => {
    const f = input.files?.[0];
    if (f) f.text().then(onText);
  };
  input.click();
}

export function Backup({ onBack }: { onBack: () => void }) {
  const [msg, setMsg] = useState('');
  const web = Platform.OS === 'web' && typeof document !== 'undefined';
  const count = sessions().length;

  return (
    <View style={s.root}>
      <Pressable onPress={onBack} style={s.back}>
        <Text style={s.backText}>‹ 返回</Text>
      </Pressable>
      <Text style={s.h2}>備份紀錄</Text>
      <Text style={s.p}>
        紀錄只係存喺呢部手機嘅瀏覽器。清除瀏覽器資料、換手機，紀錄就會冇晒。間唔中匯出一份，有事可以匯入返。
      </Text>
      <Text style={s.stat}>而家有 {count} 次練習紀錄</Text>

      {web ? (
        <>
          <Button
            label="匯出備份檔"
            onPress={() => {
              download();
              setMsg('已經下載，檔案喺「下載」資料夾。');
            }}
          />
          <Button
            label="由備份檔匯入"
            kind="ghost"
            onPress={() =>
              pickFile((text) => {
                try {
                  importData(text);
                  setMsg('匯入成功，重新載入緊…');
                  setTimeout(() => window.location.reload(), 600);
                } catch (e) {
                  setMsg(`匯入唔到：${e instanceof Error ? e.message : '檔案有問題'}`);
                }
              })
            }
          />
        </>
      ) : (
        <Text style={s.p}>手機 app 版之後先有備份。</Text>
      )}
      {!!msg && <Text style={s.msg}>{msg}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 20, paddingTop: 64, gap: 12 },
  back: { position: 'absolute', top: 12, left: 16, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: C.card },
  backText: { color: C.text, fontSize: 14, fontWeight: '700' },
  h2: { color: C.text, fontSize: 26, fontWeight: '700' },
  p: { color: C.sub, fontSize: 15, lineHeight: 22 },
  stat: { color: C.mute, fontSize: 14, marginBottom: 8 },
  msg: { color: C.warn, fontSize: 14, marginTop: 4 },
});
