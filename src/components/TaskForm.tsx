import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, List, Text } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { theme } from '../styles/theme';
import { TaskType } from '../types/tasks';
import { HouseMember } from '../types/house';

interface TaskFormProps {
  taskTypes: TaskType[];
  members: HouseMember[];
  isAdmin: boolean;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function TaskForm({ 
  taskTypes, 
  members,
  isAdmin,
  onSubmit, 
  onCancel 
}: TaskFormProps) {
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [selectedDates, setSelectedDates] = useState<{[key: string]: any}>({});
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const handleDateSelect = (day: any) => {
    setSelectedDates(prev => {
      const newDates = { ...prev };
      if (newDates[day.dateString]) {
        delete newDates[day.dateString];
      } else {
        newDates[day.dateString] = { selected: true };
      }
      return newDates;
    });
  };

  const handleSubmit = () => {
    if (!selectedType || Object.keys(selectedDates).length === 0) return;
    
    onSubmit({
      typeId: selectedType,
      assignedTo: selectedMember || undefined,
      dates: Object.keys(selectedDates).map(date => new Date(date))
    });
  };

  const getSelectedTypeName = () => {
    const type = taskTypes.find(t => t.id === selectedType);
    return type ? type.name : 'Selecione um tipo';
  };

  const getSelectedMemberEmail = () => {
    if (!selectedMember) return 'Selecione um membro';
    const member = members.find(m => m.userId === selectedMember);
    return member ? member.email : 'Selecione um membro';
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
            description={type.description}
            onPress={() => {
              setSelectedType(type.id!);
              setShowTypeDropdown(false);
            }}
          />
        ))}
      </List.Accordion>

      {isAdmin && (
        <List.Accordion
          title={getSelectedMemberEmail()}
          expanded={showMemberDropdown}
          onPress={() => setShowMemberDropdown(!showMemberDropdown)}
        >
          <List.Item
            key="none"
            title="Sem atribuição específica"
            onPress={() => {
              setSelectedMember('');
              setShowMemberDropdown(false);
            }}
          />
          {members.map(member => (
            <List.Item
              key={member.userId}
              title={member.email}
              onPress={() => {
                setSelectedMember(member.userId);
                setShowMemberDropdown(false);
              }}
            />
          ))}
        </List.Accordion>
      )}

      <Button
        mode="outlined"
        onPress={() => setShowCalendar(!showCalendar)}
        style={styles.dateButton}
      >
        Selecionar Datas ({Object.keys(selectedDates).length} selecionadas)
      </Button>

      {showCalendar && (
        <Calendar
          markedDates={selectedDates}
          onDayPress={handleDateSelect}
          minDate={new Date().toISOString().split('T')[0]}
          markingType="multi-dot"
        />
      )}

      <View style={styles.buttons}>
        <Button mode="outlined" onPress={onCancel} style={styles.button}>
          Cancelar
        </Button>
        <Button 
          mode="contained" 
          onPress={handleSubmit}
          disabled={!selectedType || Object.keys(selectedDates).length === 0}
          style={styles.button}
        >
          Criar
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: theme.spacing.m,
  },
  dateButton: {
    marginVertical: theme.spacing.m,
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