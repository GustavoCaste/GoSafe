import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PinPicker } from '../components/PinPicker';
import { PlaceRow } from '../components/PlaceRow';
import { Avatar, Button, Card, Chip, Empty, Field, Screen, styles as ui } from '../components/ui';
import { appAlert } from '../components/AppDialog';
import { addPlace, geocodeAddress, logout, updateName } from '../data/actions';
import { apiUrl, syncCheckIns, syncFavorites, syncList, syncMe } from '../data/api';
import { userWeight } from '../data/repository';
import { currentUser, errorMessage, getDatabase, useDatabase } from '../data/store';
import { CATEGORY_LABEL, SEX_LABEL } from '../domain/labels';
import { distanceMeters } from '../domain/rules';
import type { LatLng, Place, PlaceCategory } from '../domain/types';
import { currentFix, useLastKnownPosition } from '../hooks/location';
import { useRemote } from '../hooks/useRemote';
import { PLACE_DETAILS_LOGIN, useRequireLogin } from '../hooks/useRequireLogin';
import { useSubmitOnce } from '../hooks/useSubmitOnce';
import type { RootStackParamList, ScreenProps, TabParamList } from '../navigation/types';
import { colors } from '../theme';

type TabProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

const CATEGORIES = Object.keys(CATEGORY_LABEL) as PlaceCategory[];

function withDistance(places: Place[], origin: LatLng | null) {
  return places.map((place) => ({ place, distance: origin ? distanceMeters(origin, place) : null }));
}

