import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import { List, Avatar, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { getProfile } from '../../services/profile';

export default function AccountScreen() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const userProfile = await getProfile(user.uid);
      setProfile(userProfile);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Auth' }], // Mudamos de 'Login' para 'Auth'
      });
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image
          size={80}
          source={profile?.photo ? { uri: profile.photo } : require('../../../assets/default-avatar.png')}
        />
        <Text style={styles.name}>{profile?.name || user?.displayName || 'Usuário'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <Divider />

      <List.Item
        title="Meu Perfil"
        left={props => <List.Icon {...props} icon="account" />}
        onPress={() => navigation.navigate('Profile')}
      />

      <List.Item
        title="Minha Casa"
        left={props => <List.Icon {...props} icon="home" />}
        onPress={() => navigation.navigate('House')}
      />

      <List.Item
        title="Notificações"
        left={props => <List.Icon {...props} icon="bell" />}
        onPress={() => navigation.navigate('NotificationSettings')}
      />

      <List.Item
        title="Idioma"
        left={props => <List.Icon {...props} icon="translate" />}
        onPress={() => navigation.navigate('Language')}
      />

      <List.Item
        title="Segurança"
        left={props => <List.Icon {...props} icon="shield" />}
        onPress={() => navigation.navigate('Security')}
      />

      <List.Item
        title="Termos de Serviço"
        left={props => <List.Icon {...props} icon="file-document" />}
        onPress={() => navigation.navigate('Terms')}
      />

      <List.Item
        title="Sair"
        left={props => <List.Icon {...props} icon="logout" color={theme.colors.error} />}
        onPress={handleLogout}
        titleStyle={{ color: theme.colors.error }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.l,
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: theme.spacing.m,
  },
  email: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.s,
  },
});