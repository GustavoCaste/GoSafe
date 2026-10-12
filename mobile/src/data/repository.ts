/**
 * Operações sobre o banco local, com as mesmas regras do backend.
 * Funções puras sobre o objeto Database — a persistência fica em store.ts.
 * Erros de regra de negócio são lançados como DomainError (mensagem para a usuária).
 */
import {
  ALERT_MESSAGE,
  CHECK_IN_MAX_ACCURACY_METERS,
  CHECK_IN_RADIUS_METERS,
  CHECK_IN_WINDOW_MS,
  DUPLICATE_RADIUS_METERS,
  averageScore,
  computeStats,
  distanceMeters,
  isNotRecommended,
  profileWeight,
  voteWeight,
} from '../domain/rules';
import type {
  CheckIn,
  Comment,
  Database,
  LatLng,
  Notice,
  NoticeType,
  Place,
  PlaceCategory,
  PlaceStats,
  Review,
  ReviewInput,
  Sex,
  User,
} from '../domain/types';

export class DomainError extends Error {}

export const DB_SCHEMA = 1;

export function emptyDatabase(center: LatLng): Database {
  return {
    schema: DB_SCHEMA,
    center,
    sessionUserId: null,
    users: {},
    places: {},
    notices: {},
    comments: {},
    reviews: {},
    checkIns: {},
    favorites: {},
    generatedCells: {},
    counters: { testPlace: 0, testUser: 0, id: 0 },
  };
}

