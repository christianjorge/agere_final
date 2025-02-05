import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import { Post, Comment } from '../types/posts';
import { getCurrentHouseId } from '../utils/houseUtils';

const postsCollection = collection(db, 'posts');
const commentsCollection = collection(db, 'comments');

export const createPost = async (title: string, content: string, image?: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  let imageUrl;
  if (image) {
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const imageRef = ref(storage, `posts/${houseId}/${Date.now()}_${user.uid}`);
      await uploadBytes(imageRef, blob);
      imageUrl = await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw new Error('Não foi possível fazer upload da imagem');
    }
  }

  await addDoc(postsCollection, {
    houseId,
    title,
    content,
    authorId: user.uid,
    authorEmail: user.email,
    likes: [],
    imageUrl,
    createdAt: serverTimestamp(),
  });
};

export const updatePost = async (postId: string, title: string, content: string, image?: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();
  
  // Verificar se o post existe e pertence à casa atual
  const postRef = doc(db, 'posts', postId);
  const postDoc = await getDoc(postRef);
  
  if (!postDoc.exists()) {
    throw new Error('Post não encontrado');
  }

  if (postDoc.data().houseId !== houseId) {
    throw new Error('Post não pertence a esta casa');
  }

  const updateData: any = { title, content };

  if (image) {
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const imageRef = ref(storage, `posts/${houseId}/${Date.now()}_${user.uid}`);
      await uploadBytes(imageRef, blob);
      updateData.imageUrl = await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw new Error('Não foi possível fazer upload da imagem');
    }
  }

  await updateDoc(postRef, updateData);
};

export const deletePost = async (postId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();
  
  const postRef = doc(db, 'posts', postId);
  const postDoc = await getDoc(postRef);
  
  if (!postDoc.exists()) {
    throw new Error('Post não encontrado');
  }

  const post = postDoc.data();
  
  if (post.houseId !== houseId) {
    throw new Error('Post não pertence a esta casa');
  }

  if (post.authorId !== user.uid) {
    throw new Error('Apenas o autor pode excluir o post');
  }

  // Deletar a imagem do storage se existir
  if (post.imageUrl) {
    try {
      const imageRef = ref(storage, post.imageUrl);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Erro ao deletar imagem:', error);
    }
  }

  await deleteDoc(postRef);
  
  // Deletar comentários do post
  const commentsQuery = query(
    commentsCollection, 
    where('postId', '==', postId),
    where('houseId', '==', houseId)
  );
  const commentsSnapshot = await getDocs(commentsQuery);
  commentsSnapshot.forEach(async (doc) => {
    await deleteDoc(doc.ref);
  });
};

export const toggleLike = async (postId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  const postRef = doc(db, 'posts', postId);
  const postDoc = await getDoc(postRef);

  if (!postDoc.exists()) {
    throw new Error('Post não encontrado');
  }

  const post = postDoc.data();
  
  if (post.houseId !== houseId) {
    throw new Error('Post não pertence a esta casa');
  }

  const likes = post.likes || [];
  const newLikes = likes.includes(user.uid)
    ? likes.filter((id: string) => id !== user.uid)
    : [...likes, user.uid];

  await updateDoc(postRef, { likes: newLikes });
};

export const getPosts = async (searchTerm?: string, maxPosts?: number): Promise<Post[]> => {
  const houseId = await getCurrentHouseId();
  
  let q = query(
    postsCollection,
    where('houseId', '==', houseId),
    orderBy('createdAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const posts = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Post));

  if (searchTerm) {
    return posts.filter(post => 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  return posts;
};

export const addComment = async (postId: string, content: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Verificar se o post existe e pertence à casa atual
  const postRef = doc(db, 'posts', postId);
  const postDoc = await getDoc(postRef);
  
  if (!postDoc.exists()) {
    throw new Error('Post não encontrado');
  }

  if (postDoc.data().houseId !== houseId) {
    throw new Error('Post não pertence a esta casa');
  }

  await addDoc(commentsCollection, {
    houseId,
    postId,
    content,
    authorId: user.uid,
    authorEmail: user.email,
    createdAt: serverTimestamp(),
  });
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  const houseId = await getCurrentHouseId();

  const q = query(
    commentsCollection,
    where('houseId', '==', houseId),
    where('postId', '==', postId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Comment));
};