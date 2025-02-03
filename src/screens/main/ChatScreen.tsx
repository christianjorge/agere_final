import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { List, Avatar, Searchbar, Badge, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { ChatUser, getUsers, getUnreadCount } from '../../services/chat';
import { useAuth } from '../../contexts/AuthContext';
import { getProfile } from '../../services/profile';

export default function ChatScreen() {
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});
  const [userProfiles, setUserProfiles] = useState<{[key: string]: any}>({});
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadUsers();
    const interval = setInterval(loadUnreadCounts, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadUsers = async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
      await loadUnreadCounts();
      await loadUserProfiles(fetchedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfiles = async (users: ChatUser[]) => {
    try {
      const profiles = {};
      for (const user of users) {
        const profile = await getProfile(user.id);
        if (profile) {
          profiles[user.id] = profile;
        }
      }
      setUserProfiles(profiles);
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const counts = {};
      for (const chatUser of users) {
        counts[chatUser.id] = await getUnreadCount(chatUser.id);
      }
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Erro ao carregar contagem de mensagens:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query) {
      const filtered = users.filter(user => 
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.name?.toLowerCase().includes(query.toLowerCase())
      );
      setUsers(filtered);
    } else {
      loadUsers();
    }
  };

  const getInitials = (email: string) => {
    if (!email) return '?';
    const parts = email.split('@');
    return parts[0].charAt(0).toUpperCase();
  };

  const getRandomColor = (userId: string) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
    const index = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const renderUser = ({ item }: { item: ChatUser }) => (
    <TouchableOpacity 
      onPress={() => navigation.navigate('ChatConversation', { user: item })}
    >
      <List.Item
        title={item.name || item.email}
        description={item.lastMessage || 'Nenhuma mensagem'}
        left={props => (
          <View>
            {userProfiles[item.id]?.photo ? (
              <Avatar.Image
                {...props}
                size={50}
                source={{ uri: userProfiles[item.id].photo }}
                style={styles.avatar}
              />
            ) : (
              <Avatar.Text
                {...props}
                size={50}
                label={getInitials(item.email)}
                style={[styles.avatar, { backgroundColor: getRandomColor(item.id) }]}
              />
            )}
            {item.online && <Badge style={styles.onlineBadge} />}
          </View>
        )}
        right={props => 
          unreadCounts[item.id] > 0 && (
            <Badge {...props} style={styles.unreadBadge}>
              {unreadCounts[item.id]}
            </Badge>
          )
        }
      />
      <Divider />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Buscar conversas..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={users}
        renderItem={renderUser}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        onRefresh={loadUsers}
        refreshing={loading}
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
    flexGrow: 1,
  },
  avatar: {
    marginRight: theme.spacing.s,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4CAF50',
    size: 12,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    alignSelf: 'center',
  },
});