export const colors = {
  primary: '#5B3E96',
  primaryDark: '#3E2A6B',
  accent: '#FF6B81',
  background: '#FAF7FF',
  surface: '#FFFFFF',
  text: '#1F1B2E',
  textMuted: '#6B6478',
  border: '#E4DEF0',
  danger: '#D64550',
  success: '#2F9E58',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: colors.textMuted,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    color: colors.text,
  },
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
};
