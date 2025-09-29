import apiClient from '@/lib/api';
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { 
  Users, 
  Building, 
  MessageSquare, 
  TrendingUp, 
  UserCheck, 
  UserX,
  Eye,
  Settings,
  BarChart3,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Reply,
  Download,
  DollarSign
} from "lucide-react"

interface DashboardStats {
  totalUsers: number
  totalProperties: number
  totalInquiries: number
  totalTickets: number
  pendingApprovals: number
  totalProjects: number
  totalBrokers: number
  totalDevelopers: number
  monthlyRevenue: number
}

interface UserData {
  id: string
  full_name: string
  role: string
  status: string
  verification_status: string
  created_at: string
}

interface PropertyData {
  id: string
  title: string
  status: string
  price: number
  location: string
  property_type: string
  owner_id: string
  owner_name?: string
  created_at: string
}

interface ProjectData {
  id: string
  name: string
  status: string
  builder: string
  location: string
  total_units: number
  available_units: number
  created_at: string
}

interface DeveloperData {
  id: string
  company_name: string
  user_id: string
  verification_status: string
  status: string
  established_year: number
  website: string
  created_at: string
  user_name?: string
}

interface SupportTicket {
  id: string
  subject: string
  category: string
  status: string
  priority: string
  user_id: string
  user_name?: string
  created_at: string
  description: string
}

interface AnalyticsData {
  userGrowth: Array<{ month: string; users: number }>
  propertyViews: Array<{ date: string; views: number }>
  inquiries: Array<{ type: string; count: number }>
}

