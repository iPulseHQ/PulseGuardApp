const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for web platform
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure transformer for better web support
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

// Web-specific resolver settings
config.resolver.alias = {
  'react-native-reanimated/lib/reanimated2/web': 'react-native-reanimated/lib/module/reanimated2/web',
  'react-native-reanimated': 'react-native-reanimated/lib/module',
};

// Add resolver extensions for better web compatibility
config.resolver.sourceExts = [...config.resolver.sourceExts, 'web.js', 'web.ts', 'web.tsx'];

module.exports = config; 