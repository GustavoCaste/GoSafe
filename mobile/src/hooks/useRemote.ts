import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import { errorMessage } from '../data/store';

/**
 * Busca os dados da tela no servidor sempre que ela ganha foco
 * (e quando as dependências mudam).
 */
export function useRemote(load: () => Promise<unknown>, deps: unknown[]) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const run = useRef(0);
  const key = JSON.stringify(deps);

  const refresh = useCallback(() => {
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
  return { loading, error, refresh };
}
