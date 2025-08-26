import emailjs from '@emailjs/browser';
import { Order, OrderItem, DeliveryAddress } from '../models';

// Email configuration interface
interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// Order notification email templates
interface OrderEmailTemplate {
  subject: string;
  message: string;
  type: 'new_order' | 'order_confirmed' | 'order_preparing' | 'order_shipped' | 'order_delivered' | 'order_cancelled';
}

// Order status to email template mapping
const ORDER_STATUS_TEMPLATES: Record<string, OrderEmailTemplate> = {
  pending: {
    type: 'new_order',
    subject: '🆕 Nouvelle Commande Reçue - #{orderNumber}',
    message: `
      Bonjour {supplierName},
      
      Vous avez reçu une nouvelle commande !
      
      Détails de la commande:
      - Numéro de commande: #{orderNumber}
      - Client: {customerName}
      - Email: {customerEmail}
      - Téléphone: {customerPhone}
      - Montant total: €{total}
      - Articles: {itemCount} article(s)
      - Adresse de livraison: {deliveryAddress}
      
      Articles commandés:
      {orderItems}
      
      Notes de commande: {orderNotes}
      
      Veuillez confirmer cette commande dès que possible.
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  confirmed: {
    type: 'order_confirmed',
    subject: '✅ Commande Confirmée - #{orderNumber}',
    message: `
      Bonjour {supplierName},
      
      La commande #{orderNumber} a été confirmée et est maintenant en cours de préparation.
      
      Détails de la commande:
      - Client: {customerName}
      - Email: {customerEmail}
      - Téléphone: {customerPhone}
      - Montant total: €{total}
      - Articles: {itemCount} article(s)
      - Adresse de livraison: {deliveryAddress}
      
      Articles à préparer:
      {orderItems}
      
      Notes de commande: {orderNotes}
      
      Temps de préparation estimé: 15-30 minutes
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  preparing: {
    type: 'order_preparing',
    subject: '👨‍🍳 Préparation en Cours - #{orderNumber}',
    message: `
      Bonjour {supplierName},
      
      La commande #{orderNumber} est actuellement en cours de préparation.
      
      Détails de la commande:
      - Client: {customerName}
      - Email: {customerEmail}
      - Téléphone: {customerPhone}
      - Montant total: €{total}
      - Articles: {itemCount} article(s)
      - Adresse de livraison: {deliveryAddress}
      
      Articles en préparation:
      {orderItems}
      
      Notes de commande: {orderNotes}
      
      Temps de livraison estimé: 20-40 minutes
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  out_for_delivery: {
    type: 'order_shipped',
    subject: '🚚 En Cours de Livraison - #{orderNumber}',
    message: `
      Bonjour {supplierName},
      
      La commande #{orderNumber} est maintenant en route !
      
      Détails de la commande:
      - Client: {customerName}
      - Email: {customerEmail}
      - Téléphone: {customerPhone}
      - Montant total: €{total}
      - Articles: {itemCount} article(s)
      - Adresse de livraison: {deliveryAddress}
      
      Articles livrés:
      {orderItems}
      
      Notes de commande: {orderNotes}
      
      Temps de livraison estimé: 10-20 minutes
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  delivered: {
    type: 'order_delivered',
    subject: '🎉 Commande Livrée - #{orderNumber}',
    message: `
      Bonjour {supplierName},
      
      La commande #{orderNumber} a été livrée avec succès !
      
      Détails de la commande:
      - Client: {customerName}
      - Email: {customerEmail}
      - Téléphone: {customerPhone}
      - Montant total: €{total}
      - Articles: {itemCount} article(s)
      - Adresse de livraison: {deliveryAddress}
      
      Articles livrés:
      {orderItems}
      
      Notes de commande: {orderNotes}
      
      Merci pour votre excellent service !
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  cancelled: {
    type: 'order_cancelled',
    subject: '❌ Commande Annulée - #{orderNumber}',
    message: `
      Bonjour {supplierName},
      
      La commande #{orderNumber} a été annulée.
      
      Détails de la commande:
      - Client: {customerName}
      - Email: {customerEmail}
      - Téléphone: {customerPhone}
      - Montant total: €{total}
      - Articles: {itemCount} article(s)
      - Adresse de livraison: {deliveryAddress}
      
      Articles concernés:
      {orderItems}
      
      Notes de commande: {orderNotes}
      
      Si vous avez des questions concernant cette annulation, n'hésitez pas à nous contacter.
      
      Cordialement,
      L'équipe Optimizi
    `
  }
};

export class SupplierEmailService {
  private static instance: SupplierEmailService;
  private isInitialized = false;

  // EmailJS configuration - you need to set these values from your EmailJS dashboard
  private config = {
    // REQUIRED: Replace with your EmailJS Service ID
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_EMAILJS_SERVICE_ID',
    
    // REQUIRED: Replace with your EmailJS Template ID for supplier order notifications
    orderNotificationTemplateId: import.meta.env.VITE_EMAILJS_SUPPLIER_ORDER_TEMPLATE_ID || 'YOUR_SUPPLIER_ORDER_TEMPLATE_ID',
    
    // REQUIRED: Replace with your EmailJS Public Key
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY'
  };

  private constructor() {}

  public static getInstance(): SupplierEmailService {
    if (!SupplierEmailService.instance) {
      SupplierEmailService.instance = new SupplierEmailService();
    }
    return SupplierEmailService.instance;
  }

  /**
   * Initialize EmailJS
   * This should be called once when the app starts
   */
  public initialize(): void {
    if (this.isInitialized) return;

    try {
      emailjs.init(this.config.publicKey);
      this.isInitialized = true;
      console.log('Supplier EmailJS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Supplier EmailJS:', error);
    }
  }

  /**
   * Send order notification email to supplier
   * This will be called automatically when order status changes
   */
  public async sendOrderNotification(order: Order): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('Supplier EmailJS not initialized');
      return false;
    }

    try {
      const template = ORDER_STATUS_TEMPLATES[order.status];
      if (!template) {
        console.error(`No email template found for status: ${order.status}`);
        return false;
      }

      const orderNumber = order.id.slice(-8).toUpperCase();
      
      // Format order items for email
      const orderItemsHtml = this.formatOrderItems(order.items);
      
      // Format delivery address
      const deliveryAddressFormatted = this.formatDeliveryAddress(order.deliveryAddress);
      
      // Replace placeholders in the message
      const personalizedMessage = template.message
        .replace(/{supplierName}/g, order.fournisseurName)
        .replace(/{orderNumber}/g, orderNumber)
        .replace(/{customerName}/g, order.userName)
        .replace(/{customerEmail}/g, order.userEmail)
        .replace(/{customerPhone}/g, order.userPhone)
        .replace(/{total}/g, order.total.toFixed(2))
        .replace(/{itemCount}/g, order.items.length.toString())
        .replace(/{deliveryAddress}/g, deliveryAddressFormatted)
        .replace(/{orderItems}/g, orderItemsHtml)
        .replace(/{orderNotes}/g, order.orderNotes || 'Aucune note');

      const personalizedSubject = template.subject
        .replace(/{orderNumber}/g, orderNumber);

      const templateParams = {
        to_email: this.getSupplierEmail(order.fournisseurId), // You'll need to implement this
        to_name: order.fournisseurName,
        subject: personalizedSubject,
        message: personalizedMessage,
        order_id: orderNumber,
        status: order.status,
        status_type: template.type,
        company_name: 'Optimizi',
        supplier_name: order.fournisseurName,
        customer_name: order.userName,
        customer_email: order.userEmail,
        customer_phone: order.userPhone,
        order_total: order.total.toFixed(2),
        item_count: order.items.length,
        delivery_address: deliveryAddressFormatted,
        order_items: orderItemsHtml,
        order_notes: order.orderNotes || 'Aucune note'
      };

      const response = await emailjs.send(
        this.config.serviceId,
        this.config.orderNotificationTemplateId,
        templateParams
      );

      console.log('Supplier order notification email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send supplier order notification email:', error);
      return false;
    }
  }

  /**
   * Format order items for email display
   */
  private formatOrderItems(items: OrderItem[]): string {
    return items.map(item => 
      `• ${item.productName} - Quantité: ${item.quantity} ${item.unit} - Prix: €${item.totalPrice.toFixed(2)}`
    ).join('\n');
  }

  /**
   * Format delivery address for email display
   */
  private formatDeliveryAddress(address: DeliveryAddress): string {
    return `${address.street}, ${address.city} ${address.postalCode}, ${address.country}`;
  }

  /**
   * Get supplier email address
   * TODO: Implement this to fetch supplier email from your database
   */
  private getSupplierEmail(supplierId: string): string {
    // For now, return a placeholder. You'll need to implement this
    // to fetch the actual supplier email from your database
    return 'supplier@example.com'; // Replace with actual implementation
  }

  /**
   * Send bulk order notifications (for multiple orders)
   */
  public async sendBulkOrderNotifications(orders: Order[]): Promise<boolean[]> {
    const results = await Promise.allSettled(
      orders.map(order => this.sendOrderNotification(order))
    );
    
    return results.map(result => 
      result.status === 'fulfilled' ? result.value : false
    );
  }

  /**
   * Check if EmailJS is properly configured
   */
  public isConfigured(): boolean {
    return (
      this.config.serviceId !== 'YOUR_EMAILJS_SERVICE_ID' &&
      this.config.orderNotificationTemplateId !== 'YOUR_SUPPLIER_ORDER_TEMPLATE_ID' &&
      this.config.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY'
    );
  }

  /**
   * Get configuration status for debugging
   */
  public getConfigStatus(): { isConfigured: boolean; missingFields: string[] } {
    const missingFields: string[] = [];
    
    if (this.config.serviceId === 'YOUR_EMAILJS_SERVICE_ID') {
      missingFields.push('VITE_EMAILJS_SERVICE_ID');
    }
    if (this.config.orderNotificationTemplateId === 'YOUR_SUPPLIER_ORDER_TEMPLATE_ID') {
      missingFields.push('VITE_EMAILJS_SUPPLIER_ORDER_TEMPLATE_ID');
    }
    if (this.config.publicKey === 'YOUR_EMAILJS_PUBLIC_KEY') {
      missingFields.push('VITE_EMAILJS_PUBLIC_KEY');
    }

    return {
      isConfigured: missingFields.length === 0,
      missingFields
    };
  }
}

// Export singleton instance
export const supplierEmailService = SupplierEmailService.getInstance();