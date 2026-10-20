import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(); 
import 'react-native-gesture-handler';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { AppProvider, useApp } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import TimerScreen from './src/screens/TimerScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { lightColors, darkColors } from './src/theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// We keep this just in case you want to open specific screens later
function ProgressStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProgressMain" component={ProgressScreen} />
    </Stack.Navigator>
  );
}

function Tabs() {
  const { darkMode } = useApp();
  const colors = darkMode ? darkColors : lightColors;

  const navTheme = {
    ...(darkMode ? DarkTheme : DefaultTheme),
    colors: {
      ...(darkMode ? DarkTheme : DefaultTheme).colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerTitleAlign: 'center',
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
          headerStyle: { backgroundColor: colors.card },
          headerTitleStyle: { color: colors.text },
          tabBarIcon: ({ color, size }) => {
            const icons = {
              Home: 'home-outline',
              Planner: 'calendar-outline',
              Timer: 'timer-outline',
              Progress: 'stats-chart-outline',
              Settings: 'settings-outline',
            };
            return <Ionicons name={icons[route.name]} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Planner" component={TasksScreen} />
        <Tab.Screen name="Timer" component={TimerScreen} />
        <Tab.Screen name="Progress" component={ProgressStack} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer> 
  );
}

export default function App() {
  return (
    <AppProvider>
      <Tabs />
    </AppProvider>
  );
} 