const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

// Try to configure SVG transformer, fallback gracefully if not available
let svgTransformerPath;
try {
  svgTransformerPath = require.resolve('react-native-svg-transformer/expo');
} catch (error) {
  console.warn('react-native-svg-transformer not found, SVG support will be limited');
  svgTransformerPath = undefined;
}

// Configure transformer
config.transformer = {
  ...transformer,
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  ...(svgTransformerPath && { babelTransformerPath: svgTransformerPath }),
};

// Configure resolver
config.resolver = {
  ...resolver,
  platforms: ['ios', 'android', 'native', 'web'],
  // Only filter SVG from assetExts if transformer is available
  assetExts: svgTransformerPath ? resolver.assetExts.filter(ext => ext !== 'svg') : resolver.assetExts,
  sourceExts: [
    ...resolver.sourceExts,
    ...(svgTransformerPath ? ['svg'] : []),
    'web.js', 'web.ts', 'web.tsx'
  ],
  alias: {
    'react-native-reanimated/lib/reanimated2/web': 'react-native-reanimated/lib/module/reanimated2/web',
    'react-native-reanimated': 'react-native-reanimated/lib/module',
  },
};

module.exports = config; 