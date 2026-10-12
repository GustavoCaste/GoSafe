import type { RatingTone } from './domain/rules';

export const colors = {
  background: '#F7F4F0',
  surface: '#FFFFFF',
  ink: '#1D1726',
  muted: '#5E566A',
  line: '#E4DED6',
  lineSoft: '#EFEAE3',
  primary: '#5B2A86',
  primaryDark: '#2B1446',
  primarySoft: '#EFE7F7',
  coral: '#F2A28F',
  good: '#1C7C68',
  goodSoft: '#E1F2EC',
  medium: '#8F5A0E',
  mediumSoft: '#FBEBC8',
  bad: '#B03A2E',
  badSoft: '#FBE3DF',
  none: '#7A7285',
  map: '#ECE8E1',
};

export const toneColor: Record<RatingTone, string> = {
  good: colors.good,
  medium: colors.medium,
  bad: colors.bad,
  none: colors.none,
};

export const radius = { sm: 10, md: 14, lg: 18, xl: 24 };
