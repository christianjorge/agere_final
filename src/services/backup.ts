import { collection, getDocs, query, addDoc, where } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

interface BackupData {
  timestamp: Date;
  houseId: string;
  data: {
    house: any[];
    members: any[];
    expenses: any[];
    tasks: any[];
    posts: any[];
    shoppingList: any[];
  };
}

const backupCollection = collection(db, 'backups');

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

export const createBackup = async () => {
  try {
    const houseId = await getCurrentHouseId();

    // Coletar dados de todas as coleções da casa atual
    const [
      houseData,
      membersData,
      expensesData,
      tasksData,
      postsData,
      shoppingData
    ] = await Promise.all([
      getDocs(query(collection(db, 'houses'), where('id', '==', houseId))),
      getDocs(query(collection(db, 'houseMembers'), where('houseId', '==', houseId))),
      getDocs(query(collection(db, 'expenses'), where('houseId', '==', houseId))),
      getDocs(query(collection(db, 'tasks'), where('houseId', '==', houseId))),
      getDocs(query(collection(db, 'posts'), where('houseId', '==', houseId))),
      getDocs(query(collection(db, 'shoppingList'), where('houseId', '==', houseId)))
    ]);

    const backup: BackupData = {
      timestamp: new Date(),
      houseId,
      data: {
        house: houseData.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        members: membersData.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        expenses: expensesData.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        tasks: tasksData.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        posts: postsData.docs.map(doc => ({ id: doc.id, ...doc.data() })),
        shoppingList: shoppingData.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      }
    };

    await addDoc(backupCollection, backup);
    return true;
  } catch (error) {
    console.error('Erro ao criar backup:', error);
    return false;
  }
};

export const scheduleBackup = () => {
  const now = new Date();
  const nextBackup = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    3, 0, 0
  );
  
  const timeUntilBackup = nextBackup.getTime() - now.getTime();
  
  setTimeout(async () => {
    await createBackup();
    scheduleBackup();
  }, timeUntilBackup);
};