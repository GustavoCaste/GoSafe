/**
 * Banco local do app de teste. Fica todo no aparelho (AsyncStorage), sem
 * nenhuma chamada de rede. As telas leem com useDatabase() e alteram com
 * mutate(), que salva automaticamente.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { Database, LatLng, User } from '../domain/types';
import { DB_SCHEMA, DomainError } from './repository';
import { seedDatabase } from './seed';

const STORAGE_KEY = 'gosafe:test-db';

let db: Database | null = null;
let version = 0;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

export async function loadDatabase(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Database;
      if (parsed.schema === DB_SCHEMA) {
        db = parsed;
        notify();
        return true;
      }
    }
  } catch {
    // banco corrompido: começa de novo
  }
  return false;
}

export function hasDatabase(): boolean {
  return db !== null;
}

/** Cria a carga inicial em volta do ponto informado. */
export function createSeededDatabase(center: LatLng, placedAroundDevice: boolean): void {
  db = seedDatabase(center, placedAroundDevice);
  commit();
}

export async function resetDatabase(): Promise<void> {
  db = null;
  await AsyncStorage.removeItem(STORAGE_KEY);
  notify();
}

export function getDatabase(): Database {
  if (!db) throw new Error('Banco local ainda não carregado');
  return db;
}

/** Executa uma alteração e salva. Erros de regra viram mensagens para a usuária. */
export function mutate<T>(change: (database: Database) => T): T {
  const result = change(getDatabase());
  commit();
  return result;
}

/** Para alterações feitas direto em getDatabase() (ex.: gerador do mapa). */
export function commitChanges(): void {
  commit();
}

export function currentUser(): User | null {
  if (!db?.sessionUserId) return null;
  const user = db.users[db.sessionUserId];
  return user?.active ? user : null;
}

export function requireUser(): User {
  const user = currentUser();
  if (!user) throw new DomainError('Faça login para continuar');
  return user;
}

export function useDatabase(): { db: Database | null; version: number } {
  const current = useSyncExternalStore(subscribe, () => version);
  return { db, version: current };
}

export function errorMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message;
  if (error instanceof Error) return error.message;
  return 'Algo deu errado';
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

function commit() {
  notify();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (db) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(db)).catch(() => undefined);
  }, 400);
}
