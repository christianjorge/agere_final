import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export interface ShoppingItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  urgent: boolean;
  estimatedPrice: number;
  addedBy: string;
  addedByEmail: string;
  completed: boolean;
  completedBy?: string;
  completedAt?: Date;
  createdAt: Date;
  expenseId?: string; // Referência à despesa criada quando o item for comprado
}

const shoppingCollection = collection(db, 'shoppingList');

export const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'addedBy' | 'addedByEmail' | 'createdAt'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  await addDoc(shoppingCollection, {
    ...item,
    addedBy: user.uid,
    addedByEmail: user.email,
    createdAt: new Date(),
    completedBy: null,
    completedAt: null,
    expenseId: null
  });
};

export const updateShoppingItem = async (itemId: string, updates: Partial<ShoppingItem>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const itemRef = doc(db, 'shoppingList', itemId);
  
  // Se estiver marcando como completo, adicionar informações adicionais
  if (updates.completed) {
    updates.completedBy = user.uid;
    updates.completedAt = new Date();
  }

  await updateDoc(itemRef, updates);
};

export const deleteShoppingItem = async (itemId: string) => {
  const itemRef = doc(db, 'shoppingList', itemId);
  await deleteDoc(itemRef);
};

export const getShoppingList = async () => {
  // Buscar primeiro os itens não completados, ordenados por urgência e data
  const q = query(
    shoppingCollection,
    orderBy('completed', 'asc'),
    orderBy('urgent', 'desc'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ShoppingItem));
};

export const linkShoppingItemToExpense = async (itemId: string, expenseId: string) => {
  const itemRef = doc(db, 'shoppingList', itemId);
  await updateDoc(itemRef, { 
    expenseId,
    completed: true,
    completedBy: auth.currentUser?.uid,
    completedAt: new Date()
  });
};

export const getCompletedItems = async (days: number = 7) => {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const q = query(
    shoppingCollection,
    where('completed', '==', true),
    where('completedAt', '>=', dateLimit),
    orderBy('completedAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ShoppingItem));
};