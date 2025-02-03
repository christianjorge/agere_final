import React, { useState } from 'react';
import { View, StyleSheet, Text, Alert, Image } from 'react-native'; 
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { AuthInput } from '../../components/AuthInput';
import { AuthButton } from '../../components/AuthButton';
import { theme } from '../../styles/theme';
import { getUserHouses } from '../../services/house';
import logo from '../../../assets/logo2x.png';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      
      // Verificar se o usuário tem casas
      const houses = await getUserHouses();
      
      if (houses.length === 1) {
        // Se tiver apenas uma casa, ir direto para o Main
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      } else {
        // Se não tiver casa ou tiver mais de uma, ir para a seleção
        navigation.reset({
          index: 0,
          routes: [{ name: 'HouseSelection' }],
        });
      }
    } catch (error) {
      console.error('Erro no login:', error);
      Alert.alert('Erro', 'Email ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={logo} style={styles.logo} />
      <Text style={styles.title}>Agere</Text>
      <Text style={styles.subtitle}>Gerenciamento de Repúblicas</Text>

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

        <AuthButton
          title="Entrar"
          onPress={handleLogin}
          loading={loading}
        />

        <AuthButton
          title="Criar conta"
          onPress={() => navigation.navigate('Cadastrar')}
          variant="secondary"
        />

        <AuthButton
          title="Esqueci minha senha"
          onPress={() => navigation.navigate('Recuperar Senha')}
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
  logo: {
    width: 150, 
    height: 150, 
    alignSelf: 'center', 
    marginBottom: theme.spacing.l, 
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