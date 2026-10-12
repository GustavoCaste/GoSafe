import { Ionicons } from '@expo/vector-icons';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { PlaceThumb } from '../components/PlaceRow';
import { AlertBanner, Avatar, Button, RatingBadge, styles as ui } from '../components/ui';
import { generateForBounds, generationLimitReached } from '../data/generator';
import { applyWaterCheck, isFavorite, toggleFavorite } from '../data/repository';
import { commitChanges, currentUser, getDatabase, mutate, useDatabase } from '../data/store';
import { CATEGORY_LABEL } from '../domain/labels';
import { distanceMeters, formatDistance, formatRating, insideBounds, ratingTone } from '../domain/rules';
import type { Bounds, LatLng, Place, PlaceCategory } from '../domain/types';
import { currentFix, useLastKnownPosition } from '../hooks/location';
import { mapHtml } from '../map/mapHtml';
import type { RootStackParamList, TabParamList } from '../navigation/types';
import { colors, radius, toneColor } from '../theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Map'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface View_ {
  bounds: Bounds;
  zoom: number;
  center: LatLng;
}

const MIN_ZOOM_FOR_PLACES = 13;
const MAX_PINS = 400;
const FILTERS: (PlaceCategory | null)[] = [null, 'CAFE', 'BAR', 'RESTAURANT', 'TRANSPORT', 'PARK', 'SHOP', 'SERVICE', 'GYM'];

