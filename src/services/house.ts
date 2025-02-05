import { collection, deleteDoc, updateDoc, addDoc, query, where, getDocs, doc, getDoc, writeBatch } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { House, HouseMember } from '../types/house';
import { getCurrentHouseId } from '../utils/houseUtils';

const housesCollection = collection(db, 'houses');
const membersCollection = collection(db, 'houseMembers');
const invitesCollection = collection(db, 'invites');

export const generateInviteLink = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Criar um código de convite único
  const inviteCode = Math.random().toString(36).substring(2, 15);
  
  // Salvar o convite no Firestore
  await addDoc(invitesCollection, {
    houseId,
    inviteCode,
    createdBy: user.uid,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expira em 24 horas
    used: false
  });

  return inviteCode;
};

export const joinHouseWithInviteCode = async (inviteCode: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  // Buscar o convite
  const inviteQuery = query(
    invitesCollection,
    where('inviteCode', '==', inviteCode),
    where('used', '==', false),
    where('expiresAt', '>', new Date())
  );

  const inviteSnapshot = await getDocs(inviteQuery);
  if (inviteSnapshot.empty) {
    throw new Error('Convite inválido ou expirado');
  }

  const invite = inviteSnapshot.docs[0];
  const inviteData = invite.data();

  // Verificar se o usuário já é membro
  const memberQuery = query(
    membersCollection,
    where('houseId', '==', inviteData.houseId),
    where('userId', '==', user.uid)
  );

  const memberSnapshot = await getDocs(memberQuery);
  if (!memberSnapshot.empty) {
    throw new Error('Você já é membro desta casa');
  }

  // Adicionar usuário como membro
  await addDoc(membersCollection, {
    houseId: inviteData.houseId,
    userId: user.uid,
    email: user.email,
    isAdmin: false,
    joinedAt: new Date()
  });

  // Marcar convite como usado
  await updateDoc(doc(db, 'invites', invite.id), { used: true });
};

export const getUserHouses = async (): Promise<House[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  // Buscar todas as casas onde o usuário é membro
  const membershipQuery = query(
    membersCollection,
    where('userId', '==', user.uid)
  );
  
  const memberships = await getDocs(membershipQuery);
  const houseIds = memberships.docs.map(doc => doc.data().houseId);

  // Se não for membro de nenhuma casa, retornar array vazio
  if (houseIds.length === 0) return [];

  // Buscar os dados de todas as casas
  const houses: House[] = [];
  for (const houseId of houseIds) {
    const houseDoc = await getDoc(doc(db, 'houses', houseId));
    if (houseDoc.exists()) {
      houses.push({
        id: houseDoc.id,
        ...houseDoc.data()
      } as House);
    }
  }

  return houses;
};

export const createHouse = async (house: Pick<House, 'name' | 'address'>): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  // Criar a casa
  const newHouse = await addDoc(housesCollection, {
    ...house,
    createdBy: user.uid,
    createdAt: new Date(),
  });

  // Adicionar o criador como membro administrador
  await addDoc(membersCollection, {
    houseId: newHouse.id,
    userId: user.uid,
    email: user.email,
    isAdmin: true,
    joinedAt: new Date(),
  });

  return newHouse.id;
};

export const getHouseDetails = async (): Promise<House> => {
  const houseId = await getCurrentHouseId();

  const houseDoc = await getDoc(doc(db, 'houses', houseId));
  if (!houseDoc.exists()) {
    throw new Error('Casa não encontrada');
  }

  return { id: houseDoc.id, ...houseDoc.data() } as House;
};

export const generateInviteQRCode = async (): Promise<string> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Verificar se o usuário é administrador
  const memberQuery = query(
    membersCollection,
    where('houseId', '==', houseId),
    where('userId', '==', user.uid),
    where('isAdmin', '==', true)
  );
  
  const memberSnapshot = await getDocs(memberQuery);
  if (memberSnapshot.empty) {
    throw new Error('Apenas administradores podem gerar convites');
  }

  // Gerar token único
  const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  // Criar convite com expiração de 24 horas
  await addDoc(invitesCollection, {
    houseId,
    token,
    createdBy: user.uid,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
  });

  return token;
};

