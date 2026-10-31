/**
 * A API de produção é HTTPS. Só um build de teste em rede local (EXPO_PUBLIC_API_URL
 * com http://) recebe a permissão de tráfego sem criptografia.
 */
module.exports = ({ config }) =>
  process.env.EXPO_PUBLIC_API_URL?.startsWith('http://')
    ? { ...config, plugins: [...config.plugins, ['expo-build-properties', { android: { usesCleartextTraffic: true } }]] }
    : config;
