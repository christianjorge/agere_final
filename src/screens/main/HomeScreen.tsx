import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, FlatList, RefreshControl, TouchableOpacity  } from 'react-native';
import { FAB, Portal, Dialog, Card, Title, Paragraph, Button } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { HouseMembersList } from '../../components/HouseMembersList';
import { getUnreadMessagesCount } from '../../services/chat';
import { getPosts } from '../../services/posts';
import { getHouseMembers } from '../../services/house';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const [showMembersList, setShowMembersList] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigation = useNavigation();
  const [recentPosts, setRecentPosts] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  const startScanner = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setShowScanner(true);
    }
  };

  const QuickAccessButton = ({ icon, label, color, onPress }) => (
    <TouchableOpacity style={[styles.quickAccessButton, { backgroundColor: color }]} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={32} color="#fff" />
      <Text style={styles.quickAccessLabel}>{label}</Text>
    </TouchableOpacity>
  );

  const checkAdminStatus = async () => {
    try {
      const members = await getHouseMembers();
      const isUserAdmin = members.find(m => m.userId === user?.uid)?.isAdmin || false;
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Erro ao verificar status de admin:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      loadUnreadMessages(),
      loadRecentPosts(),
      checkAdminStatus()
    ]);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadInitialData();
    const interval = setInterval(loadUnreadMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      onRefresh();
    });
    return unsubscribe;
  }, [navigation]);

  const loadInitialData = async () => {
    await Promise.all([
      loadRecentPosts(),
      loadUnreadMessages(),
      checkAdminStatus()
    ]);
  };

  const loadRecentPosts = async () => {
    try {
      const posts = await getPosts('', 3);
      setRecentPosts(posts);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    }
  };

  const loadUnreadMessages = async () => {
    try {
      const count = await getUnreadMessagesCount();
      setUnreadMessages(count);
    } catch (error) {
      console.error('Erro ao carregar mensagens não lidas:', error);
    }
  };

  const getGreeting = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 12) {
      return { greeting: 'Bom dia!', emoji: '☀️' };
    } else if (currentHour < 18) {
      return { greeting: 'Boa tarde!', emoji: '🌤️' };
    } else {
      return { greeting: 'Boa noite!', emoji: '🌙' };
    }
  };

  const renderPost = ({ item }) => (
    <Card style={styles.postCard}>
      <Card.Content>
        <Title numberOfLines={1}>{item.title}</Title>
        <Paragraph numberOfLines={2}>{item.content}</Paragraph>
        {item.imageUrl && (
          <Image 
            source={{ uri: item.imageUrl }} 
            style={styles.postImage} 
            resizeMode="cover"
          />
        )}
      </Card.Content>
    </Card>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActions}>
      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
        onPress={() => navigation.navigate('ShoppingList')}
      >
        <MaterialCommunityIcons name="cart" size={32} color="white" />
        <Text style={styles.actionText}>Lista de Compras</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
        onPress={() => navigation.navigate('Tasks')}
      >
        <MaterialCommunityIcons name="calendar-check" size={32} color="white" />
        <Text style={styles.actionText}>Tarefas</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
        onPress={() => navigation.navigate('HouseRules')}
      >
        <MaterialCommunityIcons name="book-open-variant" size={32} color="white" />
        <Text style={styles.actionText}>Regras da Casa</Text>
      </TouchableOpacity>
    </View>
  );

  const { greeting, emoji } = getGreeting();

  return (
    <ScrollView 
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.title}>{`${greeting} ${emoji}`}</Text>
          </View>
          <Text style={styles.subtitle}>Bem-vindo ao Agere</Text>
        </View>

         {/* Card de notificações */}
        {unreadMessages > 0 && (
          <View style={styles.notificationCard}>
            <MaterialCommunityIcons name="email-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.notificationText}>
              Você tem {unreadMessages} mensagens não lidas
            </Text>
          </View>
        )}

        {/* Seção de posts */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>Últimas Postagens</Text>
          <FlatList
            data={recentPosts}
            renderItem={renderPost}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.postsList}
          />
        </View>

        {/* Acesso rápido */}
        {renderQuickActions()}

        <FAB
          icon="account-group"
          style={styles.fab}
          onPress={() => setShowMembersList(true)}
        />

        <Portal>
          <Dialog visible={showMembersList} onDismiss={() => setShowMembersList(false)}>
            <Dialog.Title>Membros da Casa</Dialog.Title>
            <Dialog.Content>
              <HouseMembersList onAddMember={startScanner} />
              {isAdmin && (
                <Button 
                  mode="contained" 
                  onPress={() => {
                    setShowMembersList(false);
                    navigation.navigate('Conta', { 
                      screen: 'House' 
                    });
                  }}
                  style={styles.adminButton}
                >
                  Gerenciar Casa
                </Button>
              )}
            </Dialog.Content>
          </Dialog>

          <Dialog visible={showScanner} onDismiss={() => setShowScanner(false)}>
            <Dialog.Title>Adicionar Novo Membro</Dialog.Title>
            <Dialog.Content>
              {hasPermission && (
                <Camera
                  style={styles.scanner}
                  onBarCodeScanned={({ data }) => {
                    setShowScanner(false);
                    // Implementar lógica de adicionar membro
                  }}
                  barCodeScannerSettings={{
                    barCodeTypes: ['qr'],
                  }}
                />
              )}
            </Dialog.Content>
          </Dialog>
        </Portal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickAccessSection: {
    marginVertical: theme.spacing.m,
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.m,
    marginTop: theme.spacing.s,
  },
  quickAccessButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
    borderRadius: 12,
    padding: theme.spacing.m,
    elevation: 3,
  },
  quickAccessLabel: {
    color: '#fff',
    marginTop: theme.spacing.s,
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.l,
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: theme.spacing.s,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: theme.spacing.m,
    marginHorizontal: theme.spacing.m,
    marginTop: theme.spacing.m,
    marginBottom: theme.spacing.m,
    borderRadius: 8,
    elevation: 2,
  },
  notificationText: {
    marginLeft: theme.spacing.m,
    fontSize: 16,
    color: theme.colors.primary,
  },
  postsSection: {
    marginVertical: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: theme.spacing.m,
    marginBottom: theme.spacing.s,
  },
  postsList: {
    paddingHorizontal: theme.spacing.m,
  },
  postCard: {
    width: 280,
    marginRight: theme.spacing.m,
  },
  postImage: {
    height: 120,
    borderRadius: 8,
    marginTop: theme.spacing.s,
  },
  greetingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.m,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  scanner: {
    height: 300,
    width: '100%',
  },
  adminButton: {
    marginTop: theme.spacing.m,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: theme.spacing.m,
    marginTop: theme.spacing.m,
  },
  actionButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.s,
    elevation: 3,
  },
  actionText: {
    color: 'white',
    marginTop: theme.spacing.s,
    fontSize: 12,
    textAlign: 'center',
  },
});
