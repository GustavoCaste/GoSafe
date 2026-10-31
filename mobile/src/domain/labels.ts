import type { NoticeType, PlaceCategory, Sex } from './types';

export const CATEGORY_LABEL: Record<PlaceCategory, string> = {
  CAFE: 'Café',
  BAR: 'Bar',
  RESTAURANT: 'Restaurante',
  TRANSPORT: 'Transporte',
  PARK: 'Praça / parque',
  GYM: 'Academia',
  SHOP: 'Comércio',
  SERVICE: 'Serviço',
  OTHER: 'Outro',
};

export const NOTICE_TYPE_LABEL: Record<NoticeType, string> = {
  HARASSMENT: 'Assédio',
  LIGHTING: 'Iluminação',
  MOVEMENT: 'Movimento',
  WELCOMING: 'Acolhimento',
  RESTROOM: 'Banheiro',
  GENERAL: 'Geral',
};

export const SEX_LABEL: Record<Sex, string> = {
  FEMALE: 'Feminino',
  MALE: 'Masculino',
  OTHER: 'Outro',
  NOT_INFORMED: 'Prefiro não informar',
};

export const REVIEW_PARAMS = [
  { key: 'safety', label: 'Segurança', hint: 'Como você se sentiu' },
  { key: 'lighting', label: 'Iluminação', hint: 'Entrada, saída e arredores' },
  { key: 'movement', label: 'Movimento', hint: 'Pessoas por perto' },
  { key: 'welcoming', label: 'Acolhimento', hint: 'Equipe ajuda se precisar' },
  { key: 'restroom', label: 'Banheiro', hint: 'Acesso iluminado, longe do masculino' },
] as const;

export function timeAgo(timestamp: number, now = Date.now()): string {
  const minutes = Math.floor((now - timestamp) / 60000);
  if (minutes < 1) return 'agora';
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  return new Date(timestamp).toLocaleDateString('pt-BR');
}
