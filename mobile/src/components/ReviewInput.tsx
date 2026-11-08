import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { REVIEW_PARAMS } from '../domain/labels';
import { averageScore, formatRating } from '../domain/rules';
import type { ReviewInput as Review } from '../domain/types';
import { colors } from '../theme';
import { Card, RatingBadge, styles } from './ui';

export const DEFAULT_REVIEW: Review = { safety: 3, lighting: 3, movement: 3, welcoming: 3, restroom: 3 };

/** Os 5 parâmetros de avaliação; banheiro aceita "Não há" e sai da média. */
export function ReviewInput({ value, onChange }: { value: Review; onChange: (review: Review) => void }) {
  const score = averageScore(value);

  return (
    <Card style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: colors.ink }}>Avalie o local</Text>
          <Text style={styles.muted}>Nota = média dos parâmetros preenchidos</Text>
        </View>
        <RatingBadge rating={score} large />
      </View>

      {REVIEW_PARAMS.map((param) => {
        const current = value[param.key];
        const isRestroom = param.key === 'restroom';

        return (
          <View key={param.key} style={{ gap: 4, borderTopWidth: 1, borderTopColor: colors.lineSoft, paddingTop: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '600', color: colors.ink }}>{param.label}</Text>
                <Text style={{ fontSize: 12, color: colors.muted }}>{param.hint}</Text>
              </View>
              {isRestroom ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected: current === null }}
                  onPress={() => onChange({ ...value, restroom: current === null ? 3 : null })}
                  style={{
                    minHeight: 36,
                    paddingHorizontal: 12,
                    borderRadius: 18,
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: current === null ? colors.primary : colors.line,
                    backgroundColor: current === null ? colors.primary : colors.surface,
                  }}
                >
                  <Text style={{ fontWeight: '700', fontSize: 13, color: current === null ? '#FFF' : colors.muted }}>Não há</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`${param.label} ${n} de 5`}
                  onPress={() => onChange({ ...value, [param.key]: n })}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons
                    name={current !== null && n <= current ? 'star' : 'star-outline'}
                    size={28}
                    color={current === null ? '#C9C2D1' : colors.primary}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

export function ReviewSummary({ review }: { review: Review & { score: number } }) {
  const items = REVIEW_PARAMS.map((param) => ({ label: param.label, value: review[param.key] }));
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map((item) => (
        <Text key={item.label} style={{ fontSize: 12, backgroundColor: colors.background, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, color: colors.ink }}>
          {item.label} <Text style={{ fontWeight: '700' }}>{item.value === null ? 'não há' : item.value}</Text>
        </Text>
      ))}
      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, paddingVertical: 4 }}>Nota {formatRating(review.score)}</Text>
    </View>
  );
}
