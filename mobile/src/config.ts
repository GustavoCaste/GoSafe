/** Endereço da API, definido no build do APK (EXPO_PUBLIC_API_URL). */
export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

/** Só em builds internos: mostra na tela de login o campo para trocar o servidor. */
export const SHOW_SERVER_SETTINGS = process.env.EXPO_PUBLIC_SHOW_SERVER_SETTINGS === 'true';

/** Centro inicial do mapa quando a localização não é permitida (São Paulo). */
export const DEFAULT_CENTER = { latitude: -23.56, longitude: -46.65 };
