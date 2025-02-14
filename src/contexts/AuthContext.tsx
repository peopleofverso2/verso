import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { authService } from '../services/authService';
import { configService } from '../services/configService';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: 'admin' | 'user';
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  userRole: 'admin' | 'user' | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const ADMIN_EMAILS = ['fred@verso.fr', 'admin@verso.fr']; // À configurer dans les paramètres plus tard

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return authService.onAuthStateChanged(async (firebaseUser: User | null) => {
      try {
        if (firebaseUser) {
          const formattedUser = await authService.formatUser(firebaseUser);
          const role = ADMIN_EMAILS.includes(formattedUser.email || '') ? 'admin' : 'user';
          setUser({ ...formattedUser, role });

          // Charger la configuration si elle existe
          const config = await configService.getConfig();
          console.log('User config loaded:', config);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });
  }, []);

  const signInWithGoogle = async () => {
    try {
      const authUser = await authService.signInWithGoogle();
      const role = ADMIN_EMAILS.includes(authUser.email || '') ? 'admin' : 'user';
      setUser({ ...authUser, role });
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    userRole: user?.role || null,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
