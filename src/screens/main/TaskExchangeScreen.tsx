import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Button } from 'react-native-paper';
import { theme } from '../../styles/theme';
import { ChatUser, getUsers } from '../../services/chat';
import { requestTaskExchange, respondToExchange } from '../../services/tasks';

export default function TaskExchangeScreen({ route }) {
  const { task } = route.params;
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const fetchedUsers = await getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeRequest = async (userId: string) => {
    try {
      await requestTaskExchange(task.id!, userId);
      // Navegar de volta ou mostrar confirmação
    } catch (error) {
      console.error('Erro ao solicitar troca:', error);
    }
  };

  const renderUser = ({ item }: { item: ChatUser }) => (
    <View style={styles.userCard}>
      <Text style={styles.userEmail}>{item.email}</Text>
      <Button
        mode="contained"
        onPress={() => handleExchangeRequest(item.id)}
      >
        Solicitar Troca
      </Button>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Escolha um usuário para trocar a tarefa:</Text>
      <Text style={styles.taskTitle}>{task.title}</Text>

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
    padding: theme.spacing.m,
  },
  title: {
    fontSize: 18,
    marginBottom: theme.spacing.m,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.l,
  },
  listContainer: {
    paddingTop: theme.spacing.m,
  },
  userCard: {
    backgroundColor: '#fff',
    padding: theme.spacing.m,
    borderRadius: 8,
    marginBottom: theme.spacing.m,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userEmail: {
    fontSize: 16,
  },
});