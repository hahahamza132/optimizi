import emailjs from '@emailjs/browser';

// Email configuration interface
interface EmailConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// Order status email templates
interface OrderEmailTemplate {
  subject: string;
  message: string;
  type: 'warning' | 'info' | 'secondary' | 'primary' | 'success' | 'error';
}

// Order status to email template mapping
const ORDER_STATUS_TEMPLATES: Record<string, OrderEmailTemplate> = {
  pending: {
    type: 'warning',
    subject: 'Commande en attente - #{orderNumber}',
    message: `
      Bonjour {userName},
      
      Votre commande #{orderNumber} a été reçue et est actuellement en attente de traitement.
      
      Détails de la commande:
      - Montant total: €{total}
      - Articles: {itemCount} article(s)
      - Adresse de livraison: {deliveryAddress}
      
      Nous vous tiendrons informé(e) de l'évolution de votre commande.
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  confirmed: {
    type: 'info',
    subject: 'Commande confirmée - #{orderNumber}',
    message: `
      Bonjour {userName},
      
      Excellente nouvelle ! Votre commande #{orderNumber} a été confirmée et sera bientôt préparée.
      
      Détails de la commande:
      - Montant total: €{total}
      - Articles: {itemCount} article(s)
      - Méthode de paiement: {paymentMethod}
      
      Temps de préparation estimé: 15-30 minutes
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  preparing: {
    type: 'secondary',
    subject: 'Préparation en cours - #{orderNumber}',
    message: `
      Bonjour {userName},
      
      Votre commande #{orderNumber} est actuellement en cours de préparation dans nos cuisines.
      
      Nos chefs préparent soigneusement vos {itemCount} article(s) pour vous garantir la meilleure qualité.
      
      Temps de livraison estimé: 20-40 minutes
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  out_for_delivery: {
    type: 'primary',
    subject: 'En cours de livraison - #{orderNumber}',
    message: `
      Bonjour {userName},
      
      Votre commande #{orderNumber} est maintenant en route !
      
      Notre livreur se dirige vers votre adresse:
      {deliveryAddress}
      
      Temps de livraison estimé: 10-20 minutes
      
      Préparez-vous à recevoir votre délicieuse commande !
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  delivered: {
    type: 'success',
    subject: 'Commande livrée - #{orderNumber}',
    message: `
      Bonjour {userName},
      
      Votre commande #{orderNumber} a été livrée avec succès !
      
      Nous espérons que vous apprécierez votre repas. N'hésitez pas à nous laisser un avis sur les produits que vous avez commandés.
      
      Merci de votre confiance et à bientôt sur Optimizi !
      
      Cordialement,
      L'équipe Optimizi
    `
  },
  cancelled: {
    type: 'error',
    subject: 'Commande annulée - #{orderNumber}',
    message: `
      Bonjour {userName},
      
      Nous vous informons que votre commande #{orderNumber} a été annulée.
      
      Si vous avez des questions concernant cette annulation, n'hésitez pas à nous contacter à support@optimizi.com ou au +1 (555) 123-4567.
      
      Nous nous excusons pour tout désagrément causé.
      
      Cordialement,
      L'équipe Optimizi
    `
  }
};

export class EmailService {
  private static instance: EmailService;
  private isInitialized = false;

  // TODO: You need to set these values from your EmailJS dashboard
  // 1. Go to https://www.emailjs.com/
  // 2. Create an account (free)
  // 3. Create a service (Gmail, Outlook, etc.)
  // 4. Create email templates
  // 5. Get your Service ID, Template IDs, and Public Key
  private config = {
    // REQUIRED: Replace with your EmailJS Service ID
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_EMAILJS_SERVICE_ID',
    
    // REQUIRED: Replace with your EmailJS Template IDs
    orderNotificationTemplateId: (
      import.meta.env.VITE_EMAILJS_SUPPLIER_ORDER_TEMPLATE_ID ||
      import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID ||
      'YOUR_ORDER_TEMPLATE_ID'
    ),
    contactFormTemplateId: import.meta.env.VITE_EMAILJS_CONTACT_TEMPLATE_ID || 'YOUR_CONTACT_TEMPLATE_ID',
    
    // REQUIRED: Replace with your EmailJS Public Key
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY'
  };

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
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
      console.log('EmailJS initialized successfully');
    } catch (error) {
      console.error('Failed to initialize EmailJS:', error);
    }
  }

  /**
   * Send order status notification email
   * This will be called automatically when order status changes
   */
  public async sendOrderNotification(orderData: {
    userEmail: string;
    userName: string;
    orderId: string;
    status: string;
    total: number;
    itemCount: number;
    deliveryAddress: string;
    paymentMethod: string;
    userPhone?: string;
    orderNotes?: string;
    items?: Array<{ name: string; quantity: number; unitPrice: number }>;
    orderItemsString?: string;
  }): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('EmailJS not initialized');
      return false;
    }

    try {
      const template = ORDER_STATUS_TEMPLATES[orderData.status];
      if (!template) {
        console.error(`No email template found for status: ${orderData.status}`);
        return false;
      }

      const orderNumber = orderData.orderId.slice(-8).toUpperCase();
      
      // Replace placeholders in the message
      const personalizedMessage = template.message
        .replace(/{userName}/g, orderData.userName)
        .replace(/{orderNumber}/g, orderNumber)
        .replace(/{total}/g, orderData.total.toFixed(2))
        .replace(/{itemCount}/g, orderData.itemCount.toString())
        .replace(/{deliveryAddress}/g, orderData.deliveryAddress)
        .replace(/{paymentMethod}/g, orderData.paymentMethod);

      const personalizedSubject = template.subject
        .replace(/{orderNumber}/g, orderNumber);

      // Build ordered items string for the email template if not provided
      const orderItemsString = orderData.orderItemsString ?? (
        orderData.items && orderData.items.length > 0
          ? orderData.items
              .map(i => `- ${i.quantity} x ${i.name} — €${i.unitPrice.toFixed(2)}`)
              .join('\n')
          : ''
      );

      // Match your EmailJS template variables
      const templateParams = {
        // To Email field in template uses {{email}}
        email: orderData.userEmail,
        // Optional display name if used in template
        to_name: orderData.userName,
        subject: personalizedSubject,
        message: personalizedMessage,
        order_id: orderNumber,
        status: orderData.status,
        customer_name: orderData.userName,
        customer_email: orderData.userEmail,
        customer_phone: orderData.userPhone || '',
        order_total: orderData.total.toFixed(2),
        item_count: orderData.itemCount.toString(),
        delivery_address: orderData.deliveryAddress,
        order_notes: orderData.orderNotes || '',
        order_items: orderItemsString
      } as Record<string, string>;

      const response = await emailjs.send(
        this.config.serviceId,
        this.config.orderNotificationTemplateId,
        templateParams
      );

      console.log('Order notification email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send order notification email:', error);
      return false;
    }
  }

  /**
   * Send contact form email
   * This will be called when user submits the contact form
   */
  public async sendContactFormEmail(contactData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('EmailJS not initialized');
      return false;
    }

    try {
      const templateParams = {
        from_name: contactData.name,
        from_email: contactData.email,
        subject: contactData.subject,
        message: contactData.message,
        to_email: 'huwuwhuwu9@gmail.com', // TODO: Replace with your actual support email
        company_name: 'Optimizi'
      };

      const response = await emailjs.send(
        this.config.serviceId,
        this.config.contactFormTemplateId,
        templateParams
      );

      console.log('Contact form email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send contact form email:', error);
      return false;
    }
  }

  /**
   * Send promotional email for featured products
   * This is optional and can be implemented later
   */
  public async sendPromotionalEmail(emailData: {
    userEmail: string;
    userName: string;
    featuredProducts: Array<{
      name: string;
      price: number;
      imageUrl: string;
      discount?: number;
    }>;
  }): Promise<boolean> {
    // TODO: Implement promotional email functionality
    // This would require creating a promotional email template in EmailJS
    console.log('Promotional email feature not yet implemented');
    return false;
  }

  /**
   * Check if EmailJS is properly configured
   */
  public isConfigured(): boolean {
    return (
      this.config.serviceId !== 'YOUR_EMAILJS_SERVICE_ID' &&
      this.config.orderNotificationTemplateId !== 'YOUR_ORDER_TEMPLATE_ID' &&
      this.config.contactFormTemplateId !== 'YOUR_CONTACT_TEMPLATE_ID' &&
      this.config.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY'
    );
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();