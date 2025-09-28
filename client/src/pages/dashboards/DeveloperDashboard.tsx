import apiClient from '@/lib/api';
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useProfile } from "@/hooks/useProfile"
import { useToast } from "@/hooks/use-toast"
import DashboardNav from "@/components/DashboardNav"
import DeveloperProfileForm from "@/components/DeveloperProfileForm";
import ProjectForm from "@/components/ProjectForm";
import { ProposalForm } from "@/components/ProposalForm";
import RedevelopmentDetails from "@/components/RedevelopmentDetails";
import { 
  Building, 
  Plus, 
  MessageSquare, 
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Star,
  UserPlus,
  Home,
  IndianRupee,
  Eye,
  Edit,
  Trash2,
  Hammer,
  FileText,
  Clock,
  CheckCircle,
  X
} from "lucide-react"

interface DeveloperProfile {
  id: string
  company_name: string
  company_description: string | null
  established_year: number | null
  contact_info: Record<string, any>
  website: string | null
  social_media: Record<string, any>
  verification_status: string
  status: string
}

interface DeveloperProject {
  id: string
  name: string
  location: string
  status: string
  completion_date: string | null
  price_range: string
  images: string[]
  created_at: string
}

interface UserProperty {
  id: string
  title: string
  location: string
  city: string
  price: number
  property_type: string
  listing_type: string
  status: string
  images: string[]
  created_at: string
}

interface RedevelopmentRequirement {
  id: string
  society_id: string
  requirement_type: string
  description: string
  budget_range: string
  timeline_expectation: string
  special_needs: string[]
  status: string
  created_at: string
  societies: {
    name: string
    address: string
    city: string
    total_flats: number
  }
}

interface Proposal {
  id: string
  title: string
  description: string
  budget_estimate: number
  timeline: string
  status: string
  created_at: string
  requirement: {
    requirement_type: string
    societies: {
      name: string
      city: string
    }
  }
}

