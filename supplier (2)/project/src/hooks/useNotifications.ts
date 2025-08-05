// File: /home/ubuntu/project-bolt/project/src/hooks/useNotifications.ts

import { useState, useEffect, useCallback } from 'react';
import { NotificationService } from '../services/notificationService';
import { AppNotification } from '../models';
import { requestFCMToken, onForegroundMessage } from '../config/config';

export const useNotifications = (fournisseurId: string | null) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async () => {
    if (!fournisseurId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const [notificationsData, unreadCountData] = await Promise.all([
        NotificationService.getNotificationsByFournisseur(fournisseurId),
        NotificationService.getUnreadCount(fournisseurId)
      ]);
      
      setNotifications(notificationsData);
      setUnreadCount(unreadCountData);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [fournisseurId]);

  // Set up real-time listeners
  useEffect(() => {
    if (!fournisseurId) return;

    let notificationUnsubscribe: (() => void) | null = null;
    let unreadCountUnsubscribe: (() => void) | null = null;

    // Real-time notifications listener
    notificationUnsubscribe = NotificationService.subscribeToNotifications(
      fournisseurId,
      (newNotifications) => {
        setNotifications(newNotifications);
        
        // Check for new notifications (created in the last 10 seconds)
        const now = new Date().getTime();
        const recentNotifications = newNotifications.filter(notification => {
          const notificationTime = new Date(notification.createdAt).getTime();
          return (now - notificationTime) < 10000 && !notification.isRead;
        });

        // Show browser notifications for new notifications
        recentNotifications.forEach(notification => {
          showBrowserNotification(notification);
        });
      }
    );

    // Real-time unread count listener
    unreadCountUnsubscribe = NotificationService.subscribeToUnreadCount(
      fournisseurId,
      (count) => {
        setUnreadCount(count);
      }
    );

    return () => {
      if (notificationUnsubscribe) notificationUnsubscribe();
      if (unreadCountUnsubscribe) unreadCountUnsubscribe();
    };
  }, [fournisseurId]);

  // Set up FCM and foreground message handling
  useEffect(() => {
    let unsubscribeForegroundMessage: (() => void) | null = null;

    const setupFCM = async () => {
      try {
        // Request FCM token
        const token = await requestFCMToken();
        if (token) {
          console.log('FCM token obtained:', token);
          // Here you could send the token to your backend to associate it with the user
        }

        // Listen for foreground messages
        unsubscribeForegroundMessage = onForegroundMessage((payload) => {
          console.log('Foreground message received:', payload);
          
          // Show toast notification for foreground messages
          if ((window as any).showToast) {
            (window as any).showToast({
              type: 'notification',
              title: payload.notification?.title || 'New Notification',
              message: payload.notification?.body || 'You have a new notification',
              duration: 6000
            });
          }
        });
      } catch (error) {
        console.error('Error setting up FCM:', error);
      }
    };

    setupFCM();

    return () => {
      if (unsubscribeForegroundMessage) unsubscribeForegroundMessage();
    };
  }, []);

  // Request notification permission and register service worker
  const requestNotificationPermission = async () => {
    try {
      // Request browser notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
      }

      // Register service worker for background notifications
      if ('serviceWorker' in navigator && typeof window !== 'undefined' && !window.location.hostname.includes('stackblitz')) {
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registered:', registration);
        } catch (swError) {
          console.warn('Service Worker registration failed (may not be supported in this environment):', swError);
        }
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification: AppNotification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        data: {
          notificationId: notification.id,
          orderId: notification.orderId,
          url: notification.orderId ? `/orders?highlight=${notification.orderId}` : '/notifications'
        },
        requireInteraction: notification.type === 'order', // Keep order notifications visible until user interacts
        silent: false
      });

      // Handle notification click
      browserNotification.onclick = () => {
        window.focus();
        if (notification.orderId) {
          window.location.href = `/orders?highlight=${notification.orderId}`;
        } else {
          window.location.href = '/notifications';
        }
        browserNotification.close();
      };

      // Auto-close after 10 seconds for non-order notifications
      if (notification.type !== 'order') {
        setTimeout(() => {
          browserNotification.close();
        }, 10000);
      }
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  };

  // Mark multiple notifications as read
  const markMultipleAsRead = async (notificationIds: string[]) => {
    try {
      await NotificationService.markMultipleAsRead(notificationIds);
      
      setNotifications(prev => 
        prev.map(notification => 
          notificationIds.includes(notification.id)
            ? { ...notification, isRead: true }
            : notification
        )
      );
      
      const unreadInSelection = notifications.filter(n => 
        notificationIds.includes(n.id) && !n.isRead
      ).length;
      
      setUnreadCount(prev => Math.max(0, prev - unreadInSelection));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      setError('Failed to mark notifications as read');
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!fournisseurId) return;

    try {
      await NotificationService.markAllAsRead(fournisseurId);
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      
      const deletedNotification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  };

  // Search notifications
  const searchNotifications = async (searchTerm: string, type?: string) => {
    if (!fournisseurId) return [];

    try {
      return await NotificationService.searchNotifications(fournisseurId, searchTerm, type);
    } catch (err) {
      console.error('Error searching notifications:', err);
      setError('Failed to search notifications');
      return [];
    }
  };

  // Get notification statistics
  const getNotificationStats = async () => {
    if (!fournisseurId) return null;

    try {
      return await NotificationService.getNotificationStats(fournisseurId);
    } catch (err) {
      console.error('Error getting notification stats:', err);
      setError('Failed to get notification statistics');
      return null;
    }
  };

  // Initialize
  useEffect(() => {
    fetchNotifications();
    requestNotificationPermission();
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    isOnline,
    markAsRead,
    markMultipleAsRead,
    markAllAsRead,
    deleteNotification,
    searchNotifications,
    getNotificationStats,
    refetch: fetchNotifications,
    clearError: () => setError(null)
  };
};
