module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      'expo-router/babel',
      // Worklets plugin should come before Reanimated
      // Reanimated plugin MUST be last
      'react-native-worklets/plugin',
    ],
  };
};
