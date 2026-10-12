import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PlaceRow } from '../components/PlaceRow';
import { Avatar, Button, Card, Chip, Empty, Field, Screen, styles as ui } from '../components/ui';
import { createPlace, userWeight } from '../data/repository';
import { currentUser, errorMessage, mutate, requireUser, resetDatabase, useDatabase } from '../data/store';
import { CATEGORY_LABEL, SEX_LABEL } from '../domain/labels';
import { distanceMeters } from '../domain/rules';
import type { LatLng, Place, PlaceCategory } from '../domain/types';
import { currentFix, useLastKnownPosition } from '../hooks/location';
import type { RootStackParamList, ScreenProps, TabParamList } from '../navigation/types';
import { colors } from '../theme';

type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

function withDistance(places: Place[], origin: LatLng | null) {
  return places.map((place) => ({ place, distance: origin ? distanceMeters(origin, place) : null }));
}

/** Lista estilo iFood: foto, nome, texto padrão e nota geral. */
export function PlacesScreen({ navigation }: TabProps<'Places'>) {
  const { db, version } = useDatabase();
  const position = useLastKnownPosition();
  const [sort, setSort] = useState<'distance' | 'rating'>('distance');
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const origin = position ?? db?.center ?? null;

  const items = useMemo(() => {
    if (!db) return [];
    const list = withDistance(
      Object.values(db.places).filter((place) => place.active && (!onlyAlerts || place.notRecommended)),
      origin,
    );
    list.sort((a, b) =>
      sort === 'distance'
        ? (a.distance ?? 0) - (b.distance ?? 0)
        : (b.place.weightedRating ?? -1) - (a.place.weightedRating ?? -1),
    );
    return list.slice(0, 150);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, sort, onlyAlerts, origin?.latitude, origin?.longitude]);

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.place.id}
        contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 24 }}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={ui.muted}>{position ? 'Perto de você' : 'Perto do centro de teste'}</Text>
                <Text style={ui.title}>Locais</Text>
              </View>
              <Pressable accessibilityLabel="Meus dados" onPress={() => navigation.navigate('Profile')}>
                <Avatar name={currentUser()?.name ?? '?'} size={46} />
              </Pressable>
            </View>
            <Pressable onPress={() => navigation.navigate('Search')} style={[ui.input, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <Ionicons name="search" size={20} color={colors.muted} />
              <Text style={ui.muted}>Buscar por nome, categoria ou bairro</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Mais próximos" selected={sort === 'distance'} onPress={() => setSort('distance')} />
              <Chip label="Melhor nota" selected={sort === 'rating'} onPress={() => setSort('rating')} />
              <Chip label="Só com alerta" selected={onlyAlerts} onPress={() => setOnlyAlerts(!onlyAlerts)} />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <PlaceRow place={item.place} distance={item.distance} onPress={() => navigation.navigate('Place', { placeId: item.place.id })} />
        )}
        ListEmptyComponent={<Empty text="Nenhum local encontrado." />}
      />
    </SafeAreaView>
  );
}

export function FavoritesScreen({ navigation }: TabProps<'Favorites'>) {
  const { db, version } = useDatabase();
  const position = useLastKnownPosition();
  const user = currentUser();

  const items = useMemo(() => {
    if (!db || !user) return [];
    const places = Object.values(db.favorites)
      .filter((favorite) => favorite.userId === user.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((favorite) => db.places[favorite.placeId])
      .filter((place): place is Place => Boolean(place?.active));
    return withDistance(places, position);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, user?.id, position]);

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.place.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 6 }}>
            <Text style={ui.title}>Favoritos</Text>
            <Text style={ui.muted}>{items.length} lugares que você salvou</Text>
          </View>
        }
        renderItem={({ item }) => (
          <PlaceRow place={item.place} distance={item.distance} onPress={() => navigation.navigate('Place', { placeId: item.place.id })} />
        )}
        ListEmptyComponent={<Empty text="Toque no coração de um local (no mapa ou na tela do local) para salvá-lo aqui." />}
      />
    </SafeAreaView>
  );
}

