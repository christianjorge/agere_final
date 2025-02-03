import { collection, addDoc, query, where, orderBy, onSnapshot, getDocs, updateDoc, doc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, deleteObject, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import * as Notifications from 'expo-notifications';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

export interface Message {
  id?: string;
  senderId: string;
  senderEmail: string;
  receiverId: string;
  content: string;
  imageUrl?: string | null;
  read: boolean;
  createdAt: any;
}

export interface ChatUser {
  id: string;
  email: string;
  name?: string;
  online?: boolean;
  lastMessage?: string;
  lastSeen?: Date;
}

const messagesCollection = collection(db, 'messages');
const usersCollection = collection(db, 'users');

export const sendMessage = async (receiverId: string, content: string, imageUri?: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  let imageUrl = null;
  if (imageUri) {
    try {
      // Upload da imagem original sem manipulação
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const imageRef = ref(storage, `chat_images/${Date.now()}_${user.uid}`);
      await uploadBytes(imageRef, blob);
      imageUrl = await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw new Error('Não foi possível fazer upload da imagem');
    }
  }

  const messageData = {
    senderId: user.uid,
    senderEmail: user.email,
    receiverId,
    content: content || '',
    imageUrl,
    read: false,
    createdAt: serverTimestamp(),
  };

  await addDoc(messagesCollection, messageData);

  // Enviar notificação para o destinatário
  try {
    const receiverDoc = await getDoc(doc(db, 'users', receiverId));
    const receiverData = receiverDoc.data();
    
    if (receiverData?.pushToken) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `Nova mensagem de ${user.email}`,
          body: content || 'Enviou uma imagem',
          data: { screen: 'ChatConversation', userId: user.uid },
        },
        trigger: null,
      });
    }
  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
  }

  // Atualizar última mensagem do usuário
  const userRef = doc(db, 'users', receiverId);
  await updateDoc(userRef, {
    lastMessage: content || 'Imagem',
    lastMessageAt: serverTimestamp(),
  });
};

export const getMessages = (userId: string, callback: (messages: Message[]) => void) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const q = query(
    messagesCollection,
    where('senderId', 'in', [user.uid, userId]),
    where('receiverId', 'in', [user.uid, userId]),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Message));
    callback(messages);
  });
};

export const getUsers = async (): Promise<ChatUser[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const snapshot = await getDocs(usersCollection);
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data(),
      online: doc.data().lastSeen && 
        (new Date().getTime() - doc.data().lastSeen.toDate().getTime()) < 300000 // 5 minutos
    } as ChatUser))
    .filter(u => u.id !== user.uid);
};

export const markAsRead = async (senderId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const q = query(
    messagesCollection,
    where('senderId', '==', senderId),
    where('receiverId', '==', user.uid),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  const batch = db.batch();
  
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};

export const getUnreadCount = async (senderId: string): Promise<number> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const q = query(
    messagesCollection,
    where('senderId', '==', senderId),
    where('receiverId', '==', user.uid),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};
//A função acima é semelhante a de baixo, checar simplificação
export const getUnreadMessagesCount = async (): Promise<number> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const q = query(
    messagesCollection,
    where('receiverId', '==', user.uid),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const updateUserStatus = async (online: boolean) => {
  const user = auth.currentUser;
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, {
    lastSeen: serverTimestamp(),
    online
  });
};

export const deleteMessage = async (messageId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const messageRef = doc(db, 'messages', messageId);
  const messageDoc = await getDoc(messageRef);
  
  if (!messageDoc.exists()) {
    throw new Error('Mensagem não encontrada');
  }

  const messageData = messageDoc.data();
  if (messageData.senderId !== user.uid) {
    throw new Error('Você não tem permissão para apagar esta mensagem');
  }

  // Se tiver imagem, deletar do storage também
  if (messageData.imageUrl) {
    try {
      const imageRef = ref(storage, messageData.imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
    }
  }

  await deleteDoc(messageRef);
};