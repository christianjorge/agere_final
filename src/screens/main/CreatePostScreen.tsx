import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { AuthButton } from '../../components/AuthButton';
import { theme } from '../../styles/theme';
import { createPost, updatePost } from '../../services/posts';

export default function CreatePostScreen({ navigation, route }) {
  const editingPost = route.params?.post;
  const [title, setTitle] = useState(editingPost?.title || '');
  const [content, setContent] = useState(editingPost?.content || '');
  const [image, setImage] = useState(editingPost?.imageUrl || null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title || !content) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      if (editingPost) {
        await updatePost(editingPost.id, title, content, image);
      } else {
        await createPost(title, content, image);
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Título"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="Conteúdo"
        value={content}
        onChangeText={setContent}
        style={styles.input}
        multiline
        numberOfLines={6}
        mode="outlined"
      />

      <Button
        mode="outlined"
        onPress={pickImage}
        style={styles.imageButton}
      >
        {image ? 'Trocar Imagem' : 'Adicionar Imagem'}
      </Button>

      {image && (
        <Image
          source={{ uri: image }}
          style={styles.preview}
          resizeMode="cover"
        />
      )}

      <AuthButton
        title={editingPost ? "Salvar Alterações" : "Criar Post"}
        onPress={handleSave}
        loading={loading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  input: {
    marginBottom: theme.spacing.m,
    backgroundColor: '#fff',
  },
  imageButton: {
    marginBottom: theme.spacing.m,
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: theme.spacing.m,
  },
});