const DeveloperDashboard = () => {
  const [developerProfile, setDeveloperProfile] = useState<DeveloperProfile | null>(null)
  const [projects, setProjects] = useState<DeveloperProject[]>([])
  const [properties, setProperties] = useState<UserProperty[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalProperties: 0,
    totalInquiries: 0,
    completedProjects: 0,
    totalProposals: 0,
    acceptedProposals: 0
  })
  const [requirements, setRequirements] = useState<RedevelopmentRequirement[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null)
  const [showRequirementDetails, setShowRequirementDetails] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const { profile } = useProfile()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
      
      // Set up real-time subscription for developer profile changes
      const subscription = apiClient
        .channel('developer_profile_changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'developers',
            filter: `user_id=eq.${profile.id}`
          },
          (payload) => {
            console.log('Developer profile updated:', payload)
            // Refresh the dashboard data when verification status changes
            fetchDashboardData()
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [profile])

  const fetchDashboardData = async () => {
    if (!profile) return

    try {
      setLoading(true)

      // Fetch developer profile with fresh data
      const { data: developerData, error: developerError } = await apiClient
        
        
        

      if (developerError && developerError.code !== 'PGRST116') {
        throw developerError
      }

        console.log('Developer profile status:', developerData?.verification_status)
        console.log('User profile:', profile)

        // Set the developer profile in state
        if (developerData) {
          setDeveloperProfile(developerData as DeveloperProfile)
        }

      // Fetch projects if developer profile exists
      if (developerData) {
        const { data: projectsData, error: projectsError } = await apiClient
          
          
          

        if (projectsError) throw projectsError
        setProjects(projectsData || [])

        // Fetch properties for this developer
        const { data: propertiesData, error: propertiesError } = await apiClient
          
          
          

        if (propertiesError) throw propertiesError
        setProperties(propertiesData || [])

        // Fetch redevelopment requirements
        console.log('Fetching redevelopment requirements...')
        const { data: requirementsData, error: requirementsError } = await apiClient
          .select(`
            *,
            societies!inner(name, address, city, total_flats)
          `)
          
          

        console.log('Requirements query result:', { requirementsData, requirementsError })

        if (requirementsError) throw requirementsError
        setRequirements(requirementsData || [])

        // Fetch developer's proposals
        const { data: proposalsData, error: proposalsError } = await apiClient
          .select(`
            *,
            requirement:redevelopment_requirements(
              requirement_type,
              societies!inner(name, city)
            )
          `)
          
          

        if (proposalsError) throw proposalsError
        setProposals(proposalsData || [])

        // Calculate stats
        const activeProjects = (projectsData || []).filter(p => p.status === 'ongoing').length
        const completedProjects = (projectsData || []).filter(p => p.status === 'completed').length
        const acceptedProposals = (proposalsData || []).filter(p => p.status === 'accepted').length

        setStats({
          totalProjects: (projectsData || []).length,
          totalProperties: (propertiesData || []).length,
          activeProjects,
          completedProjects,
          totalInquiries: 0, // Would need to query inquiries table
          totalProposals: (proposalsData || []).length,
          acceptedProposals
        })
      }

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

  const createDeveloperProfile = async () => {
    if (!profile) return

    try {
      const { data, error } = await apiClient
        ({
          user_id: profile.id,
          company_name: profile.company_name || 'My Development Company',
          verification_status: 'pending',
          status: 'active'
        })
        .select()
        

      if (error) throw error

      setDeveloperProfile(data as DeveloperProfile)
      toast({
        title: "Success",
        description: "Developer profile created! Please complete your company information."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create developer profile",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'planned': return 'bg-yellow-100 text-yellow-800'
      case 'on_hold': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPropertyStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'sold': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await apiClient
        .delete()
        

      if (error) throw error

      setProperties(prev => prev.filter(p => p.id !== propertyId))
      
      toast({
        title: "Success",
        description: "Property deleted successfully"
      })
    } catch (error) {
      console.error('Error deleting property:', error)
      toast({
        title: "Error",
        description: "Failed to delete property",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If no developer profile exists, show setup screen
  if (!developerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardHeader>
              <Building className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-3xl">Welcome to Your Developer Dashboard</CardTitle>
              <CardDescription className="text-lg mt-2">
                Set up your developer profile to showcase your projects and manage inquiries
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <Card>
                  <CardContent className="p-6">
                    <Building className="h-8 w-8 text-blue-500 mb-3" />
                    <h3 className="font-semibold mb-2">Project Showcase</h3>
                    <p className="text-sm text-muted-foreground">
                      Display your residential and commercial development projects
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <MessageSquare className="h-8 w-8 text-green-500 mb-3" />
                    <h3 className="font-semibold mb-2">Inquiry Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Handle customer inquiries and project interest efficiently
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <TrendingUp className="h-8 w-8 text-purple-500 mb-3" />
                    <h3 className="font-semibold mb-2">Performance Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Track project views, inquiries, and customer engagement
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={createDeveloperProfile} size="lg">
                  <UserPlus className="w-5 h-5 mr-2" />
                  Set Up Developer Profile
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link to="/projects">
                    View All Projects
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Developer Dashboard</h1>
              <div className="text-muted-foreground mt-1">
                <span>{developerProfile.company_name}</span>
                {developerProfile.verification_status === 'pending' && (
                  <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                    Pending Verification
                  </Badge>
                )}
                {developerProfile.verification_status === 'verified' && (
                  <Badge className="ml-2 bg-green-100 text-green-800">
                    <Star className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {developerProfile.verification_status === 'rejected' && (
                  <Badge className="ml-2 bg-red-100 text-red-800">
                    Verification Rejected
                  </Badge>
                )}
              </div>
            </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchDashboardData}>
              Refresh Status
            </Button>
            <Button asChild>
              <Link to="/post-property">
                <Plus className="w-4 h-4 mr-2" />
                Post New Property
              </Link>
            </Button>
            <Button onClick={() => setShowProjectForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
        </div>

        {/* Verification Notice */}
        {developerProfile.verification_status === 'pending' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-800">Profile Under Verification</h4>
                  <p className="text-sm text-yellow-700">
                    Your developer profile is being verified by our team. This helps build trust with potential customers.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                  <div className="text-2xl font-bold">{stats.totalProjects}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                  <div className="text-2xl font-bold">{stats.activeProjects}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-indigo-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Properties Listed</p>
                  <div className="text-2xl font-bold">{stats.totalProperties}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Project Inquiries</p>
                  <div className="text-2xl font-bold">{stats.totalInquiries}</div>
                </div>
              </div>
            </CardContent>
          </Card>

           <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <div className="text-2xl font-bold">{stats.completedProjects}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Hammer className="h-8 w-8 text-teal-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Proposals</p>
                  <div className="text-2xl font-bold">{stats.totalProposals}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Accepted Proposals</p>
                  <div className="text-2xl font-bold">{stats.acceptedProposals}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="company" className="space-y-4">
          <TabsList>
            <TabsTrigger value="company">Company Profile</TabsTrigger>
            <TabsTrigger value="projects">My Projects</TabsTrigger>
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="redevelopment">Redevelopment</TabsTrigger>
            <TabsTrigger value="inquiries">Project Inquiries</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Development Projects</CardTitle>
                <CardDescription>Manage your residential and commercial projects</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">Start showcasing your development projects</p>
                    <Button onClick={() => setShowProjectForm(true)}>
                      Add First Project
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <Card key={project.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          {project.images?.[0] ? (
                            <img 
                              src={project.images[0]} 
                              alt={project.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Building className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                            
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="line-clamp-1">{project.location}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{project.price_range}</span>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            {project.completion_date && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Completion: {new Date(project.completion_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            
                            <div className="flex gap-2 pt-2">
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/project/${project.id}`}>
                                  View Details
                                </Link>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setEditingProject(project);
                                  setShowProjectForm(true);
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Properties</CardTitle>
                <CardDescription>Manage your property listings</CardDescription>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No properties listed yet</h3>
                    <p className="text-muted-foreground mb-4">Start by listing your first property!</p>
                    <Button asChild>
                      <Link to="/post-property">List Property</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map((property) => (
                      <Card key={property.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          {property.images?.[0] ? (
                            <img 
                              src={property.images[0]} 
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Home className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                            
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="line-clamp-1">{property.location}, {property.city}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-lg font-bold text-primary">
                                <IndianRupee className="w-4 h-4" />
                                <span>{property.price.toLocaleString()}</span>
                              </div>
                              
                              <Badge className={getPropertyStatusColor(property.status)}>
                                {property.status}
                              </Badge>
                            </div>

                            <div className="flex gap-1">
                              <Badge variant="outline" className="capitalize text-xs">
                                {property.property_type}
                              </Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                For {property.listing_type}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button asChild size="sm" variant="outline" className="flex-1">
                                <Link to={`/property/${property.id}`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/edit-property/${property.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>

                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteProperty(property.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="redevelopment" className="space-y-4">
            <div className="grid gap-6">
              {/* Available Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Available Redevelopment Opportunities</CardTitle>
                  <CardDescription>
                    Browse active redevelopment requirements from housing societies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {requirements.length === 0 ? (
                    <div className="text-center py-8">
                      <Hammer className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No active requirements</h3>
                      <p className="text-muted-foreground">New redevelopment opportunities will appear here</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {requirements.map((requirement) => (
                        <Card key={requirement.id} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold mb-2">
                                  {requirement.societies?.name || 'Unknown Society'}
                                </h3>
                                <div className="flex items-center text-sm text-muted-foreground mb-2">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  <span>{requirement.societies?.address || 'Unknown Address'}, {requirement.societies?.city || 'Unknown City'}</span>
                                </div>
                                <div className="flex gap-2 mb-3">
                                  <Badge variant="outline">{requirement.requirement_type}</Badge>
                                  <Badge variant="outline">{requirement.societies?.total_flats || 0} Flats</Badge>
                                  <Badge variant="secondary">{requirement.budget_range}</Badge>
                                </div>
                              </div>
                              <Badge className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4">
                              {requirement.description || 'No description available'}
                            </p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium">Timeline</p>
                                <p className="text-sm text-muted-foreground">{requirement.timeline_expectation || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Budget Range</p>
                                <p className="text-sm text-muted-foreground">{requirement.budget_range || 'Not specified'}</p>
                              </div>
                            </div>
                            
                            {requirement.special_needs && requirement.special_needs.length > 0 && (
                              <div className="mb-4">
                                <p className="text-sm font-medium mb-2">Special Requirements</p>
                                <div className="flex flex-wrap gap-1">
                                  {requirement.special_needs.map((need, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {need}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex justify-between items-center">
                              <p className="text-xs text-muted-foreground">
                                Posted {new Date(requirement.created_at).toLocaleDateString()}
                              </p>
                              <div className="flex gap-2">
                                <Button 
                                  onClick={() => setShowRequirementDetails(requirement.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                                <Button 
                                  onClick={() => {
                                    setSelectedRequirement(requirement.id)
                                    setShowProposalForm(true)
                                  }}
                                  size="sm"
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Submit Proposal
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* My Proposals */}
              <Card>
                <CardHeader>
                  <CardTitle>My Proposals</CardTitle>
                  <CardDescription>
                    Track the status of your submitted proposals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {proposals.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No proposals yet</h3>
                      <p className="text-muted-foreground">Your submitted proposals will appear here</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {proposals.map((proposal) => (
                        <Card key={proposal.id} className="border">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div>
                                <h3 className="text-lg font-semibold mb-2">
                                  {proposal.title}
                                </h3>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {proposal.requirement?.societies?.name || 'Unknown Society'} - {proposal.requirement?.societies?.city || 'Unknown City'}
                                </p>
                                <Badge variant="outline" className="mb-2">
                                  {proposal.requirement?.requirement_type}
                                </Badge>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  className={
                                    proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                    proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                    proposal.status === 'under_review' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }
                                >
                                  {proposal.status.replace('_', ' ')}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-sm text-muted-foreground mb-4">
                              {proposal.description || 'No description available'}
                            </p>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div>
                                <p className="text-sm font-medium">Budget Estimate</p>
                                <p className="text-sm text-muted-foreground">
                                  ₹{proposal.budget_estimate.toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Timeline</p>
                                <p className="text-sm text-muted-foreground">{proposal.timeline || 'Not specified'}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">Submitted</p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(proposal.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                {proposal.status === 'accepted' && (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                )}
                                {proposal.status === 'under_review' && (
                                  <Clock className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div className="flex gap-2">
                                {proposal.status === 'submitted' && (
                                  <Button variant="outline" size="sm">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </Button>
                                )}
                                <Button variant="outline" size="sm">
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Inquiries</CardTitle>
                <CardDescription>Customer inquiries about your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
                  <p className="text-muted-foreground">Project inquiries will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Analytics</CardTitle>
                <CardDescription>Track project views and customer engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analytics coming soon</h3>
                  <p className="text-muted-foreground">Detailed project analytics dashboard in development</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <DeveloperProfileForm 
              onUpdate={fetchDashboardData}
              existingProfile={developerProfile}
            />
          </TabsContent>
        </Tabs>

        {/* Proposal Form Modal */}
        {showProposalForm && selectedRequirement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Submit Proposal</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowProposalForm(false)
                    setSelectedRequirement(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <ProposalForm
                  requirementId={selectedRequirement}
                  onSuccess={() => {
                    setShowProposalForm(false)
                    setSelectedRequirement(null)
                    fetchDashboardData()
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Redevelopment Details Modal */}
        {showRequirementDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-background z-10">
                <h2 className="text-lg font-semibold">Redevelopment Details</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowRequirementDetails(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <RedevelopmentDetails requirementId={showRequirementDetails} />
              </div>
            </div>
          </div>
        )}

        {/* Project Form Modal */}
        {showProjectForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ProjectForm
                onSuccess={() => {
                  setShowProjectForm(false);
                  setEditingProject(null);
                  fetchDashboardData();
                }}
                onCancel={() => {
                  setShowProjectForm(false);
                  setEditingProject(null);
                }}
                existingProject={editingProject}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeveloperDashboard