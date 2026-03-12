import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import StudentsScreen from '../screens/StudentsScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ToolkitScreen from '../screens/ToolkitScreen';
import LinkHubScreen from '../screens/LinkHubScreen';
import LessonPlannerScreen from '../screens/LessonPlannerScreen';
import ResourceExplorerScreen from '../screens/ResourceExplorerScreen';
import ResourceDetailScreen from '../screens/ResourceDetailScreen';
import SignalDashboardScreen from '../screens/SignalDashboardScreen';
import TaskSyncScreen from '../screens/TaskSyncScreen';
import { useAuth } from '../context/AuthContext';
import palette from '../theme/palette';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const ToolkitStack = createNativeStackNavigator();

const navigatorTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: palette.background,
    card: palette.background,
    primary: palette.accent,
    text: palette.text,
  },
};

function ToolkitNavigator() {
  return (
    <ToolkitStack.Navigator screenOptions={{ headerShown: false }}>
      <ToolkitStack.Screen name="ToolkitHome" component={ToolkitScreen} />
      <ToolkitStack.Screen name="LinkHub" component={LinkHubScreen} />
      <ToolkitStack.Screen name="LessonPlanner" component={LessonPlannerScreen} />
      <ToolkitStack.Screen name="ResourceExplorer" component={ResourceExplorerScreen} />
      <ToolkitStack.Screen name="ResourceDetail" component={ResourceDetailScreen} />
      <ToolkitStack.Screen name="SignalDashboard" component={SignalDashboardScreen} />
      <ToolkitStack.Screen name="TaskSync" component={TaskSyncScreen} />
    </ToolkitStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#020617',
          borderTopColor: 'rgba(255,255,255,0.08)',
          paddingBottom: 6,
        },
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.muted,
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Home: 'planet-outline',
            Students: 'people-outline',
            Attendance: 'checkmark-circle-outline',
            Reports: 'analytics-outline',
            Toolkit: 'construct-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Students" component={StudentsScreen} />
      <Tabs.Screen name="Attendance" component={AttendanceScreen} />
      <Tabs.Screen name="Reports" component={ReportsScreen} />
      <Tabs.Screen name="Toolkit" component={ToolkitNavigator} options={{ headerShown: false }} />
    </Tabs.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navigatorTheme}>
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="MainTabs" component={MainTabs} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
