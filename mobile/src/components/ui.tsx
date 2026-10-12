import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ALERT_MESSAGE, formatRating, ratingTone } from '../domain/rules';
import { colors, radius, toneColor } from '../theme';

export type IconName = keyof typeof Ionicons.glyphMap;

/** Tela com área segura, conteúdo rolável e rodapé fixo opcional (nada sobrepõe o conteúdo). */
export function Screen({
  title,
  back = true,
  right,
  footer,
  scroll = true,
  children,
}: {
  title?: string;
  back?: boolean;
  right?: ReactNode;
  footer?: ReactNode;
  scroll?: boolean;
  children: ReactNode;
}) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {(title || back) && (
        <View style={styles.header}>
          {back && navigation.canGoBack() ? (
            <IconButton icon="chevron-back" label="Voltar" onPress={() => navigation.goBack()} />
          ) : null}
          {title ? (
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {right}
        </View>
      )}
      {/* Android 15 é edge-to-edge: sem isto o teclado cobre campos e o botão do rodapé */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
        {scroll ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
        ) : (
          <View style={{ flex: 1 }}>{children}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.ink,
  filled = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  filled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, filled && styles.iconButtonFilled, pressed && { opacity: 0.6 }]}
      hitSlop={6}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.primary, fg: '#FFFFFF', border: colors.primary },
    secondary: { bg: colors.surface, fg: colors.primary, border: colors.primary },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
    danger: { bg: colors.surface, fg: colors.bad, border: colors.bad },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.bg, borderColor: palette.border },
        (pressed || disabled) && { opacity: 0.6 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={20} color={palette.fg} /> : null}
          <Text style={[styles.buttonText, { color: palette.fg }]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#9A93A3" style={[styles.input, props.multiline && styles.inputMultiline]} {...props} />
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipSelected : styles.chipIdle]}
    >
      <Text style={[styles.chipText, { color: selected ? '#FFFFFF' : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function RatingBadge({ rating, large = false }: { rating: number | null; large?: boolean }) {
  return (
    <View style={[styles.badge, large && styles.badgeLarge, { backgroundColor: toneColor[ratingTone(rating)] }]}>
      <Text style={[styles.badgeText, large && { fontSize: 20 }]}>{formatRating(rating)}</Text>
    </View>
  );
}

export function AlertBanner({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.alert, compact && { padding: 8 }]} accessibilityRole="alert">
      <Ionicons name="warning" size={compact ? 16 : 22} color={colors.bad} />
      <Text style={[styles.alertText, compact && { fontSize: 12 }]}>{compact ? 'Local não aconselhado' : ALERT_MESSAGE}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionTitle}>{children}</Text>
      {right}
    </View>
  );
}

export function Avatar({ name, size = 44, color = colors.coral }: { name: string; size?: number; color?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.primaryDark, fontWeight: '700', fontSize: size * 0.36 }}>{initials || '?'}</Text>
    </View>
  );
}

export const DEMO_DATA_TEXT =
  'Todos os dados deste app de teste — locais, usuárias, notas e comentários — foram criados por IA para exemplificar um cenário real.';

/** Aviso de que a massa de dados é fictícia, gerada por IA. */
export function DemoDataNotice({ dark = false }: { dark?: boolean }) {
  return (
    <View
      accessibilityRole="text"
      style={{
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: radius.md,
        backgroundColor: dark ? 'rgba(255,255,255,0.1)' : '#FFF7E6',
        borderWidth: dark ? 0 : 1,
        borderColor: '#F1D9A6',
      }}
    >
      <Ionicons name="sparkles" size={18} color={dark ? colors.coral : colors.medium} style={{ marginTop: 1 }} />
      <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: dark ? '#E9DFF5' : '#5C3B06' }}>{DEMO_DATA_TEXT}</Text>
    </View>
  );
}

export function Empty({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: '700', color: colors.ink },
  content: { padding: 16, paddingBottom: 32, gap: 14, width: '100%', maxWidth: 640, alignSelf: 'center' },
  footer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.background },
  iconButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  iconButtonFilled: { backgroundColor: colors.primarySoft, borderColor: colors.primarySoft },
  button: { minHeight: 54, borderRadius: radius.md, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  buttonText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink },
  input: { minHeight: 50, borderWidth: 1.5, borderColor: '#DCD5CC', borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, backgroundColor: colors.surface, color: colors.ink },
  inputMultiline: { minHeight: 110, textAlignVertical: 'top' },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, justifyContent: 'center', borderWidth: 1 },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipIdle: { backgroundColor: colors.surface, borderColor: colors.line },
  chipText: { fontSize: 14, fontWeight: '600' },
  badge: { minWidth: 44, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignItems: 'center' },
  badgeLarge: { minWidth: 64, paddingVertical: 8, borderRadius: 14 },
  badgeText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  alert: { flexDirection: 'row', gap: 10, alignItems: 'center', backgroundColor: colors.badSoft, borderRadius: radius.md, padding: 12, borderWidth: 1, borderColor: '#F0B9B1' },
  alertText: { flex: 1, color: '#7A1F16', fontWeight: '700', fontSize: 14, lineHeight: 20 },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 14 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: colors.ink },
  empty: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#DCD5CC', borderRadius: radius.lg, padding: 18 },
  emptyText: { textAlign: 'center', color: colors.muted, fontSize: 14, lineHeight: 20 },
  muted: { color: colors.muted, fontSize: 14 },
  title: { fontSize: 26, fontWeight: '700', color: colors.ink },
});
