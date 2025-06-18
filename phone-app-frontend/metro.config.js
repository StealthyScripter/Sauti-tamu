const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Force single React instance resolution
config.resolver.alias = {
  'react': require.resolve('react'),
  'react-dom': require.resolve('react-dom'),
};

// Ensure consistent module resolution across platforms
config.resolver.platforms = ['web', 'ios', 'android', 'native'];

module.exports = config;