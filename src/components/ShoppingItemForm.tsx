import React from 'react';
import { View, StyleSheet } from 'react-native';
import { TextInput, List, Checkbox, Button } from 'react-native-paper';
import { theme } from '../styles/theme';

const UNITS = [
  { label: 'Unidade', value: 'un' },
  { label: 'Quilograma', value: 'kg' },
  { label: 'Grama', value: 'g' },
  { label: 'Litro', value: 'l' },
  { label: 'Mililitro', value: 'ml' },
  { label: 'Caixa', value: 'cx' },
  { label: 'Pacote', value: 'pct' }
];

interface ShoppingItemFormData {
  name: string;
  quantity: string;
  unit: string;
  urgent: boolean;
  estimatedPrice: string;
}

interface ShoppingItemFormProps {
  data: ShoppingItemFormData;
  onSubmit: (data: ShoppingItemFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ShoppingItemForm({ 
  data, 
  onSubmit, 
  onCancel, 
  loading = false 
}: ShoppingItemFormProps) {
  const [formData, setFormData] = React.useState(data);
  const [showUnits, setShowUnits] = React.useState(false);

  const handleSubmit = () => {
    if (!formData.name || !formData.quantity) {
      return;
    }
    onSubmit(formData);
  };

  return (
    <View style={styles.container}>
      <TextInput
        label="Nome do item"
        value={formData.name}
        onChangeText={name => setFormData({ ...formData, name })}
        style={styles.input}
        mode="outlined"
      />

      <View style={styles.row}>
        <TextInput
          label="Quantidade"
          value={formData.quantity}
          onChangeText={quantity => setFormData({ ...formData, quantity })}
          keyboardType="decimal-pad"
          style={[styles.input, styles.quantityInput]}
          mode="outlined"
        />

        <TextInput
          label="Unidade"
          value={UNITS.find(u => u.value === formData.unit)?.label}
          onFocus={() => setShowUnits(true)}
          style={[styles.input, styles.unitInput]}
          mode="outlined"
          right={<TextInput.Icon icon="menu-down" onPress={() => setShowUnits(!showUnits)} />}
        />
      </View>

      {showUnits && (
        <View style={styles.unitsList}>
          {UNITS.map(unit => (
            <List.Item
              key={unit.value}
              title={unit.label}
              onPress={() => {
                setFormData({ ...formData, unit: unit.value });
                setShowUnits(false);
              }}
            />
          ))}
        </View>
      )}

      <TextInput
        label="Preço estimado (R$)"
        value={formData.estimatedPrice}
        onChangeText={price => setFormData({ ...formData, estimatedPrice: price })}
        keyboardType="decimal-pad"
        style={styles.input}
        mode="outlined"
      />

      <List.Item
        title="Urgente"
        right={() => (
          <Checkbox
            status={formData.urgent ? 'checked' : 'unchecked'}
            onPress={() => setFormData({ ...formData, urgent: !formData.urgent })}
          />
        )}
      />

      <View style={styles.buttons}>
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
          Adicionar
        </Button>
      </View>
    </View>
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
  row: {
    flexDirection: 'row',
    gap: theme.spacing.m,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  unitsList: {
    marginTop: -theme.spacing.m,
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    borderRadius: 4,
    elevation: 2,
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