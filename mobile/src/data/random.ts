/** Gerador pseudoaleatório com semente (mulberry32): a mesma semente gera os mesmos dados. */
export function createRandom(seed: number) {
  let state = seed >>> 0;

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T,>(items: readonly T[]): T => items[Math.floor(next() * items.length)],
    chance: (probability: number) => next() < probability,
    shuffle: <T,>(items: T[]): T[] => {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    gaussian: () => {
      const u = Math.max(next(), 1e-9);
      const v = next();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    },
  };
}

export type Random = ReturnType<typeof createRandom>;

export function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export const FIRST_NAMES = [
  'Ana', 'Beatriz', 'Camila', 'Daniela', 'Eduarda', 'Fernanda', 'Gabriela', 'Helena', 'Isabela', 'Júlia',
  'Karina', 'Larissa', 'Mariana', 'Natália', 'Olívia', 'Patrícia', 'Rafaela', 'Sofia', 'Tatiane', 'Vanessa',
  'Yasmin', 'Bruna', 'Carolina', 'Letícia', 'Manuela', 'Lívia', 'Alice', 'Laura', 'Valentina', 'Cecília',
];

export const LAST_NAMES = [
  'Silva', 'Souza', 'Oliveira', 'Santos', 'Lima', 'Costa', 'Pereira', 'Almeida', 'Ferreira', 'Ribeiro',
  'Carvalho', 'Gomes', 'Martins', 'Araújo', 'Barbosa', 'Rocha',
];

export const GOOD_TEXTS = [
  'Ambiente tranquilo, me senti segura o tempo todo.',
  'Equipe atenciosa e local bem iluminado.',
  'Sempre movimentado, ótimo para esperar carona.',
  'Banheiro limpo e de fácil acesso.',
  'Recomendo, inclusive à noite.',
  'Funcionárias me ajudaram a chamar um carro com segurança.',
];

export const MEDIUM_TEXTS = [
  'De dia é tranquilo, à noite fica mais vazio.',
  'Atendimento ok, mas a entrada é pouco iluminada.',
  'Nada de grave, mas fico atenta.',
  'Depende do horário; aos fins de semana é melhor.',
  'Banheiro fica no fundo, um pouco isolado.',
];

export const BAD_TEXTS = [
  'Fui seguida na saída, não volto sozinha.',
  'Muito escuro e sem ninguém por perto.',
  'Presenciei assédio e ninguém ajudou.',
  'Banheiro isolado e sem iluminação.',
  'Evitem à noite, local muito inseguro.',
];
