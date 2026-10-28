import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screens/HomeScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { RegisterSuccessScreen } from '../screens/RegisterSuccessScreen';
import { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: true, title: 'Cadastro' }} />
        <Stack.Screen name="RegisterSuccess" component={RegisterSuccessScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
