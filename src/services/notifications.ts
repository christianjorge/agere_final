import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  }

  return token;
};

export const scheduleTaskNotification = async (task) => {
  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
  if (notificationsEnabled === 'false') return;

  const trigger = new Date(task.dueDate);
  trigger.setHours(trigger.getHours() - 2); // Notificar 2 horas antes

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Lembrete de Tarefa',
      body: `A tarefa "${task.title}" vence em 2 horas!`,
      data: { taskId: task.id },
    },
    trigger,
  });
};

export const scheduleNewPostNotification = async (post) => {
  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
  if (notificationsEnabled === 'false') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nova Postagem',
      body: `${post.authorEmail} fez uma nova postagem: "${post.title}"`,
      data: { postId: post.id },
    },
    trigger: null, // Enviar imediatamente
  });
};

export const scheduleNewMemberNotification = async (member) => {
  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
  if (notificationsEnabled === 'false') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Novo Membro',
      body: `${member.email} entrou na casa!`,
      data: { memberId: member.id },
    },
    trigger: null,
  });
};