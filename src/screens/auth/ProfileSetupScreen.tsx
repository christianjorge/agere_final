import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from '../../styles/theme';
import { updateProfile } from '../../services/profile';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function ProfileSetupScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birthday, setBirthday] = useState(new Date());
  const [pixKey, setPixKey] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const navigation = useNavigation();

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, preencha seu nome');
      return;
    }

    try {
      setLoading(true);
      await updateProfile({
        userId: user?.uid || '',
        name,
        phone,
        birthday,
        pixKey,
      });

      navigation.reset({
        index: 0,
        routes: [{ name: 'HouseSelection' }],
      });
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      Alert.alert('Erro', 'Não foi possível salvar seu perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete seu Perfil</Text>
        <Text style={styles.subtitle}>
          Por favor, preencha seus dados para continuar
        </Text>

        <TextInput
          label="Nome completo *"
          value={name}
          onChangeText={setName}
          style={styles.input}
          mode="outlined"
        />

        <TextInput
          label="Telefone"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          style={styles.input}
          mode="outlined"
        />

        <Button
          mode="outlined"
          onPress={() => setShowDatePicker(true)}
          style={styles.input}
        >
          {birthday ? birthday.toLocaleDateString() : 'Selecionar data de nascimento'}
        </Button>

        {showDatePicker && (
          <DateTimePicker
            value={birthday}
            mode="date"
            onChange={(event, date) => {
              setShowDatePicker(false);
              if (date) {
                setBirthday(date);
              }
            }}
          />
        )}

        <TextInput
          label="Chave PIX"
          value={pixKey}
          onChangeText={setPixKey}
          style={styles.input}
          mode="outlined"
        />

        <Text style={styles.note}>* Campo obrigatório</Text>

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          style={styles.button}
        >
          Continuar
        </Button>
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
    padding: theme.spacing.l,
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
  input: {
    marginBottom: theme.spacing.m,
  },
  note: {
    fontSize: 12,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.m,
  },
  button: {
    marginTop: theme.spacing.m,
  },
});