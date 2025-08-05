// File: /home/ubuntu/project-bolt/project/src/services/notificationService.ts

import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  orderBy,
  limit,
  onSnapshot,
  Unsubscribe,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/config';
import { AppNotification, Order } from '../models';

export class NotificationService {
  // Create a new notification
  static async createNotification(notification: Omit<AppNotification, 'id' | 'createdAt'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'notifications'), {
      ...notification,
      createdAt: new Date().toISOString()
    });
    
    return docRef.id;
  }

  // Get notifications for a specific supplier with pagination
  static async getNotificationsByFournisseur(
    fournisseurId: string, 
    limitCount: number = 50,
    lastNotificationId?: string
  ): Promise<AppNotification[]> {
    let notificationsQuery = query(
      collection(db, 'notifications'),
      where('fournisseurId', '==', fournisseurId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AppNotification[];
  }

  // Search notifications
  static async searchNotifications(
    fournisseurId: string,
    searchTerm: string,
    type?: string
  ): Promise<AppNotification[]> {
    let notificationsQuery = query(
      collection(db, 'notifications'),
      where('fournisseurId', '==', fournisseurId),
      orderBy('createdAt', 'desc')
    );

    if (type && type !== 'all') {
      notificationsQuery = query(
        collection(db, 'notifications'),
        where('fournisseurId', '==', fournisseurId),
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      );
    }
    
    const snapshot = await getDocs(notificationsQuery);
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as AppNotification[];

    // Filter by search term (client-side filtering due to Firestore limitations)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      return notifications.filter(notification =>
        notification.title.toLowerCase().includes(lowerSearchTerm) ||
        notification.message.toLowerCase().includes(lowerSearchTerm)
      );
    }

    return notifications;
  }

  // Mark notification as read
  static async markAsRead(notificationId: string): Promise<void> {
    await updateDoc(doc(db, 'notifications', notificationId), {
      isRead: true,
      readAt: new Date().toISOString()
    });
  }

  // Mark multiple notifications as read
  static async markMultipleAsRead(notificationIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    
    notificationIds.forEach(id => {
      const notificationRef = doc(db, 'notifications', id);
      batch.update(notificationRef, {
        isRead: true,
        readAt: new Date().toISOString()
      });
    });

    await batch.commit();
  }

  // Mark all notifications as read for a supplier
  static async markAllAsRead(fournisseurId: string): Promise<void> {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('fournisseurId', '==', fournisseurId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    const batch = writeBatch(db);
    
    snapshot.docs.forEach(docSnapshot => {
      batch.update(doc(db, 'notifications', docSnapshot.id), { 
        isRead: true,
        readAt: new Date().toISOString()
      });
    });
    
    await batch.commit();
  }

  // Delete notification
  static async deleteNotification(notificationId: string): Promise<void> {
    await deleteDoc(doc(db, 'notifications', notificationId));
  }

  // Delete multiple notifications
  static async deleteMultipleNotifications(notificationIds: string[]): Promise<void> {
    const batch = writeBatch(db);
    
    notificationIds.forEach(id => {
      const notificationRef = doc(db, 'notifications', id);
      batch.delete(notificationRef);
    });

    await batch.commit();
  }

  // Get unread count
  static async getUnreadCount(fournisseurId: string): Promise<number> {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('fournisseurId', '==', fournisseurId),
      where('isRead', '==', false)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    return snapshot.size;
  }

  // Get notification statistics
  static async getNotificationStats(fournisseurId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    recent: number; // notifications from last 24 hours
  }> {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('fournisseurId', '==', fournisseurId)
    );
    
    const snapshot = await getDocs(notificationsQuery);
    const notifications = snapshot.docs.map(doc => doc.data()) as AppNotification[];
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      byType: {} as Record<string, number>,
      recent: notifications.filter(n => new Date(n.createdAt) > yesterday).length
    };

    // Count by type
    notifications.forEach(notification => {
      stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1;
    });

    return stats;
  }

  // Real-time listener for new notifications
  static subscribeToNotifications(
    fournisseurId: string, 
    callback: (notifications: AppNotification[]) => void
  ): Unsubscribe {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('fournisseurId', '==', fournisseurId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as AppNotification[];
      
      callback(notifications);
    });
  }

  // Real-time listener for unread count
  static subscribeToUnreadCount(
    fournisseurId: string,
    callback: (count: number) => void
  ): Unsubscribe {
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('fournisseurId', '==', fournisseurId),
      where('isRead', '==', false)
    );

    return onSnapshot(notificationsQuery, (snapshot) => {
      callback(snapshot.size);
    });
  }

  // Create order notification with enhanced data for suppliers
  static async createSupplierOrderNotification(subOrder: any): Promise<void> {
    const notification: Omit<AppNotification, 'id' | 'createdAt'> = {
      type: 'order',
      title: 'Nouvelle commande reçue! 🛍️',
      message: `Vous avez reçu une nouvelle commande de ${subOrder.userName} d'un montant de €${subOrder.total.toFixed(2)}. La commande contient ${subOrder.items?.length || 0} article(s).`,
      orderId: subOrder.id,
      fournisseurId: subOrder.fournisseurId,
      isRead: false,
      data: {
        customerName: subOrder.userName,
        customerEmail: subOrder.userEmail,
        customerPhone: subOrder.userPhone,
        orderTotal: subOrder.total,
        itemCount: subOrder.items?.length || 0,
        orderStatus: subOrder.status,
        paymentStatus: subOrder.paymentStatus,
        paymentMethod: subOrder.paymentMethod,
        deliveryAddress: subOrder.deliveryAddress,
        orderNotes: subOrder.orderNotes,
        items: subOrder.items?.map((item: any) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }))
      }
    };

    await this.createNotification(notification);
  }

  // Create payment notification with enhanced data for suppliers
  static async createSupplierPaymentNotification(subOrder: any, oldStatus: string, newStatus: string): Promise<void> {
    let title = '';
    let message = '';
    let emoji = '';

    switch (newStatus) {
      case 'paid':
        title = 'Paiement reçu! 💰';
        message = `Le paiement de €${subOrder.total.toFixed(2)} a été reçu pour la commande #${subOrder.id.slice(-8)} de ${subOrder.userName}`;
        emoji = '💰';
        break;
      case 'failed':
        title = 'Paiement échoué ❌';
        message = `Le paiement a échoué pour la commande #${subOrder.id.slice(-8)} de ${subOrder.userName}. Veuillez contacter le client.`;
        emoji = '❌';
        break;
      case 'pending':
        title = 'Paiement en attente ⏳';
        message = `Le paiement est en attente pour la commande #${subOrder.id.slice(-8)} de ${subOrder.userName}`;
        emoji = '⏳';
        break;
      case 'refunded':
        title = 'Paiement remboursé 💸';
        message = `Le paiement de €${subOrder.total.toFixed(2)} a été remboursé pour la commande #${subOrder.id.slice(-8)} de ${subOrder.userName}`;
        emoji = '💸';
        break;
      default:
        return; // Don't create notification for other statuses
    }

    const notification: Omit<AppNotification, 'id' | 'createdAt'> = {
      type: 'payment',
      title,
      message,
      orderId: subOrder.id,
      fournisseurId: subOrder.fournisseurId,
      isRead: false,
      data: {
        customerName: subOrder.userName,
        customerEmail: subOrder.userEmail,
        orderTotal: subOrder.total,
        oldPaymentStatus: oldStatus,
        newPaymentStatus: newStatus,
        paymentMethod: subOrder.paymentMethod,
        emoji
      }
    };

    await this.createNotification(notification);
  }

  // Create order status change notification for suppliers
  static async createSupplierOrderStatusNotification(subOrder: any, oldStatus: string, newStatus: string): Promise<void> {
    const statusMessages = {
      'pending': 'en attente',
      'confirmed': 'confirmée',
      'preparing': 'en préparation',
      'out_for_delivery': 'en livraison',
      'delivered': 'livrée',
      'cancelled': 'annulée'
    };

    const statusMessage = statusMessages[newStatus as keyof typeof statusMessages] || newStatus;
    
    const notification: Omit<AppNotification, 'id' | 'createdAt'> = {
      type: 'order',
      title: `Statut de commande mis à jour`,
      message: `La commande de ${subOrder.userName} est maintenant ${statusMessage}.`,
      orderId: subOrder.id,
      fournisseurId: subOrder.fournisseurId,
      isRead: false,
      data: {
        customerName: subOrder.userName,
        orderTotal: subOrder.total,
        oldStatus: oldStatus,
        newStatus: newStatus,
        orderStatus: newStatus
      }
    };

    await this.createNotification(notification);
  }

  // Create system notification
  static async createSystemNotification(
    fournisseurId: string, 
    title: string, 
    message: string, 
    data?: any
  ): Promise<void> {
    const notification: Omit<AppNotification, 'id' | 'createdAt'> = {
      type: 'system',
      title,
      message,
      fournisseurId,
      isRead: false,
      data
    };

    await this.createNotification(notification);
  }

  // Create product notification (for stock alerts, etc.)
  static async createProductNotification(
    fournisseurId: string,
    title: string,
    message: string,
    productId?: string,
    data?: any
  ): Promise<void> {
    const notification: Omit<AppNotification, 'id' | 'createdAt'> = {
      type: 'product',
      title,
      message,
      fournisseurId,
      isRead: false,
      data: {
        productId,
        ...data
      }
    };

    await this.createNotification(notification);
  }

  // Create bulk notifications for multiple suppliers
  static async createBulkNotifications(
    notifications: Omit<AppNotification, 'id' | 'createdAt'>[]
  ): Promise<string[]> {
    const batch = writeBatch(db);
    const notificationIds: string[] = [];

    notifications.forEach(notification => {
      const docRef = doc(collection(db, 'notifications'));
      batch.set(docRef, {
        ...notification,
        createdAt: new Date().toISOString()
      });
      notificationIds.push(docRef.id);
    });

    await batch.commit();
    return notificationIds;
  }

  // Clean up old notifications (older than specified days)
  static async cleanupOldNotifications(fournisseurId: string, daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('fournisseurId', '==', fournisseurId),
      where('createdAt', '<', cutoffDate.toISOString())
    );

    const snapshot = await getDocs(notificationsQuery);
    const batch = writeBatch(db);

    snapshot.docs.forEach(docSnapshot => {
      batch.delete(doc(db, 'notifications', docSnapshot.id));
    });

    await batch.commit();
    return snapshot.size;
  }

  // Get notification icon based on type
  static getNotificationIcon(type: string): string {
    switch (type) {
      case 'order':
        return '🛍️';
      case 'payment':
        return '💰';
      case 'system':
        return '⚙️';
      case 'product':
        return '📦';
      default:
        return '🔔';
    }
  }

  // Get notification color based on type
  static getNotificationColor(type: string): string {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'payment':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'system':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'product':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  }

  // Get notification priority based on type and content
  static getNotificationPriority(notification: AppNotification): 'high' | 'medium' | 'low' {
    switch (notification.type) {
      case 'order':
        return 'high';
      case 'payment':
        return notification.data?.newPaymentStatus === 'failed' ? 'high' : 'medium';
      case 'system':
        return 'medium';
      case 'product':
        return 'low';
      default:
        return 'low';
    }
  }

  // Format notification for display
  static formatNotificationTime(createdAt: string): string {
    const date = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  }
}
