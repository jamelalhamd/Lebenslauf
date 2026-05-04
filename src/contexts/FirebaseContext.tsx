import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { isInitialized, FIREBASE_CONFIG, FirebaseConfig, resetFirebase, initializeFirebase } from '../lib/firebase';

interface FirebaseContextType {
  connected: boolean;
  config: FirebaseConfig;
  reconnect: () => void;
  lastSync: Date | null;
  setLastSync: (d: Date | null) => void;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(isInitialized());
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    setConnected(isInitialized());
  }, []);

  const reconnect = useCallback(async () => {
    await resetFirebase();
    const ok = initializeFirebase();
    setConnected(ok);
  }, []);

  return (
    <FirebaseContext.Provider value={{ connected, config: FIREBASE_CONFIG, reconnect, lastSync, setLastSync }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export function useFirebase(): FirebaseContextType {
  const ctx = useContext(FirebaseContext);
  if (!ctx) throw new Error('useFirebase must be within FirebaseProvider');
  return ctx;
}
