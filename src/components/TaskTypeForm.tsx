import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, SegmentedButtons, Text } from 'react-native-paper';
import { theme } from '../styles/theme';

interface TaskTypeFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function TaskTypeForm({ onSubmit, onCancel }: TaskTypeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    frequency: 'custom',
    frequencyDays: '1',
    durationMonths: '1',
    points: '10'
  });

  const handleSubmit = () => {
    if (!formData.name || !formData.description) return;
    
    onSubmit({
      ...formData,
      points: parseInt(formData.points),
      frequencyDays: parseInt(formData.frequencyDays),
      durationMonths: parseInt(formData.durationMonths)
    });
  };

  return (
    <ScrollView style={styles.container}>
      <TextInput
        label="Nome da Tarefa"
        value={formData.name}
        onChangeText={name => setFormData({ ...formData, name })}
        style={styles.input}
        mode="outlined"
      />

      <TextInput
        label="Descrição"
        value={formData.description}
        onChangeText={description => setFormData({ ...formData, description })}
        multiline
        numberOfLines={3}
        style={styles.input}
        mode="outlined"
      />

      <TextInput
        label="Pontos"
        value={formData.points}
        onChangeText={points => setFormData({ ...formData, points })}
        keyboardType="numeric"
        style={styles.input}
        mode="outlined"
      />

      <Text style={styles.label}>Frequência</Text>
      <View style={styles.frequencyContainer}>
        <SegmentedButtons
          value={formData.frequency}
          onValueChange={frequency => setFormData({ ...formData, frequency })}
          buttons={[
            { value: 'daily', label: 'Diária' },
            { value: 'custom', label: 'Custom' }
          ]}
          style={styles.frequency}
        />
      </View>

      {formData.frequency === 'custom' && (
        <>
          <TextInput
            label="A cada quantos dias"
            value={formData.frequencyDays}
            onChangeText={days => setFormData({ ...formData, frequencyDays: days })}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Duração (em meses)"
            value={formData.durationMonths}
            onChangeText={months => setFormData({ ...formData, durationMonths: months })}
            keyboardType="numeric"
            style={styles.input}
            mode="outlined"
          />
        </>
      )}

      <View style={styles.buttons}>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancelar
        </Button>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          disabled={!formData.name || !formData.description}
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
  },
  label: {
    fontSize: 16,
    marginBottom: theme.spacing.s,
  },
  frequencyContainer: {
    marginBottom: theme.spacing.m,
  },
  frequency: {
    flexDirection: 'row',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.s,
  },
  button: {
    minWidth: 100,
  },
});