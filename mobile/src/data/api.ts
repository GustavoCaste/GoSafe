/**
 * Cliente da API do GoSafe. As respostas do servidor são copiadas
 * para o mesmo formato do banco local (Database), que funciona como cache:
 * assim as telas continuam lendo com useDatabase() nos dois modos.
 */
import { DEFAULT_API_URL } from '../config';
import { CHECK_IN_WINDOW_MS } from '../domain/rules';
import type {
  Bounds,
  CheckIn,
  Comment,
  Database,
  LatLng,
  Notice,
  NoticeType,
  Place,
  PlaceCategory,
  PlaceStats,
  ReviewInput,
  Role,
  Sex,
  User,
} from '../domain/types';
import { DomainError } from './repository';
import { commitChanges, getDatabase } from './store';

// O plano gratuito do Render "dorme": o primeiro acesso pode levar cerca de 1 minuto
const TIMEOUT_MS = 90000;

// ---------------------------------------------------------------- formatos da API

interface UserDto { id: string; name: string; username: string; email: string; sex: Sex; verified: boolean; role: Role; validContributions: number; reputationWeight: number; createdAt: string }
interface TokenResponse { token: string; user: UserDto }
interface AuthorDto { id: string | null; name: string; username: string | null; verified: boolean; anonymous: boolean; mine: boolean }
interface StatsDto { rating: number | null; ratingCount: number; safety: number | null; lighting: number | null; movement: number | null; welcoming: number | null; restroom: number | null }
interface PinDto { id: string; name: string; category: PlaceCategory; latitude: number; longitude: number; weightedRating: number | null; ratingCount: number; notRecommended: boolean }
interface SummaryDto extends PinDto { description: string | null; district: string; city: string; distanceMeters: number | null }
interface DetailDto extends SummaryDto {
  postalCode: string; street: string; number: string; complement: string | null; state: string;
  stats: StatsDto; favorite: boolean; checkInValidUntil: string | null; createdById: string | null;
}
interface ReviewDto { safety: number; lighting: number; movement: number; welcoming: number; restroom: number | null; score: number; withCheckIn: boolean }
interface NoticeDto { id: string; placeId: string; title: string; type: NoticeType; author: AuthorDto; commentCount: number; createdAt: string; lastActivityAt: string }
interface CommentDto { id: string; noticeId: string; body: string; author: AuthorDto; initial: boolean; createdAt: string; editedAt: string | null; review: ReviewDto | null }
interface NoticeDetailDto { notice: NoticeDto; placeName: string; initialComment: CommentDto | null }
interface CheckInDto { id: string; placeId: string; distanceMeters: number; createdAt: string; validUntil: string }
interface Page<T> { content: T[] }
interface ApiErrorBody { message?: string; fields?: Record<string, string> | null }

// ---------------------------------------------------------------- HTTP

export function apiUrl(db: Database = getDatabase()): string {
  return (db.apiUrl || DEFAULT_API_URL).replace(/\/+$/, '');
}

