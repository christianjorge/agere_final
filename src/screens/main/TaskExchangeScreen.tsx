import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Alert, ActivityIndicator } from 'react-native';
import { List, Avatar, Button, Text } from 'react-native-paper';
import { theme } from '../../styles/theme';
import { getHouseMembers } from '../../services/house';
import { HouseMember } from '../../types/house';
import { Task } from '../../types/tasks';
import { completeTask } from '../../services/tasks';
import { getProfile } from '../../services/profile';

interface TaskExchangeScreenProps {
  route: {
    params: {
      task: Task;
    };
  };
  navigation: any;
}

export default function TaskExchangeScreen({ route, navigation }: TaskExchangeScreenProps) {
  const { task } = route.params;
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [memberProfiles, setMemberProfiles] = useState<{[key: string]: any}>({});

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const houseMembers = await getHouseMembers();
      setMembers(houseMembers.filter(m => m.userId !== task.assignedTo));
      
      // Carregar perfis dos membros
      const profiles = {};
      for (const member of houseMembers) {
        const profile = await getProfile(member.userId);
        if (profile) {
          profiles[member.userId] = profile;
        }
      }
      setMemberProfiles(profiles);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      Alert.alert('Erro', 'Não foi possível carregar os membros');
    } finally {
      setLoading(false);
    }
  };

  const handleExchangeRequest = async (memberId: string) => {
    try {
      // Por enquanto, vamos apenas trocar o assignedTo da tarefa
      await completeTask(task.id!, [], memberId);
      Alert.alert('Sucesso', 'Tarefa transferida com sucesso!');
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao transferir tarefa:', error);
      Alert.alert('Erro', 'Não foi possível transferir a tarefa');
    }
  };

  const renderMember = ({ item }: { item: HouseMember }) => (
    <List.Item
      title={memberProfiles[item.userId]?.name || item.email}
      description={item.email}
      left={props => (
        <Avatar.Image
          {...props}
          size={40}
          source={
            memberProfiles[item.userId]?.photo 
              ? { uri: memberProfiles[item.userId].photo }
              : require('../../../assets/default-avatar.png')
          }
        />
      )}
      right={props => (
        <Button
          mode="contained"
          onPress={() => handleExchangeRequest(item.userId)}
        >
          Transferir
        </Button>
      )}
    />
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (members.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.emptyText}>
          Não há outros membros disponíveis para transferir a tarefa.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Transferir tarefa para:</Text>
      <Text style={styles.taskTitle}>{task.title}</Text>

      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={item => item.id!}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.l,
  },
  title: {
    fontSize: 18,
    marginVertical: theme.spacing.m,
    marginHorizontal: theme.spacing.m,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.l,
    marginHorizontal: theme.spacing.m,
  },
  listContainer: {
    padding: theme.spacing.m,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: theme.colors.placeholder,
  },
});