export function MapScreen({ navigation }: Props) {
  const { db, version } = useDatabase();
  const insets = useSafeAreaInsets();
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(false);
  const [view, setView] = useState<View_ | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [category, setCategory] = useState<PlaceCategory | null>(null);
  const [menu, setMenu] = useState<'none' | 'plus' | 'user'>('none');
  const [sheetHeight, setSheetHeight] = useState(0);
  const position = useLastKnownPosition();
  const user = currentUser();

  const html = useMemo(() => mapHtml(getDatabase().center, 14), []);
  const inject = (script: string) => webRef.current?.injectJavaScript(`${script};true;`);

  const visible = useMemo(() => {
    if (!db || !view) return [] as Place[];
    return Object.values(db.places)
      .filter((place) => place.active && insideBounds(place, view.bounds) && (!category || place.category === category))
      .slice(0, MAX_PINS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, version, view, category]);

  useEffect(() => {
    if (!ready) return;
    // locais ainda não conferidos não viram pin até o mapa confirmar que não estão na água
    const unchecked = visible.filter((place) => !place.landChecked);
    if (unchecked.length > 0 && !offline) {
      const points = unchecked.map((place) => ({ id: place.id, lat: place.latitude, lng: place.longitude }));
      inject(`window.gosafe && window.gosafe.checkWater(${JSON.stringify(points)})`);
    }
    const pins = visible.filter((place) => place.landChecked || offline).map((place) => ({
      id: place.id,
      lat: place.latitude,
      lng: place.longitude,
      label: formatRating(place.weightedRating),
      color: place.notRecommended ? colors.bad : toneColor[ratingTone(place.weightedRating)],
      alert: place.notRecommended,
    }));
    inject(`window.gosafe && window.gosafe.setPins(${JSON.stringify(pins)})`);
  }, [ready, visible]);

  useEffect(() => {
    if (ready) inject(`window.gosafe && window.gosafe.select(${JSON.stringify(selectedId)})`);
  }, [ready, selectedId]);

  useEffect(() => {
    if (ready && position) inject(`window.gosafe && window.gosafe.setUser(${position.latitude}, ${position.longitude})`);
  }, [ready, position]);

  const onMessage = (event: WebViewMessageEvent) => {
    const message = JSON.parse(event.nativeEvent.data);

    switch (message.type) {
      case 'ready':
        setReady(true);
        break;
      case 'offline':
        setOffline(true);
        break;
      case 'select':
        setSelectedId(message.id);
        break;
      case 'mapclick':
        setSelectedId(null);
        break;
      case 'water':
        if (message.results.length > 0) mutate((database) => applyWaterCheck(database, message.results));
        break;
      case 'bounds': {
        const bounds: Bounds = { west: message.west, south: message.south, east: message.east, north: message.north };
        // Locais ilustrativos surgem nas áreas novas conforme o mapa se move
        if (generateForBounds(getDatabase(), bounds, message.zoom) > 0) commitChanges();
        setView({ bounds, zoom: message.zoom, center: message.center });
        break;
      }
    }
  };

  const centerOnMe = async () => {
    const fix = position ?? (await currentFix().catch(() => null));
    if (fix) inject(`window.gosafe && window.gosafe.flyTo(${fix.latitude}, ${fix.longitude}, 15)`);
  };

  const selected = selectedId && db ? db.places[selectedId] : null;
  const zoomedOut = view !== null && view.zoom < MIN_ZOOM_FOR_PLACES;

  return (
    <View style={{ flex: 1, backgroundColor: colors.map }}>
      <WebView
        ref={webRef}
        source={{ html, baseUrl: 'https://gosafe.app/' }}
        originWhitelist={['*']}
        onMessage={onMessage}
        style={{ flex: 1, backgroundColor: colors.map }}
        setSupportMultipleWindows={false}
      />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={styles.searchRow}>
          <Pressable accessibilityRole="search" onPress={() => navigation.navigate('Search')} style={styles.search}>
            <Ionicons name="search" size={20} color={colors.muted} />
            <Text style={{ color: colors.muted, fontSize: 16, flex: 1 }} numberOfLines={1}>
              Para onde você vai?
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Menu da usuária" onPress={() => setMenu('user')} style={styles.avatarButton}>
            <Avatar name={user?.name ?? '?'} size={46} />
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }} style={{ marginHorizontal: -16, flexGrow: 0 }}>
          {FILTERS.map((item) => (
            <Pressable
              key={item ?? 'all'}
              onPress={() => setCategory(item)}
              style={[styles.filter, category === item && { backgroundColor: colors.primary }]}
            >
              <Text style={{ fontWeight: '600', color: category === item ? '#FFF' : colors.ink }}>{item ? CATEGORY_LABEL[item] : 'Todos'}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {view ? (
          <View style={styles.pill}>
            <Text style={styles.pillText}>
              {offline
                ? 'Sem internet para o mapa'
                : zoomedOut
                  ? 'Aproxime o mapa para ver e gerar locais'
                  : `${visible.length} locais nesta área${db && generationLimitReached(db) ? ' · limite de locais de teste atingido' : ''}`}
            </Text>
          </View>
        ) : null}
      </View>

      {/* com o cartão do local aberto, os botões sobem para não ficarem atrás dele */}
      <View style={[styles.fabColumn, selected && sheetHeight > 0 && { bottom: sheetHeight + 24 }]} pointerEvents="box-none">
        <Pressable accessibilityRole="button" accessibilityLabel="Centralizar na minha localização" onPress={centerOnMe} style={styles.locate}>
          <Ionicons name="locate" size={24} color="#2F6FDB" />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Mais ações" onPress={() => setMenu('plus')} style={styles.fab}>
          <Ionicons name="add" size={32} color="#FFF" />
        </Pressable>
      </View>

      {selected ? (
        <View style={styles.sheet} onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <PlaceThumb place={selected} size={60} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: 19, fontWeight: '700', color: colors.ink }} numberOfLines={1}>
                {selected.name}
              </Text>
              <Text style={ui.muted} numberOfLines={1}>
                {[CATEGORY_LABEL[selected.category], position ? formatDistance(distanceMeters(position, selected)) : null, selected.district]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <RatingBadge rating={selected.weightedRating} />
                <Text style={ui.muted}>{selected.ratingCount} avaliações</Text>
              </View>
            </View>
            {user ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={db && isFavorite(db, user.id, selected.id) ? 'Remover dos favoritos' : 'Favoritar'}
                onPress={() => mutate((database) => toggleFavorite(database, user.id, selected.id))}
                style={styles.heart}
              >
                <Ionicons name={db && isFavorite(db, user.id, selected.id) ? 'heart' : 'heart-outline'} size={24} color="#C2410C" />
              </Pressable>
            ) : null}
          </View>
          {selected.notRecommended ? <AlertBanner /> : null}
          <Button label="Ver local e avisos" onPress={() => navigation.navigate('Place', { placeId: selected.id })} />
        </View>
      ) : null}

      <Modal visible={menu !== 'none'} transparent animationType="fade" onRequestClose={() => setMenu('none')}>
        <Pressable style={styles.backdrop} onPress={() => setMenu('none')} accessibilityLabel="Fechar menu" />
        {menu === 'plus' ? (
          <View style={[styles.menu, { bottom: insets.bottom + 24 }]}>
            <MenuItem icon="location" title="Cadastrar local" subtitle="Marca no centro do mapa que você está vendo" onPress={() => { setMenu('none'); navigation.navigate('CreatePlace', { point: view?.center }); }} />
            <MenuItem icon="search" title="Buscar local" subtitle="Por nome, categoria ou bairro" onPress={() => { setMenu('none'); navigation.navigate('Search'); }} />
            <MenuItem icon="megaphone" title="Novo aviso" subtitle="Primeiro escolha o local" onPress={() => { setMenu('none'); navigation.navigate('Search', { mode: 'notice' }); }} />
          </View>
        ) : null}
        {menu === 'user' && user ? (
          <View style={[styles.menu, { top: insets.top + 70 }]}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', padding: 8 }}>
              <Avatar name={user.name} size={48} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 16, color: colors.ink }}>{user.name}</Text>
                <Text style={ui.muted}>@{user.username}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: user.verified ? colors.good : colors.muted, marginTop: 2 }}>
                  {user.verified ? 'Identidade verificada' : 'Não verificada'}
                </Text>
              </View>
            </View>
            <MenuItem icon="person" title="Meus dados" onPress={() => { setMenu('none'); navigation.navigate('Profile'); }} />
            <MenuItem
              icon="log-out"
              title="Sair do aplicativo"
              danger
              onPress={() => {
                setMenu('none');
                mutate((database) => {
                  database.sessionUserId = null;
                });
              }}
            />
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

