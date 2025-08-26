module.exports = function (api) {
  api.cache(true);
  
  // Check if module-resolver plugin is available
  let moduleResolverPlugin = null;
  try {
    require.resolve('babel-plugin-module-resolver');
    moduleResolverPlugin = [
      'module-resolver',
      {
        alias: {
          '@': './',
        },
      },
    ];
  } catch (error) {
    console.log('babel-plugin-module-resolver not found, path aliases will be handled by Metro resolver');
  }

  const plugins = [
    ...(moduleResolverPlugin ? [moduleResolverPlugin] : []),
    ['react-native-reanimated/plugin', {
      relativeSourceLocation: true,
    }],
  ];

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
}; 