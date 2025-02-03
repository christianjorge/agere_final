import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, Timestamp, getDoc, writeBatch, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import { Task, TaskType, UserReputation, TaskRotation } from '../types/tasks';

const tasksCollection = collection(db, 'tasks');
const taskTypesCollection = collection(db, 'taskTypes');
const reputationCollection = collection(db, 'reputation');
const rotationsCollection = collection(db, 'taskRotations');

// Gerenciamento de Tipos de Tarefas
export const createTaskType = async (taskType: Omit<TaskType, 'id' | 'createdBy' | 'createdAt'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  return addDoc(taskTypesCollection, {
    ...taskType,
    createdBy: user.uid,
    createdAt: new Date(),
    active: true
  });
};

export const getTaskTypes = async () => {
  const q = query(taskTypesCollection, where('active', '==', true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as TaskType));
};

// Gerenciamento de Tarefas
export const createTask = async (task: Omit<Task, 'id'>) => {
  return addDoc(tasksCollection, {
    ...task,
    completed: false,
    createdAt: new Date()
  });
};

export const getTasks = async (userId?: string) => {
  let q = query(tasksCollection, orderBy('dueDate', 'asc'));
  
  if (userId) {
    q = query(q, where('assignedTo', '==', userId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    dueDate: doc.data().dueDate.toDate()
  } as Task));
};

export const completeTask = async (taskId: string, photos?: File[]) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const photoUrls: string[] = [];

  if (photos && photos.length > 0) {
    for (const photo of photos) {
      const photoRef = ref(storage, `task_photos/${taskId}/${Date.now()}`);
      await uploadBytes(photoRef, photo);
      const url = await getDownloadURL(photoRef);
      photoUrls.push(url);
    }
  }

  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    completed: true,
    completedAt: new Date(),
    photos: photoUrls
  });

  await updateUserReputation(user.uid, true);
};

export const verifyTask = async (taskId: string, rating: number, feedback?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const taskRef = doc(db, 'tasks', taskId);
  await updateDoc(taskRef, {
    verifiedBy: user.uid,
    verifiedAt: new Date(),
    rating,
    feedback
  });

  // Atualizar reputação com base na avaliação
  const taskDoc = await getDoc(taskRef);
  if (taskDoc.exists()) {
    await updateUserReputation(taskDoc.data().assignedTo, true, rating);
  }
};

// Gerenciamento de Reputação
const updateUserReputation = async (userId: string, taskCompleted: boolean, rating?: number) => {
  const reputationRef = doc(db, 'reputation', userId);
  const reputationDoc = await getDoc(reputationRef);
  
  const currentReputation = reputationDoc.exists() ? reputationDoc.data() as UserReputation : {
    userId,
    points: 0,
    tasksCompleted: 0,
    tasksDelayed: 0,
    averageRating: 0,
    level: 1,
    badges: []
  };

  const updates: Partial<UserReputation> = {
    tasksCompleted: currentReputation.tasksCompleted + (taskCompleted ? 1 : 0),
    tasksDelayed: currentReputation.tasksDelayed + (taskCompleted ? 0 : 1)
  };

  if (rating) {
    const totalRatings = currentReputation.tasksCompleted;
    updates.averageRating = (currentReputation.averageRating * totalRatings + rating) / (totalRatings + 1);
  }

  // Calcular pontos
  const basePoints = taskCompleted ? 10 : -5;
  const ratingBonus = rating ? (rating - 3) * 2 : 0;
  updates.points = currentReputation.points + basePoints + ratingBonus;

  // Atualizar nível
  updates.level = Math.floor(updates.points / 100) + 1;

  // Verificar conquistas
  const newBadges = [...currentReputation.badges];
  if (updates.tasksCompleted >= 10 && !newBadges.includes('dedicated')) {
    newBadges.push('dedicated');
  }
  if (updates.averageRating >= 4.5 && !newBadges.includes('excellent')) {
    newBadges.push('excellent');
  }
  updates.badges = newBadges;

  // Se o documento não existe, criar; se existe, atualizar
  if (!reputationDoc.exists()) {
    await setDoc(reputationRef, { ...currentReputation, ...updates });
  } else {
    await updateDoc(reputationRef, updates);
  }
};

// Rotação Automática de Tarefas
export const setupTaskRotation = async (taskTypeId: string, memberIds: string[]) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  // Buscar o tipo de tarefa
  const taskTypeDoc = await getDoc(doc(db, 'taskTypes', taskTypeId));
  if (!taskTypeDoc.exists()) throw new Error('Tipo de tarefa não encontrado');
  
  const taskType = taskTypeDoc.data() as TaskType;
  const frequencyDays = taskType.frequencyDays || 1;
  const durationMonths = taskType.durationMonths || 1;

  // Calcular datas para o período especificado
  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);
  
  const tasks = [];
  let currentDate = new Date(startDate);
  let memberIndex = 0;

  while (currentDate <= endDate) {
    // Criar tarefa para o membro atual
    const task = {
      typeId: taskTypeId,
      assignedTo: memberIds[memberIndex],
      dueDate: new Date(currentDate),
      completed: false,
      points: taskType.points || 10,
      createdAt: new Date()
    };
    
    tasks.push(task);

    // Avançar para o próximo membro e próxima data
    memberIndex = (memberIndex + 1) % memberIds.length;
    currentDate.setDate(currentDate.getDate() + frequencyDays);
  }

  // Criar todas as tarefas no banco usando writeBatch
  const batch = writeBatch(db);
  tasks.forEach(task => {
    const taskRef = doc(collection(db, 'tasks'));
    batch.set(taskRef, task);
  });

  await batch.commit();

  // Registrar a rotação
  return addDoc(rotationsCollection, {
    taskTypeId,
    memberIds,
    startDate,
    endDate,
    frequencyDays,
    createdBy: user.uid,
    createdAt: new Date()
  });
};

// Estatísticas e Rankings
export const getTaskStatistics = async (userId: string) => {
  const tasks = await getTasks(userId);
  
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    averageRating: tasks.reduce((acc, t) => acc + (t.rating || 0), 0) / tasks.length || 0
  };
};

export const getHouseRanking = async () => {
  const snapshot = await getDocs(reputationCollection);
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    } as UserReputation))
    .sort((a, b) => b.points - a.points);
};