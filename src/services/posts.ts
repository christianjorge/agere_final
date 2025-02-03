import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, serverTimestamp, where, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';

export interface Comment {
  id?: string;
  postId: string;
  authorId: string;
  authorEmail: string;
  content: string;
  createdAt: any;
}

export interface Post {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorEmail: string;
  likes: string[];
  imageUrl?: string;
  createdAt: any;
}

export const postsCollection = collection(db, 'posts');
export const commentsCollection = collection(db, 'comments');

export const createPost = async (title: string, content: string, image?: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  let imageUrl;
  if (image) {
    try {
      // Converter URI da imagem para blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // Criar referência única para a imagem
      const imageRef = ref(storage, `posts/${Date.now()}_${user.uid}`);
      
      // Upload do blob
      await uploadBytes(imageRef, blob);
      
      // Obter URL da imagem
      imageUrl = await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw new Error('Não foi possível fazer upload da imagem');
    }
  }

  await addDoc(postsCollection, {
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

  const updateData: any = { title, content };

  if (image) {
    try {
      // Converter URI da imagem para blob
      const response = await fetch(image);
      const blob = await response.blob();
      
      // Criar referência única para a imagem
      const imageRef = ref(storage, `posts/${Date.now()}_${user.uid}`);
      
      // Upload do blob
      await uploadBytes(imageRef, blob);
      
      // Obter URL da imagem
      updateData.imageUrl = await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      throw new Error('Não foi possível fazer upload da imagem');
    }
  }

  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, updateData);
};

export const deletePost = async (postId: string): Promise<void> => {
  const postRef = doc(db, 'posts', postId);
  await deleteDoc(postRef);
  
  // Deletar comentários do post
  const commentsQuery = query(commentsCollection, where('postId', '==', postId));
  const commentsSnapshot = await getDocs(commentsQuery);
  commentsSnapshot.forEach(async (doc) => {
    await deleteDoc(doc.ref);
  });
};

export const toggleLike = async (postId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const postRef = doc(db, 'posts', postId);
  const postDoc = await getDocs(query(collection(db, 'posts')));
  const post = postDoc.docs.find(doc => doc.id === postId);

  if (post) {
    const likes = post.data().likes || [];
    const newLikes = likes.includes(user.uid)
      ? likes.filter((id: string) => id !== user.uid)
      : [...likes, user.uid];

    await updateDoc(postRef, { likes: newLikes });
  }
};

export const getPosts = async (searchTerm?: string, maxPosts?: number): Promise<Post[]> => {
  let q = query(postsCollection, orderBy('createdAt', 'desc'));
  
  if (maxPosts) {
    q = query(q, limit(maxPosts));
  }
  
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

  await addDoc(commentsCollection, {
    postId,
    content,
    authorId: user.uid,
    authorEmail: user.email,
    createdAt: serverTimestamp(),
  });
};

export const getComments = async (postId: string): Promise<Comment[]> => {
  const q = query(
    commentsCollection,
    where('postId', '==', postId),
    orderBy('createdAt', 'desc')
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Comment));
};