const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalProperties: 0,
    totalInquiries: 0,
    totalTickets: 0,
    pendingApprovals: 0,
    totalProjects: 0,
    totalBrokers: 0,
    totalDevelopers: 0,
    monthlyRevenue: 0
  })
  const [users, setUsers] = useState<UserData[]>([])
  const [properties, setProperties] = useState<PropertyData[]>([])
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [developers, setDevelopers] = useState<DeveloperData[]>([])
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    userGrowth: [],
    propertyViews: [],
    inquiries: []
  })
  const [loading, setLoading] = useState(true)
  const [filterRole, setFilterRole] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [replyText, setReplyText] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch statistics
      const [
        usersResult,
        propertiesResult,
        inquiriesResult,
        ticketsResult,
        pendingResult,
        projectsResult,
        brokersResult,
        developersResult
      ] = await Promise.all([
        apiClient.getUsers(),
        apiClient.getProperties(),
        apiClient.getInquiries(),
        apiClient.getSupportTickets(),
        apiClient.getUsers({ status: 'pending_verification' }),
        apiClient.getProjects(),
        apiClient.getBrokers(),
        apiClient.getDevelopers()
      ])

      const usersCount = usersResult.data?.length || 0;
      const propertiesCount = propertiesResult.data?.length || 0;
      const inquiriesCount = inquiriesResult.data?.length || 0;
      const ticketsCount = ticketsResult.data?.length || 0;
      const pendingCount = pendingResult.data?.length || 0;
      const projectsCount = projectsResult.data?.length || 0;
      const brokersCount = brokersResult.data?.length || 0;
      const developersCount = developersResult.data?.length || 0;

      // Calculate monthly revenue (simplified - sum of property prices)
      const propertiesRevenue = propertiesResult.data || [];
      
      const monthlyRevenue = propertiesRevenue?.reduce((sum, prop) => sum + (prop.price || 0), 0) || 0

      setStats({
        totalUsers: usersCount || 0,
        totalProperties: propertiesCount || 0,
        totalInquiries: inquiriesCount || 0,
        totalTickets: ticketsCount || 0,
        pendingApprovals: pendingCount || 0,
        totalProjects: projectsCount || 0,
        totalBrokers: brokersCount || 0,
        totalDevelopers: developersCount || 0,
        monthlyRevenue
      })

      // Fetch users
      const { data: usersData } = await apiClient.getUsers();

      setUsers(usersData || [])

      // Fetch all properties first
      const { data: propertiesData } = await apiClient.getProperties();

      // Fetch all profiles to get owner names
      const { data: profilesData } = await apiClient.getUsers();

      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.id] = profile.full_name
        return acc
      }, {} as Record<string, string>)

      setProperties((propertiesData || []).map(prop => ({
        ...prop,
        owner_name: profilesMap[prop.owner_id] || 'Unknown Owner'
      })))

      // Fetch projects
      const { data: projectsData } = await apiClient.getProjects();

      setProjects(projectsData || [])

      // Fetch developers  
      const { data: developersData } = await apiClient.getDevelopers();

      setDevelopers((developersData || []).map(dev => ({
        ...dev,
        user_name: profilesMap[dev.user_id] || 'Unknown User'
      })))

      // Fetch support tickets
      const { data: ticketsData } = await apiClient.getSupportTickets();

      setSupportTickets((ticketsData || []).map(ticket => ({
        ...ticket,
        user_name: profilesMap[ticket.user_id] || 'Unknown User'
      })))

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const updateUserStatus = async (userId: string, status: string, verificationType: 'status' | 'verification') => {
    try {
      const updateField = verificationType === 'status' ? 'status' : 'verification_status'
      const { error } = await apiClient.updateUser(userId, { [updateField]: status });

      if (error) throw error

      toast({
        title: "Success",
        description: `User ${verificationType} updated successfully`
      })

      fetchDashboardData()
    } catch (error) {
      toast({
        title: "Error", 
        description: `Failed to update user ${verificationType}`,
        variant: "destructive"
      })
    }
  }

  const updatePropertyStatus = async (propertyId: string, status: string) => {
    try {
      const { error } = await apiClient.updateProperty(propertyId, { status });

      if (error) throw error

      toast({
        title: "Success",
        description: "Property status updated successfully"
      })

      fetchDashboardData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update property status",
        variant: "destructive"
      })
    }
  }

  const deleteProperty = async (propertyId: string) => {
    try {
      const { error } = await apiClient.deleteProperty(propertyId);

      if (error) throw error

      toast({
        title: "Success",
        description: "Property deleted successfully"
      })

      fetchDashboardData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive"
      })
    }
  }

  const updateProjectStatus = async (projectId: string, status: string) => {
    try {
      const { error } = await apiClient.updateProject(projectId, { status });

      if (error) throw error

      toast({
        title: "Success",
        description: "Project status updated successfully"
      })

      fetchDashboardData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project status",
        variant: "destructive"
      })
    }
  }

  const updateDeveloperStatus = async (developerId: string, status: string, verificationType: 'status' | 'verification') => {
    try {
      console.log(`Updating developer ${developerId} ${verificationType} to ${status}`)
      
      const updateField = verificationType === 'status' ? 'status' : 'verification_status'
      const { error } = await apiClient.updateDeveloper(developerId, { [updateField]: status });

      if (error) {
        console.error('Database update error:', error)
        throw error
      }

      console.log(`Successfully updated developer ${verificationType}`)
      
      toast({
        title: "Success",
        description: `Developer ${verificationType} updated successfully`
      })

      fetchDashboardData()
    } catch (error) {
      console.error('Error updating developer status:', error)
      toast({
        title: "Error",
        description: `Failed to update developer ${verificationType}`,
        variant: "destructive"
      })
    }
  }

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await apiClient.updateSupportTicket(ticketId, { status });

      if (error) throw error

      toast({
        title: "Success",
        description: "Ticket status updated successfully"
      })

      fetchDashboardData()
      setSelectedTicket(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ticket status",
        variant: "destructive"
      })
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesRole = filterRole === 'all' || user.role === filterRole
    const matchesSearch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesRole && matchesSearch
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getVerificationColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your MilkatPost platform</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/post-property">
                <Building className="w-4 h-4 mr-2" />
                List Property
              </Link>
            </Button>
            <Button onClick={fetchDashboardData}>
              <Settings className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Properties</p>
                  <div className="text-2xl font-bold">{stats.totalProperties}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Projects</p>
                  <div className="text-2xl font-bold">{stats.totalProjects}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Monthly Revenue</p>
                  <div className="text-2xl font-bold">₹{(stats.monthlyRevenue / 100000).toFixed(1)}L</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Inquiries</p>
                <div className="text-lg font-semibold">{stats.totalInquiries}</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Support Tickets</p>
                <div className="text-lg font-semibold">{stats.totalTickets}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Pending Approvals</p>
                <div className="text-lg font-semibold text-orange-600">{stats.pendingApprovals}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Active Brokers</p>
                <div className="text-lg font-semibold">{stats.totalBrokers}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="developers">Developers</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage user accounts, roles, and verification status</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex gap-4 mb-6">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="buyer">Buyers</SelectItem>
                      <SelectItem value="seller">Sellers</SelectItem>
                      <SelectItem value="broker">Brokers</SelectItem>
                      <SelectItem value="developer">Developers</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Users Table */}
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{user.full_name || 'No Name'}</h4>
                          <Badge variant="outline" className="capitalize">
                            {user.role}
                          </Badge>
                        </div>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(user.status)}>
                            {user.status}
                          </Badge>
                          <Badge className={getVerificationColor(user.verification_status)}>
                            {user.verification_status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {user.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatus(user.id, 'suspended', 'status')}
                          >
                            <UserX className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateUserStatus(user.id, 'active', 'status')}
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {user.verification_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateUserStatus(user.id, 'verified', 'verification')}
                            >
                              Approve
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => updateUserStatus(user.id, 'rejected', 'verification')}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Management</CardTitle>
                <CardDescription>Manage all property listings on the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      placeholder="Search properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <Select defaultValue="all">
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Properties</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="rented">Rented</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Owner</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties
                        .filter(property => 
                          property.title.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((property) => (
                        <TableRow key={property.id}>
                          <TableCell className="font-medium">{property.title}</TableCell>
                          <TableCell>{property.owner_name}</TableCell>
                          <TableCell className="capitalize">{property.property_type}</TableCell>
                          <TableCell>₹{property.price?.toLocaleString()}</TableCell>
                           <TableCell>
                             <Badge 
                               variant={
                                 property.status === 'available' ? 'default' : 
                                 property.status === 'suspended' ? 'destructive' :
                                 property.status === 'pending' ? 'outline' : 'secondary'
                               }
                             >
                               {property.status}
                             </Badge>
                           </TableCell>
                          <TableCell>{property.location}</TableCell>
                           <TableCell>
                             <div className="flex gap-2">
                               <Button 
                                 size="sm" 
                                 variant="outline"
                                 onClick={() => window.open(`/property/${property.id}`, '_blank')}
                               >
                                 <Eye className="w-4 h-4" />
                               </Button>
                               
                               {property.status === 'pending' ? (
                                 <div className="flex gap-1">
                                   <Button 
                                     size="sm" 
                                     onClick={() => updatePropertyStatus(property.id, 'available')}
                                   >
                                     <CheckCircle className="w-3 h-3 mr-1" />
                                     Approve
                                   </Button>
                                   <Button 
                                     size="sm" 
                                     variant="destructive"
                                     onClick={() => updatePropertyStatus(property.id, 'suspended')}
                                   >
                                     <XCircle className="w-3 h-3 mr-1" />
                                     Reject
                                   </Button>
                                 </div>
                               ) : (
                                 <Select onValueChange={(status) => updatePropertyStatus(property.id, status)}>
                                   <SelectTrigger className="w-24">
                                     <SelectValue placeholder="Status" />
                                   </SelectTrigger>
                                   <SelectContent>
                                     <SelectItem value="available">Available</SelectItem>
                                     <SelectItem value="sold">Sold</SelectItem>
                                     <SelectItem value="rented">Rented</SelectItem>
                                     <SelectItem value="suspended">Suspend</SelectItem>
                                   </SelectContent>
                                 </Select>
                               )}
                               
                               <Button 
                                 size="sm" 
                                 variant="destructive"
                                 onClick={() => deleteProperty(property.id)}
                               >
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </div>
                           </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Management</CardTitle>
                <CardDescription>Manage all development projects</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project Name</TableHead>
                      <TableHead>Builder</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Units</TableHead>
                      <TableHead>Available</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id}>
                        <TableCell className="font-medium">{project.name}</TableCell>
                        <TableCell>{project.builder}</TableCell>
                        <TableCell>{project.location}</TableCell>
                        <TableCell>
                          <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                            {project.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{project.total_units}</TableCell>
                        <TableCell>{project.available_units}</TableCell>
                         <TableCell>
                           <div className="flex gap-2">
                             <Button 
                               size="sm" 
                               variant="outline"
                               onClick={() => window.open(`/project/${project.id}`, '_blank')}
                             >
                               <Eye className="w-4 h-4" />
                             </Button>
                             
                             {project.status === 'pending' ? (
                               <div className="flex gap-1">
                                 <Button 
                                   size="sm" 
                                   onClick={() => updateProjectStatus(project.id, 'ongoing')}
                                 >
                                   <CheckCircle className="w-3 h-3 mr-1" />
                                   Approve
                                 </Button>
                                 <Button 
                                   size="sm" 
                                   variant="destructive"
                                   onClick={() => updateProjectStatus(project.id, 'suspended')}
                                 >
                                   <XCircle className="w-3 h-3 mr-1" />
                                   Reject
                                 </Button>
                               </div>
                             ) : (
                               <Select onValueChange={(status) => updateProjectStatus(project.id, status)}>
                                 <SelectTrigger className="w-28">
                                   <SelectValue placeholder="Status" />
                                 </SelectTrigger>
                                 <SelectContent>
                                   <SelectItem value="ongoing">Ongoing</SelectItem>
                                   <SelectItem value="completed">Completed</SelectItem>
                                   <SelectItem value="suspended">Suspend</SelectItem>
                                 </SelectContent>
                               </Select>
                             )}
                             
                             <Button size="sm" variant="outline">
                               <Edit className="w-4 h-4" />
                             </Button>
                           </div>
                         </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="developers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Developer Management</CardTitle>
                <CardDescription>Manage developer accounts and verification status</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Established</TableHead>
                      <TableHead>Website</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {developers.map((developer) => (
                      <TableRow key={developer.id}>
                        <TableCell className="font-medium">{developer.company_name}</TableCell>
                        <TableCell>{developer.user_name}</TableCell>
                        <TableCell>{developer.established_year || 'N/A'}</TableCell>
                        <TableCell>
                          {developer.website ? (
                            <a 
                              href={developer.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Visit Site
                            </a>
                          ) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(developer.status)}>
                            {developer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getVerificationColor(developer.verification_status)}>
                            {developer.verification_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => window.open(`/developer/${developer.id}`, '_blank')}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            
                            {developer.verification_status === 'pending' ? (
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  onClick={() => updateDeveloperStatus(developer.id, 'verified', 'verification')}
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  onClick={() => updateDeveloperStatus(developer.id, 'rejected', 'verification')}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            ) : (
                              <Select onValueChange={(status) => updateDeveloperStatus(developer.id, status, 'verification')}>
                                <SelectTrigger className="w-28">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="verified">Verified</SelectItem>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="rejected">Rejected</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            <Select onValueChange={(status) => updateDeveloperStatus(developer.id, status, 'status')}>
                              <SelectTrigger className="w-24">
                                <SelectValue placeholder="Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="inactive">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Active Users (Last 30 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">+12% from last month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Property Views</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12.4K</div>
                    <p className="text-xs text-muted-foreground">+8% from last month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">3.2%</div>
                    <p className="text-xs text-muted-foreground">-0.1% from last month</p>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Platform revenue insights and trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">₹{(stats.monthlyRevenue / 100000).toFixed(1)}L</div>
                      <p className="text-sm text-muted-foreground">This Month</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">₹{((stats.monthlyRevenue * 0.85) / 100000).toFixed(1)}L</div>
                      <p className="text-sm text-muted-foreground">Last Month</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">+18%</div>
                      <p className="text-sm text-muted-foreground">Growth Rate</p>
                    </div>
                    <div className="text-center p-4 border rounded-lg">
                      <div className="text-2xl font-bold">₹{((stats.monthlyRevenue * 12) / 100000).toFixed(1)}L</div>
                      <p className="text-sm text-muted-foreground">Projected Annual</p>
                    </div>
                  </div>
                  <div className="text-center text-muted-foreground">
                    Revenue analytics chart would be displayed here
                  </div>
                </CardContent>
              </Card>

              {/* User Activity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>User Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Buyers</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded">
                            <div className="w-3/4 h-full bg-blue-500 rounded"></div>
                          </div>
                          <span className="text-sm">75%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Sellers</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded">
                            <div className="w-1/2 h-full bg-green-500 rounded"></div>
                          </div>
                          <span className="text-sm">50%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Brokers</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded">
                            <div className="w-1/4 h-full bg-orange-500 rounded"></div>
                          </div>
                          <span className="text-sm">25%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Developers</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded">
                            <div className="w-1/5 h-full bg-purple-500 rounded"></div>
                          </div>
                          <span className="text-sm">20%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Top Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Most Viewed Property Type</span>
                          <span className="font-medium">Apartments</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Top Location</span>
                          <span className="font-medium">Mumbai</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Average Property Price</span>
                          <span className="font-medium">₹85L</span>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Properties Listed Today</span>
                          <span className="font-medium text-green-600">+24</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Export Options */}
              <Card>
                <CardHeader>
                  <CardTitle>Data Export</CardTitle>
                  <CardDescription>Export platform data for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Users
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Properties
                    </Button>
                    <Button variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="support" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Manage customer support tickets and inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {supportTickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                        <TableCell>{ticket.user_name}</TableCell>
                        <TableCell className="capitalize">{ticket.category}</TableCell>
                        <TableCell>
                          <Badge variant={
                            ticket.priority === 'high' ? 'destructive' :
                            ticket.priority === 'medium' ? 'default' : 'secondary'
                          }>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            ticket.status === 'open' ? 'destructive' :
                            ticket.status === 'in_progress' ? 'default' : 'secondary'
                          }>
                            {ticket.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => setSelectedTicket(ticket)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>{ticket.subject}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">User</p>
                                      <p className="font-medium">{ticket.user_name}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Category</p>
                                      <p className="font-medium capitalize">{ticket.category}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-muted-foreground">Description</p>
                                    <p className="mt-1 p-3 bg-muted rounded-md">{ticket.description}</p>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium">Reply</label>
                                    <Textarea
                                      placeholder="Type your response..."
                                      value={replyText}
                                      onChange={(e) => setReplyText(e.target.value)}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button 
                                      onClick={() => updateTicketStatus(ticket.id, 'resolved')}
                                      className="flex-1"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Resolve
                                    </Button>
                                    <Button 
                                      variant="outline"
                                      onClick={() => updateTicketStatus(ticket.id, 'in_progress')}
                                    >
                                      <Clock className="w-4 h-4 mr-2" />
                                      In Progress
                                    </Button>
                                    <Button variant="outline">
                                      <Reply className="w-4 h-4 mr-2" />
                                      Reply
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                          </div>
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
    </div>
  )
}

export default AdminDashboard