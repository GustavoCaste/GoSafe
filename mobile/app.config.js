/**
 * Duas versões do mesmo app:
 * - padrão: "GoSafe Teste" (com.gosafe.test), offline, dados de demonstração no aparelho;
 * - APP_VARIANT=api: "GoSafe" (com.gosafe.app), conversa com o back-end em EXPO_PUBLIC_API_URL.
 */
module.exports = ({ config }) => {
  if (process.env.APP_VARIANT !== 'api') return config;
  return {
    ...config,
    name: 'GoSafe',
    android: { ...config.android, package: 'com.gosafe.app' },
    ios: { ...config.ios, bundleIdentifier: 'com.gosafe.app' },
    // HTTP só para testes em rede local; com a API em HTTPS (Render) a permissão fica de fora
    plugins: process.env.EXPO_PUBLIC_API_URL?.startsWith('http://')
      ? [...config.plugins, ['expo-build-properties', { android: { usesCleartextTraffic: true } }]]
      : config.plugins,
  };
};
