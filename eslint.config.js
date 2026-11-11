const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expo,
  { ignores: ['dist/*', 'tools/*'] },
  {
    // 動畫迴圈同計時器：故意用 ref 同 effect 改狀態，React compiler 規則唔啱用
    files: ['src/components/TrainerScene.tsx', 'src/screens/Player.tsx'],
    rules: {
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
