import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { LegalDocument } from '../domain/legal';
import type { LatLng, ReportTarget } from '../domain/types';

export type RootStackParamList = {
  Welcome: undefined;
  Benefits: undefined;
  Permission: undefined;
  Login: undefined;
  Register: undefined;
  Tabs: undefined;
  Place: { placeId: string };
  Notice: { noticeId: string };
  NewNotice: { placeId: string };
  Comment: { noticeId: string };
  Report: { targetType: ReportTarget; targetId: string; label: string };
  Legal: { document: LegalDocument };
  Search: { mode?: 'notice' } | undefined;
  CreatePlace: { point?: LatLng } | undefined;
  Profile: undefined;
};

export type TabParamList = {
  Map: { focusPlaceId?: string } | undefined;
  Places: undefined;
  Favorites: undefined;
};

export type ScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, T>;
