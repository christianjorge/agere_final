import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export const getCurrentHouseId = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Usuário não autenticado');

    // Primeiro, tentar buscar do perfil do usuário
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists() && userDoc.data().houseId) {
        // Verificar se o usuário ainda é membro desta casa
        const memberQuery = query(
        collection(db, 'houseMembers'),
        where('userId', '==', user.uid),
        where('houseId', '==', userDoc.data().houseId)
        );
        
        const memberSnapshot = await getDocs(memberQuery);
        if (!memberSnapshot.empty) {
        return userDoc.data().houseId;
        }
    }

    // Se não encontrou no perfil ou não é mais membro, buscar na tabela de membros
    const memberQuery = query(
        collection(db, 'houseMembers'),
        where('userId', '==', user.uid)
    );

    const memberSnapshot = await getDocs(memberQuery);
    if (memberSnapshot.empty) {
        throw new Error('Usuário não pertence a nenhuma casa');
    }

    const houseId = memberSnapshot.docs[0].data().houseId;

    // Atualizar o perfil do usuário com a casa encontrada
    await updateDoc(userRef, {
        houseId: houseId,
        updatedAt: new Date()
    });

    return houseId;
};

export const validateHouseMembership = async (houseId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const memberQuery = query(
    collection(db, 'houseMembers'),
    where('houseId', '==', houseId),
    where('userId', '==', user.uid)
  );

  const memberSnapshot = await getDocs(memberQuery);
  if (memberSnapshot.empty) {
    throw new Error('Usuário não é membro desta casa');
  }

  return memberSnapshot.docs[0].data();
};

export const isHouseAdmin = async (houseId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const memberQuery = query(
    collection(db, 'houseMembers'),
    where('houseId', '==', houseId),
    where('userId', '==', user.uid),
    where('isAdmin', '==', true)
  );

  const memberSnapshot = await getDocs(memberQuery);
  return !memberSnapshot.empty;
};