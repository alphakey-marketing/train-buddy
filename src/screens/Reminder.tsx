import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, C } from '../ui/theme';

// A calendar file delegates the reminder to the user's calendar app; the web page
// cannot promise background notifications after it has been closed.
export function Reminder() {
  const [time, setTime] = useState('12:30');
  const [message, setMessage] = useState('');
  if (Platform.OS !== 'web') return null;
  const create = () => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
    const hour = Number(match?.[1]);
    const minute = Number(match?.[2]);
    if (!match || hour > 23 || minute > 59) { setMessage('請輸入 24 小時制時間，例如 12:30。'); return; }
    const start = new Date();
    start.setHours(hour, minute, 0, 0);
    if (start.getTime() <= Date.now()) start.setDate(start.getDate() + 1);
    const end = new Date(start.getTime() + 5 * 60000);
    const stamp = (d: Date) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
    const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@train-buddy`;
    const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Train Buddy//Reminder//ZH', 'BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`, 'RRULE:FREQ=DAILY', 'SUMMARY:身體動：活動一下', 'BEGIN:VALARM', 'TRIGGER:PT0M', 'ACTION:DISPLAY', 'DESCRIPTION:活動一下', 'END:VALARM', 'END:VEVENT', 'END:VCALENDAR', ''].join('\r\n');
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'body-relax-reminder.ics'; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('已產生日曆檔；請開啟檔案並加入你嘅日曆。提醒要喺日曆同裝置設定開啟。');
  };
  return <View style={s.root}>
    <Text style={s.title}>每日活動提醒</Text>
    <Text style={s.text}>加入日曆，由你嘅日曆 app 提醒；網頁關閉後唔會自行發通知。</Text>
    <TextInput accessibilityLabel="提醒時間，24 小時制" value={time} onChangeText={setTime} placeholder="12:30" keyboardType="numbers-and-punctuation" style={s.input} />
    <Button label="下載每日提醒" kind="ghost" onPress={create} />
    {!!message && <Text accessibilityRole="alert" style={s.text}>{message}</Text>}
  </View>;
}

const s = StyleSheet.create({
  root: { marginHorizontal: 18, marginTop: 28, padding: 16, borderRadius: 16, backgroundColor: C.card, gap: 10 },
  title: { color: C.text, fontSize: 18, fontWeight: '800' },
  text: { color: C.sub, fontSize: 14, lineHeight: 20 },
  input: { color: C.text, backgroundColor: C.panel, borderWidth: 1, borderColor: C.line, borderRadius: 8, minHeight: 48, paddingHorizontal: 12, fontSize: 16 },
});
