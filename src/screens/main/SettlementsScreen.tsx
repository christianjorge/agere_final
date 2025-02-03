import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { List, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { theme } from '../../styles/theme';
import { Settlement, getPendingSettlements, markSettlementAsPaid } from '../../services/expenses';
import { useAuth } from '../../contexts/AuthContext';

export default function SettlementsScreen() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [visible, setVisible] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadSettlements();
  }, []);

  const loadSettlements = async () => {
    try {
      const fetchedSettlements = await getPendingSettlements();
      setSettlements(fetchedSettlements);
    } catch (error) {
      console.error('Erro ao carregar liquidações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (settlement: Settlement) => {
    try {
      await markSettlementAsPaid(settlement.id!);
      loadSettlements();
    } catch (error) {
      console.error('Erro ao marcar como pago:', error);
    }
  };

  const renderSettlement = ({ item }: { item: Settlement }) => (
    <List.Item
      title={`Pagar para: ${item.toUser}`}
      description={`Valor: R$ ${item.amount.toFixed(2)}`}
      right={props => (
        <Button
          mode="contained"
          onPress={() => {
            setSelectedSettlement(item);
            setVisible(true);
          }}
        >
          Pagar
        </Button>
      )}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={settlements}
        renderItem={renderSettlement}
        keyExtractor={item => item.id!}
        contentContainerStyle={styles.listContainer}
        onRefresh={loadSettlements}
        refreshing={loading}
      />

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>Informações de Pagamento</Dialog.Title>
          <Dialog.Content>
            {selectedSettlement?.pixKey ? (
              <>
                <Text style={styles.label}>Chave PIX:</Text>
                <Text style={styles.pixKey}>{selectedSettlement.pixKey}</Text>
              </>
            ) : (
              <Text>Usuário não cadastrou chave PIX</Text>
            )}
            <Text style={styles.amount}>
              Valor: R$ {selectedSettlement?.amount.toFixed(2)}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancelar</Button>
            <Button 
              onPress={() => {
                if (selectedSettlement) {
                  handlePayment(selectedSettlement);
                }
                setVisible(false);
              }}
            >
              Confirmar Pagamento
            </Button>
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
  listContainer: {
    padding: theme.spacing.m,
  },
  label: {
    fontSize: 16,
    marginBottom: theme.spacing.s,
  },
  pixKey: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.m,
  },
  amount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: theme.spacing.m,
  },
});