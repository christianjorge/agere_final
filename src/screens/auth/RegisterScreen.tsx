import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { AuthInput } from '../../components/AuthInput';
import { AuthButton } from '../../components/AuthButton';
import { theme } from '../../styles/theme';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { signUp } = useAuth();

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }
  
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }
  
    try {
      setLoading(true);
      await signUp(email, password);
      
      // Após o registro, redirecionar para completar o perfil
      navigation.reset({
        index: 0,
        routes: [{ name: 'ProfileSetup' }],
      });
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      Alert.alert('Erro', `Não foi possível criar a conta: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Criar Conta</Text>
      <Text style={styles.subtitle}>Preencha os dados para se cadastrar</Text>

      <View style={styles.form}>
        <AuthInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <AuthInput
          placeholder="Senha"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <AuthInput
          placeholder="Confirmar Senha"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <AuthButton
          title="Cadastrar"
          onPress={handleRegister}
          loading={loading}
        />

        <AuthButton
          title="Voltar para login"
          onPress={() => navigation.goBack()}
          variant="secondary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.l,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.s,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
});