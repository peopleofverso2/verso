import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
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
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user ? this.formatUser(user) : null;
      this.notifyListeners();
    });
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private formatUser(user: User): AuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    };
  }

  private notifyListeners() {
    this.authStateListeners.forEach(listener => listener(this.currentUser));
  }

  private getErrorMessage(error: any): string {
    if (!error) return 'An unknown error occurred';
    
    switch (error.code) {
      case 'auth/operation-not-allowed':
        return 'Google sign-in is not enabled. Please contact the administrator.';
      case 'auth/popup-blocked':
        return 'The sign-in popup was blocked. Please allow popups for this site.';
      case 'auth/popup-closed-by-user':
        return 'The sign-in was cancelled.';
      case 'auth/unauthorized-domain':
        return 'This domain is not authorized for sign-in. Please contact the administrator.';
      default:
        return error.message || 'Failed to sign in. Please try again.';
    }
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
      const errorMessage = this.getErrorMessage(error);
      console.error('Error signing in with Google:', {
        code: error.code,
        message: errorMessage,
        email: error.email,
        credential: error.credential
      });
      throw new Error(errorMessage);
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  onAuthStateChange(listener: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(listener);
    // Return unsubscribe function
    return () => {
      this.authStateListeners = this.authStateListeners.filter(l => l !== listener);
    };
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }
}

export const authService = AuthService.getInstance();
