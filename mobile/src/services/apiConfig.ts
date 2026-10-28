import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Porta do backend Spring Boot (gosafe-backend), definida pelo Spring Boot
// por padrão como 8080 (não há "server.port" customizado em application.properties).
const API_PORT = 8080;

/**
 * Resolve a URL base da API automaticamente a partir do host usado pelo
 * Metro/Expo para servir o app (Constants.expoConfig.hostUri), que já
 * corresponde ao IP da máquina de desenvolvimento na rede local. Isso
 * cobre tanto emulador quanto dispositivo físico via Expo Go, sem exigir
 * configuração manual na maioria dos casos.
 *
 * Caso não funcione no seu ambiente, edite API_BASE_URL abaixo diretamente.
 */
function resolveApiBaseUrl(): string {
  if (Platform.OS === 'web') {
    return `http://localhost:${API_PORT}`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(':')[0];

  if (host) {
    return `http://${host}:${API_PORT}`;
  }

  // Fallback: endereço padrão do host da máquina visto pelo emulador Android.
  return `http://10.0.2.2:${API_PORT}`;
}

export const API_BASE_URL = resolveApiBaseUrl();
