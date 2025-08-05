import React, { useState, useEffect, useMemo } from 'react';
import { 
  BellIcon, 
  CheckIcon, 
  ArchiveBoxIcon,
  TrashIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  CogIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { EnhancedNotificationService } from '../services/enhancedNotificationService';
import { EnhancedNotification, NotificationFilter, NotificationStats } from '../types/notifications';
import { useFournisseur } from '../hooks/useFournisseur';
import NotificationPreferencesComponent from '../components/notifications/NotificationPreferences';
import { useNavigate } from 'react-router-dom';

const EnhancedNotifications: React.FC = () => {
  const { fournisseur } = useFournisseur();
  const [notifications, setNotifications] = useState<EnhancedNotification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [filter, setFilter] = useState<NotificationFilter>({ isArchived: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const navigate = useNavigate();

  const itemsPerPage = 20;

  useEffect(() => {
    if (fournisseur?.id) {
      fetchNotifications();
      fetchStats();
    }
  }, [fournisseur?.id, filter, currentPage]);

  const fetchNotifications = async () => {
    if (!fournisseur?.id) return;

    try {
      setLoading(true);
      const result = await EnhancedNotificationService.getNotifications(
        fournisseur.id,
        { ...filter, searchTerm },
        itemsPerPage * currentPage
      );
      
      setNotifications(result.notifications);
      setHasMore(result.hasMore);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!fournisseur?.id) return;

    try {
      const statsData = await EnhancedNotificationService.getNotificationStats(fournisseur.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const filteredAndSortedNotifications = useMemo(() => {
    let filtered = notifications.filter(notification => {
      const matchesSearch = searchTerm === '' ||
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    // Sort notifications
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          if (aPriority === bPriority) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return bPriority - aPriority;
        case 'unread':
          if (a.isRead === b.isRead) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.isRead ? 1 : -1;
        case 'type':
          if (a.type === b.type) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return a.type.localeCompare(b.type);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [notifications, searchTerm, sortBy]);

  const handleNotificationClick = async (notification: EnhancedNotification) => {
    try {
      // Mark as clicked and read
      if (!notification.clicked) {
        await EnhancedNotificationService.markAsClicked(notification.id);
      }
      if (!notification.isRead) {
        await updateDoc(doc(db, 'notifications', notification.id), {
          isRead: true,
          readAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      // Navigate based on notification type
      switch (notification.type) {
        case 'order':
          if (notification.orderId) {
            navigate(`/orders?highlight=${notification.orderId}`);
          } else {
            navigate('/orders');
          }
          break;
        case 'payment':
          navigate('/orders');
          break;
        case 'inventory':
        case 'product':
          if (notification.productId) {
            navigate(`/products?highlight=${notification.productId}`);
          } else {
            navigate('/products');
          }
          break;
        default:
          // Stay on notifications page
          break;
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleBulkAction = async (action: 'read' | 'archive' | 'delete') => {
    if (selectedNotifications.length === 0) return;

    try {
      switch (action) {
        case 'read':
          await EnhancedNotificationService.markMultipleAsRead(selectedNotifications);
          break;
        case 'archive':
          await EnhancedNotificationService.archiveMultiple(selectedNotifications);
          break;
        case 'delete':
          if (window.confirm('Are you sure you want to delete these notifications?')) {
            await EnhancedNotificationService.deleteMultiple(selectedNotifications);
          }
          break;
      }
      setSelectedNotifications([]);
      fetchNotifications();
      fetchStats();
    } catch (error) {
      console.error(`Error performing bulk ${action}:`, error);
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <InformationCircleIcon className="h-4 w-4 text-yellow-500" />;
      case 'low':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getFilterOptions = () => [
    { value: 'all', label: 'All Notifications', count: stats?.total || 0 },
    { value: 'unread', label: 'Unread', count: stats?.unread || 0 },
    { value: 'order', label: 'Orders', count: stats?.byType.order || 0 },
    { value: 'payment', label: 'Payments', count: stats?.byType.payment || 0 },
    { value: 'inventory', label: 'Inventory', count: stats?.byType.inventory || 0 },
    { value: 'product', label: 'Products', count: stats?.byType.product || 0 },
    { value: 'system', label: 'System', count: stats?.byType.system || 0 },
  ];

  if (loading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Notifications</h1>
          <p className="mt-2 text-gray-600">
            Comprehensive notification management with advanced features
            {stats && stats.unread > 0 && (
              <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {stats.unread} unread
              </span>
            )}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ChartBarIcon className="h-4 w-4 mr-2" />
            {showStats ? 'Hide' : 'Show'} Stats
          </button>
          <button
            onClick={() => setShowPreferences(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <CogIcon className="h-4 w-4 mr-2" />
            Preferences
          </button>
          <button
            onClick={fetchNotifications}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && stats && (
        <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Notification Statistics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 font-medium">Total</p>
                  <p className="text-2xl font-bold text-blue-700">{stats.total}</p>
                </div>
                <BellIcon className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 font-medium">Unread</p>
                  <p className="text-2xl font-bold text-red-700">{stats.unread}</p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 font-medium">This Week</p>
                  <p className="text-2xl font-bold text-green-700">{stats.thisWeek}</p>
                </div>
                <CalendarIcon className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 font-medium">Click Rate</p>
                  <p className="text-2xl font-bold text-purple-700">{stats.clickThroughRate.toFixed(1)}%</p>
                </div>
                <ChartBarIcon className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="sm:w-48">
              <div className="relative">
                <FunnelIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <select
                  value={filter.type || 'all'}
                  onChange={(e) => setFilter({ ...filter, type: e.target.value === 'all' ? undefined : e.target.value })}
                  className="w-full pl-10 pr-8 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  {getFilterOptions().map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="h-4 w-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="sm:w-40">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">By Priority</option>
                <option value="unread">Unread First</option>
                <option value="type">By Type</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedNotifications.length} notification{selectedNotifications.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleBulkAction('read')}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <CheckIcon className="h-4 w-4 mr-1" />
                Mark Read
              </button>
              <button
                onClick={() => handleBulkAction('archive')}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                Archive
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                Delete
              </button>
              <button
                onClick={() => setSelectedNotifications([])}
                className="text-sm font-medium text-gray-600 hover:text-gray-700 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notifications List */}
      {filteredAndSortedNotifications.length === 0 ? (
        <div className="text-center py-16">
          <div className="mx-auto h-24 w-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl flex items-center justify-center mb-6">
            <BellIcon className="h-12 w-12 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {searchTerm || filter.type ? 'No Notifications Found' : 'No Notifications Yet'}
          </h3>
          <p className="text-gray-600 max-w-md mx-auto">
            {searchTerm || filter.type
              ? 'Try adjusting your search or filter criteria.'
              : 'You\'ll receive notifications here when there are updates about your business activities.'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100">
          {/* Select All Header */}
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedNotifications.length === filteredAndSortedNotifications.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedNotifications(filteredAndSortedNotifications.map(n => n.id));
                    } else {
                      setSelectedNotifications([]);
                    }
                  }}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-3 text-sm font-medium text-gray-700">
                  Select all notifications
                </label>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setFilter({ ...filter, isArchived: !filter.isArchived })}
                  className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                    filter.isArchived 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <ArchiveBoxIcon className="h-4 w-4 mr-1" />
                  {filter.isArchived ? 'Show Active' : 'Show Archived'}
                </button>
              </div>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {filteredAndSortedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-6 transition-all duration-200 border-l-4 ${
                  !notification.isRead ? getPriorityColor(notification.priority) : 'border-l-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedNotifications([...selectedNotifications, notification.id]);
                      } else {
                        setSelectedNotifications(selectedNotifications.filter(id => id !== notification.id));
                      }
                    }}
                    className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  
                  <div 
                    onClick={() => handleNotificationClick(notification)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className={`text-lg font-semibold ${
                          !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </h4>
                        {getPriorityIcon(notification.priority)}
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.isRead && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        )}
                        <span className="text-sm text-gray-500 font-medium">
                          {formatDate(notification.createdAt)}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mt-1 leading-relaxed">
                      {notification.message}
                    </p>
                    
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          notification.type === 'order' ? 'bg-blue-100 text-blue-800' :
                          notification.type === 'payment' ? 'bg-green-100 text-green-800' :
                          notification.type === 'inventory' ? 'bg-orange-100 text-orange-800' :
                          notification.type === 'product' ? 'bg-purple-100 text-purple-800' :
                          notification.type === 'system' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.type}
                        </span>
                        
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                          notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {notification.priority}
                        </span>
                        
                        {notification.orderId && (
                          <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-lg">
                            Order #{notification.orderId.slice(-8)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        {notification.clicked && (
                          <span className="flex items-center">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            Viewed
                          </span>
                        )}
                        {notification.emailSent && (
                          <span className="flex items-center">
                            <CheckIcon className="h-3 w-3 mr-1" />
                            Email sent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="p-6 border-t border-gray-100 text-center">
              <button
                onClick={() => setCurrentPage(prev => prev + 1)}
                disabled={loading}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Loading...
                  </>
                ) : (
                  'Load More Notifications'
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showPreferences && fournisseur?.id && (
        <NotificationPreferencesComponent
          fournisseurId={fournisseur.id}
          onClose={() => setShowPreferences(false)}
        />
      )}
    </div>
  );
};

export default EnhancedNotifications;