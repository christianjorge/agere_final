import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile as updateFirebaseProfile } from 'firebase/auth';
import { db, auth, storage } from '../config/firebase';
import { UserProfile } from '../types/profile';

export const updateProfile = async (profile: UserProfile) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  try {
    // Atualizar foto de perfil se fornecida
    let photoURL = profile.photo;
    if (profile.photo && profile.photo.startsWith('file://')) {
      const response = await fetch(profile.photo);
      const blob = await response.blob();
      const photoRef = ref(storage, `profile_photos/${user.uid}`);
      await uploadBytes(photoRef, blob);
      photoURL = await getDownloadURL(photoRef);
    }

    // Atualizar perfil no Authentication
    await updateFirebaseProfile(user, {
      displayName: profile.name,
      photoURL: photoURL || user.photoURL,
    });

    // Atualizar perfil no Firestore
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      name: profile.name,
      phone: profile.phone || null,
      birthday: profile.birthday ? new Date(profile.birthday) : null,
      pixKey: profile.pixKey || null,
      photoURL: photoURL || null,
      houseId: profile.houseId || null,
      updatedAt: new Date(),
    }, { merge: true });

    return true;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
};

export const getProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      return null;
    }

    const data = userDoc.data();
    return {
      userId: userDoc.id,
      name: data.name || '',
      phone: data.phone || '',
      birthday: data.birthday?.toDate() || undefined,
      pixKey: data.pixKey || '',
      photo: data.photoURL || undefined,
      houseId: data.houseId || undefined,
    };
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    throw error;
  }
};

export const updateCurrentHouse = async (houseId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const userRef = doc(db, 'users', user.uid);
  await updateDoc(userRef, {
    houseId,
    updatedAt: new Date(),
  });
};