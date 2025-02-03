import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Alert, TextInput as RNTextInput } from 'react-native';
import { Button, Card, Title, Paragraph, Portal, Dialog, TextInput } from 'react-native-paper';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../styles/theme';
import { getUserHouses, createHouse, joinHouseWithInvite, joinHouseWithInviteCode } from '../../services/house';
import { House } from '../../types/house';

export default function HouseSelectionScreen() {
  const [houses, setHouses] = useState<House[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [newHouse, setNewHouse] = useState({
    name: '',
    address: '',
  });
  const navigation = useNavigation();

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
    try {
      const userHouses = await getUserHouses();
      setHouses(userHouses);
    } catch (error) {
      console.error('Erro ao carregar casas:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas casas');
    }
  };

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    try {
      setLoading(true);
      await joinHouseWithInvite(data);
      setShowScanner(false);
      loadHouses();
    } catch (error) {
      console.error("Erro ao entrar na casa:", error);
      Alert.alert("Erro", "Convite inválido ou expirado");
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHouse = async () => {
    if (!newHouse.name || !newHouse.address) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      await createHouse(newHouse);
      setShowCreateDialog(false);
      setNewHouse({ name: '', address: '' });
      await loadHouses();
    } catch (error) {
      console.error('Erro ao criar casa:', error);
      Alert.alert('Erro', 'Não foi possível criar a casa');
    }
  };

  const startScanner = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status === 'granted') {
      setShowScanner(true);
      setScanned(false);
    } else {
      Alert.alert('Erro', 'Permissão para usar a câmera é necessária');
    }
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    try {
      await joinHouseWithInvite(data);
      setShowScanner(false);
      await loadHouses();
      Alert.alert('Sucesso', 'Você entrou na casa com sucesso!');
    } catch (error) {
      console.error('Erro ao entrar na casa:', error);
      Alert.alert('Erro', 'Não foi possível entrar na casa');
    }
  };

  const selectHouse = (house: House) => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  };

  const handleJoinWithCode = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Erro', 'Por favor, insira o código de convite');
      return;
    }

    try {
      await joinHouseWithInviteCode(inviteCode.trim());
      setShowJoinDialog(false);
      setInviteCode('');
      await loadHouses();
      Alert.alert('Sucesso', 'Você entrou na casa com sucesso!');
    } catch (error) {
      console.error('Erro ao entrar na casa:', error);
      Alert.alert('Erro', 'Código de convite inválido ou expirado');
    }
  };

  return (
    <View style={styles.container}>
      {houses.map(house => (
        <Card
          key={house.id}
          style={styles.card}
          onPress={() => selectHouse(house)}
        >
          <Card.Content>
            <Title>{house.name}</Title>
            <Paragraph>{house.address}</Paragraph>
          </Card.Content>
        </Card>
      ))}

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={() => setShowCreateDialog(true)}
          style={styles.button}
        >
          Criar Nova Casa
        </Button>
        <Button
          mode="outlined"
          onPress={() => setShowJoinDialog(true)}
          style={styles.button}
        >
          Entrar em uma Casa
        </Button>
      </View>

      <Portal>
        <Dialog visible={showCreateDialog} onDismiss={() => setShowCreateDialog(false)}>
          <Dialog.Title>Criar Nova Casa</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nome da Casa"
              value={newHouse.name}
              onChangeText={name => setNewHouse({ ...newHouse, name })}
              style={styles.input}
            />
            <TextInput
              label="Endereço"
              value={newHouse.address}
              onChangeText={address => setNewHouse({ ...newHouse, address })}
              style={styles.input}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowCreateDialog(false)}>Cancelar</Button>
            <Button onPress={handleCreateHouse}>Criar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showJoinDialog} onDismiss={() => setShowJoinDialog(false)}>
          <Dialog.Title>Entrar em uma Casa</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Código de Convite"
              value={inviteCode}
              onChangeText={setInviteCode}
              style={styles.input}
            />
            <Button
              mode="contained"
              onPress={handleJoinWithCode}
              style={styles.joinButton}
            >
              Entrar com Código
            </Button>
            <Button
              mode="outlined"
              onPress={startScanner}
              style={styles.joinButton}
            >
              Escanear QR Code
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowJoinDialog(false)}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showScanner} onDismiss={() => setShowScanner(false)}>
          <Dialog.Title>Escanear QR Code</Dialog.Title>
          <Dialog.Content>
            {hasPermission && (
              <View style={styles.scannerContainer}>
                <Camera
                  onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
                  barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                  }}
                  style={styles.scanner}
                />
              </View>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowScanner(false)}>Cancelar</Button>
            {scanned && (
              <Button onPress={() => setScanned(false)}>Escanear Novamente</Button>
            )}
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  card: {
    marginBottom: theme.spacing.m,
  },
  buttonContainer: {
    marginTop: 'auto',
  },
  button: {
    marginBottom: theme.spacing.m,
  },
  input: {
    marginBottom: theme.spacing.m,
  },
  joinButton: {
    marginTop: theme.spacing.s,
  },
  scannerContainer: {
    width: '100%',
    height: 300,
    overflow: 'hidden',
    borderRadius: 8,
  },
  scanner: {
    flex: 1,
  },
});