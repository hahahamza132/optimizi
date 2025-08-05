import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { User } from '../types';

export const authService = {
  async signIn(email: string, password: string): Promise<User> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Check if user has admin or fournisseur role
        const userRole = userData.role || 'client';
        if (userRole !== 'admin' && userRole !== 'fournisseur') {
          await signOut(auth);
          throw new Error('Accès non autorisé. Cette interface est réservée aux administrateurs et fournisseurs.');
        }
        
        return {
          id: firebaseUser.uid,
          fullName: userData.fullName || '',
          email: userData.email || firebaseUser.email || '',
          phone: userData.phone || '',
          cin: userData.cin || '',
          imageUrl: userData.imageUrl || '',
          status: userData.status || 'Active',
          role: userRole,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString()
        };
      } else {
        throw new Error('Données utilisateur non trouvées');
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(error.message || 'Échec de la connexion');
    }
  },

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error(error.message || 'Échec de la déconnexion');
    }
  },

  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        const userRole = userData.role || 'client';
        if (userRole !== 'admin' && userRole !== 'fournisseur') {
          return null;
        }
        
        return {
          id: uid,
          fullName: userData.fullName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          cin: userData.cin || '',
          imageUrl: userData.imageUrl || '',
          status: userData.status || 'Active',
          role: userRole,
          createdAt: userData.createdAt || new Date().toISOString(),
          updatedAt: userData.updatedAt || new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }
};