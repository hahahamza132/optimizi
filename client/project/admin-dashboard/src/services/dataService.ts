import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { User, Category, Product, Fournisseur, Order } from '../types';

export const dataService = {
  // Users
  async getUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          fullName: data.fullName || '',
          email: data.email || '',
          phone: data.phone || '',
          cin: data.cin || '',
          imageUrl: data.imageUrl || '',
          status: data.status || 'Active',
          role: data.role || 'client',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      });
      
      return users.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const querySnapshot = await getDocs(categoriesRef);
      
      const categories: Category[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          title: data.title || '',
          FournisseurId: data.FournisseurId || '',
          imgSrc: data.imgSrc || data.image || '',
          subtitle: data.subtitle || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          productCount: data.productCount || 0
        });
      });
      
      return categories.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error('Failed to fetch categories');
    }
  },

  async addCategory(category: Omit<Category, 'id'>): Promise<string> {
    try {
      const categoryData = {
        ...category,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'categories'), categoryData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding category:', error);
      throw new Error('Failed to add category');
    }
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    try {
      const categoryRef = doc(db, 'categories', id);
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

  async deleteCategory(id: string): Promise<void> {
    try {
      const categoryRef = doc(db, 'categories', id);
      await deleteDoc(categoryRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  },

  // Products
  async getProducts(): Promise<Product[]> {
    try {
      const productsRef = collection(db, 'products');
      const querySnapshot = await getDocs(productsRef);
      
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const stockQuantity = Number(data.stockQuantity || data.stock || 0);
        const name = data.name || data.title || data.productName || '';
        const imageURL = data.imageURL || data.image || data.img || '';
        const prixTTC = Number(data.prixTTC || data.price || data.prixTtc || 0);
        
        products.push({
          id: doc.id,
          name: name,
          title: data.title || name,
          prixHTVA: Number(data.prixHTVA || data.prixHtva || prixTTC * 0.9) || 0,
          tva: Number(data.tva || data.TVA || 10) || 0,
          Tags: Array.isArray(data.Tags) ? data.Tags : (Array.isArray(data.tags) ? data.tags : []),
          prixTTC: prixTTC,
          categoryId: data.categoryId || data.category || '',
          FournisseurId: data.FournisseurId || data.fournisseur || data.supplier || '',
          imageURL: imageURL,
          description: data.description || data.desc || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          stockQuantity: stockQuantity,
          discount: Number(data.discount || data.reduction || 0) || 0,
          unit: data.unit || data.unite || 'piece',
          review: Array.isArray(data.review) ? data.review : (Array.isArray(data.reviews) ? data.reviews : []),
          rating: Number(data.rating || data.note || 0) || 0,
          feature: Boolean(data.feature || data.featured || false)
        });
      });
      
      return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  },

  async addProduct(product: Omit<Product, 'id'>): Promise<string> {
    try {
      const productData = {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const docRef = await addDoc(collection(db, 'products'), productData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding product:', error);
      throw new Error('Failed to add product');
    }
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const productRef = doc(db, 'products', id);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(productRef, updateData);
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error('Failed to update product');
    }
  },

  async deleteProduct(id: string): Promise<void> {
    try {
      const productRef = doc(db, 'products', id);
      await deleteDoc(productRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  },

  // Fournisseurs
  async getFournisseurs(): Promise<Fournisseur[]> {
    try {
      const fournisseursRef = collection(db, 'Fournisseurs');
      const querySnapshot = await getDocs(fournisseursRef);
      
      const fournisseurs: Fournisseur[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fournisseurs.push({
          id: doc.id,
          name: data.name || '',
          address: data.address || '',
          ownerId: data.ownerId || '',
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

  // Orders
  async getOrders(): Promise<Order[]> {
    try {
      const ordersRef = collection(db, 'masterOrders');
      const querySnapshot = await getDocs(ordersRef);
      
      const orders: Order[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        orders.push({
          id: doc.id,
          userId: data.userId || '',
          userEmail: data.userEmail || '',
          userName: data.userName || '',
          userPhone: data.userPhone || '',
          items: data.items || [],
          subtotal: data.subtotal || 0,
          deliveryFee: data.deliveryFee || 0,
          tax: data.tax || 0,
          promoDiscount: data.promoDiscount || 0,
          total: data.total || 0,
          status: data.status || 'pending',
          paymentStatus: data.paymentStatus || 'pending',
          paymentMethod: data.paymentMethod || '',
          deliveryAddress: data.deliveryAddress || {},
          promoCode: data.promoCode,
          orderNotes: data.orderNotes,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          confirmedAt: data.confirmedAt,
          deliveredAt: data.deliveredAt
        });
      });
      
      return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw new Error('Failed to fetch orders');
    }
  },

  async updateOrderStatus(orderId: string, status: Order['status'], paymentStatus?: Order['paymentStatus']): Promise<void> {
    try {
      const orderRef = doc(db, 'masterOrders', orderId);
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };

      if (paymentStatus) {
        updateData.paymentStatus = paymentStatus;
      }

      if (status === 'confirmed') {
        updateData.confirmedAt = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.deliveredAt = new Date().toISOString();
      }

      await updateDoc(orderRef, updateData);
    } catch (error) {
      console.error('Error updating order status:', error);
      throw new Error('Failed to update order status');
    }
  }
};