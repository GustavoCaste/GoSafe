import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/theme';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'RegisterSuccess'>;

export function RegisterSuccessScreen({ navigation, route }: Props) {
  const { name } = route.params;

  return (
    <ScreenContainer centered>
      <View style={styles.badge}>
        <Text style={styles.badgeIcon}>✓</Text>
      </View>
      <Text style={typography.title}>Cadastro realizado!</Text>
      <Text style={[typography.subtitle, styles.message]}>
        Bem-vinda ao GoSafe, {name}. Sua conta foi criada com sucesso.
      </Text>

      <Button
        label="Voltar ao início"
        onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  badgeIcon: {
    color: colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  message: {
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
});
