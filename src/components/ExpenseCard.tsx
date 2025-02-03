import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Title, Paragraph, IconButton, Chip, Text } from 'react-native-paper';
import { theme } from '../styles/theme';
import { Expense } from '../services/expenses';

interface ExpenseCardProps {
  expense: Expense;
  onDelete: () => void;
  onPay: () => void;
  currentUserId?: string;
}

export default function ExpenseCard({ expense, onDelete, onPay, currentUserId }: ExpenseCardProps) {
  const isOwed = expense.paidBy !== currentUserId;
  const amountPerPerson = expense.amount / (expense.splitBetween?.length || 1);
  const payment = expense.payments?.find(p => p && p.userId === currentUserId);
  const paidMembers = expense.payments?.filter(p => p && p.paid) || [];

  return (
    <Card style={styles.expenseCard}>
      <Card.Content>
        <View style={styles.expenseHeader}>
          <View style={styles.expenseHeaderLeft}>
            <Title>{expense.title}</Title>
            <Paragraph style={styles.expenseDate}>
              {new Date(expense.date).toLocaleDateString()}
            </Paragraph>
          </View>
          <View style={styles.expenseHeaderRight}>
            {expense.paidBy === currentUserId && !expense.settled && (
              <IconButton
                icon="delete"
                onPress={onDelete}
                size={20}
              />
            )}
            <IconButton
              icon={getCategoryIcon(expense.category)}
              size={24}
            />
          </View>
        </View>
        
        <View style={styles.expenseDetails}>
          <Text style={styles.expenseAmount}>
            R$ {expense.amount.toFixed(2)}
          </Text>
          <Text style={styles.expenseShare}>
            {isOwed ? 'Você deve: ' : 'Por pessoa: '}
            R$ {amountPerPerson.toFixed(2)}
          </Text>
        </View>

        {expense.description && (
          <Paragraph style={styles.expenseDescription}>
            {expense.description}
          </Paragraph>
        )}

        <View style={styles.expenseFooter}>
          {isOwed ? (
            <View style={styles.paymentStatus}>
              <Text style={styles.expensePaidBy}>
                Pago por: {expense.paidByEmail}
              </Text>
              {!payment?.paid && !expense.settled && (
                <Chip icon="cash" onPress={onPay}>Pagar</Chip>
              )}
              {payment?.paid && (
                <Chip icon="check" mode="flat">Pago</Chip>
              )}
            </View>
          ) : (
            <View style={styles.paymentsContainer}>
              <Text style={styles.paymentsTitle}>
                Pagamentos recebidos: {paidMembers.length}/{expense.payments?.length}
              </Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

function getCategoryIcon(category: string): string {
  switch (category) {
    case 'Mercado': return 'cart';
    case 'Aluguel': return 'home';
    case 'Água': return 'water';
    case 'Luz': return 'lightbulb';
    case 'Internet': return 'wifi';
    default: return 'cash';
  }
}

const styles = StyleSheet.create({
  expenseCard: {
    marginBottom: theme.spacing.m,
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseHeaderLeft: {
    flex: 1,
  },
  expenseHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseDate: {
    color: theme.colors.placeholder,
    fontSize: 12,
  },
  expenseDetails: {
    marginVertical: theme.spacing.m,
  },
  expenseAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  expenseShare: {
    fontSize: 16,
    color: theme.colors.placeholder,
  },
  expenseDescription: {
    marginBottom: theme.spacing.m,
  },
  expenseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  expensePaidBy: {
    color: theme.colors.placeholder,
  },
  paymentsContainer: {
    flex: 1,
  },
  paymentsTitle: {
    fontSize: 14,
    color: theme.colors.placeholder,
  },
});