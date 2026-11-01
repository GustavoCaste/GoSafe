import { Text, View } from 'react-native';

import { Screen, styles as ui } from '../components/ui';
import { LEGAL_DOCUMENTS } from '../domain/legal';
import type { ScreenProps } from '../navigation/types';
import { colors } from '../theme';

/** Termos de uso e Política de privacidade, disponíveis mesmo sem conexão. */
export function LegalScreen({ route }: ScreenProps<'Legal'>) {
  const document = LEGAL_DOCUMENTS[route.params.document];

  return (
    <Screen title={document.title}>
      <Text style={ui.muted}>Versão de {document.version}</Text>
      {document.sections.map((section) => (
        <View key={section.heading} style={{ gap: 4 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: colors.ink }}>{section.heading}</Text>
          <Text style={{ fontSize: 15, lineHeight: 22, color: colors.ink }}>{section.text}</Text>
        </View>
      ))}
    </Screen>
  );
}
