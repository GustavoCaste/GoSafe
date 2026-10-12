/**
 * Carga inicial do app de teste (mesma massa do perfil "dev" do backend):
 * 50 usuárias + conta de teste, 20 locais — 2 quase perfeitos, 5 com nota muito
 * baixa (disparam o alerta de local não aconselhado) e 13 com notas variadas.
 * Os locais são posicionados em volta do ponto inicial (localização do aparelho
 * ou, sem permissão, o centro de São Paulo), mantendo o desenho original.
 */
import type { Database, LatLng, NoticeType, PlaceCategory, ReviewInput, User } from '../domain/types';
import { BAD_TEXTS, FIRST_NAMES, GOOD_TEXTS, LAST_NAMES, MEDIUM_TEXTS, createRandom, type Random } from './random';
import { createComment, createNotice, createPlace, emptyDatabase, recalculatePlace, registerUser } from './repository';

export const SAO_PAULO: LatLng = { latitude: -23.56, longitude: -46.65 };
export const SEED_PASSWORD = 'gosafe123';
export const TEST_ACCOUNT = { login: 'teste', password: SEED_PASSWORD };

type Profile = 'TOP' | 'LOW' | 'MID';

interface SeedPlace {
  name: string;
  category: PlaceCategory;
  street: string;
  number: string;
  district: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  profile: Profile;
  target: number;
}

const PLACES: SeedPlace[] = [
  { name: 'Café Aurora', category: 'CAFE', street: 'Av. Paulista', number: '1000', district: 'Bela Vista', postalCode: '01310100', latitude: -23.5646, longitude: -46.6527, profile: 'TOP', target: 5 },
  { name: 'Academia Movimento', category: 'GYM', street: 'Rua Augusta', number: '1500', district: 'Consolação', postalCode: '01304001', latitude: -23.556, longitude: -46.66, profile: 'TOP', target: 5 },
  { name: 'Terminal Leste', category: 'TRANSPORT', street: 'Rua do Gasômetro', number: '200', district: 'Brás', postalCode: '03004000', latitude: -23.5435, longitude: -46.62, profile: 'LOW', target: 1 },
  { name: 'Bar do Porto', category: 'BAR', street: 'Rua José Paulino', number: '300', district: 'Bom Retiro', postalCode: '01120000', latitude: -23.528, longitude: -46.64, profile: 'LOW', target: 1 },
  { name: 'Praça das Flores', category: 'PARK', street: 'Rua Direita', number: '50', district: 'Sé', postalCode: '01002000', latitude: -23.548, longitude: -46.635, profile: 'LOW', target: 1 },
  { name: 'Passarela da Mooca', category: 'OTHER', street: 'Rua da Mooca', number: '900', district: 'Mooca', postalCode: '03104000', latitude: -23.56, longitude: -46.6, profile: 'LOW', target: 1 },
  { name: 'Ponto Final 12', category: 'TRANSPORT', street: 'Av. do Estado', number: '3000', district: 'Pari', postalCode: '03105000', latitude: -23.53, longitude: -46.625, profile: 'LOW', target: 1 },
  { name: 'Padaria Central', category: 'CAFE', street: 'Rua Galvão Bueno', number: '100', district: 'Liberdade', postalCode: '01506000', latitude: -23.558, longitude: -46.635, profile: 'MID', target: 4.3 },
  { name: 'Livraria Página Viva', category: 'SHOP', street: 'Rua dos Pinheiros', number: '500', district: 'Pinheiros', postalCode: '05422000', latitude: -23.565, longitude: -46.682, profile: 'MID', target: 4.5 },
  { name: 'Restaurante Sabor da Casa', category: 'RESTAURANT', street: 'Rua Domingos de Morais', number: '800', district: 'Vila Mariana', postalCode: '04010000', latitude: -23.589, longitude: -46.637, profile: 'MID', target: 3.9 },
  { name: 'Farmácia Bem Estar', category: 'SERVICE', street: 'Av. Ibirapuera', number: '2000', district: 'Moema', postalCode: '04029000', latitude: -23.6, longitude: -46.664, profile: 'MID', target: 4.1 },
  { name: 'Parque das Árvores', category: 'PARK', street: 'Av. Vital Brasil', number: '700', district: 'Butantã', postalCode: '05503000', latitude: -23.57, longitude: -46.708, profile: 'MID', target: 3.2 },
  { name: 'Lanchonete da Esquina', category: 'RESTAURANT', street: 'Rua das Palmeiras', number: '400', district: 'Santa Cecília', postalCode: '01226000', latitude: -23.537, longitude: -46.656, profile: 'MID', target: 2.8 },
  { name: 'Mercado Bom Preço', category: 'SHOP', street: 'Rua Barra Funda', number: '600', district: 'Barra Funda', postalCode: '01152000', latitude: -23.526, longitude: -46.665, profile: 'MID', target: 3.6 },
  { name: 'Cafeteria Livro Aberto', category: 'CAFE', street: 'Rua Cardoso de Almeida', number: '900', district: 'Perdizes', postalCode: '05013000', latitude: -23.537, longitude: -46.675, profile: 'MID', target: 4.4 },
  { name: 'Pub Lua Cheia', category: 'BAR', street: 'Rua Aspicuelta', number: '200', district: 'Vila Madalena', postalCode: '05433010', latitude: -23.556, longitude: -46.689, profile: 'MID', target: 3.0 },
  { name: 'Terminal Vila Nova', category: 'TRANSPORT', street: 'Rua Vergueiro', number: '3500', district: 'Vila Mariana', postalCode: '04101000', latitude: -23.576, longitude: -46.641, profile: 'MID', target: 3.3 },
  { name: 'Coworking Ponto de Encontro', category: 'SERVICE', street: 'Rua Joaquim Floriano', number: '300', district: 'Itaim Bibi', postalCode: '04534000', latitude: -23.584, longitude: -46.676, profile: 'MID', target: 4.6 },
  { name: 'Lavanderia Bolha', category: 'SERVICE', street: 'Rua Tuiuti', number: '500', district: 'Tatuapé', postalCode: '03081000', latitude: -23.54, longitude: -46.576, profile: 'MID', target: 3.8 },
  { name: 'Sorveteria Gelato Sul', category: 'RESTAURANT', street: 'Av. Jabaquara', number: '1200', district: 'Saúde', postalCode: '04046000', latitude: -23.618, longitude: -46.639, profile: 'MID', target: 2.5 },
];

