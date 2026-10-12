/**
 * Regras de negócio do GoSafe — espelho fiel do backend (Spring Boot),
 * para o app de teste funcionar 100% offline com o mesmo comportamento.
 */
import type { Bounds, LatLng, PlaceStats, Review, ReviewInput } from './types';

// RN18 — local não aconselhado. Teste: 5 usuárias; produção: 100.
export const ALERT_MIN_REVIEWS = 5;
export const ALERT_MAX_RATING = 1.5;
export const ALERT_MESSAGE =
  'Local não aconselhado: as avaliações da comunidade indicam baixo nível de segurança.';

// RN09/RN10 — check-in
export const CHECK_IN_RADIUS_METERS = 100;
export const CHECK_IN_MAX_ACCURACY_METERS = 100;
export const CHECK_IN_WINDOW_MS = 4 * 60 * 60 * 1000;

// RN12 — duplicidade
export const DUPLICATE_RADIUS_METERS = 50;

// Reputação ponderada (Bishr e Mantelas, 2008)
const MIN_WEIGHT = 0.1;
const MAX_WEIGHT = 1.0;
const BASE_WEIGHT = 0.2;
const CHECK_IN_BONUS = 1.25;
const FULL_AGE_DAYS = 90;
const FULL_CONTRIBUTIONS = 20;
const DAY_MS = 24 * 60 * 60 * 1000;

const round = (value: number, places: number) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export function profileWeight(
  createdAt: number,
  validContributions: number,
  verified: boolean,
  upheldReports = 0,
  now = Date.now(),
): number {
  const ageDays = Math.max(0, Math.floor((now - createdAt) / DAY_MS));
  const age = Math.min(ageDays / FULL_AGE_DAYS, 1);
  const contributions = Math.min(Math.max(validContributions, 0) / FULL_CONTRIBUTIONS, 1);
  const upheldRate = upheldReports / Math.max(validContributions + upheldReports, 1);

  const weight = BASE_WEIGHT + 0.3 * age + 0.3 * contributions + (verified ? 0.2 : 0) - 0.3 * upheldRate;
  return round(Math.max(MIN_WEIGHT, Math.min(MAX_WEIGHT, weight)), 3);
}

export function voteWeight(profile: number, withCheckIn: boolean): number {
  return round(Math.min(MAX_WEIGHT, profile * (withCheckIn ? CHECK_IN_BONUS : 1)), 3);
}

export function averageScore(review: ReviewInput): number {
  const values = [review.safety, review.lighting, review.movement, review.welcoming, review.restroom].filter(
    (value): value is number => value !== null && value !== undefined,
  );
  return round(values.reduce((sum, value) => sum + value, 0) / values.length, 2);
}

function weightedAverage(reviews: Review[], pick: (review: Review) => number | null): number | null {
  let sum = 0;
  let weights = 0;

  for (const review of reviews) {
    const value = pick(review);
    if (value !== null && value !== undefined) {
      sum += value * review.appliedWeight;
      weights += review.appliedWeight;
    }
  }

  return weights === 0 ? null : round(sum / weights, 2);
}

/** RN07: média ponderada considerando só a avaliação mais recente de cada usuária. */
export function computeStats(visibleReviews: Review[]): PlaceStats {
  const latestByUser = new Map<string, Review>();

  // mais recente primeiro; no empate de horário vale a registrada por último
  const ordered = visibleReviews
    .map((review, index) => ({ review, index }))
    .sort((a, b) => b.review.createdAt - a.review.createdAt || b.index - a.index)
    .map((entry) => entry.review);

  for (const review of ordered) {
    if (!latestByUser.has(review.userId)) {
      latestByUser.set(review.userId, review);
    }
  }

  const reviews = [...latestByUser.values()];

  return {
    rating: weightedAverage(reviews, (review) => review.score),
    ratingCount: reviews.length,
    safety: weightedAverage(reviews, (review) => review.safety),
    lighting: weightedAverage(reviews, (review) => review.lighting),
    movement: weightedAverage(reviews, (review) => review.movement),
    welcoming: weightedAverage(reviews, (review) => review.welcoming),
    restroom: weightedAverage(reviews, (review) => review.restroom),
  };
}

/** RN18 */
export function isNotRecommended(rating: number | null, ratingCount: number): boolean {
  return rating !== null && ratingCount >= ALERT_MIN_REVIEWS && rating <= ALERT_MAX_RATING;
}

export function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function insideBounds(point: LatLng, bounds: Bounds): boolean {
  return (
    point.latitude >= bounds.south &&
    point.latitude <= bounds.north &&
    point.longitude >= bounds.west &&
    point.longitude <= bounds.east
  );
}

export type RatingTone = 'good' | 'medium' | 'bad' | 'none';

export function ratingTone(rating: number | null): RatingTone {
  if (rating === null) return 'none';
  if (rating >= 4) return 'good';
  if (rating >= 3) return 'medium';
  return 'bad';
}

export function formatRating(rating: number | null): string {
  return rating === null ? '–' : rating.toFixed(1).replace('.', ',');
}

export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined) return '';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1).replace('.', ',')} km` : `${Math.round(meters)} m`;
}
