import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const securityService = {
  async changePassword(data: ChangePasswordData): Promise<void> {
    const user = auth.currentUser;
    
    if (!user || !user.email) {
      throw new Error('Utilisateur non authentifié');
    }

    // Validate passwords match
    if (data.newPassword !== data.confirmPassword) {
      throw new Error('Les nouveaux mots de passe ne correspondent pas');
    }

    // Validate password strength
    if (data.newPassword.length < 6) {
      throw new Error('Le nouveau mot de passe doit contenir au moins 6 caractères');
    }

    try {
      // Re-authenticate user with current password
      const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password in Firebase Auth
      await updatePassword(user, data.newPassword);

      // Update timestamp in Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        updatedAt: new Date().toISOString(),
        lastPasswordChange: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'auth/wrong-password') {
        throw new Error('Mot de passe actuel incorrect');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Le nouveau mot de passe est trop faible');
      } else if (error.code === 'auth/requires-recent-login') {
        throw new Error('Veuillez vous reconnecter avant de changer votre mot de passe');
      } else {
        throw new Error(error.message || 'Erreur lors du changement de mot de passe');
      }
    }
  },

  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Au moins 8 caractères');
    }

    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Au moins une majuscule');
    }

    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Au moins une minuscule');
    }

    // Number check
    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Au moins un chiffre');
    }

    // Special character check
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Au moins un caractère spécial');
    }

    return {
      isValid: score >= 3,
      score,
      feedback
    };
  }
};