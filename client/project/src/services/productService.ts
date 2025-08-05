import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, where, writeBatch } from 'firebase/firestore';
import { db } from '../config.js';
import { Product } from '../types';
import { fournisseurService } from './fournisseurService';

const COLLECTION_NAME = 'products';

// Helper function to enrich products with fournisseur names
async function enrichProductsWithFournisseurNames(products: Product[]): Promise<Product[]> {
  try {
    // Get all unique fournisseur IDs
    const fournisseurIds = [...new Set(products.map(p => p.FournisseurId).filter(Boolean))];
    
    // Fetch all fournisseurs
    const fournisseurs = await fournisseurService.getFournisseurs();
    const fournisseurMap = new Map(fournisseurs.map(f => [f.id, f.name]));
    
    // Enrich products with fournisseur names
    return products.map(product => ({
      ...product,
      fournisseurName: fournisseurMap.get(product.FournisseurId) || 'Fournisseur inconnu'
    }));
  } catch (error) {
    console.error('Error enriching products with fournisseur names:', error);
    // Return products without fournisseur names if there's an error
    return products.map(product => ({
      ...product,
      fournisseurName: 'Fournisseur inconnu'
    }));
  }
}

export const productService = {
  // Get all products (only in stock)
  async getProducts(): Promise<Product[]> {
    try {
      const productsRef = collection(db, COLLECTION_NAME);
      // First, let's get all products to see what we have
      const querySnapshot = await getDocs(productsRef);

      console.log('Total documents found:', querySnapshot.size);

      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Document data:', doc.id, data);
        
        // More flexible data mapping
        const stockQuantity = Number(data.stockQuantity || data.stock || 0);
        const name = data.name || data.title || data.productName || '';
        const imageURL = data.imageURL || data.image || data.img || '';
        const prixTTC = Number(data.prixTTC || data.price || data.prixTtc || 0);
        
        console.log('Parsed values:', { stockQuantity, name, imageURL, prixTTC });
        
        // Include all products for now to debug
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

      console.log('Processed products:', products);

      // Filter products with stock > 0 after processing
      const inStockProducts = products.filter(product => product.stockQuantity > 0);
      console.log('In stock products:', inStockProducts);

      // Sort on client side: by stock quantity (ascending), then by creation date (descending)
      inStockProducts.sort((a, b) => {
        if (a.stockQuantity !== b.stockQuantity) {
          return a.stockQuantity - b.stockQuantity;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Enrich with fournisseur names
      return await enrichProductsWithFournisseurNames(inStockProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }
  },

  // Get featured products only (only in stock)
  async getFeaturedProducts(): Promise<Product[]> {
    try {
      const productsRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(productsRef);

      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const stockQuantity = Number(data.stockQuantity || data.stock || 0);
        const name = data.name || data.title || data.productName || '';
        const imageURL = data.imageURL || data.image || data.img || '';
        const prixTTC = Number(data.prixTTC || data.price || data.prixTtc || 0);
        const feature = Boolean(data.feature || data.featured || false);
        
        // Filter featured products with stock > 0
        if (feature && stockQuantity > 0) {
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
            feature: feature
          });
        }
      });

      // Sort by rating first, then by creation date
      products.sort((a, b) => {
        if (b.rating !== a.rating) {
          return (b.rating || 0) - (a.rating || 0);
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Enrich with fournisseur names
      return await enrichProductsWithFournisseurNames(products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      throw new Error('Failed to fetch featured products');
    }
  },

  // Get product by ID (regardless of stock for individual product pages)
  async getProductById(id: string): Promise<Product | null> {
    try {
      const productRef = doc(db, COLLECTION_NAME, id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const data = productSnap.data();
        const stockQuantity = Number(data.stockQuantity || data.stock || 0);
        const name = data.name || data.title || data.productName || '';
        const imageURL = data.imageURL || data.image || data.img || '';
        const prixTTC = Number(data.prixTTC || data.price || data.prixTtc || 0);
        
        const product: Product = {
          id: productSnap.id,
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
        };

        // Enrich with fournisseur name
        const enrichedProducts = await enrichProductsWithFournisseurNames([product]);
        return enrichedProducts[0];
      }

      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error('Failed to fetch product');
    }
  },

  // Get products by category (only in stock)
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const productsRef = collection(db, COLLECTION_NAME);
      const querySnapshot = await getDocs(productsRef);

      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const stockQuantity = Number(data.stockQuantity || data.stock || 0);
        const name = data.name || data.title || data.productName || '';
        const imageURL = data.imageURL || data.image || data.img || '';
        const prixTTC = Number(data.prixTTC || data.price || data.prixTtc || 0);
        const productCategoryId = data.categoryId || data.category || '';
        
        // Filter by category and stock > 0
        if (productCategoryId === categoryId && stockQuantity > 0) {
          products.push({
            id: doc.id,
            name: name,
            title: data.title || name,
            prixHTVA: Number(data.prixHTVA || data.prixHtva || prixTTC * 0.9) || 0,
            tva: Number(data.tva || data.TVA || 10) || 0,
            Tags: Array.isArray(data.Tags) ? data.Tags : (Array.isArray(data.tags) ? data.tags : []),
            prixTTC: prixTTC,
            categoryId: productCategoryId,
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
        }
      });

      // Sort by creation date (newest first)
      products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Enrich with fournisseur names
      return await enrichProductsWithFournisseurNames(products);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw new Error('Failed to fetch products by category');
    }
  },

  // Add new product
  async addProduct(product: Omit<Product, 'id'>): Promise<string> {
    try {
      const productData = {
        ...product,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), productData);
      return docRef.id;
    } catch (error) {
      console.error('Error adding product:', error);
      throw new Error('Failed to add product');
    }
  },

  // Update product
  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const productRef = doc(db, COLLECTION_NAME, id);
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

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    try {
      const productRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(productRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw new Error('Failed to delete product');
    }
  },

  // Toggle featured status
  async toggleFeatured(id: string, feature: boolean): Promise<void> {
    try {
      const productRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(productRef, {
        feature,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error toggling featured status:', error);
      throw new Error('Failed to update featured status');
    }
  },

  // Stock management methods
  async decrementProductStock(productId: string, quantity: number): Promise<boolean> {
    try {
      console.log(`🔄 [Stock] Attempting to decrement stock for product ${productId} by ${quantity}`);
      
      const productRef = doc(db, COLLECTION_NAME, productId);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        console.error(`❌ [Stock] Product ${productId} not found`);
        return false;
      }
      
      const productData = productSnap.data() as Product;
      const currentStock = parseInt(productData.stockQuantity?.toString() || '0') || 0;
      
      console.log(`📊 [Stock] Current stock for product ${productId}: ${currentStock}`);
      
      if (currentStock < quantity) {
        console.error(`❌ [Stock] Insufficient stock for product ${productId}. Current: ${currentStock}, Requested: ${quantity}`);
        return false;
      }
      
      const newStock = currentStock - quantity;
      console.log(`📉 [Stock] New stock for product ${productId}: ${newStock}`);
      
      await updateDoc(productRef, {
        stockQuantity: newStock,
        updatedAt: new Date().toISOString()
      });
      
      console.log(`✅ [Stock] Successfully decremented stock for product ${productId} from ${currentStock} to ${newStock}`);
      return true;
    } catch (error) {
      console.error(`❌ [Stock] Error decrementing stock for product ${productId}:`, error);
      return false;
    }
  },

  async decrementMultipleProductsStock(items: Array<{productId: string, quantity: number}>): Promise<{success: boolean, errors: string[]}> {
    const batch = writeBatch(db);
    const errors: string[] = [];

    try {
      console.log(`🔄 [Stock] Starting batch stock decrement for ${items.length} products`);
      
      // First, validate all products and check stock availability
      const productChecks = await Promise.all(
        items.map(async (item) => {
          const productRef = doc(db, COLLECTION_NAME, item.productId);
          const productSnap = await getDoc(productRef);
          
          if (!productSnap.exists()) {
            errors.push(`Product ${item.productId} not found`);
            return null;
          }
          
          const productData = productSnap.data() as Product;
          const currentStock = parseInt(productData.stockQuantity?.toString() || '0') || 0;
          
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
            stockQuantity: check.newStock,
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
};