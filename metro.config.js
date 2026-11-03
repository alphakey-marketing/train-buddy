// Metro 預設唔識 .glb，要加入資源類型先 require 得
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('glb');

module.exports = config;
