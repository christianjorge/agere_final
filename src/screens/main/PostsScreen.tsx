import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TextInput, Text } from 'react-native';
import { FAB, IconButton, Searchbar, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Post, getPosts, deletePost, toggleLike, addComment, getComments } from '../../services/posts';
import { FlatList, Image } from 'react-native';
import { CommentList } from '../../components/CommentList';

export default function PostsScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const fetchedPosts = await getPosts(searchQuery);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      Alert.alert('Erro', 'Não foi possível carregar os posts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    await loadPosts();
  };

  const handleLike = async (postId: string) => {
    try {
      await toggleLike(postId);
      await loadPosts(); // Recarregar posts para atualizar likes
    } catch (error) {
      console.error('Erro ao curtir post:', error);
      Alert.alert('Erro', 'Não foi possível curtir o post');
    }
  };

  const handleDeletePost = async (postId: string, authorId: string) => {
    if (user?.uid !== authorId) {
      Alert.alert('Erro', 'Você não tem permissão para excluir este post');
      return;
    }

    Alert.alert(
      'Confirmar exclusão',
      'Tem certeza que deseja excluir este post?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePost(postId);
              await loadPosts(); // Recarregar posts após excluir
              Alert.alert('Sucesso', 'Post excluído com sucesso');
            } catch (error) {
              console.error('Erro ao excluir post:', error);
              Alert.alert('Erro', 'Não foi possível excluir o post');
            }
          },
        },
      ]
    );
  };

  const handleComment = async (postId: string) => {
    if (!newComment.trim()) return;

    try {
      await addComment(postId, newComment);
      setNewComment('');
      // Recarregar comentários do post específico
      if (selectedPost === postId) {
        await loadPostComments(postId);
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o comentário');
    }
  };

  const loadPostComments = async (postId: string) => {
    try {
      setLoadingComments(true);
      const comments = await getComments(postId);
      const updatedPosts = posts.map(post => {
        if (post.id === postId) {
          return { ...post, comments };
        }
        return post;
      });
      setPosts(updatedPosts);
    } catch (error) {
      console.error('Erro ao carregar comentários:', error);
      Alert.alert('Erro', 'Não foi possível carregar os comentários');
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = async (postId: string) => {
    if (selectedPost === postId) {
      setSelectedPost(null);
    } else {
      setSelectedPost(postId);
      await loadPostComments(postId);
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <Text style={styles.authorText}>{item.authorEmail}</Text>
        {item.authorId === user?.uid && (
          <View style={styles.actions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => navigation.navigate('CreatePost', { post: item })}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeletePost(item.id!, item.authorId)}
            />
          </View>
        )}
      </View>

      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent}>{item.content}</Text>
      
      {item.imageUrl && (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
        />
      )}

      <View style={styles.interactionContainer}>
        <View style={styles.likeContainer}>
          <IconButton
            icon={item.likes?.includes(user?.uid || '') ? 'heart' : 'heart-outline'}
            size={20}
            onPress={() => handleLike(item.id!)}
            color={item.likes?.includes(user?.uid || '') ? '#ff4444' : undefined}
          />
          <Text>{item.likes?.length || 0}</Text>
        </View>

        <IconButton
          icon="comment"
          size={20}
          onPress={() => toggleComments(item.id!)}
        />
      </View>

      {selectedPost === item.id && (
        <View style={styles.commentsSection}>
          {loadingComments ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <>
              <CommentList comments={item.comments || []} />
              <View style={styles.commentInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Adicione um comentário..."
                  value={newComment}
                  onChangeText={setNewComment}
                />
                <IconButton
                  icon="send"
                  size={20}
                  onPress={() => handleComment(item.id!)}
                />
              </View>
            </>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Pesquisar posts..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        onSubmitEditing={handleSearch}
        style={styles.searchBar}
      />

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={item => item.id!}
        contentContainerStyle={styles.listContainer}
        onRefresh={loadPosts}
        refreshing={loading}
      />
      
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  searchBar: {
    margin: theme.spacing.m,
  },
  listContainer: {
    padding: theme.spacing.m,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: theme.spacing.l,
    marginBottom: theme.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: theme.spacing.m,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.s,
  },
  authorText: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
  actions: {
    flexDirection: 'row',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.s,
  },
  postContent: {
    fontSize: 16,
    color: theme.colors.text,
    opacity: 0.8,
  },
  interactionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.s,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsSection: {
    marginTop: theme.spacing.m,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: theme.spacing.m,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.s,
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.m,
    paddingVertical: theme.spacing.s,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.m,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  loader: {
    padding: theme.spacing.m,
  },
});