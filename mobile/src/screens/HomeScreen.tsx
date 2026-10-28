import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/theme';
import { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export function HomeScreen({ navigation }: Props) {
  return (
    <ScreenContainer centered>
      <View style={styles.brand}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoInitial}>G</Text>
        </View>
        <Text style={typography.title}>GoSafe</Text>
        <Text style={styles.tagline}>
          Uma rede colaborativa para que mulheres compartilhem experiências e
          avaliem a percepção de segurança de locais antes de frequentá-los.
        </Text>
      </View>

      <Button label="Criar conta" onPress={() => navigation.navigate('Register')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  brand: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  logoInitial: {
    color: colors.white,
    fontSize: 40,
    fontWeight: '700',
  },
  tagline: {
    ...typography.subtitle,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 22,
  },
});
