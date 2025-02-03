import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, Image } from 'react-native';
import { 
  FAB, 
  Portal, 
  Dialog,
  Text,
  SegmentedButtons,
  ActivityIndicator,
  Button,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { theme } from '../../styles/theme';
import { Expense, createExpense, getExpenses, deleteExpense, registerPayment } from '../../services/expenses';
import { getHouseMembers } from '../../services/house';
import { HouseMember } from '../../types/house';
import { useAuth } from '../../contexts/AuthContext';
import ExpenseCard from '../../components/ExpenseCard';
import ExpenseForm, { ExpenseFormData } from '../../components/ExpenseForm';

type TabType = 'paid' | 'owed' | 'history';

interface Payment {
  userId: string;
  userEmail: string;
  amount: number;
  paid: boolean;
  receiptUrl?: string;
  paidAt?: Date;
}

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [visible, setVisible] = useState(false);
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('paid');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [paymentImage, setPaymentImage] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showReceiptImage, setShowReceiptImage] = useState(false);
  const [showPaymentReceiptImage, setShowPaymentReceiptImage] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [pixKey, setPixKey] = useState<string>('');
  const [loadingMembers, setLoadingMembers] = useState(true);
  
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingMembers(true);
      
      const houseMembers = await getHouseMembers();
      setMembers(houseMembers || []);
      setLoadingMembers(false);

      const fetchedExpenses = await getExpenses();
      setExpenses(fetchedExpenses || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (formData: ExpenseFormData, receiptImage: string | null) => {
    if (!formData.title || !formData.amount || !formData.category) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (formData.splitBetween.length === 0) {
      Alert.alert('Erro', 'Selecione pelo menos um membro para dividir a despesa');
      return;
    }

    try {
      setLoading(true);
      await createExpense(
        {
          ...formData,
          amount: parseFloat(formData.amount),
          splitBetween: formData.splitBetween,
          date: formData.date
        },
        members,
        receiptImage
      );
      
      setVisible(false);
      loadData();
      Alert.alert('Sucesso', 'Despesa criada com sucesso');
    } catch (error) {
      console.error('Erro ao criar despesa:', error);
      Alert.alert('Erro', 'Não foi possível criar a despesa');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (forPayment: boolean = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (forPayment) {
        setPaymentImage(result.assets[0].uri);
      }
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      setShowDeleteConfirm(false);
      setSelectedExpense(null);
      loadData();
      Alert.alert('Sucesso', 'Despesa excluída com sucesso');
    } catch (error) {
      console.error('Erro ao excluir despesa:', error);
      Alert.alert('Erro', error.message);
    }
  };

  const handlePayment = async (expenseId: string) => {
    try {
      await registerPayment(expenseId, paymentImage);
      setShowPaymentDialog(false);
      setPaymentImage(null);
      setSelectedExpense(null);
      loadData();
      Alert.alert('Sucesso', 'Pagamento registrado com sucesso');
    } catch (error) {
      console.error('Erro ao registrar pagamento:', error);
      Alert.alert('Erro', 'Não foi possível registrar o pagamento');
    }
  };

  const filterExpenses = () => {
    if (!user || !expenses) return [];
    
    return expenses.filter(expense => {
      if (!expense) return false;
      
      switch (activeTab) {
        case 'paid':
          return expense.paidBy === user.uid;
        case 'owed':
          return expense.payments?.some(payment => 
            payment && payment.userId === user.uid && !payment.paid
          );
        case 'history':
          return expense.payments?.some(payment => 
            payment && payment.userId === user.uid && payment.paid
          );
        default:
          return false;
      }
    });
  };

  if (loading && !expenses.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={activeTab}
        onValueChange={value => setActiveTab(value as TabType)}
        buttons={[
          { value: 'paid', label: 'Pago por mim' },
          { value: 'owed', label: 'Devo' },
          { value: 'history', label: 'Histórico' }
        ]}
        style={styles.tabs}
      />

      <ScrollView style={styles.content}>
        {filterExpenses().map(expense => 
          expense && (
            <ExpenseCard 
              key={expense.id}
              expense={expense}
              onDelete={() => {
                setSelectedExpense(expense);
                setShowDeleteConfirm(true);
              }}
              onPay={() => {
                setSelectedExpense(expense);
                setShowPaymentDialog(true);
              }}
              currentUserId={user?.uid}
            />
          )
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setVisible(true)}
      />

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Nova Despesa</Dialog.Title>
          <Dialog.ScrollArea>
            <ExpenseForm
              onSubmit={handleCreateExpense}
              onCancel={() => setVisible(false)}
              loading={loading}
              members={members}
            />
          </Dialog.ScrollArea>
        </Dialog>

        <Dialog visible={showPaymentDialog} onDismiss={() => setShowPaymentDialog(false)}>
          <Dialog.Title>Registrar Pagamento</Dialog.Title>
          <Dialog.Content>
            {pixKey ? (
              <>
                <Text style={styles.pixKeyLabel}>Chave PIX do recebedor:</Text>
                <Text style={styles.pixKey}>{pixKey}</Text>
              </>
            ) : (
              <Text style={styles.noPixKey}>
                O usuário não cadastrou uma chave PIX
              </Text>
            )}
            
            <TouchableOpacity
              onPress={() => pickImage(true)}
              style={styles.uploadButton}
            >
              <Text>{paymentImage ? 'Trocar comprovante' : 'Anexar comprovante'}</Text>
            </TouchableOpacity>

            {paymentImage && (
              <Image
                source={{ uri: paymentImage }}
                style={styles.receiptPreview}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentDialog(false)}>Cancelar</Button>
            <Button 
              onPress={() => selectedExpense && handlePayment(selectedExpense.id!)}
              disabled={!paymentImage}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showDeleteConfirm} onDismiss={() => setShowDeleteConfirm(false)}>
          <Dialog.Title>Excluir Despesa</Dialog.Title>
          <Dialog.Content>
            <Text>Tem certeza que deseja excluir esta despesa?</Text>
            <Text style={styles.deleteWarning}>
              Esta ação não pode ser desfeita e só é possível se ninguém tiver registrado pagamento.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteConfirm(false)}>Cancelar</Button>
            <Button 
              onPress={() => selectedExpense && handleDeleteExpense(selectedExpense.id!)}
              textColor={theme.colors.error}
            >
              Excluir
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showReceiptImage} onDismiss={() => setShowReceiptImage(false)}>
          <Dialog.Title>Comprovante</Dialog.Title>
          <Dialog.Content>
            <Image
              source={{ uri: selectedExpense?.receiptUrl || undefined }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowReceiptImage(false)}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showPaymentReceiptImage} onDismiss={() => setShowPaymentReceiptImage(false)}>
          <Dialog.Title>Comprovante de Pagamento</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.paymentReceiptTitle}>
              Pagamento de {selectedPayment?.userEmail}
            </Text>
            <Image
              source={{ uri: selectedPayment?.receiptUrl }}
              style={styles.receiptImage}
              resizeMode="contain"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPaymentReceiptImage(false)}>Fechar</Button>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    margin: theme.spacing.m,
  },
  content: {
    flex: 1,
    padding: theme.spacing.m,
  },
  fab: {
    position: 'absolute',
    margin: theme.spacing.m,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  pixKeyLabel: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginBottom: theme.spacing.s,
  },
  pixKey: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
  },
  noPixKey: {
    color: theme.colors.error,
    marginBottom: theme.spacing.m,
  },
  uploadButton: {
    marginVertical: theme.spacing.m,
    padding: theme.spacing.m,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 4,
    alignItems: 'center',
  },
  receiptPreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  receiptImage: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  deleteWarning: {
    color: theme.colors.error,
    fontSize: 12,
    marginTop: theme.spacing.s,
  },
  paymentReceiptTitle: {
    fontSize: 14,
    marginBottom: theme.spacing.m,
    textAlign: 'center',
  },
});