export function SearchScreen({ navigation, route }: ScreenProps<'Search'>) {
  const { db, version } = useDatabase();
  const position = useLastKnownPosition();
  const [query, setQuery] = useState('');
  const pickForNotice = route.params?.mode === 'notice';

  const results = useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    const list = Object.values(db.places).filter(
      (place) =>
        place.active &&
        (!q ||
          place.name.toLowerCase().includes(q) ||
          place.district.toLowerCase().includes(q) ||
          CATEGORY_LABEL[place.category].toLowerCase().includes(q)),
    );
    const withDist = withDistance(list, position ?? db.center);
    withDist.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    return withDist.slice(0, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, query, position]);

  return (
    <SafeAreaView style={ui.screen} edges={['top', 'bottom']}>
      <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8, alignItems: 'center' }}>
        <Pressable accessibilityLabel="Voltar" onPress={() => navigation.goBack()} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <View style={[ui.input, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderColor: colors.primary, borderWidth: 2, paddingVertical: 0 }]}>
          <Ionicons name="search" size={20} color={colors.muted} />
          <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="Nome, categoria ou bairro" placeholderTextColor="#9A93A3" style={{ flex: 1, fontSize: 16, color: colors.ink, minHeight: 46 }} />
        </View>
      </View>
      {pickForNotice ? (
        <Text style={[ui.muted, { paddingHorizontal: 16, paddingBottom: 8 }]}>Escolha o local do novo aviso (comentários sempre pertencem a um local).</Text>
      ) : null}
      <FlatList
        data={results}
        keyExtractor={(item) => item.place.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: 16, paddingTop: 4, gap: 10 }}
        renderItem={({ item }) => (
          <PlaceRow
            place={item.place}
            distance={item.distance}
            onPress={() =>
              pickForNotice
                ? navigation.replace('NewNotice', { placeId: item.place.id })
                : navigation.replace('Place', { placeId: item.place.id })
            }
          />
        )}
        ListFooterComponent={
          <Pressable onPress={() => navigation.replace('CreatePlace', { point: position ?? undefined })} style={{ marginTop: 6 }}>
            <Card style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Ionicons name="add-circle" size={32} color={colors.primary} />
              <View>
                <Text style={{ fontWeight: '700' }}>Não encontrou?</Text>
                <Text style={ui.muted}>Cadastre o local no GoSafe</Text>
              </View>
            </Card>
          </Pressable>
        }
      />
    </SafeAreaView>
  );
}

const CATEGORIES = Object.keys(CATEGORY_LABEL) as PlaceCategory[];

