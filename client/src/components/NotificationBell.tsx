import { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    propertyId?: string;
    propertyTitle?: string;
  };
}

const NotificationBell = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [dbNotifications, setDbNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use WebSocket notifications
  const { 
    notifications: wsNotifications, 
    unreadCount, 
    removeNotification, 
    markNotificationAsRead, 
    markAllAsRead, 
    clearAllNotifications 
  } = useSocket();

  // Combine WebSocket notifications with database notifications
  const allNotifications = [...wsNotifications, ...dbNotifications];

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const result = await apiClient.getNotifications({ limit: 10 });
      if (result.data) {
        setDbNotifications(result.data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markDbNotificationAsRead = async (notificationId: string) => {
    try {
      await apiClient.markNotificationAsRead(notificationId);
      setDbNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId 
            ? { ...notif, isRead: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllDbNotificationsAsRead = async () => {
    try {
      const unreadDbNotifications = dbNotifications.filter(n => !n.isRead);
      if (unreadDbNotifications.length === 0) return;

      await apiClient.markNotificationsAsRead();
      setDbNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      });
    }
  };

  const clearAllDbNotifications = async () => {
    try {
      await apiClient.clearAllNotifications();
      setDbNotifications([]);
      
      toast({
        title: "Success",
        description: "All notifications cleared",
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      });
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification._id) {
      // Database notification
      if (!notification.isRead) {
        markDbNotificationAsRead(notification._id);
      }
    } else {
      // WebSocket notification
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <Circle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      default:
        return 'border-l-blue-500 bg-blue-50';
    }
  };

  if (!user) return null;

  const sortedNotifications = [...allNotifications].sort((a, b) => {
    const aTime = a.timestamp || a.createdAt;
    const bTime = b.timestamp || b.createdAt;
    return new Date(bTime).getTime() - new Date(aTime).getTime();
  });

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Notifications</CardTitle>
                <div className="flex gap-1">
                  {allNotifications.length > 0 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          // Mark WebSocket notifications as read
                          markAllAsRead();
                          // Mark database notifications as read
                          await markAllDbNotificationsAsRead();
                        }}
                        className="h-7 px-2 text-xs"
                        disabled={unreadCount === 0 && dbNotifications.filter(n => !n.isRead).length === 0}
                      >
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Mark all read
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          // Clear WebSocket notifications
                          clearAllNotifications();
                          // Clear database notifications
                          await clearAllDbNotifications();
                        }}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Clear all
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-80">
                {loading ? (
                  <div className="p-4 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                  </div>
                ) : allNotifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {sortedNotifications.map((notification) => {
                      const isRead = notification.read !== undefined ? notification.read : notification.isRead;
                      const notificationId = notification.id || notification._id;
                      
                      return (
                        <div
                          key={notificationId}
                          className={`p-3 border-l-4 cursor-pointer hover:bg-gray-50 transition-colors ${getNotificationColor(notification.type)} ${
                            !isRead ? 'bg-opacity-100' : 'bg-opacity-50'
                          }`}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatDistanceToNow(
                                      new Date(notification.timestamp || notification.createdAt), 
                                      { addSuffix: true }
                                    )}
                                  </p>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  {!isRead && (
                                    <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (notification._id) {
                                        markDbNotificationAsRead(notification._id);
                                        setDbNotifications(prev => prev.filter(n => n._id !== notification._id));
                                      } else {
                                        removeNotification(notification.id);
                                      }
                                    }}
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
