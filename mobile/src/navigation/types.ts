import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { LatLng } from '../domain/types';

export type RootStackParamList = {
  Welcome: undefined;
  Benefits: undefined;
  Permission: undefined;
  Login: undefined;
  Register: undefined;
  Tabs: undefined;
  Verification: { afterRegister?: boolean } | undefined;
  Place: { placeId: string };
  Notice: { noticeId: string };
  NewNotice: { placeId: string };
  Comment: { noticeId: string };
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