async function request<T>(method: string, path: string, body?: unknown, options: { auth?: boolean; base?: string } = {}): Promise<T> {
  const db = getDatabase();
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.auth !== false && db.token) headers.Authorization = `Bearer ${db.token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${options.base ?? apiUrl(db)}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new DomainError('Sem conexão com o servidor. Confira sua internet e tente novamente em instantes.');
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 && db.sessionUserId) {
    db.token = null;
    db.sessionUserId = null;
    commitChanges();
    throw new DomainError('Sua sessão expirou. Entre novamente.');
  }
  if (!response.ok) {
    const error = (await response.json().catch(() => ({}))) as ApiErrorBody;
    const field = error.fields ? Object.values(error.fields)[0] : undefined;
    throw new DomainError(field ?? error.message ?? `Erro ${response.status} no servidor`);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

const time = (iso: string | null | undefined) => (iso ? Date.parse(iso) : Date.now());

/** Algumas listas vêm paginadas ({content: [...]}) e outras como lista simples. */
const items = <T,>(body: T[] | Page<T>): T[] => (Array.isArray(body) ? body : body?.content ?? []);

// ---------------------------------------------------------------- conversões para o cache local

function upsertUser(db: Database, dto: UserDto): User {
  const user: User = {
    id: dto.id,
    name: dto.name,
    username: dto.username,
    email: dto.email,
    password: '',
    sex: dto.sex,
    verified: dto.verified,
    role: dto.role,
    validContributions: dto.validContributions,
    active: true,
    createdAt: time(dto.createdAt),
    reputationWeight: dto.reputationWeight,
  };
  db.users[user.id] = user;
  return user;
}

/** Autora de aviso/comentário. Anônima de outra pessoa vira "anon" (o nome nunca chega ao app). */
function authorId(db: Database, author: AuthorDto): string {
  if (author.mine && db.sessionUserId) return db.sessionUserId;
  if (!author.id) return 'anon';
  const existing = db.users[author.id];
  db.users[author.id] = {
    ...(existing ?? { email: '', password: '', sex: 'NOT_INFORMED', role: 'USER', validContributions: 0, active: true, createdAt: 0 }),
    id: author.id,
    name: author.name,
    username: author.username ?? '',
    verified: author.verified,
  } as User;
  return author.id;
}

function toStats(dto: StatsDto): PlaceStats {
  return { rating: dto.rating, ratingCount: dto.ratingCount, safety: dto.safety, lighting: dto.lighting, movement: dto.movement, welcoming: dto.welcoming, restroom: dto.restroom };
}

function upsertPlace(db: Database, dto: PinDto | SummaryDto | DetailDto): Place {
  const old = db.places[dto.id];
  const summary = dto as Partial<DetailDto>;
  const place: Place = {
    id: dto.id,
    name: dto.name,
    category: dto.category,
    description: summary.description ?? old?.description ?? '',
    postalCode: summary.postalCode ?? old?.postalCode ?? '',
    street: summary.street ?? old?.street ?? '',
    number: summary.number ?? old?.number ?? '',
    complement: summary.complement ?? old?.complement,
    district: summary.district ?? old?.district ?? '',
    city: summary.city ?? old?.city ?? '',
    state: summary.state ?? old?.state ?? '',
    latitude: dto.latitude,
    longitude: dto.longitude,
    geocodeSource: 'MANUAL',
    // o detalhe traz a nota só dentro de stats; pins e listas trazem no primeiro nível
    weightedRating: dto.weightedRating ?? summary.stats?.rating ?? old?.weightedRating ?? null,
    ratingCount: dto.ratingCount ?? summary.stats?.ratingCount ?? old?.ratingCount ?? 0,
    notRecommended: dto.notRecommended,
    createdBy: summary.createdById ?? old?.createdBy ?? '',
    active: true,
    createdAt: old?.createdAt ?? Date.now(),
    stats: summary.stats ? toStats(summary.stats) : old?.stats,
  };
  db.places[place.id] = place;
  return place;
}

function upsertNotice(db: Database, dto: NoticeDto): Notice {
  const notice: Notice = {
    id: dto.id,
    placeId: dto.placeId,
    authorId: authorId(db, dto.author),
    title: dto.title,
    type: dto.type,
    anonymous: dto.author.anonymous,
    status: 'ACTIVE',
    commentCount: dto.commentCount,
    lastActivityAt: time(dto.lastActivityAt),
    createdAt: time(dto.createdAt),
  };
  db.notices[notice.id] = notice;
  return notice;
}

function upsertComment(db: Database, dto: CommentDto, placeId: string): Comment {
  const comment: Comment = {
    id: dto.id,
    noticeId: dto.noticeId,
    authorId: authorId(db, dto.author),
    body: dto.body,
    initial: dto.initial,
    anonymous: dto.author.anonymous,
    status: 'ACTIVE',
    createdAt: time(dto.createdAt),
    editedAt: dto.editedAt ? time(dto.editedAt) : undefined,
  };
  db.comments[comment.id] = comment;
  const reviewId = `rev-${comment.id}`;
  if (dto.review) {
    db.reviews[reviewId] = {
      id: reviewId,
      userId: comment.authorId,
      placeId,
      commentId: comment.id,
      checkInId: dto.review.withCheckIn ? 'servidor' : undefined,
      safety: dto.review.safety,
      lighting: dto.review.lighting,
      movement: dto.review.movement,
      welcoming: dto.review.welcoming,
      restroom: dto.review.restroom,
      score: dto.review.score,
      appliedWeight: 0,
      createdAt: comment.createdAt,
    };
  } else {
    delete db.reviews[reviewId];
  }
  return comment;
}

function upsertCheckIn(db: Database, placeId: string, validUntil: number, distance: number): CheckIn {
  const userId = db.sessionUserId ?? '';
  const record: CheckIn = { id: `chk-${placeId}`, userId, placeId, distanceMeters: Math.round(distance), accuracyMeters: 0, createdAt: validUntil - CHECK_IN_WINDOW_MS };
  db.checkIns[record.id] = record;
  return record;
}

function setFavorite(db: Database, placeId: string, favorite: boolean) {
  const userId = db.sessionUserId;
  if (!userId) return;
  const key = `${userId}:${placeId}`;
  if (favorite) db.favorites[key] = db.favorites[key] ?? { userId, placeId, createdAt: Date.now() };
  else delete db.favorites[key];
}

const near = (position?: LatLng | null) => (position ? `&lat=${position.latitude}&lng=${position.longitude}` : '');

// ---------------------------------------------------------------- conta

export async function testConnection(url: string): Promise<void> {
  await request('GET', '/places?size=1', undefined, { auth: false, base: url.replace(/\/+$/, '') });
}

function startSession(response: TokenResponse) {
  const db = getDatabase();
  db.token = response.token;
  db.sessionUserId = upsertUser(db, response.user).id;
  commitChanges();
}

export async function apiLogin(login: string, password: string) {
  startSession(await request<TokenResponse>('POST', '/auth/login', { login: login.trim(), password }, { auth: false }));
}

export async function apiRegister(input: { name: string; username: string; email: string; password: string; sex: Sex }) {
  startSession(await request<TokenResponse>('POST', '/auth/register', { ...input, name: input.name.trim(), username: input.username.trim(), email: input.email.trim() }, { auth: false }));
}

export function apiLogout() {
  const db = getDatabase();
  db.token = null;
  db.sessionUserId = null;
  db.favorites = {};
  db.checkIns = {};
  commitChanges();
}

export async function syncMe() {
  const db = getDatabase();
  upsertUser(db, await request<UserDto>('GET', '/me'));
  commitChanges();
}

export async function apiUpdateName(name: string) {
  const db = getDatabase();
  upsertUser(db, await request<UserDto>('PUT', '/me', { name: name.trim() }));
  commitChanges();
}

export async function apiVerify() {
  await request('POST', '/me/verification', { consent: true });
  await syncMe();
}

// ---------------------------------------------------------------- locais

export async function syncMap(bounds: Bounds, category: PlaceCategory | null) {
  const db = getDatabase();
  const query = `minLng=${bounds.west}&minLat=${bounds.south}&maxLng=${bounds.east}&maxLat=${bounds.north}${category ? `&category=${category}` : ''}`;
  const pins = await request<PinDto[]>('GET', `/places/map?${query}`);
  pins.forEach((pin) => upsertPlace(db, pin));
  commitChanges();
}

export async function syncList(options: { query?: string; sort: 'DISTANCE' | 'RATING' | 'NAME'; position?: LatLng | null }) {
  const db = getDatabase();
  const q = options.query?.trim() ? `&q=${encodeURIComponent(options.query.trim())}` : '';
  const sort = options.sort === 'DISTANCE' && !options.position ? 'NAME' : options.sort;
  const list = items(await request<SummaryDto[] | Page<SummaryDto>>('GET', `/places?sort=${sort}&size=50${q}${near(options.position)}`));
  list.forEach((item) => upsertPlace(db, item));
  commitChanges();
  return list.map((item) => item.id);
}

export async function syncFavorites(position?: LatLng | null) {
  const db = getDatabase();
  const list = items(await request<SummaryDto[] | Page<SummaryDto>>('GET', `/me/favorites?${near(position).slice(1)}`));
  const userId = db.sessionUserId;
  if (userId) for (const key of Object.keys(db.favorites)) if (key.startsWith(`${userId}:`)) delete db.favorites[key];
  list.forEach((item) => {
    upsertPlace(db, item);
    setFavorite(db, item.id, true);
  });
  commitChanges();
}

export async function syncCheckIns() {
  const db = getDatabase();
  const page = await request<Page<CheckInDto>>('GET', '/me/checkins?size=50');
  db.checkIns = {};
  page.content.forEach((item) => {
    const until = time(item.validUntil);
    if (until > Date.now()) upsertCheckIn(db, item.placeId, until, item.distanceMeters);
    else db.checkIns[`old-${item.id}`] = { id: `old-${item.id}`, userId: db.sessionUserId ?? '', placeId: item.placeId, distanceMeters: Math.round(item.distanceMeters), accuracyMeters: 0, createdAt: time(item.createdAt) };
  });
  commitChanges();
}

/** Detalhe do local + avisos (mais recentes primeiro). */
export async function syncPlace(placeId: string, position?: LatLng | null) {
  const db = getDatabase();
  const [detail, notices] = await Promise.all([
    request<DetailDto>('GET', `/places/${placeId}?${near(position).slice(1)}`),
    request<Page<NoticeDto>>('GET', `/places/${placeId}/notices?size=50`),
  ]);
  upsertPlace(db, detail);
  setFavorite(db, placeId, detail.favorite);
  const until = detail.checkInValidUntil ? time(detail.checkInValidUntil) : 0;
  if (until > Date.now()) {
    const known = db.checkIns[`chk-${placeId}`];
    upsertCheckIn(db, placeId, until, known?.distanceMeters ?? 0);
  } else {
    delete db.checkIns[`chk-${placeId}`];
  }
  const keep = new Set(notices.content.map((notice) => notice.id));
  for (const notice of Object.values(db.notices)) if (notice.placeId === placeId && !keep.has(notice.id)) delete db.notices[notice.id];
  notices.content.forEach((notice) => upsertNotice(db, notice));
  commitChanges();
}

/** Aviso + comentário inicial + comentários. */
export async function syncNotice(noticeId: string) {
  const db = getDatabase();
  const [detail, comments] = await Promise.all([
    request<NoticeDetailDto>('GET', `/notices/${noticeId}`),
    request<Page<CommentDto>>('GET', `/notices/${noticeId}/comments?size=50`),
  ]);
  const notice = upsertNotice(db, detail.notice);
  if (!db.places[notice.placeId]) await syncPlace(notice.placeId).catch(() => undefined);
  const all = [...(detail.initialComment ? [detail.initialComment] : []), ...comments.content];
  const keep = new Set(all.map((comment) => comment.id));
  for (const comment of Object.values(db.comments)) if (comment.noticeId === noticeId && !keep.has(comment.id)) delete db.comments[comment.id];
  all.forEach((comment) => upsertComment(db, comment, notice.placeId));
  commitChanges();
}

// ---------------------------------------------------------------- ações

export async function apiCheckIn(placeId: string, fix: LatLng & { accuracy: number }) {
  const dto = await request<CheckInDto>('POST', `/places/${placeId}/checkins`, { latitude: fix.latitude, longitude: fix.longitude, accuracyMeters: fix.accuracy });
  const db = getDatabase();
  const record = upsertCheckIn(db, placeId, time(dto.validUntil), dto.distanceMeters);
  commitChanges();
  return record;
}

export async function apiToggleFavorite(placeId: string, favorite: boolean) {
  const db = getDatabase();
  setFavorite(db, placeId, favorite);
  commitChanges();
  try {
    await request(favorite ? 'PUT' : 'DELETE', `/places/${placeId}/favorite`);
  } catch (error) {
    setFavorite(db, placeId, !favorite);
    commitChanges();
    throw error;
  }
}

export async function apiCreatePlace(input: {
  name: string; category: PlaceCategory; description: string; postalCode: string; street: string; number: string; district: string; city: string; state: string;
}, point: LatLng) {
  const dto = await request<DetailDto>('POST', '/places', { ...input, latitude: point.latitude, longitude: point.longitude });
  const db = getDatabase();
  const place = upsertPlace(db, dto);
  commitChanges();
  return place;
}

const reviewBody = (review: ReviewInput | null) =>
  review ? { safety: review.safety, lighting: review.lighting, movement: review.movement, welcoming: review.welcoming, restroom: review.restroom } : null;

export async function apiCreateNotice(placeId: string, input: { title: string; type: NoticeType; body: string; anonymous: boolean; review: ReviewInput | null }) {
  const dto = await request<NoticeDetailDto>('POST', `/places/${placeId}/notices`, { title: input.title.trim(), type: input.type, body: input.body.trim(), anonymous: input.anonymous, review: reviewBody(input.review) });
  const db = getDatabase();
  const notice = upsertNotice(db, dto.notice);
  if (dto.initialComment) upsertComment(db, dto.initialComment, placeId);
  commitChanges();
  await syncPlace(placeId).catch(() => undefined);
  return notice;
}

export async function apiCreateComment(noticeId: string, input: { body: string; anonymous: boolean; review: ReviewInput | null }) {
  await request<CommentDto>('POST', `/notices/${noticeId}/comments`, { body: input.body.trim(), anonymous: input.anonymous, review: reviewBody(input.review) });
  await syncNotice(noticeId);
  const placeId = getDatabase().notices[noticeId]?.placeId;
  if (placeId) await syncPlace(placeId).catch(() => undefined);
}

export async function apiRemoveComment(commentId: string) {
  const db = getDatabase();
  const comment = db.comments[commentId];
  await request('DELETE', `/comments/${commentId}`);
  if (comment) {
    await syncNotice(comment.noticeId).catch(() => undefined);
    const placeId = db.notices[comment.noticeId]?.placeId;
    if (placeId) await syncPlace(placeId).catch(() => undefined);
  }
}

export async function apiRemoveNotice(noticeId: string) {
  const db = getDatabase();
  const placeId = db.notices[noticeId]?.placeId;
  await request('DELETE', `/notices/${noticeId}`);
  delete db.notices[noticeId];
  commitChanges();
  if (placeId) await syncPlace(placeId).catch(() => undefined);
}
