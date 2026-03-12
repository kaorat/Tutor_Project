import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import { ConnectivityProvider } from './src/context/ConnectivityContext';
import { AuthProvider } from './src/context/AuthContext';
import { DataProvider } from './src/context/DataContext';
import { SyncProvider } from './src/context/SyncContext';
import { ResourceFavoritesProvider } from './src/context/ResourceFavoritesContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConnectivityProvider>
        <AuthProvider>
          <SyncProvider>
            <DataProvider>
              <ResourceFavoritesProvider>
                <StatusBar style="light" />
                <AppNavigator />
              </ResourceFavoritesProvider>
            </DataProvider>
          </SyncProvider>
        </AuthProvider>
      </ConnectivityProvider>
    </GestureHandlerRootView>
  );
}
