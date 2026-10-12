import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native';

import { placeThumbColor } from '../components/PlaceRow';
import { DEFAULT_REVIEW, ReviewInput, ReviewSummary } from '../components/ReviewInput';
import { AlertBanner, Button, Card, Chip, Empty, Field, IconButton, RatingBadge, Screen, SectionTitle, styles as ui } from '../components/ui';
import {
  checkIn,
  checkInValidUntil,
  createComment,
  createNotice,
  displayAuthor,
  isFavorite,
  placeStats,
  removeComment,
  removeNotice,
  reviewForComment,
  toggleFavorite,
  userWeight,
  validCheckIn,
} from '../data/repository';
import { currentUser, errorMessage, mutate, requireUser, useDatabase } from '../data/store';
import { CATEGORY_LABEL, NOTICE_TYPE_LABEL, REVIEW_PARAMS, timeAgo } from '../domain/labels';
import { ALERT_MIN_REVIEWS, distanceMeters, formatDistance, formatRating, voteWeight } from '../domain/rules';
import type { Comment, Database, NoticeType, ReviewInput as Review } from '../domain/types';
import { currentFix, useLastKnownPosition } from '../hooks/location';
import type { ScreenProps } from '../navigation/types';
import { colors } from '../theme';

function Author({ db, authorId, anonymous, createdAt }: { db: Database; authorId: string; anonymous: boolean; createdAt: number }) {
  const viewer = currentUser();
  const author = displayAuthor(db, authorId, anonymous, viewer?.id ?? null);
  return (
    <Text style={{ fontSize: 13, color: colors.muted }}>
      <Text style={{ fontWeight: '700', color: colors.ink }}>{author.name}</Text>
      {author.username ? ` @${author.username}` : ''}
      {author.verified ? <Text style={{ color: colors.good, fontWeight: '700' }}> · verificada</Text> : null}
      {author.mine ? <Text style={{ color: colors.primary, fontWeight: '700' }}> · você</Text> : null}
      {` · ${timeAgo(createdAt)}`}
    </Text>
  );
}