export function newId(db: Database, prefix: string): string {
  db.counters.id += 1;
  return `${prefix}_${db.counters.id.toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

// ---------------------------------------------------------------- usuárias

export interface RegisterInput {
  name: string;
  username: string;
  email: string;
  password: string;
  sex: Sex;
}

export function registerUser(db: Database, input: RegisterInput, options: { createdAt?: number; generated?: boolean } = {}): User {
  const name = input.name.trim();
  const username = input.username.trim().toLowerCase();
  const email = input.email.trim().toLowerCase();

  if (name.length < 3) throw new DomainError('Nome deve ter pelo menos 3 caracteres');
  if (!/^[a-z0-9._]{3,30}$/.test(username)) {
    throw new DomainError('Nome de usuária: use de 3 a 30 letras, números, ponto ou sublinhado');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new DomainError('E-mail inválido');
  if (input.password.length < 8) throw new DomainError('Senha deve ter pelo menos 8 caracteres');

  const users = Object.values(db.users);
  if (users.some((user) => user.email === email)) throw new DomainError('E-mail já cadastrado');
  if (users.some((user) => user.username === username)) throw new DomainError('Nome de usuária já está em uso');

  const user: User = {
    id: newId(db, 'usr'),
    name,
    username,
    email,
    password: input.password,
    sex: input.sex,
    verified: false,
    role: 'USER',
    validContributions: 0,
    active: true,
    createdAt: options.createdAt ?? Date.now(),
    generated: options.generated,
  };

  db.users[user.id] = user;
  return user;
}

export function authenticate(db: Database, login: string, password: string): User {
  const value = login.trim().toLowerCase();
  const user = Object.values(db.users).find(
    (candidate) => candidate.active && (candidate.email === value || candidate.username === value),
  );

  if (!user || user.password !== password) throw new DomainError('Credenciais inválidas');
  return user;
}

export function userWeight(user: User): number {
  return profileWeight(user.createdAt, user.validContributions, user.verified);
}

// ---------------------------------------------------------------- locais

export interface PlaceInput {
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
}

export function createPlace(
  db: Database,
  creator: User,
  input: PlaceInput,
  point: LatLng,
  options: { createdAt?: number; generated?: boolean; skipDuplicateCheck?: boolean; needsLandCheck?: boolean } = {},
): Place {
  const name = input.name.trim();
  const postalDigits = input.postalCode.replace(/\D/g, '');

  if (name.length < 3) throw new DomainError('Nome do local deve ter pelo menos 3 caracteres');
  if (postalDigits.length !== 8) throw new DomainError('CEP deve ter 8 dígitos');
  if (!input.street.trim()) throw new DomainError('Logradouro é obrigatório');
  if (!input.number.trim()) throw new DomainError('Número é obrigatório');
  if (!input.district.trim()) throw new DomainError('Bairro é obrigatório');
  if (!input.city.trim()) throw new DomainError('Cidade é obrigatória');
  if (!/^[A-Za-z]{2}$/.test(input.state.trim())) throw new DomainError('UF deve ter 2 letras');

  if (!options.skipDuplicateCheck) {
    const duplicate = Object.values(db.places).some(
      (place) =>
        place.active &&
        place.name.toLowerCase() === name.toLowerCase() &&
        distanceMeters(place, point) <= DUPLICATE_RADIUS_METERS,
    );
    if (duplicate) throw new DomainError('Já existe um local com esse nome a menos de 50 m');
  }

  const place: Place = {
    id: newId(db, 'plc'),
    name,
    category: input.category,
    description: input.description.trim(),
    postalCode: `${postalDigits.slice(0, 5)}-${postalDigits.slice(5)}`,
    street: input.street.trim(),
    number: input.number.trim(),
    complement: input.complement?.trim() || undefined,
    district: input.district.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    latitude: point.latitude,
    longitude: point.longitude,
    geocodeSource: 'DEVICE',
    weightedRating: null,
    ratingCount: 0,
    notRecommended: false,
    createdBy: creator.id,
    active: true,
    createdAt: options.createdAt ?? Date.now(),
    generated: options.generated,
    // local marcado pela usuária é confiável; carga e gerador são conferidos contra a água no mapa
    landChecked: !options.needsLandCheck,
  };

  db.places[place.id] = place;
  return place;
}

export function visibleReviews(db: Database, placeId: string): Review[] {
  return Object.values(db.reviews).filter((review) => {
    if (review.placeId !== placeId) return false;
    const comment = db.comments[review.commentId];
    const notice = comment ? db.notices[comment.noticeId] : undefined;
    return comment?.status === 'ACTIVE' && notice?.status === 'ACTIVE';
  });
}

export function placeStats(db: Database, placeId: string): PlaceStats {
  return computeStats(visibleReviews(db, placeId));
}

/** RN07 + RN18: recalcula nota ponderada, contagem e alerta de local não aconselhado. */
export function recalculatePlace(db: Database, place: Place): void {
  const stats = placeStats(db, place.id);
  place.weightedRating = stats.rating;
  place.ratingCount = stats.ratingCount;
  place.notRecommended = isNotRecommended(stats.rating, stats.ratingCount);
}

export function alertMessage(place: Place): string | null {
  return place.notRecommended ? ALERT_MESSAGE : null;
}

// ---------------------------------------------------------------- check-in

export function validCheckIn(db: Database, userId: string, placeId: string, now = Date.now()): CheckIn | undefined {
  return Object.values(db.checkIns)
    .filter((checkIn) => checkIn.userId === userId && checkIn.placeId === placeId && now - checkIn.createdAt < CHECK_IN_WINDOW_MS)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
}

export function checkInValidUntil(checkIn: CheckIn): number {
  return checkIn.createdAt + CHECK_IN_WINDOW_MS;
}

export function checkIn(db: Database, user: User, place: Place, position: LatLng, accuracyMeters: number): CheckIn {
  if (accuracyMeters > CHECK_IN_MAX_ACCURACY_METERS) {
    throw new DomainError(`Precisão do GPS insuficiente (${Math.round(accuracyMeters)} m). Tente novamente em local aberto.`);
  }
  if (validCheckIn(db, user.id, place.id)) {
    throw new DomainError('Você já fez check-in neste local nas últimas 4 horas');
  }

  const distance = distanceMeters(place, position);
  if (Math.max(0, distance - accuracyMeters) > CHECK_IN_RADIUS_METERS) {
    throw new DomainError(`Você está a ${Math.round(distance)} m do local; o check-in exige até ${CHECK_IN_RADIUS_METERS} m`);
  }

  const record: CheckIn = {
    id: newId(db, 'chk'),
    userId: user.id,
    placeId: place.id,
    distanceMeters: Math.round(distance),
    accuracyMeters,
    createdAt: Date.now(),
  };

  db.checkIns[record.id] = record;
  return record;
}

// ---------------------------------------------------------------- avisos, comentários e avaliações

function validateReview(review: ReviewInput): void {
  const values: (number | null)[] = [review.safety, review.lighting, review.movement, review.welcoming];
  if (values.some((value) => value === null || value < 1 || value > 5)) {
    throw new DomainError('Avalie todos os parâmetros de 1 a 5');
  }
  if (review.restroom !== null && (review.restroom < 1 || review.restroom > 5)) {
    throw new DomainError('Banheiro: nota de 1 a 5 ou "Não há"');
  }
}

function addReview(
  db: Database,
  user: User,
  place: Place,
  comment: Comment,
  input: ReviewInput,
  options: { createdAt?: number; skipRecalculation?: boolean },
): Review {
  validateReview(input);
  const createdAt = options.createdAt ?? Date.now();
  const checkInRecord = validCheckIn(db, user.id, place.id, createdAt);

  const review: Review = {
    id: newId(db, 'rev'),
    userId: user.id,
    placeId: place.id,
    commentId: comment.id,
    checkInId: checkInRecord?.id,
    ...input,
    score: averageScore(input),
    appliedWeight: voteWeight(userWeight(user), checkInRecord !== undefined),
    createdAt,
  };

  db.reviews[review.id] = review;
  if (!options.skipRecalculation) recalculatePlace(db, place);
  return review;
}

export interface NoticeInput {
  title: string;
  type: NoticeType;
  body: string;
  anonymous: boolean;
  review: ReviewInput | null;
}

/** RN04/RN05: aviso sempre nasce num local, com título e comentário inicial. */
export function createNotice(
  db: Database,
  author: User,
  place: Place,
  input: NoticeInput,
  options: { createdAt?: number; skipRecalculation?: boolean } = {},
): Notice {
  const title = input.title.trim();
  const body = input.body.trim();

  if (!place.active) throw new DomainError('Local não encontrado');
  if (title.length < 5 || title.length > 120) throw new DomainError('Título deve ter entre 5 e 120 caracteres');
  if (!body) throw new DomainError('Comentário inicial é obrigatório');
  if (body.length > 1000) throw new DomainError('Comentário deve ter no máximo 1000 caracteres');

  const createdAt = options.createdAt ?? Date.now();
  const notice: Notice = {
    id: newId(db, 'ntc'),
    placeId: place.id,
    authorId: author.id,
    title,
    type: input.type,
    anonymous: input.anonymous,
    status: 'ACTIVE',
    commentCount: 0,
    lastActivityAt: createdAt,
    createdAt,
  };
  db.notices[notice.id] = notice;

  const initial: Comment = {
    id: newId(db, 'cmt'),
    noticeId: notice.id,
    authorId: author.id,
    body,
    initial: true,
    anonymous: input.anonymous,
    status: 'ACTIVE',
    createdAt,
  };
  db.comments[initial.id] = initial;

  if (input.review) addReview(db, author, place, initial, input.review, options);
  author.validContributions += 1;
  return notice;
}

export interface CommentInput {
  body: string;
  anonymous: boolean;
  review: ReviewInput | null;
}

export function createComment(
  db: Database,
  author: User,
  notice: Notice,
  input: CommentInput,
  options: { createdAt?: number; skipRecalculation?: boolean } = {},
): Comment {
  const body = input.body.trim();
  const place = db.places[notice.placeId];

  if (notice.status !== 'ACTIVE' || !place?.active) throw new DomainError('Aviso não encontrado');
  if (!body) throw new DomainError('Comentário é obrigatório');
  if (body.length > 1000) throw new DomainError('Comentário deve ter no máximo 1000 caracteres');

  const createdAt = options.createdAt ?? Date.now();
  const comment: Comment = {
    id: newId(db, 'cmt'),
    noticeId: notice.id,
    authorId: author.id,
    body,
    initial: false,
    anonymous: input.anonymous,
    status: 'ACTIVE',
    createdAt,
  };
  db.comments[comment.id] = comment;

  notice.commentCount += 1;
  notice.lastActivityAt = Math.max(notice.lastActivityAt, createdAt);

  if (input.review) addReview(db, author, place, comment, input.review, options);
  author.validContributions += 1;
  return comment;
}

export function removeComment(db: Database, user: User, comment: Comment): void {
  if (comment.authorId !== user.id && user.role === 'USER') {
    throw new DomainError('Só a autora ou a moderação podem remover o comentário');
  }
  const notice = db.notices[comment.noticeId];
  comment.status = 'REMOVED';
  if (!comment.initial) notice.commentCount = Math.max(0, notice.commentCount - 1);
  recalculatePlace(db, db.places[notice.placeId]);
}

export function removeNotice(db: Database, user: User, notice: Notice): void {
  if (notice.authorId !== user.id && user.role === 'USER') {
    throw new DomainError('Só a autora ou a moderação podem remover o aviso');
  }
  notice.status = 'REMOVED';
  recalculatePlace(db, db.places[notice.placeId]);
}

export function reviewForComment(db: Database, commentId: string): Review | undefined {
  return Object.values(db.reviews).find((review) => review.commentId === commentId);
}

/** Autora como aparece publicamente: anônima esconde nome e usuário. */
export function displayAuthor(db: Database, authorId: string, anonymous: boolean, viewerId: string | null) {
  const author = db.users[authorId];
  const mine = viewerId === authorId;
  if (anonymous || !author) {
    return { name: 'Anônima', username: null as string | null, verified: author?.verified ?? false, anonymous: true, mine };
  }
  return { name: author.name, username: author.username, verified: author.verified, anonymous: false, mine };
}

// ---------------------------------------------------------------- locais na água

export interface WaterResult {
  id: string;
  water: boolean;
  lat?: number | null;
  lng?: number | null;
}

/** Apaga um local e tudo o que pertence a ele (usado só para locais de teste gerados). */
export function deletePlaceCascade(db: Database, placeId: string): void {
  const noticeIds = new Set(Object.values(db.notices).filter((n) => n.placeId === placeId).map((n) => n.id));
  for (const comment of Object.values(db.comments)) if (noticeIds.has(comment.noticeId)) delete db.comments[comment.id];
  for (const review of Object.values(db.reviews)) if (review.placeId === placeId) delete db.reviews[review.id];
  for (const checkIn of Object.values(db.checkIns)) if (checkIn.placeId === placeId) delete db.checkIns[checkIn.id];
  for (const key of Object.keys(db.favorites)) if (key.endsWith(`:${placeId}`)) delete db.favorites[key];
  noticeIds.forEach((id) => delete db.notices[id]);
  delete db.places[placeId];
}

/**
 * Resultado da checagem de água feita pelo mapa: local de teste gerado na
 * água é apagado; local da carga é movido para a terra mais próxima.
 */
export function applyWaterCheck(db: Database, results: WaterResult[]): number {
  let changed = 0;
  for (const result of results) {
    const place = db.places[result.id];
    if (!place) continue;
    if (result.water) {
      changed += 1;
      if (place.generated) {
        deletePlaceCascade(db, place.id);
        continue;
      }
      if (result.lat != null && result.lng != null) {
        place.latitude = result.lat;
        place.longitude = result.lng;
      } else {
        place.active = false; // sem terra por perto (ex.: alto-mar): some do mapa
      }
    }
    place.landChecked = true;
  }
  return changed;
}

// ---------------------------------------------------------------- favoritos

export function isFavorite(db: Database, userId: string, placeId: string): boolean {
  return Boolean(db.favorites[`${userId}:${placeId}`]);
}

export function toggleFavorite(db: Database, userId: string, placeId: string): boolean {
  const key = `${userId}:${placeId}`;
  if (db.favorites[key]) {
    delete db.favorites[key];
    return false;
  }
  db.favorites[key] = { userId, placeId, createdAt: Date.now() };
  return true;
}
