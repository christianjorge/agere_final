import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Switch } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../styles/theme';

export default function NotificationSettingsScreen() {
  const [settings, setSettings] = useState({
    tasks: true,
    expenses: true,
    posts: true,
    chat: true,
    newMembers: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const updateSetting = async (key: string, value: boolean) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Notificações</List.Subheader>
        
        <List.Item
          title="Tarefas"
          description="Lembretes de tarefas e trocas"
          right={() => (
            <Switch
              value={settings.tasks}
              onValueChange={value => updateSetting('tasks', value)}
            />
          )}
        />

        <List.Item
          title="Despesas"
          description="Novos gastos e pagamentos"
          right={() => (
            <Switch
              value={settings.expenses}
              onValueChange={value => updateSetting('expenses', value)}
            />
          )}
        />

        <List.Item
          title="Postagens"
          description="Novas postagens e comentários"
          right={() => (
            <Switch
              value={settings.posts}
              onValueChange={value => updateSetting('posts', value)}
            />
          )}
        />

        <List.Item
          title="Chat"
          description="Novas mensagens"
          right={() => (
            <Switch
              value={settings.chat}
              onValueChange={value => updateSetting('chat', value)}
            />
          )}
        />

        <List.Item
          title="Novos Membros"
          description="Entrada de novos moradores"
          right={() => (
            <Switch
              value={settings.newMembers}
              onValueChange={value => updateSetting('newMembers', value)}
            />
          )}
        />
      </List.Section>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});