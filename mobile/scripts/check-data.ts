/**
 * Testes da lógica do app offline (sem aparelho): npm run test:data
 * Cobrem a carga de dados, as regras de negócio espelhadas do backend e o
 * gerador de locais do mapa.
 */
import assert from 'node:assert/strict';

import { generateForBounds } from '../src/data/generator';
import {
  DomainError,
  authenticate,
  checkIn,
  createComment,
  createNotice,
  createPlace,
  displayAuthor,
  emptyDatabase,
  placeStats,
  registerUser,
  removeComment,
} from '../src/data/repository';
import { SAO_PAULO, seedDatabase } from '../src/data/seed';
import { ALERT_MESSAGE } from '../src/domain/rules';
import type { Database, LatLng, ReviewInput } from '../src/domain/types';

let passed = 0;
function test(name: string, run: () => void) {
  try {
    run();
    passed += 1;
    console.log(`  ok  ${name}`);
  } catch (error) {
    console.error(`  FALHOU  ${name}`);
    throw error;
  }
}

const north = (point: LatLng, meters: number): LatLng => ({ latitude: point.latitude + meters / 111_195, longitude: point.longitude });
const allOnes: ReviewInput = { safety: 1, lighting: 1, movement: 1, welcoming: 1, restroom: 1 };
const allFives: ReviewInput = { safety: 5, lighting: 5, movement: 5, welcoming: 5, restroom: null };

function newUser(db: Database, name: string) {
  return registerUser(db, { name: `Usuária ${name}`, username: `u.${name}`, email: `${name}@t.dev`, password: 'senha-forte-1', sex: 'FEMALE' });
}

function newPlace(db: Database, point: LatLng = SAO_PAULO, name = 'Local de teste') {
  return createPlace(db, newUser(db, `criadora${Math.floor(Math.random() * 1e9)}`), {
    name, category: 'CAFE', description: '', postalCode: '01310-100', street: 'Rua A', number: '1', district: 'Centro', city: 'São Paulo', state: 'sp',
  }, point);
}

console.log('Carga inicial');
const seeded = seedDatabase(SAO_PAULO, false);
const places = Object.values(seeded.places);

test('50 usuárias da carga + conta de teste', () => {
  assert.equal(Object.values(seeded.users).filter((user) => user.username.startsWith('seed')).length, 50);
  assert.ok(authenticate(seeded, 'teste', 'gosafe123'));
});
test('20 locais', () => assert.equal(places.length, 20));
test('2 locais quase perfeitos (≥ 4,9)', () => assert.equal(places.filter((p) => (p.weightedRating ?? 0) >= 4.9).length, 2));
test('5 locais não aconselhados com alerta', () => {
  const alerts = places.filter((p) => p.notRecommended);
  assert.equal(alerts.length, 5);
  assert.ok(alerts.every((p) => (p.weightedRating ?? 5) <= 1.5 && p.ratingCount >= 5));
});
test('13 locais com notas variadas, sem alerta', () => {
  const mid = places.filter((p) => !p.notRecommended && (p.weightedRating ?? 0) < 4.9);
  assert.equal(mid.length, 13);
  assert.ok(new Set(mid.map((p) => Math.round(p.weightedRating ?? 0))).size >= 3);
});
test('a carga é sempre igual (determinística)', () => {
  const again = seedDatabase(SAO_PAULO, false);
  assert.deepEqual(
    Object.values(again.places).map((p) => p.weightedRating),
    places.map((p) => p.weightedRating),
  );
});

console.log('RN18 — local não aconselhado');
test('só alerta a partir de 5 usuárias e nota ≤ 1,5; some quando sai uma avaliação', () => {
  const db = emptyDatabase(SAO_PAULO);
  const place = newPlace(db);
  const notice = createNotice(db, newUser(db, 'a1'), place, { title: 'Local perigoso', type: 'HARASSMENT', body: 'x', anonymous: false, review: allOnes });
  for (const name of ['a2', 'a3', 'a4']) createComment(db, newUser(db, name), notice, { body: 'y', anonymous: false, review: allOnes });
  assert.equal(place.ratingCount, 4);
  assert.equal(place.notRecommended, false);

  const fifth = newUser(db, 'a5');
  const comment = createComment(db, fifth, notice, { body: 'z', anonymous: false, review: allOnes });
  assert.equal(place.notRecommended, true);
  assert.ok(ALERT_MESSAGE.startsWith('Local não aconselhado'));

  removeComment(db, fifth, comment);
  assert.equal(place.notRecommended, false);
});
test('nota média com muitas avaliações não dispara alerta', () => {
  const db = emptyDatabase(SAO_PAULO);
  const place = newPlace(db);
  const notice = createNotice(db, newUser(db, 'm0'), place, { title: 'Avaliação mediana', type: 'GENERAL', body: 'x', anonymous: false, review: { safety: 2, lighting: 2, movement: 2, welcoming: 2, restroom: 2 } });
  for (let i = 1; i <= 6; i++) createComment(db, newUser(db, `m${i}`), notice, { body: 'y', anonymous: false, review: { safety: 2, lighting: 2, movement: 2, welcoming: 2, restroom: null } });
  assert.equal(place.notRecommended, false);
});

