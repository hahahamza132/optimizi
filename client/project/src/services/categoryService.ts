import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config.js';
import { Category } from '../types';

const COLLECTION_NAME = 'categories';

export const categoryService = {
  // Get all categories
  async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, COLLECTION_NAME);
      const q = query(categoriesRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const categories: Category[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          title: data.title || '',
          FournisseurId: data.FournisseurId || '',
          imgSrc: data.imgSrc || data.image|| '',
          subtitle: data.subtitle || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          productCount: data.productCount || 0
        });
      });
      
      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  },

  // Get category by ID
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, id);
      const categorySnap = await getDoc(categoryRef);
      
      if (categorySnap.exists()) {
        const data = categorySnap.data();
        return {
          id: categorySnap.id,
          title: data.title || '',
          FournisseurId: data.FournisseurId || '',
          imgSrc: data.imgSrc || data.image||'',
          subtitle: data.subtitle || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          productCount: data.productCount || 0
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw new Error('Failed to fetch category');
    }
  },

  // Add new category
  async addCategory(category: Omit<Category, 'id'>): Promise<string> {
    try {
      const categoryData = {
        ...category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), categoryData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw new Error('Failed to add category');
    }
  },

  // Update category
  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(categoryRef, updateData);
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  },

  // Delete category
  async deleteCategory(id: string): Promise<void> {
    try {
      const categoryRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  }
};