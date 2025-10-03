import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Bell, 
  Mail, 
  UserPlus, 
  CheckCircle, 
  X, 
  AlertCircle,
  Clock,
  Building2,
  MoreHorizontal,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

interface NotificationCenterProps {
  userId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getNotifications();
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to fetch notifications",
          variant: "destructive",
        });
        return;
      }

      const notificationList = response.data.notifications || [];
      setNotifications(notificationList);
      setUnreadCount(notificationList.filter(n => !n.isRead).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notifications",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiClient.markNotificationAsRead(notificationId);
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to mark notification as read",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n._id === notificationId 
            ? { ...n, isRead: true, readAt: new Date().toISOString() }
            : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark notification as read",
        variant: "destructive",
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await apiClient.markAllNotificationsAsRead();
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to mark all notifications as read",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to mark all notifications as read",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await apiClient.deleteNotification(notificationId);
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to delete notification",
          variant: "destructive",
        });
        return;
      }

      // Update local state
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      toast({
        title: "Success",
        description: "Notification deleted",
      });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      invitation: <UserPlus className="h-5 w-5" />,
      invitation_accepted: <CheckCircle className="h-5 w-5" />,
      invitation_declined: <X className="h-5 w-5" />,
      redevelopment: <Building2 className="h-5 w-5" />,
      system: <Bell className="h-5 w-5" />,
      default: <Mail className="h-5 w-5" />
    };
    return icons[type] || icons.default;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-gray-100 text-gray-800'
    };
    return colors[priority] || colors.low;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.isRead;
      case 'invitations':
        return notification.type.includes('invitation');
      case 'redevelopment':
        return notification.type.includes('redevelopment');
      default:
        return true;
    }
  });

  const getStats = () => {
    return {
      total: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
      invitations: notifications.filter(n => n.type.includes('invitation')).length,
      redevelopment: notifications.filter(n => n.type.includes('redevelopment')).length,
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-6 w-6 text-gray-600" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs bg-red-500">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground">
              Stay updated with your society activities
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead} className="gap-2">
              <Eye className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
          <Button variant="outline" onClick={fetchNotifications} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.unread}</div>
            <div className="text-sm text-muted-foreground">Unread</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.invitations}</div>
            <div className="text-sm text-muted-foreground">Invitations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.redevelopment}</div>
            <div className="text-sm text-muted-foreground">Redevelopment</div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="unread">Unread ({stats.unread})</TabsTrigger>
              <TabsTrigger value="invitations">Invitations ({stats.invitations})</TabsTrigger>
              <TabsTrigger value="redevelopment">Redevelopment ({stats.redevelopment})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredNotifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? "You're all caught up! No new notifications."
                      : `No ${activeTab} notifications found.`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <Card 
                      key={notification._id} 
                      className={`hover:shadow-lg transition-shadow ${
                        !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/30' : ''
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`p-2 rounded-lg ${
                              !notification.isRead ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              {getNotificationIcon(notification.type)}
                            </div>
                            
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className={`font-semibold ${
                                  !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </h4>
                                <Badge className={getPriorityColor(notification.priority)}>
                                  {notification.priority.toUpperCase()}
                                </Badge>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                              
                              <p className="text-sm text-gray-600">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{formatDate(notification.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-1">
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification._id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteNotification(notification._id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardHeader>
      </Card>
    </div>
  );
};

export default NotificationCenter;
