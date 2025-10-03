import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
  UserPlus, 
  Phone, 
  Mail, 
  MessageSquare, 
  Building2,
  CheckCircle,
  AlertCircle,
  X,
  Send
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';

interface InvitationFormProps {
  societyId: string;
  societyName: string;
  onClose: () => void;
  onSuccess: (invitation: any) => void;
}

const InvitationForm: React.FC<InvitationFormProps> = ({
  societyId,
  societyName,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    invitedPhone: '',
    invitedName: '',
    invitedEmail: '',
    invitationType: 'society_member' as 'society_member' | 'broker' | 'developer',
    message: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.invitedPhone.trim()) {
      errors.push('Phone number is required');
    } else if (formData.invitedPhone.length < 10) {
      errors.push('Please enter a valid phone number');
    }

    if (formData.invitedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.invitedEmail)) {
      errors.push('Please enter a valid email address');
    }

    if (formData.message && formData.message.length > 500) {
      errors.push('Message must be less than 500 characters');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
      });
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.sendInvitation({
        society_id: societyId,
        ...formData
      });

      if (response.error) {
        // Handle specific error cases
        if (response.error.includes('already been invited') || response.error.includes('ALREADY_INVITED')) {
          toast({
            title: "Already Invited",
            description: "This user has already been invited to the society",
            variant: "destructive",
          });
        } else if (response.error.includes('already a member') || response.error.includes('ALREADY_MEMBER')) {
          toast({
            title: "Already a Member",
            description: "This user is already a member of the society",
            variant: "destructive",
          });
        } else if (response.error.includes('previously invited') || response.error.includes('PREVIOUSLY_INVITED')) {
          toast({
            title: "Previously Invited",
            description: "This user has already been invited to this society before",
            variant: "destructive",
          });
        } else if (response.error.includes('society owner') || response.error.includes('IS_OWNER')) {
          toast({
            title: "Cannot Invite Owner",
            description: "Cannot invite the society owner",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Error",
            description: response.error,
            variant: "destructive",
          });
        }
        return;
      }

      // Show success message based on user registration status
      if (response.data.userRegistered) {
        toast({
          title: "Invitation Sent",
          description: `Invitation sent successfully to ${formData.invitedName || formData.invitedPhone}. The user will receive a notification in their dashboard.`,
        });
      } else {
        toast({
          title: "Invitation Sent",
          description: `Invitation message sent to ${formData.invitedPhone}. The user will receive SMS/Email with registration instructions.`,
        });
      }

      onSuccess(response.data.invitation);
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInvitationTypeLabel = (type: string) => {
    const labels = {
      society_member: 'Society Member',
      broker: 'Broker',
      developer: 'Developer'
    };
    return labels[type as keyof typeof labels] || type;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Send Invitation to {societyName}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Society Info */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  Inviting to: {societyName}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="invitedPhone" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number *
            </Label>
            <Input
              id="invitedPhone"
              type="tel"
              value={formData.invitedPhone}
              onChange={(e) => handleInputChange('invitedPhone', e.target.value)}
              placeholder="Enter phone number (e.g., 9876543210)"
              required
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="invitedName" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Name (Optional)
            </Label>
            <Input
              id="invitedName"
              value={formData.invitedName}
              onChange={(e) => handleInputChange('invitedName', e.target.value)}
              placeholder="Enter person's name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="invitedEmail" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email (Optional)
            </Label>
            <Input
              id="invitedEmail"
              type="email"
              value={formData.invitedEmail}
              onChange={(e) => handleInputChange('invitedEmail', e.target.value)}
              placeholder="Enter email address"
            />
          </div>

          {/* Invitation Type */}
          <div className="space-y-2">
            <Label htmlFor="invitationType">Role Type *</Label>
            <Select 
              value={formData.invitationType} 
              onValueChange={(value: 'society_member' | 'broker' | 'developer') => 
                handleInputChange('invitationType', value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="society_member">
                  <div className="flex flex-col">
                    <span>Society Member</span>
                    <span className="text-sm text-muted-foreground">
                      Can view and vote on redevelopment projects
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="broker">
                  <div className="flex flex-col">
                    <span>Broker</span>
                    <span className="text-sm text-muted-foreground">
                      Can help with property transactions
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="developer">
                  <div className="flex flex-col">
                    <span>Developer</span>
                    <span className="text-sm text-muted-foreground">
                      Can submit redevelopment proposals
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Personal Message (Optional)
            </Label>
            <Textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Add a personal message to the invitation..."
              rows={3}
              maxLength={500}
            />
            <div className="text-sm text-muted-foreground text-right">
              {formData.message.length}/500 characters
            </div>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Registered User</h4>
                    <p className="text-xs text-green-600 mt-1">
                      If the phone number is registered, they'll receive a notification in their dashboard.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">New User</h4>
                    <p className="text-xs text-blue-600 mt-1">
                      If not registered, they'll receive SMS/Email with registration instructions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvitationForm;
