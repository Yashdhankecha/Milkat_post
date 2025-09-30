import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  UserPlus, 
  Clock, 
  CheckCircle, 
  X, 
  AlertCircle,
  Mail,
  Phone,
  Calendar,
  Building2,
  MoreHorizontal,
  RefreshCw
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import InvitationForm from './InvitationForm';

interface Invitation {
  _id: string;
  society: {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  invitedPhone: string;
  invitedName?: string;
  invitedEmail?: string;
  invitationType: string;
  status: string;
  message?: string;
  isUserRegistered: boolean;
  sentAt?: string;
  acceptedAt?: string;
  declinedAt?: string;
  expiresAt: string;
  createdAt: string;
}

interface InvitationManagementProps {
  societyId: string;
  societyName: string;
}

const InvitationManagement: React.FC<InvitationManagementProps> = ({
  societyId,
  societyName
}) => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvitationForm, setShowInvitationForm] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchInvitations();
  }, [societyId]);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getSentInvitations(`?society_id=${societyId}`);
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to fetch invitations",
          variant: "destructive",
        });
        return;
      }

      setInvitations(response.data.invitations || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: "Error",
        description: "Failed to fetch invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      const response = await apiClient.cancelInvitation(invitationId);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Invitation cancelled successfully",
      });

      fetchInvitations();
    } catch (error: any) {
      console.error('Error cancelling invitation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const handleInvitationSuccess = (invitation: any) => {
    setShowInvitationForm(false);
    fetchInvitations();
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    const statusIcons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-4 w-4" />,
      sent: <Mail className="h-4 w-4" />,
      accepted: <CheckCircle className="h-4 w-4" />,
      declined: <X className="h-4 w-4" />,
      expired: <AlertCircle className="h-4 w-4" />,
      cancelled: <X className="h-4 w-4" />,
    };
    return statusIcons[status] || <Clock className="h-4 w-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInvitationTypeLabel = (type: string) => {
    const labels = {
      society_member: 'Society Member',
      broker: 'Broker',
      developer: 'Developer'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const filteredInvitations = invitations.filter(invitation => {
    switch (activeTab) {
      case 'pending':
        return invitation.status === 'pending' || invitation.status === 'sent';
      case 'accepted':
        return invitation.status === 'accepted';
      case 'declined':
        return invitation.status === 'declined';
      case 'expired':
        return invitation.status === 'expired' || invitation.status === 'cancelled';
      default:
        return true;
    }
  });

  const getStats = () => {
    return {
      total: invitations.length,
      pending: invitations.filter(i => i.status === 'pending' || i.status === 'sent').length,
      accepted: invitations.filter(i => i.status === 'accepted').length,
      declined: invitations.filter(i => i.status === 'declined').length,
      expired: invitations.filter(i => i.status === 'expired' || i.status === 'cancelled').length,
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
        <div>
          <h2 className="text-2xl font-bold">Invitation Management</h2>
          <p className="text-muted-foreground">
            Send invitations and manage responses for {societyName}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchInvitations} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowInvitationForm(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Send Invitation
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-muted-foreground">Accepted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            <div className="text-sm text-muted-foreground">Declined</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
            <div className="text-sm text-muted-foreground">Expired</div>
          </CardContent>
        </Card>
      </div>

      {/* Invitations List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({stats.accepted})</TabsTrigger>
              <TabsTrigger value="declined">Declined ({stats.declined})</TabsTrigger>
              <TabsTrigger value="expired">Expired ({stats.expired})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {filteredInvitations.length === 0 ? (
                <div className="text-center py-12">
                  <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Invitations Found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'all' 
                      ? "No invitations have been sent yet."
                      : `No ${activeTab} invitations found.`
                    }
                  </p>
                  {activeTab === 'all' && (
                    <Button 
                      onClick={() => setShowInvitationForm(true)} 
                      className="mt-4 gap-2"
                    >
                      <UserPlus className="h-4 w-4" />
                      Send First Invitation
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvitations.map((invitation) => (
                    <Card key={invitation._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <div>
                                <h4 className="font-semibold">
                                  {invitation.invitedName || invitation.invitedPhone}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  <span>{invitation.invitedPhone}</span>
                                  {invitation.invitedEmail && (
                                    <>
                                      <Mail className="h-3 w-3" />
                                      <span>{invitation.invitedEmail}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <Badge className={getStatusColor(invitation.status)}>
                                <span className="flex items-center gap-1">
                                  {getStatusIcon(invitation.status)}
                                  {invitation.status.toUpperCase()}
                                </span>
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                <span>{getInvitationTypeLabel(invitation.invitationType)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Sent {formatDate(invitation.sentAt || invitation.createdAt)}</span>
                              </div>
                              <div className={`flex items-center gap-1 ${invitation.isUserRegistered ? 'text-green-600' : 'text-blue-600'}`}>
                                <span className="text-xs font-medium">
                                  {invitation.isUserRegistered ? 'REGISTERED' : 'NEW USER'}
                                </span>
                              </div>
                            </div>
                            
                            {invitation.message && (
                              <p className="text-sm text-muted-foreground italic">
                                "{invitation.message}"
                              </p>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {(invitation.status === 'pending' || invitation.status === 'sent') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancelInvitation(invitation._id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
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

      {/* Invitation Form */}
      {showInvitationForm && (
        <InvitationForm
          societyId={societyId}
          societyName={societyName}
          onClose={() => setShowInvitationForm(false)}
          onSuccess={handleInvitationSuccess}
        />
      )}
    </div>
  );
};

export default InvitationManagement;
