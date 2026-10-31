import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { API_MODE } from '../config';
import { errorMessage } from '../data/store';

/**
 * Modo API: busca os dados da tela no servidor sempre que ela ganha foco
 * (e quando as dependências mudam). No modo offline não faz nada.
 */
export function useRemote(load: () => Promise<unknown>, deps: unknown[]) {
  const [loading, setLoading] = useState(API_MODE);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);
  const key = JSON.stringify(deps);

  const refresh = useCallback(() => {
    if (!API_MODE) return;
    const id = ++run.current;
    setLoading(true);
    load()
      .then(() => id === run.current && setError(null))
      .catch((reason) => id === run.current && setError(errorMessage(reason)))
      .finally(() => id === run.current && setLoading(false));
    // recarrega quando as dependências (serializadas em key) mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useFocusEffect(refresh);
  return { loading: API_MODE && loading, error: API_MODE ? error : null, refresh };
}
