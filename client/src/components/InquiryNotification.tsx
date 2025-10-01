import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';
import { 
  Bell, 
  MessageSquare, 
  X, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface InquiryNotificationProps {
  userId: string;
  onInquiryUpdate?: () => void;
}

const InquiryNotification: React.FC<InquiryNotificationProps> = ({
  userId,
  onInquiryUpdate
}) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for new responses periodically
    const checkForResponses = async () => {
      try {
        const result = await apiClient.getMyInquiries();
        if (!result.error && result.data?.inquiries) {
          const newResponses = result.data.inquiries.filter(
            (inquiry: any) => 
              inquiry.status === 'responded' && 
              inquiry.response && 
              !inquiry.notificationShown
          );
          
          if (newResponses.length > 0) {
            setNotifications(newResponses);
            setIsVisible(true);
            
            // Show toast notification
            toast({
              title: "New Response Received!",
              description: `You have ${newResponses.length} new response${newResponses.length > 1 ? 's' : ''} to your inquiries.`,
            });
          }
        }
      } catch (error) {
        console.error('Error checking for responses:', error);
      }
    };

    // Check immediately
    checkForResponses();

    // Check every 30 seconds
    const interval = setInterval(checkForResponses, 30000);

    return () => clearInterval(interval);
  }, [userId, toast]);

  const handleDismiss = () => {
    setIsVisible(false);
    setNotifications([]);
  };

  const handleViewInquiry = (inquiry: any) => {
    // Mark as viewed
    setNotifications(prev => prev.filter(n => n._id !== inquiry._id));
    if (notifications.length === 1) {
      setIsVisible(false);
    }
    
    // Trigger callback to refresh dashboard
    onInquiryUpdate?.();
  };

  if (!isVisible || notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-full">
      <Card className="shadow-lg border-l-4 border-l-blue-500">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  New Response{notifications.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {notifications.length} new response{notifications.length > 1 ? 's' : ''} to your inquiries
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {notifications.slice(0, 3).map((inquiry) => (
              <div
                key={inquiry._id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleViewInquiry(inquiry)}
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {inquiry.property?.title || 'Property Inquiry'}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Response from {inquiry.propertyOwner?.phone || 'Property Owner'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Responded
                  </Badge>
                </div>
              </div>
            ))}
            
            {notifications.length > 3 && (
              <p className="text-xs text-gray-500 text-center">
                +{notifications.length - 3} more response{notifications.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => {
                handleDismiss();
                onInquiryUpdate?.();
              }}
            >
              View All
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
            >
              Dismiss
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InquiryNotification;
