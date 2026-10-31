/**
 * Ações das telas. No modo offline alteram o banco do aparelho (como sempre);
 * no modo API chamam o servidor e atualizam o cache local com a resposta.
 */
import { API_MODE } from '../config';
import type { LatLng, NoticeType, PlaceCategory, ReviewInput, Sex } from '../domain/types';
import * as api from './api';
import {
  authenticate,
  checkIn,
  createComment,
  createNotice,
  createPlace,
  registerUser,
  removeComment,
  removeNotice,
  toggleFavorite,
} from './repository';
import { mutate, requireUser } from './store';

export async function login(value: string, password: string) {
  if (API_MODE) return api.apiLogin(value, password);
  mutate((db) => {
    db.sessionUserId = authenticate(db, value, password).id;
  });
}

export async function register(input: { name: string; username: string; email: string; password: string; sex: Sex }) {
  if (API_MODE) return api.apiRegister(input);
  mutate((db) => {
    db.sessionUserId = registerUser(db, input).id;
  });
}

export function logout() {
  if (API_MODE) return api.apiLogout();
  mutate((db) => {
    db.sessionUserId = null;
  });
}

export async function updateName(name: string) {
  if (API_MODE) return api.apiUpdateName(name);
  const user = requireUser();
  mutate((db) => {
    db.users[user.id].name = name.trim();
  });
}

export async function verifyIdentity() {
  if (API_MODE) return api.apiVerify();
  const user = requireUser();
  mutate((db) => {
    db.users[user.id].verified = true;
  });
}

export async function doCheckIn(placeId: string, fix: LatLng & { accuracy: number }) {
  if (API_MODE) return api.apiCheckIn(placeId, fix);
  return mutate((db) => checkIn(db, requireUser(), db.places[placeId], fix, fix.accuracy));
}

export async function setFavorite(placeId: string, favorite: boolean) {
  if (API_MODE) return api.apiToggleFavorite(placeId, favorite);
  const user = requireUser();
  mutate((db) => {
    if (Boolean(db.favorites[`${user.id}:${placeId}`]) !== favorite) toggleFavorite(db, user.id, placeId);
  });
}

export async function addPlace(
  input: { name: string; category: PlaceCategory; description: string; postalCode: string; street: string; number: string; district: string; city: string; state: string },
  point: LatLng,
) {
  if (API_MODE) return api.apiCreatePlace(input, point);
  return mutate((db) => createPlace(db, requireUser(), input, point));
}

export async function addNotice(placeId: string, input: { title: string; type: NoticeType; body: string; anonymous: boolean; review: ReviewInput | null }) {
  if (API_MODE) return api.apiCreateNotice(placeId, input);
  return mutate((db) => createNotice(db, requireUser(), db.places[placeId], input));
}

export async function addComment(noticeId: string, input: { body: string; anonymous: boolean; review: ReviewInput | null }) {
  if (API_MODE) return api.apiCreateComment(noticeId, input);
  mutate((db) => createComment(db, requireUser(), db.notices[noticeId], input));
}

export async function deleteComment(commentId: string) {
  if (API_MODE) return api.apiRemoveComment(commentId);
  mutate((db) => removeComment(db, requireUser(), db.comments[commentId]));
}

export async function deleteNotice(noticeId: string) {
  if (API_MODE) return api.apiRemoveNotice(noticeId);
  mutate((db) => removeNotice(db, requireUser(), db.notices[noticeId]));
}
