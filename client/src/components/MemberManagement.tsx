import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserPlus, Mail, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/integrations/supabase/client'

interface MemberManagementProps {
  societyId: string
}

export const MemberManagement = ({ societyId }: MemberManagementProps) => {
  const [members, setMembers] = useState([])
  const [invitations, setInvitations] = useState([])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [flatNumber, setFlatNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  
  const { toast } = useToast()

  useEffect(() => {
    fetchMembers()
    fetchInvitations()
  }, [societyId])

  const fetchMembers = async () => {
    try {
      const { data: membersData, error: membersError } = await supabase
        .from('society_members')
        .select('*')
        .eq('society_id', societyId)

      if (membersError) throw membersError

      // Fetch profiles separately if needed
      const memberIds = membersData?.map(member => member.user_id) || []
      
      if (memberIds.length === 0) {
        setMembers([])
        return
      }

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, phone')
        .in('id', memberIds)

      if (profilesError) {
        console.warn('Could not fetch profiles:', profilesError)
        // Continue with members data even if profiles fail
        setMembers(membersData.map(member => ({ ...member, profiles: null })))
        return
      }

      // Combine the data
      const membersWithProfiles = membersData.map(member => {
        const profile = profilesData.find(p => p.id === member.user_id)
        return {
          ...member,
          profiles: profile || null
        }
      })

      setMembers(membersWithProfiles)

      setMembers(membersWithProfiles)
    } catch (err: any) {
      toast({
        title: "Error fetching members",
        description: err.message,
        variant: "destructive",
      })
    }
  }

  const fetchInvitations = async () => {
    try {
      const { data, error } = await supabase
        .from('member_invitations')
        .select('*')
        .eq('society_id', societyId)

      if (error) throw error
      setInvitations(data || [])
    } catch (error: any) {
      toast({
        title: "Error fetching invitations",
        description: error.message,
        variant: "destructive",
      })
    }
  }


  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: invitation, error } = await supabase
        .from('member_invitations')
        .insert([{
          society_id: societyId,
          name,
          email: email || null,
          phone,
          flat_number: flatNumber,
          invited_by: (await supabase.auth.getUser()).data.user?.id
        }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Invitation created!",
        description: `Member invitation sent for ${name} - Flat ${flatNumber}. They can now register using their email/mobile.`,
      })

      setName('')
      setEmail('')
      setPhone('')
      setFlatNumber('')
      setOpen(false)
      fetchInvitations()
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'expired':
        return <XCircle className="h-4 w-4 text-gray-400" />
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Member Management</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Member</DialogTitle>
              <DialogDescription>
                Send an invitation to a new society member
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={sendInvitation} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter member's full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile Number</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="flatNumber">Flat Number</Label>
                <Input
                  id="flatNumber"
                  value={flatNumber}
                  onChange={(e) => setFlatNumber(e.target.value)}
                  placeholder="A-101"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="member@example.com"
                />
              </div>
              <div className="bg-muted/50 p-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Auto-Registration Process:</p>
                <p className="text-muted-foreground">
                  When the member signs up with the same email or mobile number, they will automatically become a society member.
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Send Invitation'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="invitations">Invitations ({invitations.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Society Members</CardTitle>
              <CardDescription>Manage your society members</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Flat Number</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: any) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell>{member.flat_number}</TableCell>
                      <TableCell>{member.profiles?.phone || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.status)}>
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(member.joined_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invitations">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
              <CardDescription>Members will auto-join when they register with matching email/mobile</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member Details</TableHead>
                    <TableHead>Flat Number</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((invitation: any) => (
                    <TableRow key={invitation.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{invitation.name}</div>
                          {invitation.email && (
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {invitation.email}
                            </div>
                          )}
                          {invitation.phone && (
                            <div className="text-sm text-muted-foreground">
                              {invitation.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{invitation.flat_number}</TableCell>
                      <TableCell className="flex items-center gap-2">
                        {getStatusIcon(invitation.status)}
                        <Badge variant="outline">
                          {invitation.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {new Date(invitation.expires_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}