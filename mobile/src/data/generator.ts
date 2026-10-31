/**
 * Gerador de locais ilustrativos: conforme a usuária navega pelo mapa, cada
 * "célula" de ~1 km ainda não visitada ganha de 0 a 2 locais "Local Teste N",
 * com notas e comentários aleatórios de usuárias aleatórias. Serve para ver
 * os pins surgindo com a movimentação (carga por área visível).
 */
import { CATEGORY_LABEL } from '../domain/labels';
import type { Bounds, Database, PlaceCategory, User } from '../domain/types';
import { FIRST_NAMES, LAST_NAMES, createRandom, hashString, type Random } from './random';
import { createComment, createNotice, createPlace, recalculatePlace, registerUser } from './repository';
import { reviewFor, textFor } from './seed';

const CELL_DEGREES = 0.01;
export const MIN_ZOOM = 13;
const MAX_CELLS_PER_PASS = 120;
/** Limites para o banco local não crescer sem fim com a navegação. */
export const MAX_GENERATED_PLACES = 2500;
const MAX_TEST_USERS = 150;
const DAY = 24 * 60 * 60 * 1000;
const CATEGORIES = Object.keys(CATEGORY_LABEL) as PlaceCategory[];

const testUserPool = new WeakMap<Database, User[]>();

function randomTestUser(db: Database, random: Random): User {
  let pool = testUserPool.get(db);
  if (!pool) {
    pool = Object.values(db.users).filter((user) => user.username.startsWith('teste.usuaria'));
    testUserPool.set(db, pool);
  }

  // reaproveita usuárias já criadas; acima do limite, só reaproveita
  if (pool.length >= MAX_TEST_USERS || (pool.length > 10 && random.chance(0.4))) return random.pick(pool);

  db.counters.testUser += 1;
  const n = db.counters.testUser;
  const user = registerUser(
    db,
    {
      name: `${random.pick(FIRST_NAMES)} ${random.pick(LAST_NAMES)}`,
      username: `teste.usuaria${n}`,
      email: `teste.usuaria${n}@gosafe.dev`,
      password: 'gosafe123',
      sex: 'FEMALE',
    },
    { createdAt: Date.now() - random.int(0, 300) * DAY, generated: true },
  );
  user.verified = random.chance(0.3);
  pool.push(user);
  return user;
}

export function generationLimitReached(db: Database): boolean {
  return db.counters.testPlace >= MAX_GENERATED_PLACES;
}

/** Gera locais nas células visíveis ainda não geradas. Devolve quantos locais foram criados. */
export function generateForBounds(db: Database, bounds: Bounds, zoom: number): number {
  if (zoom < MIN_ZOOM || generationLimitReached(db)) return 0;

  const x0 = Math.floor(bounds.west / CELL_DEGREES);
  const x1 = Math.floor(bounds.east / CELL_DEGREES);
  const y0 = Math.floor(bounds.south / CELL_DEGREES);
  const y1 = Math.floor(bounds.north / CELL_DEGREES);

  let cells = 0;
  let created = 0;

  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) {
      const key = `${x}:${y}`;
      if (db.generatedCells[key]) continue;
      if (++cells > MAX_CELLS_PER_PASS) return created;

      db.generatedCells[key] = true;
      const random = createRandom(hashString(key));
      const count = random.int(0, 2);

      for (let i = 0; i < count; i++) {
        if (generationLimitReached(db)) return created;
        created += 1;
        generatePlace(db, random, {
          latitude: (y + random.next()) * CELL_DEGREES,
          longitude: (x + random.next()) * CELL_DEGREES,
        });
      }
    }
  }

  return created;
}

function generatePlace(db: Database, random: Random, point: { latitude: number; longitude: number }): void {
  db.counters.testPlace += 1;
  const n = db.counters.testPlace;
  const creator = randomTestUser(db, random);

  const place = createPlace(
    db,
    creator,
    {
      name: `Local Teste ${n}`,
      category: random.pick(CATEGORIES),
      description: 'Local ilustrativo gerado automaticamente para testes.',
      postalCode: '00000000',
      street: `Rua Teste ${random.int(1, 400)}`,
      number: String(random.int(1, 3000)),
      district: 'Região de teste',
      city: 'Cidade de teste',
      state: 'SP',
    },
    point,
    { generated: true, skipDuplicateCheck: true, needsLandCheck: true },
  );

  const roll = random.next();
  const profile = roll < 0.15 ? 'LOW' : roll < 0.35 ? 'TOP' : 'MID';
  const reviewers = random.int(0, profile === 'LOW' ? 7 : 6);
  if (reviewers === 0) return;

  const target = 1.5 + random.next() * 3.5;
  let timestamp = Date.now() - random.int(10, 60) * DAY;
  const author = randomTestUser(db, random);

  const notice = createNotice(
    db,
    author,
    place,
    {
      title: `Relato sobre o Local Teste ${n}`,
      type: random.pick(['GENERAL', 'LIGHTING', 'MOVEMENT', 'WELCOMING', 'RESTROOM', 'HARASSMENT'] as const),
      body: textFor(profile, random),
      anonymous: random.chance(0.3),
      review: reviewFor(profile, target, random),
    },
    { createdAt: timestamp, skipRecalculation: true },
  );

  const used = new Set([author.id]);
  for (let i = 1; i < reviewers; i++) {
    const reviewer = randomTestUser(db, random);
    if (used.has(reviewer.id)) continue;
    used.add(reviewer.id);
    timestamp += random.int(1, 3) * DAY;
    createComment(
      db,
      reviewer,
      notice,
      { body: textFor(profile, random), anonymous: random.chance(0.3), review: reviewFor(profile, target, random) },
      { createdAt: timestamp, skipRecalculation: true },
    );
  }

  recalculatePlace(db, place);
}
