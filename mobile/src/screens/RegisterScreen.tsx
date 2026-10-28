import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScreenContainer } from '../components/ScreenContainer';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { colors, spacing, typography } from '../theme/theme';
import { RootStackParamList } from '../navigation/types';
import { createUser } from '../services/userService';
import { ApiError } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

type FormState = {
  name: string;
  email: string;
  password: string;
};

const INITIAL_FORM: FormState = { name: '', email: '', password: '' };

export function RegisterScreen({ navigation }: Props) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | undefined>(undefined);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function validate(): string | undefined {
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      return 'Preencha todos os campos para continuar.';
    }
    return undefined;
  }

  async function handleSubmit() {
    const validationMessage = validate();
    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    setFormError(undefined);
    setIsSubmitting(true);

    try {
      const user = await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigation.replace('RegisterSuccess', { name: user.name });
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.';
      setFormError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ScreenContainer>
      <Text style={typography.title}>Criar conta</Text>
      <Text style={[typography.subtitle, styles.subtitle]}>
        Preencha seus dados para começar a usar o GoSafe.
      </Text>

      <View style={styles.form}>
        <TextField
          label="Nome"
          placeholder="Como podemos te chamar?"
          value={form.name}
          onChangeText={(value) => updateField('name', value)}
          autoCapitalize="words"
        />
        <TextField
          label="E-mail"
          placeholder="seuemail@exemplo.com"
          value={form.email}
          onChangeText={(value) => updateField('email', value)}
          keyboardType="email-address"
        />
        <TextField
          label="Senha"
          placeholder="Crie uma senha"
          value={form.password}
          onChangeText={(value) => updateField('password', value)}
          isPassword
        />

        {formError ? <Text style={styles.errorBanner}>{formError}</Text> : null}

        <Button label="Cadastrar" onPress={handleSubmit} loading={isSubmitting} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  form: {
    marginTop: spacing.sm,
  },
  errorBanner: {
    color: colors.danger,
    fontSize: 14,
    marginBottom: spacing.md,
  },
});
