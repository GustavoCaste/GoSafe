/**
 * Modo do app, definido no build:
 * - offline (padrão): "GoSafe Teste", dados só no aparelho, com carga de demonstração;
 * - api: "GoSafe", conversa com o back-end (EXPO_PUBLIC_GOSAFE_MODE=api).
 */
export const API_MODE = process.env.EXPO_PUBLIC_GOSAFE_MODE === 'api';

/** Endereço inicial da API; pode ser trocado na tela de login (fica salvo no aparelho). */
export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:8080';

/** Só em builds internos: mostra na tela de login o campo para trocar o servidor. */
export const SHOW_SERVER_SETTINGS = process.env.EXPO_PUBLIC_SHOW_SERVER_SETTINGS === 'true';

/** Conta da carga de demonstração do back-end (perfil dev). */
export const API_DEMO_ACCOUNT = { login: 'seed01', password: 'gosafe123' };
