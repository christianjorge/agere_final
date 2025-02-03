import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import { List, Text } from 'react-native-paper';
import { theme } from '../../styles/theme';
import { AdminLog, getRecentLogs } from '../../services/adminLogs';

export default function AdminLogsScreen() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const recentLogs = await getRecentLogs();
      setLogs(recentLogs);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderLog = ({ item }: { item: AdminLog }) => (
    <List.Item
      title={item.action}
      description={`Por: ${item.performedByEmail}\n${new Date(item.timestamp).toLocaleString()}`}
      left={props => <List.Icon {...props} icon="history" />}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        renderItem={renderLog}
        keyExtractor={item => item.id!}
        contentContainerStyle={styles.listContainer}
        onRefresh={loadLogs}
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
  listContainer: {
    padding: theme.spacing.m,
  },
});