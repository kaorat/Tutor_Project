import { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

const ConnectivityContext = createContext({ isOnline: true, type: 'unknown' });

export function ConnectivityProvider({ children }) {
  const [state, setState] = useState({ isOnline: true, type: 'unknown' });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(status => {
      const isOnline = Boolean(status.isConnected && status.isInternetReachable !== false);
      setState({ isOnline, type: status.type });
    });
    return unsubscribe;
  }, []);

  return (
    <ConnectivityContext.Provider value={state}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export const useConnectivity = () => useContext(ConnectivityContext);
