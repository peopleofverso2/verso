import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebaseConfig';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

class AuthService {
  private static instance: AuthService;
  private currentUser: AuthUser | null = null;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  private constructor() {
    firebaseOnAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = this.formatUser(user);
      } else {
        this.currentUser = null;
      }
      this.notifyListeners();
    });
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private notifyListeners() {
    this.authStateListeners.forEach(listener => listener(this.currentUser));
  }

  private formatUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(callback);
    
    // Appeler immédiatement avec l'état actuel
    callback(this.currentUser);
    
    // Retourner une fonction de nettoyage
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      console.log('Starting Google sign in...');
      const provider = new GoogleAuthProvider();
      console.log('Provider created');
      const result = await signInWithPopup(auth, provider);
      console.log('Sign in successful:', result.user.email);
      return this.formatUser(result.user);
    } catch (error: any) {
      console.error('Error signing in with Google:', {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential
      });
      throw error;
    }
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

export const authService = AuthService.getInstance();
