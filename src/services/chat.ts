import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, onSnapshot, getDoc, writeBatch, limit } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { ChatMessage, ChatUser } from '../types/chat';
import { getCurrentHouseId } from '../utils/houseUtils';
import { getProfile } from './profile';

const messagesCollection = collection(db, 'messages');

export const sendMessage = async (receiverId: string, content: string, imageUrl?: string | null) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Remover campos undefined/null antes de enviar para o Firestore
  const messageData = {
    houseId,
    senderId: user.uid,
    senderEmail: user.email,
    receiverId,
    content: content || '',
    read: false,
    createdAt: new Date()
  };

  // Só adicionar imageUrl se ele existir
  if (imageUrl) {
    messageData['imageUrl'] = imageUrl;
  }

  await addDoc(messagesCollection, messageData);
};

export const getMessages = (receiverId: string, callback: (messages: ChatMessage[]) => void) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const unsubscribe = onSnapshot(
    query(
      messagesCollection,
      where('senderId', 'in', [user.uid, receiverId]),
      where('receiverId', 'in', [user.uid, receiverId]),
      orderBy('createdAt', 'desc')
    ),
    (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as ChatMessage));
      callback(messages);
    },
    (error) => {
      console.error('Erro ao carregar mensagens:', error);
    }
  );

  return unsubscribe;
};

export const markAsRead = async (senderId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  const q = query(
    messagesCollection,
    where('houseId', '==', houseId),
    where('senderId', '==', senderId),
    where('receiverId', '==', user.uid),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  
  if (snapshot.empty) return;

  const batch = writeBatch(db);
  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
};

export const deleteMessage = async (messageId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const messageRef = doc(db, 'messages', messageId);
  const messageDoc = await getDoc(messageRef);

  if (!messageDoc.exists()) {
    throw new Error('Mensagem não encontrada');
  }

  const message = messageDoc.data();
  if (message.senderId !== user.uid) {
    throw new Error('Apenas o remetente pode apagar a mensagem');
  }

  await deleteDoc(messageRef);
};

export const getUsers = async (): Promise<ChatUser[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  const membersQuery = query(
    collection(db, 'houseMembers'),
    where('houseId', '==', houseId)
  );

  const membersSnapshot = await getDocs(membersQuery);
  const members = membersSnapshot.docs.map(doc => doc.data());

  const otherMembers = members.filter(member => member.userId !== user.uid);

  const users: ChatUser[] = [];
  for (const member of otherMembers) {
    const profile = await getProfile(member.userId);
    const lastMessage = await getLastMessage(member.userId);

    users.push({
      id: member.userId,
      houseId,
      email: member.email,
      name: profile?.name || null,
      photo: profile?.photo || null,
      lastMessage: lastMessage?.content || null,
      lastMessageTime: lastMessage?.createdAt || null,
      online: false
    });
  }

  return users;
};

const getLastMessage = async (userId: string): Promise<ChatMessage | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const houseId = await getCurrentHouseId();

  const q = query(
    messagesCollection,
    where('houseId', '==', houseId),
    where('senderId', 'in', [user.uid, userId]),
    where('receiverId', 'in', [user.uid, userId]),
    orderBy('createdAt', 'desc'),
    limit(1)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  return {
    id: snapshot.docs[0].id,
    ...snapshot.docs[0].data()
  } as ChatMessage;
};

export const getUnreadCount = async (senderId: string): Promise<number> => {
  const user = auth.currentUser;
  if (!user) return 0;

  const houseId = await getCurrentHouseId();

  const q = query(
    messagesCollection,
    where('houseId', '==', houseId),
    where('senderId', '==', senderId),
    where('receiverId', '==', user.uid),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};

export const getUnreadMessagesCount = async (): Promise<number> => {
  const user = auth.currentUser;
  if (!user) return 0;

  const houseId = await getCurrentHouseId();

  const q = query(
    messagesCollection,
    where('houseId', '==', houseId),
    where('receiverId', '==', user.uid),
    where('read', '==', false)
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};