export const joinHouseWithInvite = async (token: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  // Verificar se o convite é válido
  const inviteQuery = query(
    invitesCollection,
    where('token', '==', token),
    where('expiresAt', '>', new Date())
  );
  
  const inviteSnapshot = await getDocs(inviteQuery);
  if (inviteSnapshot.empty) {
    throw new Error('Convite inválido ou expirado');
  }

  const invite = inviteSnapshot.docs[0].data();

  // Verificar se o usuário já é membro
  const memberQuery = query(
    membersCollection,
    where('houseId', '==', invite.houseId),
    where('userId', '==', user.uid)
  );

  const memberSnapshot = await getDocs(memberQuery);
  if (!memberSnapshot.empty) {
    throw new Error('Você já é membro desta casa');
  }

  // Adicionar usuário como membro
  await addDoc(membersCollection, {
    houseId: invite.houseId,
    userId: user.uid,
    email: user.email,
    isAdmin: false,
    joinedAt: new Date(),
  });
};

export const updateHouseRules = async (rules: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Verificar se o usuário é admin
  const memberQuery = query(
    membersCollection,
    where('houseId', '==', houseId),
    where('userId', '==', user.uid),
    where('isAdmin', '==', true)
  );
  
  const memberSnapshot = await getDocs(memberQuery);
  if (memberSnapshot.empty) {
    throw new Error('Apenas administradores podem atualizar as regras');
  }

  // Atualizar as regras
  const houseRef = doc(db, 'houses', houseId);
  await updateDoc(houseRef, { rules });
};

export const getHouseMembers = async (): Promise<HouseMember[]> => {
  const houseId = await getCurrentHouseId();

  // Buscar todos os membros da casa
  const membersQuery = query(
    membersCollection,
    where('houseId', '==', houseId)
  );

  const membersSnapshot = await getDocs(membersQuery);
  return membersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as HouseMember));
};

export const removeMember = async (memberId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Verificar se o membro pertence à casa atual
  const memberDoc = await getDoc(doc(db, 'houseMembers', memberId));
  if (!memberDoc.exists() || memberDoc.data().houseId !== houseId) {
    throw new Error('Membro não encontrado nesta casa');
  }

  // Verificar se o usuário atual é administrador
  const adminQuery = query(
    membersCollection,
    where('houseId', '==', houseId),
    where('userId', '==', user.uid),
    where('isAdmin', '==', true)
  );

  const adminSnapshot = await getDocs(adminQuery);
  if (adminSnapshot.empty) {
    throw new Error('Apenas administradores podem remover membros');
  }

  // Remover o membro
  await deleteDoc(doc(db, 'houseMembers', memberId));
};

export const deleteHouse = async (): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Verificar se o usuário é admin da casa
  const memberQuery = query(
    membersCollection,
    where('houseId', '==', houseId),
    where('userId', '==', user.uid),
    where('isAdmin', '==', true)
  );
  
  const memberSnapshot = await getDocs(memberQuery);
  if (memberSnapshot.empty) {
    throw new Error('Apenas administradores podem deletar a casa');
  }

  const batch = writeBatch(db);

  // Deletar todos os dados relacionados à casa
  const collections = [
    'expenses',
    'tasks',
    'posts',
    'shoppingList',
    'messages',
    'houseMembers',
    'taskTypes',
    'invites'
  ];

  for (const collectionName of collections) {
    const q = query(
      collection(db, collectionName),
      where('houseId', '==', houseId)
    );
    const snapshot = await getDocs(q);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
  }

  // Deletar a casa
  const houseRef = doc(db, 'houses', houseId);
  batch.delete(houseRef);

  // Executar todas as operações
  await batch.commit();
};