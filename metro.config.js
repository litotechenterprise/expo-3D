// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 3D file extensions
config.resolver.assetExts.push(
  'glb',
  'gltf',
  'obj',
  'mtl',
  'dae',
  'fbx'
);

module.exports = config;