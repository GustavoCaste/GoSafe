import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { currentUser, hasDatabase, loadDatabase, useDatabase } from './src/data/store';
import type { RootStackParamList, TabParamList } from './src/navigation/types';
import { BenefitsScreen, LoginScreen, PermissionScreen, RegisterScreen, VerificationScreen, WelcomeScreen } from './src/screens/AuthScreens';
import { CreatePlaceScreen, FavoritesScreen, PlacesScreen, ProfileScreen, SearchScreen } from './src/screens/ListScreens';
import { MapScreen } from './src/screens/MapScreen';
import { CommentScreen, NewNoticeScreen, NoticeScreen, PlaceScreen } from './src/screens/PlaceScreens';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tabs = createBottomTabNavigator<TabParamList>();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: colors.background, primary: colors.primary } };

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
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
    loadDatabase().finally(() => setLoaded(true));
  }, []);

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDark }}>
        <ActivityIndicator color={colors.coral} size="large" />
      </View>
    );
  }

  const seeded = hasDatabase();
  const signedIn = seeded && currentUser() !== null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer theme={theme}>
        <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          {!seeded ? (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Benefits" component={BenefitsScreen} />
              <Stack.Screen name="Permission" component={PermissionScreen} />
            </>
          ) : !signedIn ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
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
              <Stack.Screen name="Verification" component={VerificationScreen} />
              <Stack.Screen name="Benefits" component={BenefitsScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
