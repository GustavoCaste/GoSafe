/**
 * Diálogo com a identidade do GoSafe, no lugar da caixa padrão do Android
 * (Alert.alert). Mesma assinatura: appAlert(título, mensagem?, botões?).
 * O tipo (erro, sucesso, aviso, informação) é deduzido do conteúdo.
 */
import { Ionicons } from '@expo/vector-icons';
import { useSyncExternalStore } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius } from '../theme';

export interface DialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

type Tone = 'error' | 'success' | 'warning' | 'info';

interface Dialog {
  title: string;
  message?: string;
  buttons: DialogButton[];
  tone: Tone;
}

const queue: Dialog[] = [];
const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function inferTone(title: string, buttons: DialogButton[]): Tone {
  if (buttons.some((button) => button.style === 'destructive')) return 'warning';
  if (/não foi possível|não realizado|indisponível|inválid|termos|consentimento|defina/i.test(title)) return 'error';
  if (/feito|verificada|pronto|sucesso/i.test(title)) return 'success';
  return 'info';
}

export function appAlert(title: string, message?: string, buttons?: DialogButton[]) {
  const list = buttons && buttons.length ? buttons : [{ text: 'OK' }];
  queue.push({ title, message, buttons: list, tone: inferTone(title, list) });
  notify();
}

const TONES: Record<Tone, { icon: keyof typeof Ionicons.glyphMap; color: string; soft: string }> = {
  error: { icon: 'alert-circle', color: colors.bad, soft: colors.badSoft },
  success: { icon: 'checkmark-circle', color: colors.good, soft: colors.goodSoft },
  warning: { icon: 'warning', color: colors.medium, soft: colors.mediumSoft },
  info: { icon: 'information-circle', color: colors.primary, soft: colors.primarySoft },
};

/** Monte uma vez na raiz do app. */
export function DialogHost() {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => version,
  );

  const dialog = queue[0];
  if (!dialog) return null;

  const tone = TONES[dialog.tone];
  const close = (button?: DialogButton) => {
    queue.shift();
    notify();
    button?.onPress?.();
  };
  const cancel = dialog.buttons.find((button) => button.style === 'cancel');
  const stacked = dialog.buttons.length > 2;

  return (
    <Modal transparent visible animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={() => close(cancel)}>
      <View style={styles.backdrop}>
        <View style={styles.card} accessibilityRole="alert">
          <View style={[styles.icon, { backgroundColor: tone.soft }]}>
            <Ionicons name={tone.icon} size={30} color={tone.color} />
          </View>
          <Text style={styles.title}>{dialog.title}</Text>
          {dialog.message ? <Text style={styles.message}>{dialog.message}</Text> : null}
          <View style={[styles.buttons, stacked && { flexDirection: 'column' }]}>
            {dialog.buttons.map((button) => {
              const isCancel = button.style === 'cancel';
              const isDanger = button.style === 'destructive';
              return (
                <Pressable
                  key={button.text}
                  accessibilityRole="button"
                  onPress={() => close(button)}
                  style={({ pressed }) => [
                    styles.button,
                    !stacked && { flex: 1 },
                    isCancel
                      ? { backgroundColor: colors.surface, borderColor: colors.line }
                      : { backgroundColor: isDanger ? colors.bad : colors.primary, borderColor: isDanger ? colors.bad : colors.primary },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[styles.buttonText, { color: isCancel ? colors.ink : '#FFFFFF' }]}>{button.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(29,23,38,0.55)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { width: '100%', maxWidth: 400, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 22, alignItems: 'center', gap: 10 },
  icon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  title: { fontSize: 19, fontWeight: '800', color: colors.ink, textAlign: 'center' },
  message: { fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' },
  buttons: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 8 },
  button: { minHeight: 50, borderRadius: radius.md, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  buttonText: { fontSize: 16, fontWeight: '700' },
});
