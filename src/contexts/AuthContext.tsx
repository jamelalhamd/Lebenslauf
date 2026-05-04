import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getAuthRef } from '../lib/firebase';

interface AuthContextType {
  isAdmin: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuthRef();
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const auth = getAuthRef();
    if (!auth) return false;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    const auth = getAuthRef();
    if (auth) await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ isAdmin: !!user, user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
