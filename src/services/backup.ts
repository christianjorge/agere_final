import { collection, getDocs, query, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface BackupData {
  timestamp: Date;
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

export const createBackup = async () => {
  try {
    // Coletar dados de todas as coleções importantes
    const [
      houseData,
      membersData,
      expensesData,
      tasksData,
      postsData,
      shoppingData
    ] = await Promise.all([
      getDocs(collection(db, 'houses')),
      getDocs(collection(db, 'houseMembers')),
      getDocs(collection(db, 'expenses')),
      getDocs(collection(db, 'tasks')),
      getDocs(collection(db, 'posts')),
      getDocs(collection(db, 'shoppingList'))
    ]);

    const backup: BackupData = {
      timestamp: new Date(),
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
  // Criar backup diário às 3h da manhã
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
    scheduleBackup(); // Agendar próximo backup
  }, timeUntilBackup);
};