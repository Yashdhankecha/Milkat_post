import apiClient from '@/lib/api';
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/useAuth"
import { useToast } from "@/hooks/use-toast"
import DashboardNav from "@/components/DashboardNav"
import { 
  Home, 
  Plus, 
  MessageSquare, 
  Eye,
  MapPin,
  IndianRupee,
  TrendingUp,
  Edit,
  Trash2
} from "lucide-react"

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

interface PropertyInquiry {
  id: string
  subject: string
  message: string
  status: string
  created_at: string
  user_id: string
  profiles: {
    full_name: string
  }
}

const SellerDashboard = () => {
  const [properties, setProperties] = useState<UserProperty[]>([])
  const [inquiries, setInquiries] = useState<PropertyInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
    }
  }, [profile])

  const fetchDashboardData = async () => {
    if (!profile) return

    try {
      setLoading(true)

      // Fetch user properties
      const { data: propertiesData, error: propertiesError } = await apiClient
        
        
        

      if (propertiesError) throw propertiesError
      setProperties(propertiesData || [])

      // Fetch property inquiries
      const { data: inquiryData, error: inquiryError } = await apiClient
        .select(`
          id,
          subject,
          message,
          status,
          created_at,
          user_id,
          profiles (
            full_name
          )
        `)
        .map(p => p.id))
        

      if (inquiryError) throw inquiryError
      setInquiries(inquiryData || [])

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'sold': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getInquiryStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'responded': return 'bg-blue-100 text-blue-800'
      case 'closed': return 'bg-green-100 text-green-800'
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

      // Remove property from local state
      setProperties(prev => Array.isArray(prev) ? prev.filter(p => p.id !== propertyId) : [])
      
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

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.fullName}</h1>
            <p className="text-muted-foreground mt-3">Manage your property listings and inquiries</p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/post-property">
                <Plus className="w-4 h-4 mr-2" />
                List New Property
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Properties</p>
                  <div className="text-2xl font-bold">{Array.isArray(properties) ? properties.length : 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
                  <div className="text-2xl font-bold">
                    {Array.isArray(properties) ? properties.filter(p => p.status === 'available').length : 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">New Inquiries</p>
                  <div className="text-2xl font-bold">
                    {Array.isArray(inquiries) ? inquiries.filter(inq => inq.status === 'pending').length : 0}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <div className="text-2xl font-bold">0</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="properties" className="space-y-4">
          <TabsList>
            <TabsTrigger value="properties">My Properties</TabsTrigger>
            <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Properties</CardTitle>
                <CardDescription>Manage your property listings</CardDescription>
              </CardHeader>
              <CardContent>
                {!Array.isArray(properties) || properties.length === 0 ? (
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
                    {Array.isArray(properties) && properties.map((property) => (
                      <Card key={property.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          {property.images?.[0] ? (
                            <img 
                              src={property.images[0]?.url || property.images[0]} 
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
                              
                              <Badge className={getStatusColor(property.status)}>
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

          <TabsContent value="inquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Inquiries</CardTitle>
                <CardDescription>Respond to customer inquiries about your properties</CardDescription>
              </CardHeader>
              <CardContent>
                {inquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
                    <p className="text-muted-foreground">Inquiries from potential buyers will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div key={inquiry.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{inquiry.subject}</h4>
                            <p className="text-sm text-muted-foreground">
                              From: {inquiry.profiles?.full_name || 'Unknown User'}
                            </p>
                          </div>
                          <Badge className={getInquiryStatusColor(inquiry.status)}>
                            {inquiry.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {inquiry.message}
                        </p>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">
                            {new Date(inquiry.created_at).toLocaleDateString()}
                          </span>
                          
                          {inquiry.status === 'pending' && (
                            <Button size="sm">
                              Respond
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Analytics</CardTitle>
                <CardDescription>Track views, inquiries, and performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Manage your account information and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Profile management features coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default SellerDashboard