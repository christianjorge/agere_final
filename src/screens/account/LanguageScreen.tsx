import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, RadioButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../styles/theme';
import { useNavigation } from '@react-navigation/native';

export default function LanguageScreen() {
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const navigation = useNavigation();

  const languages = [
    { code: 'pt', name: 'Português' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' }
  ];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      await AsyncStorage.setItem('appLanguage', languageCode);
      // Aqui você pode adicionar a lógica para mudar o idioma do app
      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar idioma:', error);
    }
  };

  return (
    <View style={styles.container}>
      <List.Section>
        {languages.map(language => (
          <List.Item
            key={language.code}
            title={language.name}
            onPress={() => handleLanguageChange(language.code)}
            right={() => (
              <RadioButton
                value={language.code}
                status={selectedLanguage === language.code ? 'checked' : 'unchecked'}
                onPress={() => handleLanguageChange(language.code)}
              />
            )}
          />
        ))}
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});