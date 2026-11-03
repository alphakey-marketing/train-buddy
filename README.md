# Train Buddy 🏋️

一個 3D 健身陪練 App 原型：人形會示範伸展同訓練動作，你可以由背面睇佢做，練緊嘅肌肉會發紅光。

![screenshot](docs/screenshot.png)

## 開始

```bash
npm install
npx expo start
```

- 手機裝 **Expo Go**，掃 QR code 就可以試
- 撳 `w` 用瀏覽器開

## 項目結構

```
App.tsx                         主畫面（動作選擇、肌肉清單、控制）
src/components/TrainerScene.tsx 3D 場景、鏡頭、動畫播放
src/components/HumanFigure.tsx  人形同肌肉
src/data/exercises.ts           動作總表（基本動作 + 動作庫）
src/data/types.ts               動作類型、分類（基本 / P0–P3）
src/data/library/ch4.ts         身體操作書 ch4 初級動作庫（16 個）
src/data/library/ch5.ts         身體操作書 ch5 發展動作庫（13 個）
src/data/muscles.ts             肌肉名稱
src/lib/pose.ts                 姿勢類型同插值
docs/PLAN.md                    開發規劃
```

詳細規劃睇 [docs/PLAN.md](docs/PLAN.md)。