export function PlaceScreen({ navigation, route }: ScreenProps<'Place'>) {
  const { db, version } = useDatabase();
  const position = useLastKnownPosition();
  const [busy, setBusy] = useState(false);
  const user = currentUser();
  const place = db?.places[route.params.placeId];

  const stats = useMemo(() => (db && place ? placeStats(db, place.id) : null), [db, version, place]);
  const notices = useMemo(
    () =>
      db && place
        ? Object.values(db.notices)
            .filter((notice) => notice.placeId === place.id && notice.status === 'ACTIVE')
            .sort((a, b) => b.lastActivityAt - a.lastActivityAt)
        : [],
    [db, version, place],
  );

  if (!db || !place || !place.active || !user) {
    return (
      <Screen title="Local">
        <Empty text="Local não encontrado." />
      </Screen>
    );
  }

  const favorite = isFavorite(db, user.id, place.id);
  const currentCheckIn = validCheckIn(db, user.id, place.id);

  const doCheckIn = async (simulate: boolean) => {
    try {
      setBusy(true);
      let fix = { latitude: place.latitude, longitude: place.longitude, accuracy: 5 };
      if (!simulate) {
        const real = await currentFix();
        if (!real) throw new Error('Permita o acesso à localização para fazer check-in.');
        fix = real;
      }
      const record = mutate((database) => checkIn(database, requireUser(), database.places[place.id], fix, fix.accuracy));
      Alert.alert('Check-in feito', `Você estava a ${record.distanceMeters} m. Suas avaliações deste local nas próximas 4 h contam com peso maior.`);
    } catch (error) {
      Alert.alert('Check-in não realizado', errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  const address = [`${place.street}, ${place.number}`, place.district, `${place.city}/${place.state}`].join(' — ');
  const distance = position ? formatDistance(distanceMeters(position, place)) : '';

  return (
    <SafeAreaView style={ui.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={{ height: 200, backgroundColor: placeThumbColor(place), justifyContent: 'flex-end', padding: 14 }}>
          <SafeAreaView edges={['top']} style={{ position: 'absolute', left: 16, right: 16, top: 0, flexDirection: 'row', justifyContent: 'space-between' }}>
            <IconButton icon="chevron-back" label="Voltar" onPress={() => navigation.goBack()} />
            <IconButton
              icon={favorite ? 'heart' : 'heart-outline'}
              label={favorite ? 'Remover dos favoritos' : 'Favoritar'}
              color="#C2410C"
              onPress={() => mutate((database) => toggleFavorite(database, user.id, place.id))}
            />
          </SafeAreaView>
          <Text style={{ color: '#3B2A1E', fontWeight: '700', fontSize: 12 }}>
            [Foto do local] {place.generated ? '· Local ilustrativo gerado para teste' : ''}
          </Text>
        </View>

        <View style={{ padding: 16, gap: 14, maxWidth: 640, width: '100%', alignSelf: 'center' }}>
          <View style={{ gap: 4 }}>
            <Text style={ui.title}>{place.name}</Text>
            <Text style={ui.muted}>{[CATEGORY_LABEL[place.category], distance].filter(Boolean).join(' · ')}</Text>
            <Text style={ui.muted}>{address}</Text>
          </View>

          {place.notRecommended ? <AlertBanner /> : null}

          <Card style={{ flexDirection: 'row', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <View style={{ alignItems: 'center', gap: 4, paddingRight: 14, borderRightWidth: 1, borderRightColor: colors.lineSoft }}>
              <RatingBadge rating={stats?.rating ?? null} large />
              <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>
                nota ponderada{'\n'}
                {stats?.ratingCount ?? 0} usuárias
              </Text>
            </View>
            <View style={{ flex: 1, minWidth: 170, gap: 7 }}>
              {REVIEW_PARAMS.map((param) => {
                const value = stats ? stats[param.key] : null;
                return (
                  <View key={param.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ width: 86, fontSize: 13, color: colors.muted }}>{param.label}</Text>
                    <View style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.lineSoft }}>
                      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.primary, width: `${((value ?? 0) / 5) * 100}%` }} />
                    </View>
                    <Text style={{ width: 28, textAlign: 'right', fontWeight: '700', fontSize: 13 }}>{formatRating(value)}</Text>
                  </View>
                );
              })}
            </View>
          </Card>
          {!place.notRecommended && (stats?.ratingCount ?? 0) < ALERT_MIN_REVIEWS ? (
            <Text style={[ui.muted, { fontSize: 12 }]}>
              O alerta de local não aconselhado só é considerado a partir de {ALERT_MIN_REVIEWS} usuárias avaliando (versão de teste).
            </Text>
          ) : null}

          {currentCheckIn ? (
            <View style={{ backgroundColor: colors.goodSoft, borderRadius: 14, padding: 12 }}>
              <Text style={{ color: '#155E50', lineHeight: 20 }}>
                <Text style={{ fontWeight: '700' }}>Check-in feito {timeAgo(currentCheckIn.createdAt)}</Text> · você estava a {currentCheckIn.distanceMeters} m. Vale até{' '}
                {new Date(checkInValidUntil(currentCheckIn)).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 6 }}>
              <Button label="Fazer check-in (estou aqui)" icon="location" variant="secondary" loading={busy} onPress={() => doCheckIn(false)} />
              <Button label="Simular check-in no local (teste)" variant="ghost" onPress={() => doCheckIn(true)} />
            </View>
          )}

          <SectionTitle right={<Button label="Novo aviso" icon="add" style={{ minHeight: 44 }} onPress={() => navigation.navigate('NewNotice', { placeId: place.id })} />}>
            Avisos recentes
          </SectionTitle>
          {notices.length === 0 ? <Empty text="Ainda não há avisos. Seja a primeira a relatar como é este local." /> : null}
          {notices.map((notice) => (
            <Pressable key={notice.id} onPress={() => navigation.navigate('Notice', { noticeId: notice.id })}>
              <Card style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
                    {NOTICE_TYPE_LABEL[notice.type]}
                  </Text>
                  <Author db={db} authorId={notice.authorId} anonymous={notice.anonymous} createdAt={notice.lastActivityAt} />
                </View>
                <Text style={{ fontWeight: '700', fontSize: 15 }}>{notice.title}</Text>
                <Text style={ui.muted}>{notice.commentCount} comentários</Text>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function NoticeScreen({ navigation, route }: ScreenProps<'Notice'>) {
  const { db, version } = useDatabase();
  const user = currentUser();
  const notice = db?.notices[route.params.noticeId];

  const comments = useMemo(
    () =>
      db && notice
        ? Object.values(db.comments)
            .filter((comment) => comment.noticeId === notice.id && comment.status === 'ACTIVE')
            .sort((a, b) => (a.initial === b.initial ? a.createdAt - b.createdAt : a.initial ? -1 : 1))
        : [],
    [db, version, notice],
  );

  if (!db || !notice || notice.status !== 'ACTIVE' || !user) {
    return (
      <Screen title="Aviso">
        <Empty text="Aviso não encontrado ou removido." />
      </Screen>
    );
  }

  const place = db.places[notice.placeId];
  const canModerate = user.role !== 'USER';

  const remove = (comment: Comment) =>
    Alert.alert('Remover comentário?', 'A avaliação ligada a ele deixa de contar na nota do local.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          try {
            mutate((database) => removeComment(database, requireUser(), database.comments[comment.id]));
          } catch (error) {
            Alert.alert('Não foi possível remover', errorMessage(error));
          }
        },
      },
    ]);

  const removeWhole = () =>
    Alert.alert('Remover aviso?', 'O aviso e as avaliações dele deixam de aparecer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          mutate((database) => removeNotice(database, requireUser(), database.notices[notice.id]));
          navigation.goBack();
        },
      },
    ]);

  return (
    <Screen
      title={notice.title}
      right={notice.authorId === user.id || canModerate ? <IconButton icon="trash-outline" label="Remover aviso" color={colors.bad} onPress={removeWhole} /> : undefined}
      footer={<Button label="Comentar e avaliar" icon="chatbubble-ellipses" onPress={() => navigation.navigate('Comment', { noticeId: notice.id })} />}
    >
      <Pressable onPress={() => navigation.navigate('Place', { placeId: place.id })}>
        <Text style={{ color: colors.primary, fontWeight: '700' }}>
          {place.name} · {NOTICE_TYPE_LABEL[notice.type]}
        </Text>
      </Pressable>
      {place.notRecommended ? <AlertBanner compact /> : null}
      {comments.map((comment) => {
        const review = reviewForComment(db, comment.id);
        const mine = comment.authorId === user.id;
        return (
          <Card key={comment.id} style={[{ gap: 8 }, comment.initial && { borderColor: colors.primary, borderWidth: 1.5 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Author db={db} authorId={comment.authorId} anonymous={comment.anonymous} createdAt={comment.createdAt} />
                {comment.initial ? <Text style={{ fontSize: 12, color: colors.primary, fontWeight: '700' }}>Relato inicial</Text> : null}
              </View>
              {review ? <RatingBadge rating={review.score} /> : null}
              {(mine || canModerate) && !comment.initial ? (
                <IconButton icon="trash-outline" label="Remover comentário" color={colors.bad} onPress={() => remove(comment)} />
              ) : null}
            </View>
            <Text style={{ fontSize: 15, lineHeight: 22, color: colors.ink }}>{comment.body}</Text>
            {review ? (
              <>
                <ReviewSummary review={review} />
                {review.checkInId ? <Text style={{ fontSize: 12, color: colors.good, fontWeight: '700' }}>Avaliou com check-in no local</Text> : null}
              </>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

function VoteWeightInfo({ placeId }: { placeId: string }) {
  const { db } = useDatabase();
  const user = currentUser();
  if (!db || !user) return null;
  const checked = validCheckIn(db, user.id, placeId);
  const weight = voteWeight(userWeight(user), Boolean(checked));

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: checked ? colors.goodSoft : colors.lineSoft, color: checked ? '#155E50' : colors.muted }}>
          {checked ? `Check-in confirmado · ${checked.distanceMeters} m` : 'Sem check-in neste local'}
        </Text>
        <Text style={{ fontSize: 13, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: colors.primarySoft, color: colors.primary }}>
          Peso do seu voto: {weight.toFixed(2).replace('.', ',')}
        </Text>
      </View>
      <Text style={{ fontSize: 12, color: colors.muted }}>O peso cresce com o tempo de conta, contribuições válidas, verificação facial e check-in no local.</Text>
    </View>
  );
}

const NOTICE_TYPES = Object.keys(NOTICE_TYPE_LABEL) as NoticeType[];

export function NewNoticeScreen({ navigation, route }: ScreenProps<'NewNotice'>) {
  const { db } = useDatabase();
  const place = db?.places[route.params.placeId];
  const [title, setTitle] = useState('');
  const [type, setType] = useState<NoticeType>('GENERAL');
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [withReview, setWithReview] = useState(true);
  const [review, setReview] = useState<Review>(DEFAULT_REVIEW);

  if (!place) return <Screen title="Novo aviso"><Empty text="Local não encontrado." /></Screen>;

  const submit = () => {
    try {
      const notice = mutate((database) =>
        createNotice(database, requireUser(), database.places[place.id], { title, type, body, anonymous, review: withReview ? review : null }),
      );
      navigation.replace('Notice', { noticeId: notice.id });
    } catch (error) {
      Alert.alert('Não foi possível publicar', errorMessage(error));
    }
  };

  return (
    <Screen title="Novo aviso" footer={<Button label="Publicar aviso" onPress={submit} />}>
      <Card style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Ionicons name="lock-closed" size={18} color={colors.muted} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>Local do aviso</Text>
          <Text style={{ fontWeight: '700' }}>{place.name}</Text>
        </View>
      </Card>
      <Field label="Título do aviso" value={title} onChangeText={setTitle} placeholder="Resuma em uma frase (mín. 5 caracteres)" maxLength={120} />
      <Text style={ui.label}>Tipo</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {NOTICE_TYPES.map((item) => (
          <Chip key={item} label={NOTICE_TYPE_LABEL[item]} selected={type === item} onPress={() => setType(item)} />
        ))}
      </View>
      <Field label="Comentário inicial" value={body} onChangeText={setBody} multiline maxLength={1000} placeholder="Conte o que aconteceu ou o que outras mulheres devem saber" />
      <ToggleRow label="Incluir avaliação do local" value={withReview} onChange={setWithReview} />
      {withReview ? (
        <>
          <VoteWeightInfo placeId={place.id} />
          <ReviewInput value={review} onChange={setReview} />
        </>
      ) : null}
      <ToggleRow label="Publicar como anônima" value={anonymous} onChange={setAnonymous} />
    </Screen>
  );
}

export function CommentScreen({ navigation, route }: ScreenProps<'Comment'>) {
  const { db } = useDatabase();
  const notice = db?.notices[route.params.noticeId];
  const [body, setBody] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [withReview, setWithReview] = useState(true);
  const [review, setReview] = useState<Review>(DEFAULT_REVIEW);

  if (!db || !notice) return <Screen title="Comentar"><Empty text="Aviso não encontrado." /></Screen>;

  const submit = () => {
    try {
      mutate((database) => createComment(database, requireUser(), database.notices[notice.id], { body, anonymous, review: withReview ? review : null }));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Não foi possível comentar', errorMessage(error));
    }
  };

  return (
    <Screen title="Comentar" footer={<Button label="Enviar comentário" onPress={submit} />}>
      <Card>
        <Text style={{ fontSize: 12, color: colors.muted }}>Respondendo ao aviso em {db.places[notice.placeId]?.name}</Text>
        <Text style={{ fontWeight: '700', marginTop: 2 }}>{notice.title}</Text>
      </Card>
      <Field label="Seu comentário" value={body} onChangeText={setBody} multiline maxLength={1000} placeholder="Compartilhe sua experiência neste local" />
      <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'right' }}>{body.length} / 1000</Text>
      <ToggleRow label="Incluir avaliação do local" value={withReview} onChange={setWithReview} />
      {withReview ? (
        <>
          <VoteWeightInfo placeId={notice.placeId} />
          <ReviewInput value={review} onChange={setReview} />
        </>
      ) : null}
      <ToggleRow label="Comentar como anônima" value={anonymous} onChange={setAnonymous} />
    </Screen>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary }} />
      <Text style={{ flex: 1, fontSize: 15, color: colors.ink }}>{label}</Text>
    </View>
  );
}
