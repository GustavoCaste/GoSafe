import { useNavigation, type NavigationProp } from '@react-navigation/native';

import { appAlert } from '../components/AppDialog';
import { currentUser } from '../data/store';
import type { RootStackParamList } from '../navigation/types';

export const PLACE_DETAILS_LOGIN = 'Para ver as notas de cada tópico e os avisos deste local, entre na sua conta.';

/** Visitante vê o mapa, a lista e a nota geral; para abrir o local ou interagir, é convidada a entrar. Devolve true se já há sessão. */
export function useRequireLogin() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (reason: string): boolean => {
    if (currentUser()) return true;
    appAlert('Entre para continuar', reason, [
      { text: 'Agora não', style: 'cancel' },
      { text: 'Entrar', onPress: () => navigation.navigate('Login') },
    ]);
    return false;
  };
}
