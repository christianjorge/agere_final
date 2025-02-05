import { collection, addDoc, getDocs, query, orderBy, limit, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface AdminLog {
  id?: string;
  houseId: string;
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: any;
  timestamp: Date;
}

const logsCollection = collection(db, 'adminLogs');

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

export const logAdminAction = async (action: string, details: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  await addDoc(logsCollection, {
    houseId,
    action,
    performedBy: user.uid,
    performedByEmail: user.email,
    details,
    timestamp: new Date(),
  });
};

export const getRecentLogs = async (limit: number = 50): Promise<AdminLog[]> => {
  const houseId = await getCurrentHouseId();
  
  const q = query(
    logsCollection,
    where('houseId', '==', houseId),
    orderBy('timestamp', 'desc'),
    limit(limit)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AdminLog));
};