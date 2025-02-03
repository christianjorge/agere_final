import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from '../screens/main/HomeScreen';
import PostsScreen from '../screens/main/PostsScreen';
import CreatePostScreen from '../screens/main/CreatePostScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ChatConversationScreen from '../screens/main/ChatConversationScreen';
import ExpensesScreen from '../screens/main/ExpensesScreen';
import SettlementsScreen from '../screens/main/SettlementsScreen';
import AccountScreen from '../screens/main/AccountScreen';
import ProfileScreen from '../screens/account/ProfileScreen';
import HouseScreen from '../screens/account/HouseScreen';
import NotificationSettingsScreen from '../screens/account/NotificationSettingsScreen';
import LanguageScreen from '../screens/account/LanguageScreen';
import SecurityScreen from '../screens/account/SecurityScreen';
import TermsScreen from '../screens/account/TermsScreen';
import ShoppingListScreen from '../screens/main/ShoppingListScreen';
import HouseRulesScreen from '../screens/main/HouseRulesScreen';
import TasksScreen from '../screens/main/TasksScreen';

const Tab = createBottomTabNavigator();
const PostStack = createNativeStackNavigator();
const ChatStack = createNativeStackNavigator();
const ExpenseStack = createNativeStackNavigator();
const AccountStack = createNativeStackNavigator();
const HomeStack = createNativeStackNavigator();

function HomeNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} options={{ title: 'Início' }} />
      <HomeStack.Screen name="ShoppingList" component={ShoppingListScreen} options={{ title: 'Lista de Compras' }} />
      <HomeStack.Screen name="HouseRules" component={HouseRulesScreen} options={{ title: 'Regras da Casa' }} />
      <HomeStack.Screen name="Tasks" component={TasksScreen} options={{ title: 'Tarefas' }} />
    </HomeStack.Navigator>
  );
}

function PostNavigator() {
  return (
    <PostStack.Navigator>
      <PostStack.Screen name="PostsList" component={PostsScreen} options={{ title: 'Postagens' }} />
      <PostStack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Nova Postagem' }} />
    </PostStack.Navigator>
  );
}

function ChatNavigator() {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen name="ChatList" component={ChatScreen} options={{ title: 'Conversas' }} />
      <ChatStack.Screen name="ChatConversation" component={ChatConversationScreen} options={{ title: 'Conversa' }} />
    </ChatStack.Navigator>
  );
}

function ExpenseNavigator() {
  return (
    <ExpenseStack.Navigator>
      <ExpenseStack.Screen name="ExpensesList" component={ExpensesScreen} options={{ title: 'Despesas' }} />
      <ExpenseStack.Screen name="Settlements" component={SettlementsScreen} options={{ title: 'Pagamentos' }} />
    </ExpenseStack.Navigator>
  );
}

function AccountNavigator() {
  return (
    <AccountStack.Navigator>
      <AccountStack.Screen name="AccountMain" component={AccountScreen} options={{ title: 'Minha Conta' }} />
      <AccountStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Meu Perfil' }} />
      <AccountStack.Screen name="House" component={HouseScreen} options={{ title: 'Minha Casa' }} />
      <AccountStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notificações' }} />
      <AccountStack.Screen name="Language" component={LanguageScreen} options={{ title: 'Idioma' }} />
      <AccountStack.Screen name="Security" component={SecurityScreen} options={{ title: 'Segurança' }} />
      <AccountStack.Screen name="Terms" component={TermsScreen} options={{ title: 'Termos de Serviço' }} />
    </AccountStack.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Início':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Postagens':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Despesas':
              iconName = focused ? 'wallet' : 'wallet-outline';
              break;
            case 'Bate-papo':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Conta':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Início" 
        component={HomeNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Postagens" 
        component={PostNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Despesas" 
        component={ExpenseNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Bate-papo" 
        component={ChatNavigator}
        options={{ headerShown: false }}
      />
      <Tab.Screen 
        name="Conta" 
        component={AccountNavigator}
        options={{ headerShown: false }}
      />
    </Tab.Navigator>
  );
}