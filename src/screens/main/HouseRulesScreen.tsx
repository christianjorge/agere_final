import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';
import { getHouseDetails } from '../../services/house';
import { useAuth } from '../../contexts/AuthContext';

export default function HouseRulesScreen() {
  const [rules, setRules] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const house = await getHouseDetails();
      setRules(house?.rules || 'Nenhuma regra definida.');
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Regras da Casa</Text>
        <Text style={styles.rules}>{rules}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.m,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
  rules: {
    fontSize: 16,
    lineHeight: 24,
  },
});