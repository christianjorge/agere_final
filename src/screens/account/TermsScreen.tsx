import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { theme } from '../../styles/theme';

export default function TermsScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Termos de Serviço</Text>
      
      <Text style={styles.section}>1. Aceitação dos Termos</Text>
      <Text style={styles.content}>
        Ao acessar e usar o aplicativo Agere, você concorda em cumprir estes termos de serviço.
        O uso continuado do aplicativo constitui aceitação de quaisquer alterações ou modificações
        feitas a estes termos.
      </Text>

      <Text style={styles.section}>2. Uso do Serviço</Text>
      <Text style={styles.content}>
        O Agere é uma plataforma para gerenciamento de residências compartilhadas.
        Você concorda em usar o serviço apenas para propósitos legais e de acordo
        com estes termos.
      </Text>

      <Text style={styles.section}>3. Privacidade</Text>
      <Text style={styles.content}>
        Sua privacidade é importante para nós. Nossa Política de Privacidade explica
        como coletamos, usamos e protegemos suas informações pessoais.
      </Text>

      <Text style={styles.section}>4. Contas</Text>
      <Text style={styles.content}>
        Você é responsável por manter a confidencialidade de sua conta e senha.
        Notifique-nos imediatamente sobre qualquer uso não autorizado de sua conta.
      </Text>

      <Text style={styles.section}>5. Conteúdo do Usuário</Text>
      <Text style={styles.content}>
        Você mantém todos os direitos sobre o conteúdo que compartilha no Agere.
        Ao compartilhar conteúdo, você concede ao Agere uma licença para usar,
        modificar, executar e exibir esse conteúdo.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: theme.spacing.m,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: theme.spacing.l,
  },
  section: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: theme.spacing.l,
    marginBottom: theme.spacing.s,
  },
  content: {
    fontSize: 16,
    lineHeight: 24,
    color: theme.colors.text,
    opacity: 0.8,
  },
});