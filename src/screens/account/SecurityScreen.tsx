import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Switch, List } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';

export default function SecurityScreen() {
  const { user, updatePassword } = useAuth();
  const [pinEnabled, setPinEnabled] = useState(false);
  const [pin, setPin] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkPinStatus();
  }, []);

  const checkPinStatus = async () => {
    try {
      const savedPin = await AsyncStorage.getItem('appPin');
      setPinEnabled(!!savedPin);
    } catch (error) {
      console.error('Erro ao verificar PIN:', error);
    }
  };

  const handlePinToggle = async (value: boolean) => {
    if (value) {
      setPinEnabled(true);
    } else {
      await AsyncStorage.removeItem('appPin');
      setPinEnabled(false);
      setPin('');
    }
  };

  const handleSavePin = async () => {
    if (pin.length !== 4) {
      Alert.alert('Erro', 'O PIN deve ter 4 dígitos');
      return;
    }

    try {
      await AsyncStorage.setItem('appPin', pin);
      Alert.alert('Sucesso', 'PIN configurado com sucesso');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o PIN');
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    try {
      setLoading(true);
      await updatePassword(currentPassword, newPassword);
      Alert.alert('Sucesso', 'Senha alterada com sucesso');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível alterar a senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Subheader>PIN de Acesso</List.Subheader>
        <List.Item
          title="Habilitar PIN"
          right={() => (
            <Switch
              value={pinEnabled}
              onValueChange={handlePinToggle}
            />
          )}
        />

        {pinEnabled && (
          <View style={styles.pinSection}>
            <TextInput
              label="PIN (4 dígitos)"
              value={pin}
              onChangeText={setPin}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              style={styles.input}
            />
            <Button mode="contained" onPress={handleSavePin}>
              Salvar PIN
            </Button>
          </View>
        )}
      </List.Section>

      <List.Section>
        <List.Subheader>Alterar Senha</List.Subheader>
        <View style={styles.passwordSection}>
          <TextInput
            label="Senha Atual"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            label="Nova Senha"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            style={styles.input}
          />
          <TextInput
            label="Confirmar Nova Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
          />
          <Button
            mode="contained"
            onPress={handleChangePassword}
            loading={loading}
          >
            Alterar Senha
          </Button>
        </View>
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  pinSection: {
    padding: theme.spacing.m,
  },
  passwordSection: {
    padding: theme.spacing.m,
  },
  input: {
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
  },
});