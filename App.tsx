import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import HomeScreen from './src/screens/HomeScreen';
import FieldTasksScreen from './src/screens/FieldTasksScreen';
import MyReportsScreen from './src/screens/MyReportsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FieldDashboardScreen from './src/screens/FieldDashboardScreen';
import { CustomBottomTabBar } from './src/components/CustomBottomTabBar';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainNavigator() {
  const { user } = useAuth();

  if (!user) {
    return <LoginScreen />;
  }

  const isFieldOfficer = user.user_type === 'FIELD' || user.role === 'field-officer';

  // Jika Petugas Lapangan (FIELD) -> Tampilkan Bottom Tab Navigasi Khusus Petugas (Dashboard Petugas, Tugas, Riwayat/Log, Profil)
  if (isFieldOfficer) {
    return (
      <Tab.Navigator
        initialRouteName="FieldDashboard"
        tabBar={(props) => <CustomBottomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tab.Screen name="FieldDashboard" component={FieldDashboardScreen} />
        <Tab.Screen name="FieldTasks" component={FieldTasksScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    );
  }

  // Jika Warga / Pelapor -> Tampilkan Bottom Tab Navigasi Warga (Dashboard, Laporan, Riwayat, Profil)
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      tabBar={(props) => <CustomBottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="CitizenReport" component={HomeScreen} />
      <Tab.Screen name="MyReports" component={MyReportsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <MainNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

