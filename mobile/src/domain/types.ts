export type Role = 'USER' | 'MODERATOR' | 'ADMIN';
export type Sex = 'FEMALE' | 'MALE' | 'OTHER' | 'NOT_INFORMED';
export type ContentStatus = 'ACTIVE' | 'HIDDEN' | 'REMOVED';
export type GeocodeSource = 'MANUAL' | 'DEVICE';

export type PlaceCategory =
  | 'CAFE'
  | 'BAR'
  | 'RESTAURANT'
  | 'TRANSPORT'
  | 'PARK'
  | 'GYM'
  | 'SHOP'
  | 'SERVICE'
  | 'OTHER';

export type NoticeType = 'HARASSMENT' | 'LIGHTING' | 'MOVEMENT' | 'WELCOMING' | 'RESTROOM' | 'GENERAL';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  /** Banco local de teste: senha guardada só no aparelho, sem comunicação com rede. */
  password: string;
  sex: Sex;
  verified: boolean;
  role: Role;
  validContributions: number;
  active: boolean;
  createdAt: number;
  /** Usuária criada automaticamente pela carga ou pelo gerador de locais de teste. */
  generated?: boolean;
}

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  description: string;
  postalCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  geocodeSource: GeocodeSource;
  weightedRating: number | null;
  ratingCount: number;
  notRecommended: boolean;
  createdBy: string;
  active: boolean;
  createdAt: number;
  generated?: boolean;
}

export interface Notice {
  id: string;
  placeId: string;
  authorId: string;
  title: string;
  type: NoticeType;
  anonymous: boolean;
  status: ContentStatus;
  commentCount: number;
  lastActivityAt: number;
  createdAt: number;
}

export interface Comment {
  id: string;
  noticeId: string;
  authorId: string;
  body: string;
  initial: boolean;
  anonymous: boolean;
  status: ContentStatus;
  createdAt: number;
  editedAt?: number;
}

export interface ReviewInput {
  safety: number;
  lighting: number;
  movement: number;
  welcoming: number;
  /** null = "não há banheiro" — fica fora da média. */
  restroom: number | null;
}

export interface Review extends ReviewInput {
  id: string;
  userId: string;
  placeId: string;
  commentId: string;
  checkInId?: string;
  score: number;
  appliedWeight: number;
  createdAt: number;
}

export interface CheckIn {
  id: string;
  userId: string;
  placeId: string;
  /** Só a distância é guardada — nunca a posição da usuária. */
  distanceMeters: number;
  accuracyMeters: number;
  createdAt: number;
}

export interface Favorite {
  userId: string;
  placeId: string;
  createdAt: number;
}

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface PlaceStats {
  rating: number | null;
  ratingCount: number;
  safety: number | null;
  lighting: number | null;
  movement: number | null;
  welcoming: number | null;
  restroom: number | null;
}

export interface Database {
  schema: number;
  center: LatLng;
  sessionUserId: string | null;
  users: Record<string, User>;
  places: Record<string, Place>;
  notices: Record<string, Notice>;
  comments: Record<string, Comment>;
  reviews: Record<string, Review>;
  checkIns: Record<string, CheckIn>;
  /** Chave: `${userId}:${placeId}` */
  favorites: Record<string, Favorite>;
  generatedCells: Record<string, true>;
  counters: { testPlace: number; testUser: number; id: number };
}
