module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // reanimated siempre debe ser el último plugin
      'react-native-reanimated/plugin',
    ],
  };
};
