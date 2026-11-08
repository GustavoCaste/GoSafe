import { useRef, useState } from 'react';

/**
 * Evita envio duplicado: um toque duplo em "Publicar" criava dois avisos
 * (ou mostrava "E-mail já cadastrado" no cadastro) antes de a tela trocar.
 * A ação devolve true quando deu certo; se falhar, libera para a usuária
 * corrigir e tentar de novo. Aceita ações assíncronas (modo API).
 */
export function useSubmitOnce() {
  const busy = useRef(false);
  const [sending, setSending] = useState(false);

  const submit = (action: () => boolean | Promise<boolean>) => {
    if (busy.current) return;
    busy.current = true;
    setSending(true);
    Promise.resolve()
      .then(action)
      .catch(() => false)
      .then((ok) => {
        if (!ok) busy.current = false;
        setSending(false);
      });
  };

  return [submit, sending] as const;
}
