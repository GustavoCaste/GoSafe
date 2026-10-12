import { useRef } from 'react';

/**
 * Evita envio duplicado: um toque duplo em "Publicar" criava dois avisos
 * (ou mostrava "E-mail já cadastrado" no cadastro) antes de a tela trocar.
 * A ação devolve true quando deu certo; se falhar, libera para a usuária
 * corrigir e tentar de novo.
 */
export function useSubmitOnce() {
  const busy = useRef(false);

  return (action: () => boolean) => {
    if (busy.current) return;
    busy.current = true;
    if (!action()) busy.current = false;
  };
}
