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
import { 
  Heart, 
  Search, 
  MessageSquare, 
  Calendar,
  Home,
  MapPin,
  IndianRupee,
  Eye,
  Trash2,
  Plus,
  TrendingUp,
  Edit
} from "lucide-react"

interface SavedProperty {
  id: string
  created_at: string
  property_id: string
  properties: {
    id: string
    title: string
    location: string
    city: string
    price: number
    property_type: string
    images: string[]
    status: string
  }
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

interface UserInquiry {
  id: string
  subject: string
  message: string
  inquiry_type: string
  status: string
  created_at: string
  property_id?: string
  properties?: {
    title: string
    location: string
  }
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

const BuyerSellerDashboard = () => {
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [myProperties, setMyProperties] = useState<UserProperty[]>([])
  const [myInquiries, setMyInquiries] = useState<UserInquiry[]>([])
  const [propertyInquiries, setPropertyInquiries] = useState<PropertyInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useProfile()
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

      // Fetch saved properties (buyer functionality)
      const { data: savedData, error: savedError } = await apiClient
        .select(`
          id,
          created_at,
          property_id,
          properties (
            id,
            title,
            location,
            city,
            price,
            property_type,
            images,
            status
          )
        `)
        
        

      if (savedError) throw savedError
      setSavedProperties(savedData || [])

      // Fetch my properties (seller functionality)
      const { data: propertiesData, error: propertiesError } = await apiClient
        
        
        

      if (propertiesError) throw propertiesError
      setMyProperties(propertiesData || [])

      // Fetch my inquiries (buyer functionality)
      const { data: inquiryData, error: inquiryError } = await apiClient
        .select(`
          id,
          subject,
          message,
          inquiry_type,
          status,
          created_at,
          property_id,
          properties (
            title,
            location
          )
        `)
        
        

      if (inquiryError) throw inquiryError
      setMyInquiries(inquiryData || [])

      // Fetch inquiries on my properties (seller functionality)
      const result = await apiClient.getInquiries();
      const propertyInquiryData = result.data || [];
      const propertyInquiryError = result.error;
        

      if (propertyInquiryError) throw propertyInquiryError
      setPropertyInquiries(propertyInquiryData || [])

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

  const removeSavedProperty = async (savedPropertyId: string) => {
    try {
      const { error } = await apiClient
        .delete()
        

      if (error) throw error

      toast({
        title: "Success",
        description: "Property removed from saved list"
      })

      setSavedProperties(prev => prev.filter(prop => prop.id !== savedPropertyId))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove property",
        variant: "destructive"
      })
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

      setMyProperties(prev => prev.filter(p => p.id !== propertyId))
      
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
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header - Made responsive */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome back, {profile?.full_name}</h1>
            <p className="text-muted-foreground mt-1">Buy, sell, and manage properties all in one place</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link to="/properties">
                <Search className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">Browse Properties</span>
              </Link>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link to="/post-property">
                <Plus className="w-4 h-4 mr-2" />
                <span className="whitespace-nowrap">List Property</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats - Made responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Heart className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Saved Properties</p>
                  <div className="text-2xl font-bold">{savedProperties.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <Home className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">My Properties</p>
                  <div className="text-2xl font-bold">{myProperties.length}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
                  <div className="text-2xl font-bold">
                    {myProperties.filter(p => p.status === 'available').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">New Inquiries</p>
                  <div className="text-2xl font-bold">
                    {propertyInquiries.filter(inq => inq.status === 'pending').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Made responsive */}
        <Tabs defaultValue="saved" className="space-y-4">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="saved" className="px-3 py-2">Saved Properties</TabsTrigger>
            <TabsTrigger value="my-properties" className="px-3 py-2">My Properties</TabsTrigger>
            <TabsTrigger value="my-inquiries" className="px-3 py-2">My Inquiries</TabsTrigger>
            <TabsTrigger value="property-inquiries" className="px-3 py-2">Property Inquiries</TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Saved Properties</CardTitle>
                <CardDescription>Properties you've saved for later viewing</CardDescription>
              </CardHeader>
              <CardContent>
                {savedProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No saved properties yet</h3>
                    <p className="text-muted-foreground mb-4">Start browsing properties and save the ones you like!</p>
                    <Button asChild>
                      <Link to="/properties">Browse Properties</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedProperties.map((saved) => {
                      const property = saved.properties
                      return (
                        <Card key={saved.id} className="overflow-hidden">
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
                                
                                <Badge variant="outline" className="capitalize">
                                  {property.property_type}
                                </Badge>
                              </div>
                              
                              <div className="flex gap-2 pt-2">
                                <Button asChild size="sm" className="flex-1">
                                  <Link to={`/property/${property.id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    <span className="hidden xs:inline">View</span>
                                  </Link>
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => removeSavedProperty(saved.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Properties</CardTitle>
                <CardDescription>Manage your property listings</CardDescription>
              </CardHeader>
              <CardContent>
                {myProperties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No properties listed yet</h3>
                    <p className="text-muted-foreground mb-4">Start by listing your first property!</p>
                    <Button asChild>
                      <Link to="/post-property">List Property</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {myProperties.map((property) => (
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
                                  <span className="hidden xs:inline">View</span>
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

          <TabsContent value="my-inquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Inquiries</CardTitle>
                <CardDescription>Track your property inquiries and responses</CardDescription>
              </CardHeader>
              <CardContent>
                {myInquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
                    <p className="text-muted-foreground">Start exploring properties and make inquiries!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
                          <div>
                            <h4 className="font-medium">{inquiry.subject}</h4>
                            {inquiry.properties && (
                              <p className="text-sm text-muted-foreground">
                                {inquiry.properties.title} - {inquiry.properties.location}
                              </p>
                            )}
                          </div>
                          <Badge className={getInquiryStatusColor(inquiry.status)}>
                            {inquiry.status}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {inquiry.message}
                        </p>
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>Type: {inquiry.inquiry_type.replace('_', ' ')}</span>
                          <span>{new Date(inquiry.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property-inquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Inquiries</CardTitle>
                <CardDescription>Respond to customer inquiries about your properties</CardDescription>
              </CardHeader>
              <CardContent>
                {propertyInquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
                    <p className="text-muted-foreground">Inquiries from potential buyers will appear here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {propertyInquiries.map((inquiry) => (
                      <div key={inquiry.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
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
                        
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
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
        </Tabs>
      </div>
    </div>
  )
}

export default BuyerSellerDashboard
