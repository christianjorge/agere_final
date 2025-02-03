import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Platform, Image, Alert } from 'react-native';
import { TextInput, IconButton, Avatar, Text, ActivityIndicator, Portal, Dialog, Button} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';
import { Message, sendMessage, getMessages, markAsRead, deleteMessage } from '../../services/chat';
import { useAuth } from '../../contexts/AuthContext';

export default function ChatConversationScreen({ route }) {
  const { user: chatUser } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    const unsubscribe = getMessages(chatUser.id, (updatedMessages) => {
      setMessages(updatedMessages);
      setLoading(false);
      markAsRead(chatUser.id);
    });

    return () => unsubscribe();
  }, [chatUser.id]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage(chatUser.id, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };

  const handleImagePick = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      try {
        await sendMessage(chatUser.id, '', result.assets[0].uri);
      } catch (error) {
        console.error('Erro ao enviar imagem:', error);
      }
    }
  };

  const handleTyping = (text: string) => {
    setNewMessage(text);
    setIsTyping(true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    
    // Se for um timestamp do Firestore
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
    
    // Se for uma data normal
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleLongPress = (message: Message) => {
    if (message.senderId === user?.uid) {
      setSelectedMessage(message);
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteMessage = async () => {
    if (!selectedMessage) return;

    try {
      await deleteMessage(selectedMessage.id!);
      setShowDeleteDialog(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Erro ao deletar mensagem:', error);
      Alert.alert('Erro', 'Não foi possível apagar a mensagem');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.senderId === user?.uid;

    return (
      <TouchableOpacity 
        onLongPress={() => handleLongPress(item)}
        activeOpacity={0.7}
      >
        <View style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage
        ]}>
          {item.imageUrl ? (
            <TouchableOpacity onPress={() => {/* Implementar visualização da imagem */}}>
              <Image 
                source={{ uri: item.imageUrl }} 
                style={styles.messageImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            <Text style={[
              styles.messageText,
              isOwnMessage ? styles.ownMessageText : styles.otherMessageText
            ]}>
              {item.content}
            </Text>
          )}
          <Text style={[
            styles.timeText,
            isOwnMessage ? styles.ownTimeText : styles.otherTimeText
          ]}>
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id!}
        contentContainerStyle={styles.listContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        inverted
      />

      <View style={styles.inputContainer}>
        <IconButton
          icon="image"
          size={24}
          onPress={handleImagePick}
        />
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={handleTyping}
          placeholder="Digite sua mensagem..."
          multiline
          maxLength={500}
        />
        <IconButton
          icon="send"
          size={24}
          onPress={handleSend}
          disabled={!newMessage.trim()}
        />
      </View>

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Apagar mensagem?</Dialog.Title>
          <Dialog.Content>
            <Text>Você deseja apagar esta mensagem?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>Cancelar</Button>
            <Button onPress={handleDeleteMessage} color={theme.colors.error}>Apagar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: theme.spacing.m,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: theme.spacing.m,
    borderRadius: 16,
    marginBottom: theme.spacing.m,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#000',
  },
  timeText: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.m,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: theme.spacing.m,
    maxHeight: 100,
  },
  ownTimeText: {
    color: '#fff',
    opacity: 0.8,
  },
  otherTimeText: {
    color: '#000',
    opacity: 0.6,
  },
});