console.log('Nota ponderada');
test('vale só a avaliação mais recente de cada usuária; banheiro "não há" fica fora', () => {
  const db = emptyDatabase(SAO_PAULO);
  const place = newPlace(db);
  const author = newUser(db, 'n1');
  const notice = createNotice(db, author, place, { title: 'Primeira visita', type: 'GENERAL', body: 'x', anonymous: false, review: allOnes });
  createComment(db, author, notice, { body: 'voltei', anonymous: false, review: allFives });
  const stats = placeStats(db, place.id);
  assert.equal(stats.ratingCount, 1);
  assert.equal(stats.rating, 5);
  assert.equal(stats.restroom, null);
});

console.log('Check-in');
test('raio de 100 m descontando a precisão; precisão ruim; janela de 4 h', () => {
  const db = emptyDatabase(SAO_PAULO);
  const place = newPlace(db);
  const user = newUser(db, 'c1');
  assert.throws(() => checkIn(db, user, place, north(place, 500), 10), DomainError);
  assert.throws(() => checkIn(db, user, place, north(place, 120), 10), DomainError);
  assert.throws(() => checkIn(db, user, place, place, 150), /Precisão do GPS/);
  const record = checkIn(db, user, place, north(place, 150), 60);
  assert.equal(record.distanceMeters, 150);
  assert.throws(() => checkIn(db, user, place, place, 5), /4 horas/);
});
test('avaliação com check-in ganha bônus de peso', () => {
  const db = emptyDatabase(SAO_PAULO);
  const place = newPlace(db);
  const withCheckIn = newUser(db, 'b1');
  checkIn(db, withCheckIn, place, place, 5);
  const notice = createNotice(db, withCheckIn, place, { title: 'Fui hoje e foi ótimo', type: 'GENERAL', body: 'x', anonymous: false, review: { ...allFives, restroom: 5 } });
  createComment(db, newUser(db, 'b2'), notice, { body: 'ruim', anonymous: false, review: allOnes });
  assert.equal(placeStats(db, place.id).rating, 3.22);
});

console.log('Locais, cadastro e anonimato');
test('local com mesmo nome a menos de 50 m é bloqueado', () => {
  const db = emptyDatabase(SAO_PAULO);
  newPlace(db, SAO_PAULO, 'Café Igual');
  assert.throws(() => newPlace(db, north(SAO_PAULO, 30), 'CAFÉ IGUAL'), /50 m/);
  newPlace(db, north(SAO_PAULO, 200), 'Café Igual');
});
test('validações de cadastro e login', () => {
  const db = emptyDatabase(SAO_PAULO);
  newUser(db, 'maria');
  assert.throws(() => newUser(db, 'maria'), /E-mail já cadastrado/);
  assert.throws(() => registerUser(db, { name: 'Ana', username: 'com espaco', email: 'x@y.com', password: 'senha-forte-1', sex: 'FEMALE' }), DomainError);
  assert.throws(() => registerUser(db, { name: 'Ana', username: 'ana', email: 'x@y.com', password: '123', sex: 'FEMALE' }), /8 caracteres/);
  assert.throws(() => authenticate(db, 'u.maria', 'errada'), /Credenciais/);
  assert.ok(authenticate(db, 'MARIA@T.DEV', 'senha-forte-1'));
});
test('anônima esconde nome e usuário, mas a autora se reconhece', () => {
  const db = emptyDatabase(SAO_PAULO);
  const author = newUser(db, 'anon');
  assert.equal(displayAuthor(db, author.id, true, null).name, 'Anônima');
  assert.equal(displayAuthor(db, author.id, true, null).username, null);
  assert.equal(displayAuthor(db, author.id, true, author.id).mine, true);
});

console.log('Gerador de locais do mapa');
test('gera "Local Teste N" ao navegar, sem repetir a área e sem gerar com zoom afastado', () => {
  const db = seedDatabase(SAO_PAULO, false);
  const area = { west: -46.7, south: -23.6, east: -46.62, north: -23.54 };
  const created = generateForBounds(db, area, 14);
  assert.ok(created > 20, `esperava vários locais, gerou ${created}`);
  assert.ok(Object.values(db.places).some((p) => p.name === 'Local Teste 1'));
  assert.equal(generateForBounds(db, area, 14), 0);
  assert.equal(generateForBounds(db, { west: -48, south: -25, east: -47, north: -24 }, 10), 0);
  const generated = Object.values(db.places).filter((p) => p.generated);
  assert.ok(generated.some((p) => p.ratingCount > 0));
  assert.ok(generated.every((p) => p.notRecommended === (p.ratingCount >= 5 && (p.weightedRating ?? 5) <= 1.5)));
});

console.log(`\n${passed} testes passaram.`);
