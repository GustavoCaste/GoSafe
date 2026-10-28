import { API_BASE_URL } from './apiConfig';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const DEFAULT_ERROR_MESSAGE = 'Ocorreu um erro inesperado. Tente novamente.';
const CONNECTION_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua conexão e se o backend está em execução.';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
};

/**
 * Cliente HTTP simples e centralizado para consumir a API do gosafe-backend.
 * Todas as telas devem passar por serviços (ex.: userService) que usam esta
 * função, em vez de chamar fetch diretamente.
 */
export async function apiRequest<TResponse>(
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: { 'Content-Type': 'application/json' },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(CONNECTION_ERROR_MESSAGE, 0);
  }

  const rawBody = await response.text();
  let parsedBody: unknown;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : undefined;
  } catch {
    parsedBody = undefined;
  }

  if (!response.ok) {
    const messageField =
      typeof parsedBody === 'object' && parsedBody !== null
        ? (parsedBody as { message?: unknown }).message
        : undefined;

    const backendMessage = typeof messageField === 'string' && messageField.length > 0 ? messageField : undefined;

    throw new ApiError(backendMessage ?? DEFAULT_ERROR_MESSAGE, response.status);
  }

  return parsedBody as TResponse;
}
