import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import HouseSelectionScreen from '../screens/house/HouseSelectionScreen';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Cadastrar" component={RegisterScreen} />
      <Stack.Screen name="Recuperar Senha" component={ForgotPasswordScreen} />
      <Stack.Screen 
        name="HouseSelection" 
        component={HouseSelectionScreen}
        options={{
          headerTitle: 'Selecionar Residência',
          headerLeft: () => null, 
        }}
      />
    </Stack.Navigator>
  );
}