/** Cadastro com endereço estruturado; o pino é o centro do mapa ou a sua localização. */
export function CreatePlaceScreen({ navigation, route }: ScreenProps<'CreatePlace'>) {
  const position = useLastKnownPosition();
  const [point, setPoint] = useState<LatLng | null>(route.params?.point ?? position);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('CAFE');
  const [description, setDescription] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');

  const useMyLocation = async () => {
    const fix = await currentFix().catch(() => null);
    if (fix) setPoint(fix);
    else Alert.alert('Localização indisponível', 'Permita o acesso à localização nas configurações do aparelho.');
  };

  const submit = () => {
    if (!point) {
      Alert.alert('Defina o local', 'Use sua localização ou abra o cadastro a partir do mapa.');
      return;
    }
    try {
      const place = mutate((db) =>
        createPlace(db, requireUser(), { name, category, description, postalCode, street, number, district, city, state }, point),
      );
      navigation.replace('Place', { placeId: place.id });
    } catch (error) {
      Alert.alert('Não foi possível cadastrar', errorMessage(error));
    }
  };

  return (
    <Screen title="Cadastrar local" footer={<Button label="Cadastrar local" onPress={submit} />}>
      <Field label="Nome do local" value={name} onChangeText={setName} placeholder="Ex.: Café Aurora" />
      <Text style={ui.label}>Categoria</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CATEGORIES.map((item) => (
          <Chip key={item} label={CATEGORY_LABEL[item]} selected={category === item} onPress={() => setCategory(item)} />
        ))}
      </View>
      <Field label="CEP" value={postalCode} onChangeText={setPostalCode} keyboardType="number-pad" placeholder="00000-000" />
      <Field label="Logradouro" value={street} onChangeText={setStreet} />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ flex: 1, minWidth: 100 }}>
          <Field label="Número" value={number} onChangeText={setNumber} keyboardType="number-pad" />
        </View>
        <View style={{ flex: 2, minWidth: 160 }}>
          <Field label="Bairro" value={district} onChangeText={setDistrict} />
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <View style={{ flex: 3, minWidth: 160 }}>
          <Field label="Cidade" value={city} onChangeText={setCity} />
        </View>
        <View style={{ flex: 1, minWidth: 80 }}>
          <Field label="UF" value={state} onChangeText={setState} autoCapitalize="characters" maxLength={2} />
        </View>
      </View>
      <Field label="Descrição curta" value={description} onChangeText={setDescription} multiline placeholder="Texto que aparece na lista de locais" />
      <Card style={{ gap: 8 }}>
        <Text style={{ fontWeight: '700' }}>Posição no mapa</Text>
        <Text style={ui.muted}>
          {point
            ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)} — na versão de teste o endereço não é geocodificado; vale este ponto.`
            : 'Nenhum ponto definido.'}
        </Text>
        <Button label="Usar minha localização" variant="secondary" icon="locate" onPress={useMyLocation} />
      </Card>
    </Screen>
  );
}

export function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const { db, version } = useDatabase();
  const sessionUser = currentUser();
  const [name, setName] = useState(sessionUser?.name ?? '');

  const counts = useMemo(() => {
    if (!db || !sessionUser) return { notices: 0, comments: 0, favorites: 0, checkIns: 0 };
    const user = sessionUser;
    return {
      notices: Object.values(db.notices).filter((notice) => notice.authorId === user.id && notice.status === 'ACTIVE').length,
      comments: Object.values(db.comments).filter((comment) => comment.authorId === user.id && !comment.initial && comment.status === 'ACTIVE').length,
      favorites: Object.values(db.favorites).filter((favorite) => favorite.userId === user.id).length,
      checkIns: Object.values(db.checkIns).filter((checkIn) => checkIn.userId === user.id).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, sessionUser?.id]);

  // Depois de "Sair" a tela ainda pode renderizar uma vez antes de ser desmontada
  if (!sessionUser) return null;
  const user = sessionUser;
  const weight = userWeight(user);

  const reset = () =>
    Alert.alert('Recriar dados de teste?', 'Apaga tudo deste aparelho (locais, usuárias, comentários) e volta ao primeiro acesso.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Apagar e recriar', style: 'destructive', onPress: () => resetDatabase() },
    ]);

  return (
    <Screen title="Meus dados">
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Avatar name={user.name} size={88} />
        <Text style={{ fontSize: 22, fontWeight: '700' }}>{user.name}</Text>
        <Text style={ui.muted}>@{user.username} · {user.email}</Text>
        <Text style={{ fontWeight: '700', color: user.verified ? colors.good : colors.muted }}>
          {user.verified ? 'Identidade verificada' : 'Identidade não verificada'}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          ['Avisos', counts.notices],
          ['Comentários', counts.comments],
          ['Favoritos', counts.favorites],
          ['Check-ins', counts.checkIns],
        ].map(([label, value]) => (
          <Card key={label} style={{ flex: 1, alignItems: 'center', paddingHorizontal: 4 }}>
            <Text style={{ fontSize: 20, fontWeight: '800' }}>{value}</Text>
            <Text style={{ fontSize: 12, color: colors.muted }} numberOfLines={1} adjustsFontSizeToFit>
              {label}
            </Text>
          </Card>
        ))}
      </View>
      <Card style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: '700' }}>Confiabilidade do perfil</Text>
          <Text style={{ fontWeight: '700', color: colors.primary }}>Peso {weight.toFixed(2).replace('.', ',')}</Text>
        </View>
        <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.lineSoft }}>
          <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.primary, width: `${weight * 100}%` }} />
        </View>
        <Text style={ui.muted}>
          {user.validContributions} contribuições válidas{user.verified ? ' · verificada' : ''}. Perfis novos começam com peso 0,2 e sobem até 1,0 com tempo de conta, contribuições e verificação.
        </Text>
        {!user.verified ? <Button label="Verificar identidade (opcional)" variant="secondary" icon="shield-checkmark" onPress={() => navigation.navigate('Verification')} /> : null}
      </Card>
      <Card style={{ gap: 10 }}>
        <Field label="Nome" value={name} onChangeText={setName} />
        <Text style={ui.muted}>Sexo: {SEX_LABEL[user.sex]}</Text>
        <Button
          label="Salvar nome"
          variant="secondary"
          onPress={() => {
            if (name.trim().length < 3) return Alert.alert('Nome inválido', 'Use pelo menos 3 caracteres.');
            mutate((database) => {
              database.users[user.id].name = name.trim();
            });
            Alert.alert('Pronto', 'Nome atualizado.');
          }}
        />
      </Card>
      <Button
        label="Sair do aplicativo"
        variant="danger"
        icon="log-out"
        onPress={() =>
          mutate((database) => {
            database.sessionUserId = null;
          })
        }
      />
      <Button label="Recriar dados de teste" variant="ghost" icon="refresh" onPress={reset} />
      <Text style={[ui.muted, { textAlign: 'center', fontSize: 12 }]}>
        {db ? `${Object.keys(db.places).length} locais · ${Object.keys(db.users).length} usuárias · ${Object.keys(db.reviews).length} avaliações no aparelho` : ''}
      </Text>
    </Screen>
  );
}
