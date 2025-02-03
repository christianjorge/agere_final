import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, Button, Checkbox, Text } from 'react-native-paper';
import { theme } from '../styles/theme';
import { TaskType } from '../types/tasks';
import { HouseMember } from '../types/house';

interface TaskRotationSetupProps {
  taskTypes: TaskType[];
  members: HouseMember[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function TaskRotationSetup({ 
  taskTypes, 
  members,
  onSubmit, 
  onCancel 
}: TaskRotationSetupProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSubmit = () => {
    if (!selectedType || selectedMembers.length === 0) return;
    
    onSubmit({
      taskTypeId: selectedType,
      members: selectedMembers
    });
  };

  const getSelectedTypeName = () => {
    const type = taskTypes.find(t => t.id === selectedType);
    return type ? type.name : 'Selecione um tipo';
  };

  return (
    <ScrollView style={styles.container}>
      <List.Accordion
        title={getSelectedTypeName()}
        expanded={showTypeDropdown}
        onPress={() => setShowTypeDropdown(!showTypeDropdown)}
      >
        {taskTypes.map(type => (
          <List.Item
            key={type.id}
            title={type.name}
            onPress={() => {
              setSelectedType(type.id!);
              setShowTypeDropdown(false);
            }}
          />
        ))}
      </List.Accordion>

      <Text style={styles.label}>Selecione os Membros</Text>
      {members.map(member => (
        <List.Item
          key={member.userId}
          title={member.email}
          right={() => (
            <Checkbox
              status={selectedMembers.includes(member.userId) ? 'checked' : 'unchecked'}
              onPress={() => toggleMember(member.userId)}
            />
          )}
        />
      ))}

      <View style={styles.buttons}>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancelar
        </Button>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          disabled={!selectedType || selectedMembers.length === 0}
          style={styles.button}
        >
          Configurar
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.m,
  },
  label: {
    fontSize: 16,
    marginBottom: theme.spacing.s,
    marginTop: theme.spacing.m,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: theme.spacing.s,
    marginTop: theme.spacing.m,
  },
  button: {
    minWidth: 100,
  },
});