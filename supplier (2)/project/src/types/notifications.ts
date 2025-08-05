// Enhanced notification types and interfaces
export interface NotificationPreferences {
  id?: string;
  fournisseurId: string;
  
  // Order notifications
  newOrderReceived: boolean;
  orderStatusChanged: boolean;
  orderCancelled: boolean;
  orderModified: boolean;
  
  // Payment notifications
  paymentReceived: boolean;
  paymentFailed: boolean;
  paymentPending: boolean;
  refundProcessed: boolean;
  
  // Inventory notifications
  lowInventoryAlert: boolean;
  outOfStockAlert: boolean;
  restockReminder: boolean;
  
  // Product notifications
  productReviewReceived: boolean;
  productPerformanceUpdate: boolean;
  
  // Account notifications
  accountVerificationUpdate: boolean;
  profileUpdateRequired: boolean;
  
  // Marketing notifications
  promotionalCampaignUpdate: boolean;
  salesReportReady: boolean;
  
  // System notifications
  systemMaintenance: boolean;
  policyChanges: boolean;
  securityAlerts: boolean;
  
  // Delivery preferences
  emailNotifications: boolean;
  inAppNotifications: boolean;
  smsNotifications: boolean;
  
  // Timing preferences
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
  
  // Frequency preferences
  instantNotifications: boolean;
  dailyDigest: boolean;
  weeklyDigest: boolean;
  
  createdAt: string;
  updatedAt: string;
}

export interface EnhancedNotification {
  id: string;
  type: 'order' | 'payment' | 'inventory' | 'product' | 'account' | 'marketing' | 'system';
  subType: string; // Specific notification subtype
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
  
  // Recipients
  fournisseurId: string;
  fournisseurName: string;
  
  // Related entities
  orderId?: string;
  productId?: string;
  customerId?: string;
  campaignId?: string;
  
  // Status
  isRead: boolean;
  readAt?: string;
  isArchived: boolean;
  archivedAt?: string;
  
  // Delivery tracking
  emailSent: boolean;
  emailSentAt?: string;
  smsSent: boolean;
  smsSentAt?: string;
  
  // Interaction tracking
  clicked: boolean;
  clickedAt?: string;
  actionTaken: boolean;
  actionTakenAt?: string;
  
  // Metadata
  data?: any;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  subType: string;
  name: string;
  subject: string;
  htmlTemplate: string;
  textTemplate: string;
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  archived: number;
  byType: Record<string, number>;
  byPriority: Record<string, number>;
  recent: number; // Last 24 hours
  thisWeek: number;
  thisMonth: number;
  clickThroughRate: number;
  averageReadTime: number;
}

export interface NotificationFilter {
  type?: string;
  subType?: string;
  priority?: string;
  isRead?: boolean;
  isArchived?: boolean;
  dateFrom?: string;
  dateTo?: string;
  searchTerm?: string;
}