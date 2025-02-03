import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image } from 'react-native';
import { TextInput, Button, List, IconButton, Chip, Text } from 'react-native-paper';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../styles/theme';
import { HouseMember } from '../types/house';

const CATEGORIES = [
  { label: 'Mercado', value: 'Mercado', icon: 'cart' },
  { label: 'Aluguel', value: 'Aluguel', icon: 'home' },
  { label: 'Água', value: 'Água', icon: 'water' },
  { label: 'Luz', value: 'Luz', icon: 'lightbulb' },
  { label: 'Internet', value: 'Internet', icon: 'wifi' },
  { label: 'Outros', value: 'Outros', icon: 'dots-horizontal' }
];

export interface ExpenseFormData {
  title: string;
  amount: string;
  category: string;
  description: string;
  date: Date;
  splitBetween: string[];
}

interface ExpenseFormProps {
  initialData?: ExpenseFormData;
  onSubmit: (data: ExpenseFormData, receiptImage: string | null) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  members: HouseMember[];
}

export default function ExpenseForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false,
  members 
}: ExpenseFormProps) {
  const [formData, setFormData] = useState<ExpenseFormData>(initialData || {
    title: '',
    amount: '',
    category: CATEGORIES[0].value,
    description: '',
    date: new Date(),
    splitBetween: []
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const toggleMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      splitBetween: prev.splitBetween.includes(memberId)
        ? prev.splitBetween.filter(id => id !== memberId)
        : [...prev.splitBetween, memberId]
    }));
  };

  const selectAllMembers = () => {
    setFormData(prev => ({
      ...prev,
      splitBetween: members.map(m => m.userId)
    }));
  };

  const handleSubmit = () => {
    if (formData.splitBetween.length === 0) {
      alert('Selecione pelo menos um membro para dividir a despesa');
      return;
    }
    onSubmit(formData, receiptImage);
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        label="Título"
        value={formData.title}
        onChangeText={title => setFormData(prev => ({ ...prev, title }))}
        style={styles.input}
        mode="outlined"
      />
      
      <TextInput
        label="Valor"
        value={formData.amount}
        onChangeText={amount => setFormData(prev => ({ ...prev, amount }))}
        keyboardType="decimal-pad"
        style={styles.input}
        mode="outlined"
      />

      <TextInput
        label="Categoria"
        value={CATEGORIES.find(cat => cat.value === formData.category)?.label}
        onFocus={() => setShowCategories(true)}
        style={styles.input}
        mode="outlined"
        right={<TextInput.Icon icon="menu-down" onPress={() => setShowCategories(!showCategories)} />}
      />

      {showCategories && (
        <View style={styles.categoriesList}>
          {CATEGORIES.map(category => (
            <List.Item
              key={category.value}
              title={category.label}
              left={props => <List.Icon {...props} icon={category.icon} />}
              onPress={() => {
                setFormData(prev => ({ ...prev, category: category.value }));
                setShowCategories(false);
              }}
            />
          ))}
        </View>
      )}

      <TextInput
        label="Descrição"
        value={formData.description}
        onChangeText={description => setFormData(prev => ({ ...prev, description }))}
        multiline
        style={styles.input}
        mode="outlined"
      />

      <Button
        onPress={() => setShowDatePicker(true)}
        mode="outlined"
        style={styles.dateButton}
      >
        {formData.date.toLocaleDateString()}
      </Button>

      {showDatePicker && (
        <DateTimePicker
          value={formData.date}
          mode="date"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              setFormData(prev => ({ ...prev, date }));
            }
          }}
        />
      )}

      <Button
        mode="outlined"
        onPress={pickImage}
        style={styles.uploadButton}
        icon="file-upload"
      >
        {receiptImage ? 'Trocar comprovante' : 'Anexar comprovante'}
      </Button>

      {receiptImage && (
        <View style={styles.receiptPreviewContainer}>
          <Image
            source={{ uri: receiptImage }}
            style={styles.receiptPreview}
            resizeMode="cover"
          />
          <IconButton
            icon="close"
            size={20}
            style={styles.removeReceiptButton}
            onPress={() => setReceiptImage(null)}
          />
        </View>
      )}

      <Text style={styles.membersTitle}>Dividir com:</Text>
      <Button
        mode="outlined"
        onPress={selectAllMembers}
        style={styles.selectAllButton}
      >
        Selecionar Todos
      </Button>

      <View style={styles.membersList}>
        {members.map(member => (
          <Chip
            key={member.userId}
            selected={formData.splitBetween.includes(member.userId)}
            onPress={() => toggleMember(member.userId)}
            style={styles.memberChip}
            mode={formData.splitBetween.includes(member.userId) ? 'flat' : 'outlined'}
          >
            {member.email}
          </Chip>
        ))}
      </View>

      <View style={styles.buttonContainer}>
        <Button 
          mode="outlined" 
          onPress={onCancel}
          style={styles.button}
        >
          Cancelar
        </Button>
        <Button 
          mode="contained"
          onPress={handleSubmit}
          loading={loading}
          disabled={loading}
          style={styles.button}
        >
          Salvar
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.m,
  },
  input: {
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
  },
  dateButton: {
    marginBottom: theme.spacing.m,
  },
  uploadButton: {
    marginBottom: theme.spacing.m,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.m,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.spacing.s,
  },
  categoriesList: {
    marginTop: -theme.spacing.m,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    elevation: 2,
  },
  receiptPreviewContainer: {
    position: 'relative',
    marginBottom: theme.spacing.m,
  },
  receiptPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeReceiptButton: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: theme.colors.error,
  },
  membersTitle: {
    fontSize: 16,
    marginBottom: theme.spacing.s,
    color: theme.colors.placeholder,
  },
  selectAllButton: {
    marginBottom: theme.spacing.m,
  },
  membersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.m,
  },
  memberChip: {
    margin: 4,
  },
});