function MenuItem({ icon, title, subtitle, danger, onPress }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle?: string; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: colors.background }]}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={22} color={danger ? colors.bad : colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: danger ? colors.bad : colors.ink }}>{title}</Text>
        {subtitle ? <Text style={{ fontSize: 13, color: colors.muted }}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const shadow = { shadowColor: '#1D1726', shadowOpacity: 0.18, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6 };

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: 16, gap: 10 },
  searchRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  search: { flex: 1, minHeight: 52, borderRadius: 26, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, ...shadow },
  avatarButton: { borderRadius: 26, borderWidth: 3, borderColor: '#FFF', ...shadow },
  filter: { minHeight: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: colors.surface, justifyContent: 'center', ...shadow, elevation: 3 },
  pill: { alignSelf: 'center', backgroundColor: 'rgba(29,23,38,0.82)', borderRadius: 15, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  fabColumn: { position: 'absolute', right: 16, bottom: 44, gap: 12, alignItems: 'center' },
  locate: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', ...shadow },
  fab: { width: 62, height: 62, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', ...shadow },
  sheet: { position: 'absolute', left: 12, right: 12, bottom: 12, backgroundColor: colors.surface, borderRadius: radius.xl, padding: 16, gap: 12, maxWidth: 560, alignSelf: 'center', ...shadow },
  heart: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(29,23,38,0.5)' },
  menu: { position: 'absolute', right: 16, left: 16, maxWidth: 360, alignSelf: 'flex-end', marginLeft: 'auto', backgroundColor: colors.surface, borderRadius: radius.xl, padding: 8, ...shadow },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, padding: 10, borderRadius: radius.md },
  menuIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
});
