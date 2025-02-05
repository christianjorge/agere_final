import { collection, addDoc, updateDoc, deleteDoc, doc, getDoc, getDocs, query, orderBy, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { ShoppingItem } from '../types/shopping';
import { getCurrentHouseId } from '../utils/houseUtils';

const shoppingCollection = collection(db, 'shoppingList');

export const addShoppingItem = async (item: Omit<ShoppingItem, 'id' | 'addedBy' | 'addedByEmail' | 'createdAt' | 'houseId'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();
  console.log(houseId);

  await addDoc(shoppingCollection, {
    ...item,
    houseId,
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

  const houseId = await getCurrentHouseId();

  // Verificar se o item pertence à casa atual
  const itemRef = doc(db, 'shoppingList', itemId);
  const itemDoc = await getDoc(itemRef);
  
  if (!itemDoc.exists()) {
    throw new Error('Item não encontrado');
  }

  if (itemDoc.data().houseId !== houseId) {
    throw new Error('Item não pertence a esta casa');
  }
  
  if (updates.completed) {
    updates.completedBy = user.uid;
    updates.completedAt = new Date();
  }

  await updateDoc(itemRef, updates);
};

export const deleteShoppingItem = async (itemId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Verificar se o item pertence à casa atual
  const itemRef = doc(db, 'shoppingList', itemId);
  const itemDoc = await getDoc(itemRef);
  
  if (!itemDoc.exists()) {
    throw new Error('Item não encontrado');
  }

  if (itemDoc.data().houseId !== houseId) {
    throw new Error('Item não pertence a esta casa');
  }

  await deleteDoc(itemRef);
};

export const getShoppingList = async () => {
  const houseId = await getCurrentHouseId();
  
  const q = query(
    shoppingCollection,
    where('houseId', '==', houseId),
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
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Verificar se o item pertence à casa atual
  const itemRef = doc(db, 'shoppingList', itemId);
  const itemDoc = await getDoc(itemRef);
  
  if (!itemDoc.exists()) {
    throw new Error('Item não encontrado');
  }

  if (itemDoc.data().houseId !== houseId) {
    throw new Error('Item não pertence a esta casa');
  }

  await updateDoc(itemRef, { 
    expenseId,
    completed: true,
    completedBy: user.uid,
    completedAt: new Date()
  });
};

export const getCompletedItems = async (days: number = 7) => {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);

  const houseId = await getCurrentHouseId();

  const q = query(
    shoppingCollection,
    where('houseId', '==', houseId),
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