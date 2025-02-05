import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, Timestamp, getDoc, writeBatch, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import { Task, TaskType, UserReputation, TaskRotation } from '../types/tasks';
import { getCurrentHouseId } from '../utils/houseUtils';

const tasksCollection = collection(db, 'tasks');
const taskTypesCollection = collection(db, 'taskTypes');
const reputationCollection = collection(db, 'reputation');
const rotationsCollection = collection(db, 'taskRotations');

export const createTaskType = async (taskType: Omit<TaskType, 'id' | 'createdBy' | 'createdAt' | 'houseId'>) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  return addDoc(taskTypesCollection, {
    ...taskType,
    houseId,
    createdBy: user.uid,
    createdAt: new Date(),
    active: true
  });
};

export const getTaskTypes = async () => {
  const houseId = await getCurrentHouseId();
  
  const q = query(
    taskTypesCollection, 
    where('houseId', '==', houseId),
    where('active', '==', true)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as TaskType));
};

export const createTask = async (task: Omit<Task, 'id' | 'houseId'>) => {
  const houseId = await getCurrentHouseId();
  
  return addDoc(tasksCollection, {
    ...task,
    houseId,
    completed: false,
    createdAt: new Date()
  });
};

export const getTasks = async (userId?: string) => {
  const houseId = await getCurrentHouseId();
  
  let q = query(
    tasksCollection,
    where('houseId', '==', houseId),
    orderBy('dueDate', 'asc')
  );
  
  if (userId) {
    q = query(q, where('assignedTo', '==', userId));
  }

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dueDate: data.dueDate.toDate(),
      createdAt: data.createdAt.toDate(),
      // Converter datas apenas se existirem
      completedAt: data.completedAt ? data.completedAt.toDate() : null,
      verifiedAt: data.verifiedAt ? data.verifiedAt.toDate() : null
    } as Task;
  });
};

export const completeTask = async (taskId: string, photos?: string[], newAssignee?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Verificar se a tarefa pertence à casa atual
  const taskRef = doc(db, 'tasks', taskId);
  const taskDoc = await getDoc(taskRef);
  
  if (!taskDoc.exists()) {
    throw new Error('Tarefa não encontrada');
  }

  if (taskDoc.data().houseId !== houseId) {
    throw new Error('Tarefa não pertence a esta casa');
  }

  const photoUrls: string[] = [];

  if (photos && photos.length > 0) {
    for (const photoUri of photos) {
      try {
        const response = await fetch(photoUri);
        const blob = await response.blob();
        const photoRef = ref(storage, `task_photos/${houseId}/${taskId}/${Date.now()}`);
        await uploadBytes(photoRef, blob);
        const url = await getDownloadURL(photoRef);
        photoUrls.push(url);
      } catch (error) {
        console.error('Erro ao fazer upload da foto:', error);
      }
    }
  }

  const updateData: Partial<Task> = {
    completed: true,
    completedAt: new Date(),
    photos: photoUrls
  };

  // Se houver um novo responsável, atualizar o assignedTo
  if (newAssignee) {
    updateData.assignedTo = newAssignee;
    updateData.completed = false;
    updateData.completedAt = null;
  }

  await updateDoc(taskRef, updateData);

  if (!newAssignee) {
    await updateUserReputation(user.uid, true);
  }
};

export const verifyTask = async (taskId: string, rating: number, feedback?: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Verificar se a tarefa pertence à casa atual
  const taskRef = doc(db, 'tasks', taskId);
  const taskDoc = await getDoc(taskRef);
  
  if (!taskDoc.exists()) {
    throw new Error('Tarefa não encontrada');
  }

  if (taskDoc.data().houseId !== houseId) {
    throw new Error('Tarefa não pertence a esta casa');
  }

  await updateDoc(taskRef, {
    verifiedBy: user.uid,
    verifiedAt: new Date(),
    rating,
    feedback
  });

  await updateUserReputation(taskDoc.data().assignedTo, true, rating);
};

const updateUserReputation = async (userId: string, taskCompleted: boolean, rating?: number) => {
  const houseId = await getCurrentHouseId();
  const reputationRef = doc(reputationCollection, `${houseId}_${userId}`);
  const reputationDoc = await getDoc(reputationRef);
  
  const currentReputation = reputationDoc.exists() ? reputationDoc.data() as UserReputation : {
    userId,
    houseId,
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

  const basePoints = taskCompleted ? 10 : -5;
  const ratingBonus = rating ? (rating - 3) * 2 : 0;
  updates.points = currentReputation.points + basePoints + ratingBonus;

  updates.level = Math.floor(updates.points / 100) + 1;

  const newBadges = [...currentReputation.badges];
  if (updates.tasksCompleted >= 10 && !newBadges.includes('dedicated')) {
    newBadges.push('dedicated');
  }
  if (updates.averageRating >= 4.5 && !newBadges.includes('excellent')) {
    newBadges.push('excellent');
  }
  updates.badges = newBadges;

  if (!reputationDoc.exists()) {
    await setDoc(reputationRef, { ...currentReputation, ...updates });
  } else {
    await updateDoc(reputationRef, updates);
  }
};

export const setupTaskRotation = async (taskTypeId: string, memberIds: string[]) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  const taskTypeDoc = await getDoc(doc(db, 'taskTypes', taskTypeId));
  if (!taskTypeDoc.exists()) throw new Error('Tipo de tarefa não encontrado');
  
  const taskType = taskTypeDoc.data() as TaskType;

  // Verificar se o tipo de tarefa pertence à casa atual
  if (taskType.houseId !== houseId) {
    throw new Error('Tipo de tarefa não pertence a esta casa');
  }

  const frequencyDays = taskType.frequencyDays || 1;
  const durationMonths = taskType.durationMonths || 1;

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + durationMonths);
  
  const tasks = [];
  let currentDate = new Date(startDate);
  let memberIndex = 0;

  while (currentDate <= endDate) {
    const task = {
      typeId: taskTypeId,
      assignedTo: memberIds[memberIndex],
      dueDate: new Date(currentDate),
      completed: false,
      points: taskType.points || 10,
      houseId,
      createdAt: new Date()
    };
    
    tasks.push(task);

    memberIndex = (memberIndex + 1) % memberIds.length;
    currentDate.setDate(currentDate.getDate() + frequencyDays);
  }

  const batch = writeBatch(db);
  tasks.forEach(task => {
    const taskRef = doc(collection(db, 'tasks'));
    batch.set(taskRef, task);
  });

  await batch.commit();

  return addDoc(rotationsCollection, {
    taskTypeId,
    memberIds,
    startDate,
    endDate,
    frequencyDays,
    houseId,
    createdBy: user.uid,
    createdAt: new Date()
  });
};

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
  const houseId = await getCurrentHouseId();

  const q = query(
    reputationCollection,
    where('houseId', '==', houseId)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({
      id: doc.id,
      ...doc.data()
    } as UserReputation))
    .sort((a, b) => b.points - a.points);
};