import { collection, addDoc, getDocs, query, where, orderBy, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, storage } from '../config/firebase';
import { HouseMember } from '../types/house';
import { Expense, Payment, Settlement } from '../types/expenses';
import { getCurrentHouseId } from '../utils/houseUtils';

const expensesCollection = collection(db, 'expenses');

export const createExpense = async (
  expense: {
    title: string;
    amount: number;
    category: string;
    date: Date;
    description?: string;
    splitBetween: string[];
  },
  members: HouseMember[],
  receiptFile: string | null = null
) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  let receiptUrl: string | null = null;
  if (receiptFile) {
    try {
      const response = await fetch(receiptFile);
      const blob = await response.blob();
      const receiptRef = ref(storage, `receipts/${houseId}/${Date.now()}_${user.uid}`);
      await uploadBytes(receiptRef, blob);
      receiptUrl = await getDownloadURL(receiptRef);
    } catch (error) {
      console.error('Erro ao fazer upload do comprovante:', error);
    }
  }

  const payments = expense.splitBetween.map(userId => {
    const member = members.find(m => m.userId === userId);
    return {
      userId,
      userEmail: member?.email || '',
      amount: expense.amount / expense.splitBetween.length,
      paid: userId === user.uid,
      paidAt: userId === user.uid ? new Date() : null,
      receiptUrl: null
    };
  });

  const expenseData = {
    title: expense.title,
    amount: expense.amount,
    category: expense.category,
    date: expense.date,
    description: expense.description || '',
    splitBetween: expense.splitBetween,
    paidBy: user.uid,
    paidByEmail: user.email || '',
    receiptUrl,
    settled: false,
    payments,
    createdAt: new Date(),
    houseId
  };

  try {
    const docRef = await addDoc(expensesCollection, expenseData);
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar despesa:', error);
    throw error;
  }
};

export const getExpenses = async () => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  const q = query(
    expensesCollection,
    where('houseId', '==', houseId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    date: doc.data().date.toDate(),
    createdAt: doc.data().createdAt.toDate()
  } as Expense));
};

export const registerPayment = async (expenseId: string, receiptFile: string | null = null) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  let receiptUrl: string | null = null;
  if (receiptFile) {
    try {
      const response = await fetch(receiptFile);
      const blob = await response.blob();
      const receiptRef = ref(storage, `payments/${houseId}/${Date.now()}_${user.uid}`);
      await uploadBytes(receiptRef, blob);
      receiptUrl = await getDownloadURL(receiptRef);
    } catch (error) {
      console.error('Erro ao fazer upload do comprovante:', error);
      throw new Error('Não foi possível fazer upload do comprovante');
    }
  }

  const expenseRef = doc(db, 'expenses', expenseId);
  const expenseDoc = await getDoc(expenseRef);
  if (!expenseDoc.exists()) throw new Error('Despesa não encontrada');

  const expense = expenseDoc.data() as Expense;
  
  // Verificar se a despesa pertence à casa atual
  if (expense.houseId !== houseId) {
    throw new Error('Despesa não pertence a esta casa');
  }

  const updatedPayments = expense.payments.map(payment => {
    if (payment.userId === user.uid) {
      return {
        ...payment,
        paid: true,
        receiptUrl,
        paidAt: new Date()
      };
    }
    return payment;
  });

  // Verificar se todos pagaram para marcar como quitada
  const allPaid = updatedPayments.every(payment => payment.paid);

  await updateDoc(expenseRef, {
    payments: updatedPayments,
    settled: allPaid
  });
};

export const deleteExpense = async (expenseId: string) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  const expenseRef = doc(db, 'expenses', expenseId);
  const expenseDoc = await getDoc(expenseRef);
  if (!expenseDoc.exists()) throw new Error('Despesa não encontrada');

  const expense = expenseDoc.data() as Expense;

  // Verificar se a despesa pertence à casa atual
  if (expense.houseId !== houseId) {
    throw new Error('Despesa não pertence a esta casa');
  }

  // Verificar se é o criador da despesa
  if (expense.paidBy !== user.uid) {
    throw new Error('Apenas quem criou a despesa pode apagá-la');
  }

  // Verificar se alguém já pagou
  if (expense.payments && expense.payments.some(p => p && p.paid && p.userId !== user.uid)) {
    throw new Error('Não é possível apagar uma despesa que já recebeu pagamentos');
  }

  // Deletar comprovantes do storage
  if (expense.receiptUrl) {
    try {
      const receiptRef = ref(storage, expense.receiptUrl);
      await deleteObject(receiptRef);
    } catch (error) {
      console.error('Erro ao deletar comprovante:', error);
    }
  }

  if (expense.payments) {
    for (const payment of expense.payments) {
      if (payment && payment.receiptUrl) {
        try {
          const paymentRef = ref(storage, payment.receiptUrl);
          await deleteObject(paymentRef);
        } catch (error) {
          console.error('Erro ao deletar comprovante de pagamento:', error);
        }
      }
    }
  }

  await deleteDoc(expenseRef);
};

export const getPendingSettlements = async (): Promise<Settlement[]> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  // Buscar liquidações pendentes onde o usuário é o pagador
  const settlementsQuery = query(
    collection(db, 'settlements'),
    where('houseId', '==', houseId),
    where('fromUser', '==', user.uid),
    where('settled', '==', false)
  );

  const snapshot = await getDocs(settlementsQuery);
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Settlement));
};

export const markSettlementAsPaid = async (settlementId: string): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuário não autenticado');

  const houseId = await getCurrentHouseId();

  const settlementRef = doc(db, 'settlements', settlementId);
  const settlementDoc = await getDoc(settlementRef);

  if (!settlementDoc.exists()) {
    throw new Error('Liquidação não encontrada');
  }

  const settlement = settlementDoc.data() as Settlement;

  // Verificar se a liquidação pertence à casa atual
  if (settlement.houseId !== houseId) {
    throw new Error('Liquidação não pertence a esta casa');
  }

  // Verificar se o usuário é o pagador
  if (settlement.fromUser !== user.uid) {
    throw new Error('Apenas o pagador pode marcar como pago');
  }

  await updateDoc(settlementRef, {
    settled: true,
    settledAt: new Date()
  });
};