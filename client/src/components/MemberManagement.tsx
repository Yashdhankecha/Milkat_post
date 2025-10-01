import apiClient from '@/lib/api';
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, Mail, CheckCircle, XCircle, Clock, Phone, Crown, RefreshCw } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface MemberManagementProps {
  societyId: string
}

interface Member {
  id: string;
  userId: string;
  phone: string;
  email: string;
  fullName?: string;
  role: string;
  status: string;
  joinedAt: string;
  isOwner: boolean;
  flatNumber?: string;
  blockNumber?: string;
  membershipRole?: string;
}

export const MemberManagement = ({ societyId }: MemberManagementProps) => {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [flatNumber, setFlatNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    if (societyId) {
      fetchMembers()
      fetchInvitations()
    }
  }, [societyId])

  // Auto-refresh data every 30 seconds to catch accepted invitations
  useEffect(() => {
    if (societyId) {
      const interval = setInterval(() => {
        fetchMembers()
        fetchInvitations()
      }, 30000) // 30 seconds

      return () => clearInterval(interval)
    }
  }, [societyId])

  const fetchMembers = async () => {
    if (!societyId) {
      console.log('No societyId provided, skipping members fetch');
      return;
    }
    
    try {
      console.log('Fetching members for societyId:', societyId);
      const { data: membersResponse, error: membersError } = await apiClient.getSocietyMembers(societyId)

      if (membersError) throw membersError

      if (membersResponse && membersResponse.members) {
        setMembers(membersResponse.members)
      } else {
        setMembers([])
      }
    } catch (err: any) {
      toast({
        title: "Error fetching members",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const fetchInvitations = async () => {
    if (!societyId) {
      console.log('No societyId provided, skipping invitations fetch');
      return;
    }
    
    try {
      console.log('Fetching invitations for societyId:', societyId);
      const { data: invitationsData, error: invitationsError } = await apiClient.getSentInvitations(`?society_id=${societyId}`)

      if (invitationsError) throw invitationsError

      if (invitationsData && invitationsData.invitations) {
        setInvitations(invitationsData.invitations)
      } else {
        setInvitations([])
      }
    } catch (err: any) {
      toast({
        title: "Error fetching invitations",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const addMember = async () => {
    if (!name || !phone || !email) {
      toast({
        title: "Error",
        description: "Please fill all required fields",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // For now, we'll send an invitation instead of directly adding a member
      const invitationData = {
        society_id: societyId,
        invitedPhone: phone,
        invitedName: name,
        invitedEmail: email,
        invitationType: 'society_member' as const,
        message: `Welcome to our society! We're excited to have you join our community.`
      }

      const { data, error } = await apiClient.sendInvitation(invitationData)

      if (error) {
        // Handle specific error cases
        if (error.includes('already been invited')) {
          toast({
            title: "Already Invited",
            description: "This user has already been invited to the society",
            variant: "destructive",
          })
        } else if (error.includes('already a member')) {
          toast({
            title: "Already a Member",
            description: "This user is already a member of the society",
            variant: "destructive",
          })
        } else {
          throw error
        }
        return
      }

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      })

      // Reset form
      setName('')
      setEmail('')
      setPhone('')
      setFlatNumber('')
      setOpen(false)

      // Refresh invitations
      fetchInvitations()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'society_owner':
        return <Crown className="h-4 w-4 text-yellow-600" />
      case 'society_member':
        return <UserPlus className="h-4 w-4 text-blue-600" />
      default:
        return <UserPlus className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Member Management</h2>
          <p className="text-muted-foreground">
            Manage society members and send invitations
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              fetchMembers()
              fetchInvitations()
            }}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your society
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="flatNumber">Flat Number (Optional)</Label>
                <Input
                  id="flatNumber"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  placeholder="Enter flat number"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addMember} disabled={loading}>
                  {loading ? 'Sending...' : 'Send Invitation'}
                </Button>
              </div>
            </div>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Society Members</CardTitle>
              <CardDescription>
                Current members of your society
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg">
                  <UserPlus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Members Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start by inviting members to your society
                  </p>
                  <Button onClick={() => setOpen(true)} className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Invite First Member
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/50"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {/* Avatar */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          member.isOwner ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-blue-400 to-blue-600'
                        }`}>
                          {member.phone?.charAt(0) || 'U'}
                        </div>

                        {/* Member Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-base truncate">
                              {(member as any).fullName || member.phone}
                            </p>
                            {member.isOwner && (
                              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 gap-1">
                                <Crown className="h-3 w-3" />
                                Owner
                              </Badge>
                            )}
                            <Badge 
                              variant="outline"
                              className="text-xs"
                            >
                              {member.role.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span>{member.phone}</span>
                            </div>
                            {member.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{member.email}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Status and Date */}
                        <div className="hidden md:flex flex-col items-end gap-2">
                          <Badge 
                            className={`${getStatusColor(member.status)}`}
                          >
                            {member.status.toUpperCase()}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            Joined {formatDate(member.joinedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent Invitations</CardTitle>
              <CardDescription>
                Track the status of your invitations (showing pending invitations only)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invitations.filter((inv: any) => inv.status === 'pending' || inv.status === 'sent').length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Pending Invitations</h3>
                  <p className="text-muted-foreground">
                    All invitations have been responded to or send new invitations to grow your society
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations
                    .filter((inv: any) => inv.status === 'pending' || inv.status === 'sent')
                    .map((invitation: any) => (
                    <Card key={invitation._id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {invitation.invitedName || invitation.invitedPhone}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invitation.invitedEmail && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {invitation.invitedEmail}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {invitation.invitedPhone}
                            </div>
                          </div>
                          {invitation.message && (
                            <div className="text-sm italic text-muted-foreground">
                              "{invitation.message}"
                            </div>
                          )}
                        </div>
                        <div className="text-right space-y-2">
                          <Badge variant="outline">
                            {invitation.invitationType.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {invitation.status === 'accepted' && <CheckCircle className="h-4 w-4 text-green-600" />}
                            {invitation.status === 'declined' && <XCircle className="h-4 w-4 text-red-600" />}
                            {invitation.status === 'pending' && <Clock className="h-4 w-4 text-yellow-600" />}
                            {invitation.status === 'sent' && <Clock className="h-4 w-4 text-blue-600" />}
                            <span className="text-sm font-medium">
                              {invitation.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}