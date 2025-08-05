import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Fournisseur } from '../types';

const COLLECTION_NAME = 'Fournisseurs';

export const fournisseurService = {
  // Get all fournisseurs
  async getFournisseurs(): Promise<Fournisseur[]> {
    try {
      const fournisseursRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(fournisseursRef);
      
      const fournisseurs: Fournisseur[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fournisseurs.push({
          id: doc.id,
          name: data.name || '',
          address: data.address || '',
          ownerId: data.ownerId || data.FournisseurOwner || '',
          image: data.image || '',
          matriculeFiscale: data.matriculeFiscale || '',
          openingHours: data.openingHours || '',
          useUserAddress: Boolean(data.useUserAddress || false),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      });
      
      return fournisseurs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching fournisseurs:', error);
      throw new Error('Failed to fetch fournisseurs');
    }
  },

  // Get fournisseur by ID
  async getFournisseurById(id: string): Promise<Fournisseur | null> {
    try {
      const fournisseurRef = doc(db, COLLECTION_NAME, id);
      const fournisseurSnap = await getDoc(fournisseurRef);
      
      if (fournisseurSnap.exists()) {
        const data = fournisseurSnap.data();
        return {
          id: fournisseurSnap.id,
          name: data.name || '',
          address: data.address || '',
          ownerId: data.ownerId || data.FournisseurOwner || '',
          image: data.image || '',
          matriculeFiscale: data.matriculeFiscale || '',
          openingHours: data.openingHours || '',
          useUserAddress: Boolean(data.useUserAddress || false),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching fournisseur:', error);
      throw new Error('Failed to fetch fournisseur');
    }
  },

  // Add new fournisseur
  async addFournisseur(fournisseur: Omit<Fournisseur, 'id'>): Promise<string> {
    try {
      const fournisseurData = {
        name: fournisseur.name,
        address: fournisseur.address,
        ownerId: fournisseur.ownerId,
        FournisseurOwner: fournisseur.ownerId, // Also save as FournisseurOwner for compatibility
        image: fournisseur.image,
        matriculeFiscale: fournisseur.matriculeFiscale,
        openingHours: fournisseur.openingHours,
        useUserAddress: fournisseur.useUserAddress,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), fournisseurData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding fournisseur:', error);
      throw new Error('Failed to add fournisseur');
    }
  },

  // Update fournisseur
  async updateFournisseur(id: string, updates: Partial<Fournisseur>): Promise<void> {
    try {
      const fournisseurRef = doc(db, COLLECTION_NAME, id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Also update FournisseurOwner if ownerId is being updated
      if (updates.ownerId) {
        updateData.FournisseurOwner = updates.ownerId;
      }
      
      await updateDoc(fournisseurRef, updateData);
    } catch (error) {
      console.error('Error updating fournisseur:', error);
      throw new Error('Failed to update fournisseur');
    }
  },

  // Delete fournisseur
  async deleteFournisseur(id: string): Promise<void> {
    try {
      const fournisseurRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(fournisseurRef);
    } catch (error) {
      console.error('Error deleting fournisseur:', error);
      throw new Error('Failed to delete fournisseur');
    }
  },

  // Get fournisseurs by owner ID
  async getFournisseursByOwnerId(ownerId: string): Promise<Fournisseur[]> {
    try {
      const fournisseursRef = collection(db, COLLECTION_NAME);
      const q = query(fournisseursRef, where('ownerId', '==', ownerId));
      const querySnapshot = await getDocs(q);
      
      const fournisseurs: Fournisseur[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fournisseurs.push({
          id: doc.id,
          name: data.name || '',
          address: data.address || '',
          ownerId: data.ownerId || data.FournisseurOwner || '',
          image: data.image || '',
          matriculeFiscale: data.matriculeFiscale || '',
          openingHours: data.openingHours || '',
          useUserAddress: Boolean(data.useUserAddress || false),
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      });
      
      return fournisseurs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching fournisseurs by owner:', error);
      throw new Error('Failed to fetch fournisseurs by owner');
    }
  }
};
  // Check if user already has a fournisseur
  async userHasFournisseur(ownerId: string): Promise<boolean> {
    try {
      const userFournisseurs = await this.getFournisseursByOwnerId(ownerId);
      return userFournisseurs.length > 0;
    } catch (error) {
      console.error('Error checking if user has fournisseur:', error);
      return false;
    }
  },

  // Get user's fournisseur
  async getUserFournisseur(ownerId: string): Promise<Fournisseur | null> {
    try {
      const userFournisseurs = await this.getFournisseursByOwnerId(ownerId);
      return userFournisseurs.length > 0 ? userFournisseurs[0] : null;
    } catch (error) {
      console.error('Error getting user fournisseur:', error);
      return null;
    }
  }