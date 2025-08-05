// File: /home/ubuntu/project-bolt/project/src/components/notifications/NotificationCenter.tsx

import React, { useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import {
  BellIcon,
  CheckIcon,
  EyeIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationService } from '../../services/notificationService';
import { AppNotification } from '../../models';
import { useNavigate } from 'react-router-dom';

interface NotificationCenterProps {
  fournisseurId: string | null;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ fournisseurId }) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications(fournisseurId);
  const [showAll, setShowAll] = useState(false);
  const navigate = useNavigate();

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate to relevant page if orderId exists
    if (notification.orderId) {
      navigate(`/orders?highlight=${notification.orderId}`);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const handleViewAllNotifications = () => {
    navigate('/notifications');
  };

  return (
    <Menu as="div" className="relative">
      <Menu.Button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-xl transition-all duration-200 group">
        <BellIcon className="h-6 w-6 group-hover:scale-110 transition-transform duration-200" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center h-5 w-5 text-xs font-bold text-white bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-150"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-50 mt-2 w-96 origin-top-right rounded-3xl bg-white shadow-2xl ring-1 ring-black ring-opacity-5 focus:outline-none border border-gray-100">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                    title="Mark all as read"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={handleViewAllNotifications}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors duration-200"
                  title="View all notifications"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="mx-auto h-16 w-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                    <BellIcon className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-gray-500 text-sm font-medium">No notifications yet</p>
                  <p className="text-gray-400 text-xs mt-1">You'll see updates here when they arrive</p>
                </div>
              ) : (
                <>
                  {displayedNotifications.map((notification) => (
                    <Menu.Item key={notification.id}>
                      {({ active }) => (
                        <div
                          onClick={() => handleNotificationClick(notification)}
                          className={`block p-4 rounded-2xl cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
                            active ? 'bg-gray-50' : ''
                          } ${
                            !notification.isRead 
                              ? 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 shadow-sm' 
                              : 'border border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shadow-sm ${
                              NotificationService.getNotificationColor(notification.type)
                            }`}>
                              {NotificationService.getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className={`text-sm font-semibold truncate ${
                                  !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2 leading-relaxed">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-500 font-medium">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                                
                                {notification.orderId && (
                                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-lg">
                                    #{notification.orderId.slice(-6)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Menu.Item>
                  ))}

                  {/* Show More/Less Button */}
                  {notifications.length > 5 && (
                    <div className="pt-4 border-t border-gray-100">
                      <button
                        onClick={() => setShowAll(!showAll)}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 rounded-xl hover:bg-blue-50 transition-all duration-200"
                      >
                        {showAll ? 'Show Less' : `Show ${notifications.length - 5} More`}
                      </button>
                    </div>
                  )}

                  {/* View All Button */}
                  <div className="pt-2">
                    <button
                      onClick={handleViewAllNotifications}
                      className="w-full text-center text-sm text-gray-600 hover:text-gray-800 font-medium py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 hover:border-gray-300"
                    >
                      View All Notifications
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </Menu.Items>
      </Transition>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </Menu>
  );
};

export default NotificationCenter;
