import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { FAB, Portal, Dialog, Text, Card, Button, IconButton, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { Task, TaskType } from '../../types/tasks';
import { getTasks, getTaskTypes, completeTask, verifyTask, createTask, createTaskType, setupTaskRotation } from '../../services/tasks';
import TaskForm from '../../components/TaskForm';
import TaskTypeForm from '../../components/TaskTypeForm';
import TaskRotationSetup from '../../components/TaskRotationSetup';
import { getHouseMembers } from '../../services/house';
import { HouseMember } from '../../types/house';

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskTypes, setTaskTypes] = useState<TaskType[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showTypeDialog, setShowTypeDialog] = useState(false);
  const [showRotationDialog, setShowRotationDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [view, setView] = useState<'all' | 'mine' | 'pending'>('mine');
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [fabMenuExpanded, setFabMenuExpanded] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [fetchedTasks, fetchedTypes, houseMembers] = await Promise.all([
        getTasks(),
        getTaskTypes(),
        getHouseMembers()
      ]);
      
      setTasks(fetchedTasks || []);
      setTaskTypes(fetchedTypes || []);
      setMembers(houseMembers || []);
      setIsAdmin(houseMembers.find(m => m.userId === user?.uid)?.isAdmin || false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (formData: any) => {
    try {
      const promises = formData.dates.map(date => 
        createTask({
          typeId: formData.typeId,
          assignedTo: formData.assignedTo || user!.uid,
          dueDate: date,
          completed: false,
          points: taskTypes.find(t => t.id === formData.typeId)?.points || 10
        })
      );

      await Promise.all(promises);
      setShowAddDialog(false);
      loadData();
      Alert.alert('Sucesso', 'Tarefas criadas com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tarefas:', error);
      Alert.alert('Erro', 'Não foi possível criar as tarefas');
    }
  };

  const handleAddTaskType = async (formData: any) => {
    try {
      await createTaskType({
        name: formData.name,
        description: formData.description,
        frequency: formData.frequency,
        frequencyDays: formData.frequencyDays,
        points: formData.points,
        active: true
      });
      setShowTypeDialog(false);
      loadData();
      Alert.alert('Sucesso', 'Tipo de tarefa criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar tipo de tarefa:', error);
      Alert.alert('Erro', 'Não foi possível criar o tipo de tarefa');
    }
  };

  const handleSetupRotation = async (formData: any) => {
    try {
      await setupTaskRotation(formData.taskTypeId, formData.members);
      setShowRotationDialog(false);
      loadData();
      Alert.alert('Sucesso', 'Rotação configurada com sucesso!');
    } catch (error) {
      console.error('Erro ao configurar rotação:', error);
      Alert.alert('Erro', 'Não foi possível configurar a rotação');
    }
  };

  const handleComplete = async (taskId: string) => {
    try {
      await completeTask(taskId);
      loadData();
      Alert.alert('Sucesso', 'Tarefa concluída com sucesso!');
    } catch (error) {
      console.error('Erro ao concluir tarefa:', error);
      Alert.alert('Erro', 'Não foi possível concluir a tarefa');
    }
  };

  const handleVerify = async (taskId: string) => {
    try {
      const rating = 5;
      const feedback = 'Ótimo trabalho!';
      
      await verifyTask(taskId, rating, feedback);
      loadData();
      Alert.alert('Sucesso', 'Tarefa verificada com sucesso!');
    } catch (error) {
      console.error('Erro ao verificar tarefa:', error);
      Alert.alert('Erro', 'Não foi possível verificar a tarefa');
    }
  };

  const filterTasks = () => {
    if (!tasks) return [];
    
    let filteredTasks = [...tasks];
    
    switch (view) {
      case 'mine':
        filteredTasks = filteredTasks.filter(task => task.assignedTo === user?.uid);
        break;
      case 'pending':
        filteredTasks = filteredTasks.filter(task => !task.completed);
        break;
    }

    // Ordenar: primeiro as não concluídas, depois por data
    return filteredTasks.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  };

  const getResponsibleName = (userId: string) => {
    const member = members.find(m => m.userId === userId);
    return member?.email || 'Usuário não encontrado';
  };

  const renderTaskCard = ({ item: task }: { item: Task }) => {
    const taskType = taskTypes.find(t => t.id === task.typeId);
    const responsibleName = getResponsibleName(task.assignedTo);
    
    return (
      <Card style={styles.taskCard}>
        <Card.Content>
          <View style={styles.taskHeader}>
            <Text style={styles.taskTitle}>{taskType?.name}</Text>
            <Text style={styles.taskDue}>
              Vence em: {new Date(task.dueDate).toLocaleDateString()}
            </Text>
          </View>

          <Text style={styles.taskDescription}>
            {taskType?.description}
          </Text>

          <Text style={styles.responsibleText}>
            Responsável: {responsibleName}
          </Text>

          {task.completed && task.completedAt && (
            <View style={styles.completedInfo}>
              <Text>Concluída em: {task.completedAt.toDate().toLocaleDateString()}</Text>
              {task.rating && (
                <View style={styles.rating}>
                  <Text>Avaliação: {task.rating}/5</Text>
                  {task.feedback && (
                    <Text style={styles.feedback}>{task.feedback}</Text>
                  )}
                </View>
              )}
            </View>
          )}
        </Card.Content>

        <Card.Actions>
          {!task.completed && task.assignedTo === user?.uid && (
            <Button
              mode="contained"
              onPress={() => handleComplete(task.id!)}
            >
              Concluir
            </Button>
          )}
          {task.completed && !task.verifiedBy && isAdmin && task.assignedTo !== user?.uid && (
            <Button
              mode="contained"
              onPress={() => handleVerify(task.id!)}
            >
              Verificar
            </Button>
          )}
        </Card.Actions>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={view}
        onValueChange={value => setView(value as typeof view)}
        buttons={[
          { value: 'mine', label: 'Minhas' },
          { value: 'pending', label: 'Pendentes' },
          { value: 'all', label: 'Todas' }
        ]}
        style={styles.viewSelector}
      />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator style={styles.loader} />
        ) : (
          filterTasks().map(task => (
            <View key={task.id}>
              {renderTaskCard({ item: task })}
            </View>
          ))
        )}
        
        <View style={styles.fabSpace} />
      </ScrollView>

      <View style={styles.fabContainer}>
        {isAdmin && (
          <FAB
            icon={fabMenuExpanded ? 'chevron-down' : 'chevron-up'}
            style={[styles.fab, styles.toggleFab]}
            onPress={() => setFabMenuExpanded(!fabMenuExpanded)}
          />
        )}
        {isAdmin && fabMenuExpanded && (
          <>
            <FAB
              icon="cog"
              label="Configurar Tipos"
              style={[styles.fab, styles.configFab]}
              onPress={() => setShowTypeDialog(true)}
            />
            <FAB
              icon="account-group"
              label="Configurar Rotação"
              style={[styles.fab, styles.rotationFab]}
              onPress={() => setShowRotationDialog(true)}
            />
          </>
        )}
        <FAB
          icon="plus"
          label="Nova Tarefa"
          style={[styles.fab, styles.mainFab]}
          onPress={() => setShowAddDialog(true)}
        />
      </View>

      <Portal>
        <Dialog 
          visible={showAddDialog} 
          onDismiss={() => setShowAddDialog(false)}
          dismissable={false}
        >
          <Dialog.Title>Nova Tarefa</Dialog.Title>
          <Dialog.ScrollArea>
            <TaskForm
              taskTypes={taskTypes}
              members={members}
              isAdmin={isAdmin}
              onSubmit={handleAddTask}
              onCancel={() => setShowAddDialog(false)}
            />
          </Dialog.ScrollArea>
        </Dialog>

        <Dialog 
          visible={showTypeDialog} 
          onDismiss={() => setShowTypeDialog(false)}
          dismissable={false}
        >
          <Dialog.Title>Configurar Tipos de Tarefas</Dialog.Title>
          <Dialog.ScrollArea>
            <TaskTypeForm
              onSubmit={handleAddTaskType}
              onCancel={() => setShowTypeDialog(false)}
            />
          </Dialog.ScrollArea>
        </Dialog>

        <Dialog 
          visible={showRotationDialog} 
          onDismiss={() => setShowRotationDialog(false)}
          dismissable={false}
        >
          <Dialog.Title>Configurar Rotação de Tarefas</Dialog.Title>
          <Dialog.ScrollArea>
            <TaskRotationSetup
              taskTypes={taskTypes}
              members={members}
              onSubmit={handleSetupRotation}
              onCancel={() => setShowRotationDialog(false)}
            />
          </Dialog.ScrollArea>
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
  viewSelector: {
    margin: theme.spacing.m,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: theme.spacing.s,
    paddingBottom: 40,
  },
  fabSpace: {
    height: 60,
  },
  fabContainer: {
    position: 'absolute',
    right: theme.spacing.m,
    bottom: theme.spacing.m,
    alignItems: 'flex-end',
  },
  fab: {
    marginBottom: theme.spacing.s,
  },
  toggleFab: {
    backgroundColor: theme.colors.primary,
    marginBottom: theme.spacing.m,
  },
  mainFab: {
    backgroundColor: theme.colors.primary,
  },
  configFab: {
    backgroundColor: '#4CAF50',
  },
  rotationFab: {
    backgroundColor: '#FF9800',
  },
  loader: {
    marginTop: theme.spacing.xl,
  },
  taskCard: {
    marginBottom: theme.spacing.m,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskDue: {
    fontSize: 12,
    color: theme.colors.placeholder,
  },
  taskDescription: {
    fontSize: 14,
    marginVertical: theme.spacing.xs,
    color: theme.colors.placeholder,
  },
  responsibleText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  completedInfo: {
    marginTop: theme.spacing.xs,
    paddingTop: theme.spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  rating: {
    marginTop: theme.spacing.xs,
  },
  feedback: {
    fontStyle: 'italic',
    fontSize: 12,
    color: theme.colors.placeholder,
  },
});