/** Lista estilo iFood: foto, nome, texto padrão e nota geral. */
export function PlacesScreen({ navigation }: TabProps<'Places'>) {
  const { db, version } = useDatabase();
  const position = useLastKnownPosition();
  const [sort, setSort] = useState<'distance' | 'rating' | 'name'>('distance');
  const requireLogin = useRequireLogin();
  const [onlyAlerts, setOnlyAlerts] = useState(false);
  const origin = position ?? db?.center ?? null;
  const remote = useRemote(() => syncList({ sort: sort === 'distance' ? 'DISTANCE' : sort === 'rating' ? 'RATING' : 'NAME', position: origin }), [sort, origin?.latitude, origin?.longitude]);

  const items = useMemo(() => {
    if (!db) return [];
    const list = withDistance(
      Object.values(db.places).filter((place) => place.active && (!onlyAlerts || place.notRecommended)),
      origin,
    );
    list.sort((a, b) =>
      sort === 'distance'
        ? (a.distance ?? 0) - (b.distance ?? 0)
        : sort === 'rating'
          ? (b.place.weightedRating ?? -1) - (a.place.weightedRating ?? -1)
          : a.place.name.localeCompare(b.place.name, 'pt-BR'),
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
                <Text style={ui.muted}>{position ? 'Perto de você' : 'Perto do centro do mapa'}</Text>
                <Text style={ui.title}>Locais</Text>
              </View>
              <Pressable accessibilityLabel={currentUser() ? 'Meus dados' : 'Entrar'} onPress={() => navigation.navigate(currentUser() ? 'Profile' : 'Login')}>
                <Avatar name={currentUser()?.name ?? '?'} size={46} />
              </Pressable>
            </View>
            <Pressable onPress={() => navigation.navigate('Search')} style={[ui.input, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}>
              <Ionicons name="search" size={20} color={colors.muted} />
              <Text style={ui.muted}>Buscar por nome, categoria, bairro ou cidade</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label="Mais próximos" selected={sort === 'distance'} onPress={() => setSort('distance')} />
              <Chip label="Melhor nota" selected={sort === 'rating'} onPress={() => setSort('rating')} />
              <Chip label="Nome (A–Z)" selected={sort === 'name'} onPress={() => setSort('name')} />
              <Chip label="Só com alerta" selected={onlyAlerts} onPress={() => setOnlyAlerts(!onlyAlerts)} />
            </View>
            {remote.error ? <Text style={{ color: colors.bad }}>{remote.error}</Text> : null}
          </View>
        }
        renderItem={({ item }) => (
          <PlaceRow place={item.place} distance={item.distance} onPress={() => { if (requireLogin(PLACE_DETAILS_LOGIN)) navigation.navigate('Place', { placeId: item.place.id }); }} />
        )}
        ListEmptyComponent={<Empty text={remote.loading ? 'Carregando locais…' : remote.error ?? 'Nenhum local encontrado.'} />}
      />
    </SafeAreaView>
  );
}

export function FavoritesScreen({ navigation }: TabProps<'Favorites'>) {
  const { db, version } = useDatabase();
  const position = useLastKnownPosition();
  const user = currentUser();
  const remote = useRemote(() => (user ? syncFavorites(position) : Promise.resolve()), [user?.id]);

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
        ListEmptyComponent={
          user ? (
            <Empty text={remote.loading ? 'Carregando favoritos…' : remote.error ?? 'Toque no coração de um local (no mapa ou na tela do local) para salvá-lo aqui.'} />
          ) : (
            <View style={{ gap: 12 }}>
              <Empty text="Entre na sua conta para salvar lugares e encontrá-los aqui." />
              <Button label="Entrar" onPress={() => navigation.navigate('Login')} />
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

export function SearchScreen({ navigation, route }: ScreenProps<'Search'>) {
  const { db, version } = useDatabase();
  const position = useLastKnownPosition();
  const [query, setQuery] = useState('');
  const [city, setCity] = useState('');
  const [remote, setRemote] = useState({ query: '', city: '' });
  useEffect(() => {
    const timer = setTimeout(() => setRemote({ query, city }), 350);
    return () => clearTimeout(timer);
  }, [query, city]);
  useRemote(() => {
    // a API busca categoria pelo código; o texto digitado é o rótulo em português
    const category = CATEGORIES.find((item) => CATEGORY_LABEL[item].toLowerCase() === remote.query.trim().toLowerCase());
    return syncList({ query: category ? undefined : remote.query, category, city: remote.city, sort: 'DISTANCE', position: position ?? db?.center });
  }, [remote.query, remote.city]);
  const pickForNotice = route.params?.mode === 'notice';
  const requireLogin = useRequireLogin();

  const results = useMemo(() => {
    if (!db) return [];
    const q = query.trim().toLowerCase();
    const c = city.trim().toLowerCase();
    const list = Object.values(db.places).filter(
      (place) =>
        place.active &&
        (!c || place.city.toLowerCase().includes(c)) &&
        (!q ||
          place.name.toLowerCase().includes(q) ||
          place.district.toLowerCase().includes(q) ||
          place.city.toLowerCase().includes(q) ||
          CATEGORY_LABEL[place.category].toLowerCase().includes(q)),
    );
    const withDist = withDistance(list, position ?? db.center);
    withDist.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));
    return withDist.slice(0, 60);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, query, city, position]);

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
      <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
        <TextInput accessibilityLabel="Filtrar por cidade" value={city} onChangeText={setCity} placeholder="Filtrar por cidade (opcional)" placeholderTextColor="#9A93A3" style={[ui.input, { minHeight: 46, paddingVertical: 0 }]} />
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
                : requireLogin(PLACE_DETAILS_LOGIN) && navigation.replace('Place', { placeId: item.place.id })
            }
          />
        )}
        ListFooterComponent={
          <Pressable
            onPress={() => {
              if (requireLogin('Para cadastrar um local, entre na sua conta.')) navigation.replace('CreatePlace', { point: position ?? undefined });
            }}
            style={{ marginTop: 6 }}
          >
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

/** Cadastro com endereço estruturado; o pino vem do endereço, do mapa ou da sua localização, e pode ser ajustado. */
export function CreatePlaceScreen({ navigation, route }: ScreenProps<'CreatePlace'>) {
  const position = useLastKnownPosition();
  const [point, setPoint] = useState<LatLng | null>(route.params?.point ?? position);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<PlaceCategory>('CAFE');
  const [description, setDescription] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [picking, setPicking] = useState(false);
  const [locating, setLocating] = useState(false);
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [once, sending] = useSubmitOnce();

  const useMyLocation = async () => {
    const fix = await currentFix().catch(() => null);
    if (fix) setPoint(fix);
    else appAlert('Localização indisponível', 'Permita o acesso à localização nas configurações do aparelho.');
  };

  const locateAddress = async () => {
    if (!street.trim() || !city.trim() || !state.trim()) {
      appAlert('Endereço incompleto', 'Preencha logradouro, cidade e UF para localizar no mapa.');
      return;
    }
    try {
      setLocating(true);
      setPoint(await geocodeAddress({ street, number, district, city, state, postalCode }));
      setPicking(true);
    } catch (error) {
      appAlert('Endereço não localizado', errorMessage(error));
    } finally {
      setLocating(false);
    }
  };

  const submit = () =>
    once(async () => {
      if (!point) {
        appAlert('Defina o local', 'Localize o endereço, ajuste o pino no mapa ou use sua localização.');
        return false;
      }
      try {
        const place = await addPlace({ name, category, description, postalCode, street, number, complement, district, city, state }, point);
        navigation.replace('Place', { placeId: place.id });
        return true;
      } catch (error) {
        appAlert('Não foi possível cadastrar', errorMessage(error));
        return false;
      }
    });

  return (
    <Screen title="Cadastrar local" footer={<Button label="Cadastrar local" loading={sending} onPress={submit} />}>
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
          <Field label="Número" value={number} onChangeText={setNumber} autoCapitalize="characters" maxLength={20} placeholder="123 ou S/N" />
        </View>
        <View style={{ flex: 2, minWidth: 160 }}>
          <Field label="Bairro" value={district} onChangeText={setDistrict} />
        </View>
      </View>
      <Field label="Complemento" value={complement} onChangeText={setComplement} maxLength={60} placeholder="Opcional: loja, bloco, andar" />
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
            ? `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`
            : 'Nenhum ponto definido.'}
        </Text>
        <Button label="Localizar pelo endereço" variant="secondary" icon="search" loading={locating} onPress={locateAddress} />
        <Button label="Ajustar pino no mapa" variant="secondary" icon="location" onPress={() => setPicking(true)} />
        <Button label="Usar minha localização" variant="secondary" icon="locate" onPress={useMyLocation} />
      </Card>
      <PinPicker
        visible={picking}
        start={point ?? getDatabase().center}
        onClose={() => setPicking(false)}
        onConfirm={(next) => {
          setPoint(next);
          setPicking(false);
        }}
      />
    </Screen>
  );
}

export function ProfileScreen({ navigation }: ScreenProps<'Profile'>) {
  const { db, version } = useDatabase();
  const sessionUser = currentUser();
  const [name, setName] = useState(sessionUser?.name ?? '');
  useRemote(() => Promise.all([syncMe(), syncFavorites(), syncCheckIns()]), []);

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

  return (
    <Screen title="Meus dados">
      <View style={{ alignItems: 'center', gap: 6 }}>
        <Avatar name={user.name} size={88} />
        <Text style={{ fontSize: 22, fontWeight: '700' }}>{user.name}</Text>
        <Text style={ui.muted}>@{user.username} · {user.email}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
              ['Contribuições', user.validContributions],
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
          {user.validContributions} contribuições válidas. Perfis novos começam com peso 0,2, e o peso cresce com o tempo de conta e as contribuições.
        </Text>
      </Card>
      <Card style={{ gap: 4 }}>
        <Text style={{ fontWeight: '700' }}>Verificação facial</Text>
        <Text style={ui.muted}>Esta funcionalidade estará em modo funcional em versões futuras.</Text>
      </Card>
      <Card style={{ gap: 10 }}>
        <Field label="Nome" value={name} onChangeText={setName} />
        <Text style={ui.muted}>Sexo: {SEX_LABEL[user.sex]}</Text>
        <Button
          label="Salvar nome"
          variant="secondary"
          onPress={() => {
            if (name.trim().length < 3) return appAlert('Nome inválido', 'Use pelo menos 3 caracteres.');
            updateName(name)
              .then(() => appAlert('Pronto', 'Nome atualizado.'))
              .catch((error) => appAlert('Não foi possível salvar', errorMessage(error)));
          }}
        />
      </Card>
      <Button
        label="Sair do aplicativo"
        variant="danger"
        icon="log-out"
        onPress={() => logout()}
      />
      <Button label="Por que usar o GoSafe" variant="ghost" icon="sparkles" onPress={() => navigation.navigate('Benefits')} />
      <Button label="Termos de uso" variant="ghost" onPress={() => navigation.navigate('Legal', { document: 'terms' })} />
      <Button label="Política de privacidade" variant="ghost" onPress={() => navigation.navigate('Legal', { document: 'privacy' })} />
      <Text style={[ui.muted, { textAlign: 'center', fontSize: 12 }]}>Conectado a {apiUrl()}</Text>
    </Screen>
  );
}
