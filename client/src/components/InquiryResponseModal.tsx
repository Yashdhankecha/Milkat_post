import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';
import { 
  MessageSquare, 
  Send, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Home,
  MapPin,
  IndianRupee,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface InquiryResponseModalProps {
  inquiry: any;
  isOpen: boolean;
  onClose: () => void;
  onResponseSent: () => void;
}

const InquiryResponseModal: React.FC<InquiryResponseModalProps> = ({
  inquiry,
  isOpen,
  onClose,
  onResponseSent
}) => {
  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState(inquiry?.status || 'pending');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!response.trim()) {
      toast({
        title: "Response Required",
        description: "Please enter a response message",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await apiClient.respondToInquiry(inquiry._id, response);
      
      if (result.error) {
        throw new Error(result.error);
      }

      toast({
        title: "Response Sent Successfully",
        description: "Your response has been sent to the buyer",
      });

      onResponseSent();
      onClose();
      setResponse('');

    } catch (error: any) {
      console.error('Error sending response:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to send response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const result = await apiClient.updateInquiryStatus(inquiry._id, newStatus);
      
      if (result.error) {
        throw new Error(result.error);
      }

      setStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Inquiry marked as ${newStatus}`,
      });

      onResponseSent(); // Refresh the list

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to update status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'responded': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'closed': return 'bg-green-100 text-green-800 border-green-200';
      case 'spam': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'responded': return <CheckCircle className="h-4 w-4" />;
      case 'closed': return <XCircle className="h-4 w-4" />;
      case 'spam': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (!isOpen || !inquiry) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-6 w-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                Inquiry Response
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Inquiry Details */}
            <div className="space-y-6">
              {/* Inquiry Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Buyer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {inquiry.inquirer?.phone || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Buyer
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                      <Phone className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {inquiry.inquirer?.phone || 'Not provided'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Contact Number
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full">
                      <Mail className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {inquiry.inquirer?.email || 'Not provided'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Email Address
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-full">
                      <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                        {inquiry.contactPreference || 'phone'}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Preferred Contact
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Property Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Property Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                      {inquiry.property?.title || 'Property'}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                      <MapPin className="h-4 w-4" />
                      {inquiry.property?.location?.city || inquiry.property?.location?.address || 'Location not specified'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <IndianRupee className="h-4 w-4" />
                      ₹{inquiry.property?.price?.toLocaleString() || 'Price not specified'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inquiry Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Inquiry Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Subject
                    </Label>
                    <p className="text-gray-800 dark:text-gray-200 mt-1">
                      {inquiry.subject}
                    </p>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Message
                    </Label>
                    <p className="text-gray-800 dark:text-gray-200 mt-1 whitespace-pre-wrap">
                      {inquiry.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(inquiry.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Response Form */}
            <div className="space-y-6">
              {/* Status Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Status Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(status)}>
                      {getStatusIcon(status)}
                      <span className="ml-1 capitalize">{status}</span>
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate('responded')}
                      disabled={status === 'responded'}
                    >
                      Mark as Responded
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate('closed')}
                      disabled={status === 'closed'}
                    >
                      Mark as Closed
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate('pending')}
                      disabled={status === 'pending'}
                    >
                      Mark as Pending
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate('spam')}
                      disabled={status === 'spam'}
                      className="text-red-600 hover:text-red-700"
                    >
                      Mark as Spam
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Response Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Send Response
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="response">Your Response *</Label>
                      <Textarea
                        id="response"
                        placeholder="Type your response to the buyer here..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        rows={6}
                        required
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {response.length}/2000 characters
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting || !response.trim()}
                        className="flex-1"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-2" />
                            Send Response
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>

              {/* Previous Response */}
              {inquiry.response && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Previous Response
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">
                        {inquiry.response.message}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Sent on {new Date(inquiry.response.respondedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InquiryResponseModal;
