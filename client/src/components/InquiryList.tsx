import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import InquiryResponseModal from './InquiryResponseModal';
import { 
  MessageSquare, 
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
  AlertCircle,
  Eye,
  Reply,
  MoreHorizontal
} from 'lucide-react';

interface InquiryListProps {
  inquiries: any[];
  onRefresh: () => void;
  type: 'received' | 'sent'; // 'received' for property owners, 'sent' for buyers
}

const InquiryList: React.FC<InquiryListProps> = ({
  inquiries,
  onRefresh,
  type
}) => {
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const { toast } = useToast();

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

  const handleViewInquiry = (inquiry: any) => {
    setSelectedInquiry(inquiry);
    setShowResponseModal(true);
  };

  const handleResponseSent = () => {
    onRefresh();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (inquiries.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="p-4 rounded-full bg-gray-100 dark:bg-gray-800 w-fit mx-auto mb-4">
          <MessageSquare className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
          No inquiries yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          {type === 'received' 
            ? "Inquiries from potential buyers about your properties will appear here."
            : "Your inquiries to property owners will appear here."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => (
        <Card key={inquiry._id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              {/* Left Section - Inquiry Info */}
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-1">
                      {inquiry.subject}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {truncateText(inquiry.message)}
                    </p>
                  </div>
                  <Badge className={getStatusColor(inquiry.status)}>
                    {getStatusIcon(inquiry.status)}
                    <span className="ml-1 capitalize">{inquiry.status}</span>
                  </Badge>
                </div>

                {/* Property Info */}
                {inquiry.property && (
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span className="font-medium">{inquiry.property.title}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{inquiry.property.location?.city || inquiry.property.location?.address || 'Location not specified'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <IndianRupee className="h-4 w-4" />
                      <span>₹{inquiry.property.price?.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {/* User Info */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {type === 'received' ? (
                    // For property owners - show buyer info
                    <>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{inquiry.inquirer?.phone || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{inquiry.inquirer?.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        <span>{inquiry.inquirer?.email || 'Not provided'}</span>
                      </div>
                    </>
                  ) : (
                    // For buyers - show property owner info
                    <>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{inquiry.propertyOwner?.phone || 'Unknown'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{inquiry.propertyOwner?.phone || 'Not provided'}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(inquiry.createdAt)}</span>
                  {inquiry.response && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="text-green-600 dark:text-green-400">
                        Responded {formatDate(inquiry.response.respondedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Right Section - Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewInquiry(inquiry)}
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View Details
                </Button>
                
                {type === 'received' && inquiry.status !== 'closed' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleViewInquiry(inquiry)}
                    className="flex items-center gap-2"
                  >
                    <Reply className="h-4 w-4" />
                    {inquiry.response ? 'Reply' : 'Respond'}
                  </Button>
                )}
              </div>
            </div>

            {/* Response Preview */}
            {inquiry.response && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Your Response
                    </span>
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    {truncateText(inquiry.response.message, 150)}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Response Modal */}
      <InquiryResponseModal
        inquiry={selectedInquiry}
        isOpen={showResponseModal}
        onClose={() => {
          setShowResponseModal(false);
          setSelectedInquiry(null);
        }}
        onResponseSent={handleResponseSent}
      />
    </div>
  );
};

export default InquiryList;
