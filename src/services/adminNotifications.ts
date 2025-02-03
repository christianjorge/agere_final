import * as Notifications from 'expo-notifications';
import { logAdminAction } from './adminLogs';

export const sendAdminNotification = async (
  title: string,
  body: string,
  data?: any
) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data
    },
    trigger: null // enviar imediatamente
  });

  // Registrar no log de ações administrativas
  await logAdminAction('send_notification', { title, body, data });
};

export const notifyMemberRemoval = async (memberEmail: string) => {
  await sendAdminNotification(
    'Membro Removido',
    `O membro ${memberEmail} foi removido da casa`,
    { type: 'member_removal', memberEmail }
  );
};

export const notifyNewAdmin = async (memberEmail: string) => {
  await sendAdminNotification(
    'Novo Administrador',
    `${memberEmail} agora é um administrador da casa`,
    { type: 'new_admin', memberEmail }
  );
};

export const notifyRulesUpdate = async () => {
  await sendAdminNotification(
    'Regras Atualizadas',
    'As regras da casa foram atualizadas',
    { type: 'rules_update' }
  );
};

export const notifyBackupCreated = async (success: boolean) => {
  if (success) {
    await sendAdminNotification(
      'Backup Realizado',
      'O backup diário foi concluído com sucesso',
      { type: 'backup_success' }
    );
  } else {
    await sendAdminNotification(
      'Erro no Backup',
      'Houve um problema ao realizar o backup diário',
      { type: 'backup_error' }
    );
  }
};