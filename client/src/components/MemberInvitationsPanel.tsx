import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api';
import { Mail, CheckCircle, XCircle, Building2, MapPin, Users, Calendar, Loader2, RefreshCw } from 'lucide-react';

interface Invitation {
  _id: string;
  society: {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    societyCode: string;
    totalFlats: number;
    amenities?: string[];
    images?: Array<{ url: string; isPrimary: boolean }>;
  };
  invitedBy: {
    _id: string;
    phone: string;
    fullName?: string;
  };
  invitationType: string;
  status: string;
  message?: string;
  createdAt: string;
  expiresAt?: string;
}

export function MemberInvitationsPanel() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    try {
      const { data, error } = await apiClient.getMyInvitations();
      
      if (error) {
        console.error('Error fetching invitations:', error);
        toast({
          title: 'Error',
          description: 'Failed to load invitations',
          variant: 'destructive',
        });
        return;
      }

      setInvitations(data?.invitations || []);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleResponse = async (invitationId: string, response: 'accept' | 'reject') => {
    setRespondingTo(invitationId);
    
    try {
      const { data, error } = await apiClient.respondToInvitation(invitationId, response);
      
      if (error) {
        console.error(`Error ${response}ing invitation:`, error);
        
        if (error.includes('already been')) {
          toast({
            title: 'Already Responded',
            description: 'You have already responded to this invitation',
            variant: 'destructive',
          });
        } else if (error.includes('expired')) {
          toast({
            title: 'Expired',
            description: 'This invitation has expired',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Error',
            description: error || `Failed to ${response} invitation`,
            variant: 'destructive',
          });
        }
        return;
      }

      toast({
        title: response === 'accept' ? 'Invitation Accepted' : 'Invitation Declined',
        description: data?.message || `You have successfully ${response === 'accept' ? 'joined the society' : 'declined the invitation'}`,
      });

      // Refresh invitations list
      await fetchInvitations();
    } catch (err) {
      console.error(`Error ${response}ing invitation:`, err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium mb-2">No Pending Invitations</p>
          <p className="text-muted-foreground">
            You don't have any pending society invitations at the moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Society Invitations</h2>
          <p className="text-muted-foreground">
            You have {invitations.length} pending {invitations.length === 1 ? 'invitation' : 'invitations'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchInvitations}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {invitations.map((invitation) => {
            const expired = isExpired(invitation.expiresAt);
            const primaryImage = invitation.society.images?.find(img => img.isPrimary)?.url || 
                               invitation.society.images?.[0]?.url;

            return (
              <Card key={invitation._id} className={expired ? 'opacity-60' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-xl flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {invitation.society.name}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {invitation.society.address}, {invitation.society.city}, {invitation.society.state}
                      </CardDescription>
                    </div>
                    <Badge variant={expired ? 'secondary' : 'default'}>
                      {expired ? 'Expired' : 'Pending'}
                    </Badge>
                  </div>
                </CardHeader>

                {primaryImage && (
                  <div className="px-6">
                    <img 
                      src={primaryImage} 
                      alt={invitation.society.name}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  </div>
                )}

                <CardContent className="space-y-4 pt-4">
                  {invitation.message && (
                    <Alert>
                      <Mail className="h-4 w-4" />
                      <AlertDescription>{invitation.message}</AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Total Flats:</span>
                      <span className="font-medium">{invitation.society.totalFlats}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Invited:</span>
                      <span className="font-medium">{formatDate(invitation.createdAt)}</span>
                    </div>
                  </div>

                  {invitation.society.amenities && invitation.society.amenities.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Amenities:</p>
                      <div className="flex flex-wrap gap-2">
                        {invitation.society.amenities.slice(0, 5).map((amenity, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {amenity}
                          </Badge>
                        ))}
                        {invitation.society.amenities.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{invitation.society.amenities.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="text-sm text-muted-foreground">
                    <p>Invited by: {invitation.invitedBy.fullName || invitation.invitedBy.phone}</p>
                    <p>Role: <span className="font-medium capitalize">{invitation.invitationType.replace('_', ' ')}</span></p>
                  </div>

                  {invitation.expiresAt && !expired && (
                    <p className="text-sm text-amber-600">
                      Expires on {formatDate(invitation.expiresAt)}
                    </p>
                  )}
                </CardContent>

                <CardFooter className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={() => handleResponse(invitation._id, 'accept')}
                    disabled={expired || respondingTo === invitation._id}
                  >
                    {respondingTo === invitation._id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleResponse(invitation._id, 'reject')}
                    disabled={expired || respondingTo === invitation._id}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
