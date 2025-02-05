import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Text, Share } from 'react-native';
import { TextInput, Button, List, Avatar, Portal, Dialog, ActivityIndicator } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { theme } from '../../styles/theme';
import { getHouseDetails, getHouseMembers, updateHouseRules, removeMember, generateInviteQRCode, generateInviteLink, deleteHouse } from '../../services/house';
import { House, HouseMember } from '../../types/house';
import { QRCodeGenerator } from '../../components/QRCodeGenerator';
import { useNavigation } from '@react-navigation/native';

export default function HouseScreen() {
  const { user } = useAuth();
  const [house, setHouse] = useState<House | null>(null);
  const [members, setMembers] = useState<HouseMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [qrCodeValue, setQRCodeValue] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editedHouse, setEditedHouse] = useState<House | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    loadHouseData();
  }, []);

  const loadHouseData = async () => {
    try {
      const houseMembers = await getHouseMembers();
      setMembers(houseMembers);
      
      const currentMember = houseMembers.find(m => m.userId === user?.uid);
      setIsAdmin(currentMember?.isAdmin || false);

      if (currentMember) {
        const houseDetails = await getHouseDetails(currentMember.houseId);
        setHouse(houseDetails);
        setEditedHouse(houseDetails);
      }
    } catch (error) {
      console.error('Erro ao carregar dados da casa:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados da casa');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      await removeMember(memberId);
      loadHouseData();
      Alert.alert('Sucesso', 'Membro removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover membro:', error);
      Alert.alert('Erro', 'Não foi possível remover o membro');
    }
  };

  const handleUpdateHouse = async () => {
    if (!editedHouse) return;

    try {
      await updateHouseRules(editedHouse.rules || '');
      setHouse(editedHouse);
      setEditMode(false);
      Alert.alert('Sucesso', 'Dados da casa atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar casa:', error);
      Alert.alert('Erro', 'Não foi possível atualizar os dados da casa');
    }
  };

  const handleGenerateQRCode = async () => {
    try {
      const inviteToken = await generateInviteQRCode(house?.id || '');
      setQRCodeValue(inviteToken);
      setShowQRCode(true);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      Alert.alert('Erro', 'Não foi possível gerar o QR Code');
    }
  };

  const handleGenerateInviteCode = async () => {
    try {
      const code = await generateInviteLink(house?.id || '');
      setInviteCode(code);
      setShowInviteCode(true);
    } catch (error) {
      console.error('Erro ao gerar código de convite:', error);
      Alert.alert('Erro', 'Não foi possível gerar o código de convite');
    }
  };

  const handleShareInviteCode = async () => {
    try {
      await Share.share({
        message: `Use o código ${inviteCode} para entrar na casa ${house?.name} no Agere!`,
      });
    } catch (error) {
      console.error('Erro ao compartilhar código:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar o código');
    }
  };

  const handleDeleteHouse = async () => {
    Alert.alert(
      'Deletar Casa',
      'Tem certeza que deseja deletar esta casa? Esta ação não pode ser desfeita e todos os dados serão perdidos.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Deletar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteHouse(house?.id || '');
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth', params: { screen: 'HouseSelection' } }],
              });
            } catch (error) {
              console.error('Erro ao deletar casa:', error);
              Alert.alert('Erro', 'Não foi possível deletar a casa');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TextInput
            label="Nome da Casa"
            value={editMode ? editedHouse?.name : house?.name}
            onChangeText={name => editMode && setEditedHouse(prev => ({ ...prev!, name }))}
            style={styles.input}
            disabled={!editMode}
          />

          <TextInput
            label="Endereço"
            value={editMode ? editedHouse?.address : house?.address}
            onChangeText={address => editMode && setEditedHouse(prev => ({ ...prev!, address }))}
            style={styles.input}
            disabled={!editMode}
          />

          {isAdmin ? (
            <TextInput
              label="Regras da Casa"
              value={editMode ? editedHouse?.rules : house?.rules}
              onChangeText={rules => editMode && setEditedHouse(prev => ({ ...prev!, rules }))}
              multiline
              numberOfLines={6}
              style={styles.rulesInput}
              disabled={!editMode}
              placeholder="Digite aqui as regras da casa..."
            />
          ) : (
            house?.rules && (
              <View style={styles.rulesContainer}>
                <Text style={styles.rulesTitle}>Regras da Casa</Text>
                <Text style={styles.rulesText}>{house.rules}</Text>
              </View>
            )
          )}

          {isAdmin && (
            <View style={styles.buttonContainer}>
              {editMode ? (
                <>
                  <Button
                    mode="contained"
                    onPress={handleUpdateHouse}
                    style={styles.button}
                  >
                    Salvar Alterações
                  </Button>
                  <Button
                    mode="outlined"
                    onPress={() => {
                      setEditMode(false);
                      setEditedHouse(house);
                    }}
                    style={styles.button}
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button
                  mode="contained"
                  onPress={() => setEditMode(true)}
                  style={styles.button}
                >
                  Editar Dados
                </Button>
              )}
              {isAdmin && (
                <Button
                  mode="contained"
                  onPress={handleDeleteHouse}
                  style={[styles.button, { backgroundColor: theme.colors.error }]}
                >
                  Deletar Casa
                </Button>
              )}
            </View>
          )}
        </View>

        <View style={styles.membersSection}>
          <View style={styles.memberHeader}>
            <Text style={styles.sectionTitle}>Membros ({members.length})</Text>
            {isAdmin && (
              <View style={styles.inviteButtons}>
                <Button
                  mode="contained"
                  onPress={handleGenerateQRCode}
                  style={styles.inviteButton}
                >
                  QR Code
                </Button>
                <Button
                  mode="contained"
                  onPress={handleGenerateInviteCode}
                  style={styles.inviteButton}
                >
                  Código de Convite
                </Button>
              </View>
            )}
          </View>

          {members.map(member => (
            <List.Item
              key={member.id}
              title={member.email}
              description={member.isAdmin ? 'Administrador' : 'Membro'}
              left={props => (
                <Avatar.Image
                  {...props}
                  size={40}
                  source={require('../../../assets/default-avatar.png')}
                />
              )}
              right={props => 
                isAdmin && member.userId !== user?.uid && (
                  <Button 
                    onPress={() => handleRemoveMember(member.id!)}
                    color={theme.colors.error}
                  >
                    Remover
                  </Button>
                )
              }
            />
          ))}
        </View>
      </ScrollView>

      <Portal>
        <Dialog visible={showQRCode} onDismiss={() => setShowQRCode(false)}>
          <Dialog.Title>QR Code de Convite</Dialog.Title>
          <Dialog.Content>
            <QRCodeGenerator value={qrCodeValue} />
            <Text style={styles.qrHelp}>
              Compartilhe este QR Code com novos membros para que eles possam se juntar à casa.
              O código expira em 24 horas.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowQRCode(false)}>Fechar</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showInviteCode} onDismiss={() => setShowInviteCode(false)}>
          <Dialog.Title>Código de Convite</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.inviteCode}>{inviteCode}</Text>
            <Text style={styles.inviteHelp}>
              Compartilhe este código com novos membros para que eles possam se juntar à casa.
              O código expira em 24 horas.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowInviteCode(false)}>Fechar</Button>
            <Button onPress={handleShareInviteCode}>Compartilhar</Button>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: theme.spacing.m,
  },
  input: {
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
  },
  rulesInput: {
    marginBottom: theme.spacing.m,
    backgroundColor: theme.colors.surface,
    minHeight: 120,
  },
  rulesContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.m,
    borderRadius: 8,
    marginBottom: theme.spacing.m,
  },
  rulesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.s,
  },
  rulesText: {
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    marginTop: theme.spacing.m,
  },
  button: {
    marginBottom: theme.spacing.s,
  },
  membersSection: {
    padding: theme.spacing.m,
  },
  memberHeader: {
    flexDirection: 'column',
    marginBottom: theme.spacing.m,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: theme.spacing.s,
  },
  inviteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inviteButton: {
    flex: 1,
    marginHorizontal: theme.spacing.s,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: theme.spacing.m,
    color: theme.colors.primary,
  },
  inviteHelp: {
    marginTop: theme.spacing.m,
    textAlign: 'center',
    color: theme.colors.placeholder,
  },
  qrHelp: {
    marginTop: theme.spacing.m,
    textAlign: 'center',
    color: theme.colors.placeholder,
  },
});