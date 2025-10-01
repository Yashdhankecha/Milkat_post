import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api';
import { MessageSquare, Send, Phone, Mail, MessageCircle } from 'lucide-react';

interface InquiryFormProps {
  propertyId?: string;
  projectId?: string;
  propertyTitle?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const InquiryForm: React.FC<InquiryFormProps> = ({
  propertyId,
  projectId,
  propertyTitle,
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    contactPreference: 'phone' as 'phone' | 'email' | 'whatsapp'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to make an inquiry",
        variant: "destructive"
      });
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const inquiryData = {
        inquiryType: propertyId ? 'property_inquiry' : 'project_inquiry',
        subject: formData.subject,
        message: formData.message,
        contactPreference: formData.contactPreference,
        propertyId: propertyId || undefined,
        projectId: projectId || undefined
      };

      const response = await apiClient.createInquiry(inquiryData);

      if (response.error) {
        throw new Error(response.error);
      }

      toast({
        title: "Inquiry Sent Successfully",
        description: "Your inquiry has been sent to the property owner. You'll receive a response soon!",
      });

      // Reset form
      setFormData({
        subject: '',
        message: '',
        contactPreference: 'phone'
      });

      onSuccess?.();

    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-500" />
          Make an Inquiry
        </CardTitle>
        {propertyTitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            About: {propertyTitle}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              placeholder="What would you like to know?"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.subject.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Please provide details about your inquiry..."
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              rows={4}
              maxLength={2000}
              required
            />
            <p className="text-xs text-gray-500">
              {formData.message.length}/2000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactPreference">Preferred Contact Method</Label>
            <Select
              value={formData.contactPreference}
              onValueChange={(value) => handleInputChange('contactPreference', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contact method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="whatsapp">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Inquiry
                </>
              )}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default InquiryForm;
