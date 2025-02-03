import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Avatar, Button, IconButton } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { theme } from '../styles/theme';
import { getHouseMembers, removeMember } from '../services/house';
import { HouseMember } from '../types/house';
import { getProfile } from '../services/profile';

interface HouseMembersListProps {
  onAddMember: () => void;
}

export function HouseMembersList({ onAddMember }: HouseMembersListProps) {
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [memberProfiles, setMemberProfiles] = useState<{[key: string]: any}>({});
  const { user } = useAuth();

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const houseMembers = await getHouseMembers();
      setMembers(houseMembers);
      setIsAdmin(houseMembers.find(m => m.userId === user?.uid)?.isAdmin || false);
      
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
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      loadMembers();
    } catch (error) {
      console.error('Erro ao remover membro:', error);
    }
  };

  const renderMember = ({ item }: { item: HouseMember }) => (
    <List.Item
      title={item.email}
      description={item.isAdmin ? 'Administrador' : 'Membro'}
      left={props => (
        <Avatar.Image
          {...props}
          size={40}
          source={
            memberProfiles[item.userId]?.photo 
              ? { uri: memberProfiles[item.userId].photo }
              : require('../../assets/default-avatar.png')
          }
        />
      )}
      right={props => 
        isAdmin && item.userId !== user?.uid && (
          <IconButton
            icon="delete"
            onPress={() => handleRemoveMember(item.id!)}
            color={theme.colors.error}
          />
        )
      }
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={members}
        renderItem={renderMember}
        keyExtractor={item => item.id!}
        contentContainerStyle={styles.list}
      />
      
      {isAdmin && (
        <Button
          mode="contained"
          onPress={onAddMember}
          style={styles.addButton}
        >
          Adicionar Membro
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 400,
  },
  list: {
    paddingVertical: theme.spacing.s,
  },
  addButton: {
    marginTop: theme.spacing.m,
  },
});