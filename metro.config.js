const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Habilita path aliases definidos en tsconfig.json (@/ → src/)
config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

module.exports = config;
