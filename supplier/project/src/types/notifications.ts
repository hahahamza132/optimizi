// Simple notification types for suppliers - focused on orders only
export interface Notification {
  id: string;
  type: 'order';
  title: string;
  message: string;
  orderId: string;
  fournisseurId: string;
  isRead: boolean;
  createdAt: string;
  orderData?: {
    customerName: string;
    customerEmail: string;
    total: number;
    itemCount: number;
    status: string;
  };
}

export interface NotificationStats {
  total: number;
  unread: number;
  today: number;
}