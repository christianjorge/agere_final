import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface AdminLog {
  id?: string;
  action: string;
  performedBy: string;
  performedByEmail: string;
  details: any;
  timestamp: Date;
}

const logsCollection = collection(db, 'adminLogs');

export const logAdminAction = async (action: string, details: any) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  await addDoc(logsCollection, {
    action,
    performedBy: user.uid,
    performedByEmail: user.email,
    details,
    timestamp: new Date(),
  });
};

export const getRecentLogs = async (limit: number = 50): Promise<AdminLog[]> => {
  const q = query(logsCollection, orderBy('timestamp', 'desc'), limit(limit));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as AdminLog));
};