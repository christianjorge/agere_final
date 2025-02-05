import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, Text, Alert } from 'react-native';
import { List, FAB, Portal, Dialog, IconButton, Checkbox, Button } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { ShoppingItem, ShoppingItemFormData } from '../../types/shopping';
import { addShoppingItem, updateShoppingItem, deleteShoppingItem, getShoppingList } from '../../services/shopping';
import ShoppingItemForm from '../../components/ShoppingItemForm';

export default function ShoppingListScreen() {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);
  const [createExpense, setCreateExpense] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigation = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setError(null);
      const fetchedItems = await getShoppingList();
      setItems(fetchedItems);
    } catch (error) {
      console.error('Erro ao carregar lista:', error);
      if (items.length === 0) {
        setError('Não foi possível carregar a lista de compras');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (formData: ShoppingItemFormData) => {
    try {
      await addShoppingItem({
        name: formData.name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        urgent: formData.urgent,
        estimatedPrice: parseFloat(formData.estimatedPrice) || 0,
        completed: false
      });
      setVisible(false);
      loadItems();
    } catch (error) {
      console.error('Erro ao adicionar item:', error);
      setError('Não foi possível adicionar o item');
    }
  };

  const handlePurchaseItem = (item: ShoppingItem) => {
    setSelectedItem(item);
    setShowPurchaseDialog(true);
    setCreateExpense(false);
  };

  const handleToggleComplete = async (item: ShoppingItem) => {
    if (item.completed && item.expenseId) {
      Alert.alert(
        'Não é possível desmarcar',
        'Este item já possui uma despesa associada.'
      );
      return;
    }

    if (!item.completed) {
      handlePurchaseItem(item);
    } else {
      try {
        await updateShoppingItem(item.id!, {
          completed: false,
          completedBy: null,
          completedAt: null,
          expenseId: null
        });
        loadItems();
      } catch (error) {
        console.error('Erro ao atualizar item:', error);
        setError('Não foi possível atualizar o status do item');
      }
    }
  };

  const confirmPurchase = async () => {
    if (!selectedItem) return;

    try {
      await updateShoppingItem(selectedItem.id!, { 
        completed: true,
        completedBy: user?.uid,
        completedAt: new Date()
      });
      
      if (createExpense) {
        navigation.navigate('Despesas', {
          screen: 'ExpensesList',
          params: {
            initialExpense: {
              title: `Compra: ${selectedItem.name}`,
              amount: selectedItem.estimatedPrice,
              category: 'Mercado',
              description: `Compra do item: ${selectedItem.name} (${selectedItem.quantity} ${selectedItem.unit})`
            }
          }
        });
      }
      
      setShowPurchaseDialog(false);
      setSelectedItem(null);
      loadItems();
    } catch (error) {
      console.error('Erro ao confirmar compra:', error);
      setError('Não foi possível confirmar a compra');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deleteShoppingItem(itemId);
      loadItems();
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      setError('Não foi possível excluir o item');
    }
  };

  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <List.Item
      title={item.name}
      description={`${item.quantity} ${item.unit}${item.estimatedPrice ? ` - Estimado: R$ ${item.estimatedPrice.toFixed(2)}` : ''}`}
      onPress={() => !item.completed && handlePurchaseItem(item)}
      right={props => (
        <View style={styles.itemActions}>
          <IconButton
            icon={item.completed ? 'cart-check' : 'cart'}
            size={24}
            onPress={() => handleToggleComplete(item)}
          />
          <IconButton
            icon="delete"
            size={24}
            onPress={() => handleDeleteItem(item.id!)}
          />
        </View>
      )}
      style={[
        styles.listItem,
        item.urgent && styles.urgentItem,
        item.completed && styles.completedItem
      ]}
    />
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        Nenhum item na lista de compras
      </Text>
    </View>
  );

  const renderError = () => error && (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderError()}
      
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id!}
        ListEmptyComponent={!loading && renderEmptyList()}
        refreshing={loading}
        onRefresh={loadItems}
      />

      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => setVisible(true)}
      />

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Adicionar Item</Dialog.Title>
          <Dialog.ScrollArea>
            <ShoppingItemForm
              data={{
                name: '',
                quantity: '1',
                unit: 'un',
                urgent: false,
                estimatedPrice: ''
              }}
              onSubmit={handleAddItem}
              onCancel={() => setVisible(false)}
              loading={loading}
            />
          </Dialog.ScrollArea>
        </Dialog>

        <Dialog visible={showPurchaseDialog} onDismiss={() => setShowPurchaseDialog(false)}>
          <Dialog.Title>Confirmar Compra</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogText}>
              Deseja marcar "{selectedItem?.name}" como comprado?
            </Text>
            {selectedItem?.estimatedPrice > 0 && (
              <List.Item
                title="Criar despesa automaticamente"
                right={() => (
                  <Checkbox
                    status={createExpense ? 'checked' : 'unchecked'}
                    onPress={() => setCreateExpense(!createExpense)}
                  />
                )}
              />
            )}
            {createExpense && selectedItem?.estimatedPrice && (
              <Text style={styles.expenseNote}>
                Uma nova despesa será criada com o valor estimado de R$ {selectedItem.estimatedPrice.toFixed(2)}
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowPurchaseDialog(false)}>Cancelar</Button>
            <Button onPress={confirmPurchase}>Confirmar</Button>
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
  fab: {
    position: 'absolute',
    margin: theme.spacing.m,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listItem: {
    marginHorizontal: theme.spacing.s,
    marginVertical: theme.spacing.xs,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
  },
  urgentItem: {
    backgroundColor: '#ffebee', // Vermelho claro
  },
  completedItem: {
    opacity: 0.6,
  },
  dialogText: {
    fontSize: 16,
    marginBottom: theme.spacing.m,
  },
  expenseNote: {
    fontSize: 14,
    color: theme.colors.placeholder,
    marginTop: theme.spacing.s,
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.placeholder,
    textAlign: 'center',
  },
  errorContainer: {
    padding: theme.spacing.m,
    backgroundColor: '#ffebee',
    marginBottom: theme.spacing.m,
  },
  errorText: {
    color: theme.colors.error,
    textAlign: 'center',
  },
});