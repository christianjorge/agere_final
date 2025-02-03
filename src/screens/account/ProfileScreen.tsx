import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { TextInput, Button, Avatar, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { updateProfile, getProfile, UserProfile } from '../../services/profile';
import { theme } from '../../styles/theme';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile>({
    userId: user?.uid || '',
    name: user?.displayName || '',
    phone: '',
    birthday: new Date(),
    pixKey: '',
    photo: user?.photoURL || undefined,
  });
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const userProfile = await getProfile(user.uid);
      if (userProfile) {
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do perfil');
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfile({ ...profile, photo: result.assets[0].uri });
    }
  };

  const handleSave = async () => {
    if (!profile.name.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório');
      return;
    }

    try {
      setLoading(true);
      await updateProfile(profile);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.photoContainer}>
        <Avatar.Image
          size={120}
          source={profile.photo ? { uri: profile.photo } : require('../../../assets/default-avatar.png')}
        />
        <Button onPress={pickImage} style={styles.photoButton}>
          Alterar foto
        </Button>
      </View>

      <TextInput
        label="Nome completo"
        value={profile.name}
        onChangeText={name => setProfile({ ...profile, name })}
        style={styles.input}
      />

      <TextInput
        label="Telefone"
        value={profile.phone}
        onChangeText={phone => setProfile({ ...profile, phone })}
        keyboardType="phone-pad"
        style={styles.input}
      />

      <TextInput
        label="Chave PIX"
        value={profile.pixKey}
        onChangeText={pixKey => setProfile({ ...profile, pixKey })}
        style={styles.input}
      />

      <Button
        onPress={() => setShowDatePicker(true)}
        style={styles.dateButton}
      >
        {profile.birthday ? profile.birthday.toLocaleDateString() : 'Selecionar data de nascimento'}
      </Button>

      {showDatePicker && (
        <DateTimePicker
          value={profile.birthday || new Date()}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setProfile({ ...profile, birthday: date });
            }
          }}
        />
      )}

      <Button
        mode="contained"
        onPress={handleSave}
        loading={loading}
        style={styles.saveButton}
      >
        Salvar Alterações
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  photoContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.l,
  },
  photoButton: {
    marginTop: theme.spacing.m,
  },
  input: {
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
  },
  dateButton: {
    marginBottom: theme.spacing.m,
  },
  saveButton: {
    marginTop: theme.spacing.l,
  },
});