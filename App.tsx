import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider as PaperProvider } from 'react-native-paper';
import { auth, db, storage } from './src/config/firebase';
import * as Notifications from 'expo-notifications';
import AuthNavigator from './src/navigation/AuthNavigator';
import MainNavigator from './src/navigation/MainNavigator';
import { registerForPushNotificationsAsync } from './src/services/notifications';
import { AuthProvider } from './src/contexts/AuthContext';
import { HouseProvider } from './src/contexts/HouseContext';

const Stack = createNativeStackNavigator();

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data.taskId) {
        // Navegar para a tarefa específica
      } else if (data.postId) {
        // Navegar para o post específico
      }
    });

    return () => subscription.remove();
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        <HouseProvider>
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Auth" component={AuthNavigator} />
              <Stack.Screen name="Main" component={MainNavigator} />
            </Stack.Navigator>
          </NavigationContainer>
        </HouseProvider>
      </AuthProvider>
    </PaperProvider>
  );
}