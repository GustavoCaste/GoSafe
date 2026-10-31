import { Pressable, Text, View } from 'react-native';

import { CATEGORY_LABEL } from '../domain/labels';
import { formatDistance } from '../domain/rules';
import type { Place } from '../domain/types';
import { colors, radius } from '../theme';
import { RatingBadge } from './ui';

const THUMB_COLORS = ['#E9C9A8', '#C9DDF0', '#CFE3C8', '#F3DFA2', '#E6CFE0', '#D9D4CE', '#D7C3B0'];

export function placeThumbColor(place: Place): string {
  let hash = 0;
  for (const char of place.id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return THUMB_COLORS[hash % THUMB_COLORS.length];
}

export function PlaceThumb({ place, size = 60 }: { place: Place; size?: number }) {
  const initials = place.name
    .split(' ')
    .filter((part) => part.length > 2 || /\d/.test(part))
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <View style={{ width: size, height: size, borderRadius: 16, backgroundColor: placeThumbColor(place), alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontWeight: '800', fontSize: size * 0.33, color: '#3B2A1E' }}>{initials}</Text>
    </View>
  );
}

/** Item da lista de locais (estilo iFood): foto, nome, texto padrão e nota geral. */
export function PlaceRow({ place, distance, onPress }: { place: Place; distance?: number | null; onPress: () => void }) {
  const meta = [CATEGORY_LABEL[place.category], formatDistance(distance), place.district].filter(Boolean).join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: place.notRecommended ? '#F0B9B1' : colors.line,
        padding: 12,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <PlaceThumb place={place} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: colors.ink }} numberOfLines={1}>
          {place.name}
        </Text>
        <Text style={{ fontSize: 13, color: colors.muted }} numberOfLines={1}>
          {meta}
        </Text>
        {place.notRecommended ? (
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.bad }}>Local não aconselhado</Text>
        ) : (
          <Text style={{ fontSize: 13, color: colors.muted }} numberOfLines={1}>
            {place.description}
          </Text>
        )}
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <RatingBadge rating={place.weightedRating} />
        <Text style={{ fontSize: 12, color: colors.muted }}>{place.ratingCount} aval.</Text>
      </View>
    </Pressable>
  );
}
