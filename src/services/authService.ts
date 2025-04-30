import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// En mode développement, on utilise un mock si les variables d'environnement ne sont pas définies
const isDevelopment = import.meta.env.DEV;
const isFirebaseConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== 'your_api_key';

let auth: any;
let googleProvider: any;

if (isFirebaseConfigured) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
  } catch (error) {
    console.error('Error initializing Firebase:', error);
  }
}

class AuthService {
  private static instance: AuthService;
  private mockUser: User | null = null;

  private constructor() {
    if (isDevelopment && !isFirebaseConfigured) {
      console.warn('Firebase not configured. Using mock authentication for development.');
      this.mockUser = {
        uid: 'mock-user-id',
        email: 'dev@example.com',
        displayName: 'Developer',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => '',
        getIdTokenResult: async () => ({
          token: '',
          signInProvider: null,
          expirationTime: '',
          issuedAtTime: '',
          authTime: '',
          claims: {}
        }),
        reload: async () => {},
        toJSON: () => ({})
      } as User;
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signInWithGoogle(): Promise<void> {
    if (!isFirebaseConfigured) {
      if (isDevelopment) {
        console.log('Mock sign in successful');
        return;
      }
      throw new Error('Firebase is not configured');
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    if (!isFirebaseConfigured) {
      if (isDevelopment) {
        console.log('Mock sign out successful');
        return;
      }
      throw new Error('Firebase is not configured');
    }

    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  onAuthStateChanged(callback: (user: User | null) => void) {
    if (!isFirebaseConfigured) {
      if (isDevelopment) {
        // Simuler un délai pour le mock
        setTimeout(() => callback(this.mockUser), 100);
        return () => {};
      }
      console.warn('Firebase not configured, auth state changes will not be monitored');
      return () => {};
    }

    return firebaseOnAuthStateChanged(auth, callback);
  }

  isAuthenticated(): boolean {
    if (!isFirebaseConfigured && isDevelopment) {
      return true; // En développement, toujours authentifié si Firebase n'est pas configuré
    }
    return auth?.currentUser !== null;
  }

  getCurrentUser(): User | null {
    if (!isFirebaseConfigured && isDevelopment) {
      return this.mockUser;
    }
    return auth?.currentUser;
  }
}

export const authService = AuthService.getInstance();