const DAY = 24 * 60 * 60 * 1000;

function around(target: number, random: Random): number {
  return Math.max(1, Math.min(5, Math.round(target + random.gaussian() * 0.7)));
}

export function reviewFor(profile: Profile, target: number, random: Random): ReviewInput {
  switch (profile) {
    case 'TOP':
      return { safety: 5, lighting: 5, movement: 5, welcoming: 5, restroom: random.chance(1 / 6) ? 4 : 5 };
    case 'LOW':
      return { safety: 1, lighting: random.chance(0.2) ? 2 : 1, movement: 1, welcoming: 1, restroom: random.chance(0.5) ? 1 : null };
    default:
      return {
        safety: around(target, random),
        lighting: around(target, random),
        movement: around(target, random),
        welcoming: around(target, random),
        restroom: random.chance(1 / 3) ? null : around(target, random),
      };
  }
}

export function textFor(profile: Profile, random: Random): string {
  if (profile === 'TOP') return random.pick(GOOD_TEXTS);
  if (profile === 'LOW') return random.pick(BAD_TEXTS);
  return random.pick(random.chance(0.5) ? MEDIUM_TEXTS : GOOD_TEXTS);
}

const TITLES: Record<Profile, string> = {
  TOP: 'Lugar muito seguro e acolhedor',
  LOW: 'Cuidado: local inseguro',
  MID: 'Como foi minha experiência aqui',
};

const TYPES: Record<Profile, NoticeType> = { TOP: 'WELCOMING', LOW: 'HARASSMENT', MID: 'GENERAL' };

export function seedDatabase(center: LatLng, placedAroundDevice: boolean): Database {
  const db = emptyDatabase(center);
  const random = createRandom(42);
  const now = Date.now();
  const users: User[] = [];

  for (let i = 1; i <= 50; i++) {
    const user = registerUser(
      db,
      {
        name: `${FIRST_NAMES[(i - 1) % FIRST_NAMES.length]} ${LAST_NAMES[(i - 1) % LAST_NAMES.length]}`,
        username: `seed${String(i).padStart(2, '0')}`,
        email: `seed${String(i).padStart(2, '0')}@gosafe.dev`,
        password: SEED_PASSWORD,
        sex: 'FEMALE',
      },
      { createdAt: now - random.int(5, 200) * DAY, generated: true },
    );
    user.verified = i % 5 === 0;
    users.push(user);
  }

  // Conta para quem está testando o app
  registerUser(db, { name: 'Usuária de Teste', username: 'teste', email: 'teste@gosafe.dev', password: SEED_PASSWORD, sex: 'FEMALE' });

  for (const seed of PLACES) {
    const point = {
      latitude: center.latitude + (seed.latitude - SAO_PAULO.latitude),
      longitude: center.longitude + (seed.longitude - SAO_PAULO.longitude),
    };
    const creator = random.pick(users);
    const place = createPlace(
      db,
      creator,
      {
        name: seed.name,
        category: seed.category,
        description: 'Local de demonstração do GoSafe.',
        postalCode: seed.postalCode,
        street: seed.street,
        number: seed.number,
        district: seed.district,
        city: placedAroundDevice ? 'Demonstração' : 'São Paulo',
        state: 'SP',
      },
      point,
      { createdAt: now - 90 * DAY, skipDuplicateCheck: true },
    );

    const reviewers = seed.profile === 'TOP' ? 12 : seed.profile === 'LOW' ? 10 : random.int(3, 8);
    const chosen = random.shuffle(users).slice(0, reviewers);
    let timestamp = now - random.int(40, 80) * DAY;

    const notice = createNotice(
      db,
      chosen[0],
      place,
      {
        title: TITLES[seed.profile],
        type: TYPES[seed.profile],
        body: textFor(seed.profile, random),
        anonymous: random.chance(0.25),
        review: reviewFor(seed.profile, seed.target, random),
      },
      { createdAt: timestamp, skipRecalculation: true },
    );

    for (const reviewer of chosen.slice(1)) {
      timestamp += random.int(1, 4) * DAY;
      createComment(
        db,
        reviewer,
        notice,
        { body: textFor(seed.profile, random), anonymous: random.chance(0.25), review: reviewFor(seed.profile, seed.target, random) },
        { createdAt: timestamp, skipRecalculation: true },
      );
    }

    if (seed.profile === 'MID' && random.chance(0.5)) {
      createNotice(
        db,
        random.pick(users),
        place,
        {
          title: 'Dica para quem vai à noite',
          type: random.pick(['LIGHTING', 'MOVEMENT', 'RESTROOM'] as NoticeType[]),
          body: random.pick(MEDIUM_TEXTS),
          anonymous: random.chance(0.5),
          review: null,
        },
        { createdAt: now - random.int(1, 10) * DAY },
      );
    }

    recalculatePlace(db, place);
  }

  return db;
}
