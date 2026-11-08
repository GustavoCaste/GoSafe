import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { DialogHost } from './src/components/AppDialog';
import { currentUser, getDatabase, hasDatabase, loadDatabase, useDatabase } from './src/data/store';
import type { RootStackParamList, TabParamList } from './src/navigation/types';
import { BenefitsScreen, LoginScreen, PermissionScreen, RegisterScreen, WelcomeScreen } from './src/screens/AuthScreens';
import { LegalScreen } from './src/screens/LegalScreens';
import { CreatePlaceScreen, FavoritesScreen, PlacesScreen, ProfileScreen, SearchScreen } from './src/screens/ListScreens';
import { MapScreen } from './src/screens/MapScreen';
import { CommentScreen, NewNoticeScreen, NoticeScreen, PlaceScreen, ReportScreen } from './src/screens/PlaceScreens';
import { colors } from './src/theme';

// a abertura com a marca fica na tela até o banco local terminar de carregar
SplashScreen.preventAutoHideAsync().catch(() => undefined);

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary } };

/**
 * Faixa sólida no roxo dos botões do app (Todos, +) atrás dos botões do Android (voltar/início/recentes).
 * Com o app em tela cheia (edge-to-edge) a barra é transparente e alguns
 * aparelhos (ex.: Xiaomi/MIUI) ignoram o estilo pedido, deixando ícones
 * claros sobre fundo claro. Fundo escuro + ícones claros fica legível sempre.
 */
function SystemNavigationStrip() {
  const insets = useSafeAreaInsets();
  if (insets.bottom === 0) return null;
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: insets.bottom, backgroundColor: colors.primary }}
    />
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        // Faixa levemente tingida atrás dos botões do Android, para eles não sumirem no branco
        tabBarIcon: ({ color, size, focused }) => {
          const icons = { Map: 'map', Places: 'list', Favorites: 'heart' } as const;
          const name = icons[route.name];
          return <Ionicons name={focused ? name : (`${name}-outline` as const)} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Map" component={MapScreen} options={{ title: 'Mapa' }} />
      <Tabs.Screen name="Places" component={PlacesScreen} options={{ title: 'Locais' }} />
      <Tabs.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Favoritos' }} />
    </Tabs.Navigator>
  );
}

export default function App() {
  const [loaded, setLoaded] = useState(false);
  useDatabase();

  useEffect(() => {
    // ícones claros sobre a faixa roxa de SystemNavigationStrip
    NavigationBar.setStyle('light');
    loadDatabase().finally(() => {
      setLoaded(true);
      SplashScreen.hideAsync().catch(() => undefined);
    });
  }, []);

  if (!loaded) return null;

  const started = hasDatabase();
  const signedIn = started && currentUser() !== null;
  const guest = started && !signedIn && getDatabase().guest === true;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer theme={theme}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          {!started ? (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Benefits" component={BenefitsScreen} />
              <Stack.Screen name="Permission" component={PermissionScreen} />
            </>
          ) : !signedIn && !guest ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Legal" component={LegalScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="Tabs" component={MainTabs} />
              <Stack.Screen name="Place" component={PlaceScreen} />
              <Stack.Screen name="Notice" component={NoticeScreen} />
              <Stack.Screen name="NewNotice" component={NewNoticeScreen} />
              <Stack.Screen name="Comment" component={CommentScreen} />
              <Stack.Screen name="Search" component={SearchScreen} />
              <Stack.Screen name="CreatePlace" component={CreatePlaceScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="Report" component={ReportScreen} />
              <Stack.Screen name="Legal" component={LegalScreen} />
              <Stack.Screen name="Benefits" component={BenefitsScreen} />
              {/* a chave nova tira da pilha o Login de onde a visitante saiu, senão a tela não muda */}
              {guest ? (
                <>
                  <Stack.Screen name="Login" navigationKey="guest" component={LoginScreen} />
                  <Stack.Screen name="Register" navigationKey="guest" component={RegisterScreen} />
                </>
              ) : null}
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
      <SystemNavigationStrip />
      <DialogHost />
    </SafeAreaProvider>
  );
}
