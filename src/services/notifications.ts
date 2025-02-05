import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const getCurrentHouseId = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const memberQuery = query(
    collection(db, 'houseMembers'),
    where('userId', '==', user.uid)
  );
  const memberSnapshot = await getDocs(memberQuery);
  if (memberSnapshot.empty) {
    throw new Error('Usuário não pertence a nenhuma casa');
  }
  return memberSnapshot.docs[0].data().houseId;
};

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

  const houseId = await getCurrentHouseId();

  const trigger = new Date(task.dueDate);
  trigger.setHours(trigger.getHours() - 2);

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Lembrete de Tarefa',
      body: `A tarefa "${task.title}" vence em 2 horas!`,
      data: { taskId: task.id, houseId },
    },
    trigger,
  });
};

export const scheduleNewPostNotification = async (post) => {
  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
  if (notificationsEnabled === 'false') return;

  const houseId = await getCurrentHouseId();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Nova Postagem',
      body: `${post.authorEmail} fez uma nova postagem: "${post.title}"`,
      data: { postId: post.id, houseId },
    },
    trigger: null,
  });
};

export const scheduleNewMemberNotification = async (member) => {
  const notificationsEnabled = await AsyncStorage.getItem('notificationsEnabled');
  if (notificationsEnabled === 'false') return;

  const houseId = await getCurrentHouseId();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Novo Membro',
      body: `${member.email} entrou na casa!`,
      data: { memberId: member.id, houseId },
    },
    trigger: null,
  });
};