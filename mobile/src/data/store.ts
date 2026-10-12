/**
 * Banco local do app de teste. Fica todo no aparelho, sem nenhuma chamada de
 * rede. As telas leem com useDatabase() e alteram com mutate(), que salva
 * automaticamente.
 *
 * Persistência em arquivo (expo-file-system): o AsyncStorage do Android não
 * consegue ler valores acima de ~2 MB (limite do CursorWindow), e o banco passa
 * disso depois de muita navegação pelo mapa — os dados se perderiam ao reabrir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File, Paths } from 'expo-file-system';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import type { Database, LatLng, User } from '../domain/types';
import { DB_SCHEMA, DomainError } from './repository';
import { seedDatabase } from './seed';

const LEGACY_STORAGE_KEY = 'gosafe:test-db';
const SAVE_DELAY_MS = 400;

let db: Database | null = null;
let version = 0;
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Set<() => void>();

function databaseFile(): File {
  return new File(Paths.document, 'gosafe-test-db.json');
}

function parse(raw: string | null): Database | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Database;
    return parsed.schema === DB_SCHEMA ? parsed : null;
  } catch {
    return null; // arquivo corrompido: começa de novo
  }
}

export async function loadDatabase(): Promise<boolean> {
  const file = databaseFile();
  let loaded = file.exists ? parse(await file.text()) : null;

  if (!loaded) {
    // migra versões anteriores do app, que guardavam no AsyncStorage
    const legacy = parse(await AsyncStorage.getItem(LEGACY_STORAGE_KEY).catch(() => null));
    if (legacy) {
      loaded = legacy;
      writeNow(legacy);
      await AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => undefined);
    }
  }

  if (loaded) {
    db = loaded;
    notify();
    return true;
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
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  db = null;
  const file = databaseFile();
  if (file.exists) file.delete();
  await AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => undefined);
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

function writeNow(database: Database) {
  try {
    const file = databaseFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(database));
  } catch (error) {
    console.warn('GoSafe: não foi possível salvar o banco local', error);
  }
}

function flush() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (db) writeNow(db);
}

function commit() {
  notify();
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, SAVE_DELAY_MS);
}

// Garante a gravação quando o app vai para segundo plano ou é fechado logo após uma alteração
AppState.addEventListener('change', (state) => {
  if (state !== 'active' && saveTimer) flush();
});
