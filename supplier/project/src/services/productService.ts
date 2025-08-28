import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  deleteDoc, 
  addDoc, 
  updateDoc,
  getDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/config';
import { Product } from '../models';

export class ProductService {
  static async getProductsByFournisseur(fournisseurId: string): Promise<Product[]> {
    const productsQuery = query(
      collection(db, 'products'),
      where('FournisseurId', '==', fournisseurId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    
    return productsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];
  }

  static async createProduct(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'products'), {
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      review: []
    });
    
    return docRef.id;
  }

  static async updateProduct(id: string, data: Partial<Product>): Promise<void> {
    await updateDoc(doc(db, 'products', id), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  }

  static async deleteProduct(id: string): Promise<void> {
    await deleteDoc(doc(db, 'products', id));
  }

  static calculatePrices(prixHTVA: string, tva: number, discount: string) {
    const basePrice = parseFloat(prixHTVA) || 0;
    const taxRate = tva / 100;
    const discountRate = parseFloat(discount) / 100;
    
    const prixTTC = basePrice * (1 + taxRate);
    const prixAfterDiscount = prixTTC * (1 - discountRate);
    
    return {
      prixTTC: prixTTC.toFixed(3),
      prixAfterDiscount: prixAfterDiscount.toFixed(3)
    };
  }

  // Stock management methods
  static async decrementProductStock(productId: string, quantity: number): Promise<boolean> {
    try {
      console.log(`🔄 [Stock] Attempting to decrement stock for product ${productId} by ${quantity}`);
      
      const productRef = doc(db, 'products', productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        console.error(`❌ [Stock] Product ${productId} not found`);
        return false;
      }
      
      const productData = productSnap.data() as Product;
      const currentStock = parseInt(productData.stockQuantity) || 0;
      
      console.log(`📊 [Stock] Current stock for product ${productId}: ${currentStock}`);
      
      if (currentStock < quantity) {
        console.error(`❌ [Stock] Insufficient stock for product ${productId}. Current: ${currentStock}, Requested: ${quantity}`);
        return false;
      }
      
      const newStock = currentStock - quantity;
      console.log(`📉 [Stock] New stock for product ${productId}: ${newStock}`);
      
      await updateDoc(productRef, {
        stockQuantity: newStock.toString(),
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ [Stock] Successfully decremented stock for product ${productId} from ${currentStock} to ${newStock}`);
      return true;
    } catch (error) {
      console.error(`❌ [Stock] Error decrementing stock for product ${productId}:`, error);
      return false;
    }
  }

  static async decrementMultipleProductsStock(items: Array<{productId: string, quantity: number}>): Promise<{success: boolean, errors: string[]}> {
    const batch = writeBatch(db);
    const errors: string[] = [];
    let allSuccessful = true;

    try {
      console.log(`🔄 [Stock] Starting batch stock decrement for ${items.length} products`);
      
      // First, validate all products and check stock availability
      const productChecks = await Promise.all(
        items.map(async (item) => {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);
          
          if (!productSnap.exists()) {
            errors.push(`Product ${item.productId} not found`);
            return null;
          }
          
          const productData = productSnap.data() as Product;
          const currentStock = parseInt(productData.stockQuantity) || 0;
          
          if (currentStock < item.quantity) {
            errors.push(`Insufficient stock for product ${item.productId}. Current: ${currentStock}, Requested: ${item.quantity}`);
            return null;
          }
          
          return {
            ref: productRef,
            currentStock,
            newStock: currentStock - item.quantity,
            productId: item.productId,
            quantity: item.quantity
          };
        })
      );

      // If any validation failed, return early
      if (errors.length > 0) {
        console.error(`❌ [Stock] Validation failed for batch stock decrement:`, errors);
        return { success: false, errors };
      }

      // All validations passed, proceed with batch update
      productChecks.forEach((check) => {
        if (check) {
          batch.update(check.ref, {
            stockQuantity: check.newStock.toString(),
            updatedAt: new Date().toISOString()
          });
          console.log(`📉 [Stock] Queued stock decrement for product ${check.productId} from ${check.currentStock} to ${check.newStock}`);
        }
      });

      // Commit the batch
      await batch.commit();
      console.log(`✅ [Stock] Successfully completed batch stock decrement for ${items.length} products`);
      
      return { success: true, errors: [] };
    } catch (error) {
      console.error(`❌ [Stock] Error in batch stock decrement:`, error);
      return { success: false, errors: [`Batch update failed: ${error.message}`] };
    }
  }
}