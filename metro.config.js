const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

// Configure transformer for SVG support
config.transformer = {
  ...transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

// Configure resolver
config.resolver = {
  ...resolver,
  platforms: ['ios', 'android', 'native', 'web'],
  assetExts: resolver.assetExts.filter(ext => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg', 'web.js', 'web.ts', 'web.tsx'],
  alias: {
    'react-native-reanimated/lib/reanimated2/web': 'react-native-reanimated/lib/module/reanimated2/web',
    'react-native-reanimated': 'react-native-reanimated/lib/module',
  },
};

module.exports = config; 