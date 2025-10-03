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
  Heart, 
  Search, 
  MessageSquare, 
  Calendar,
  Home,
  MapPin,
  IndianRupee,
  Eye,
  Trash2
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

const BuyerDashboard = () => {
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [inquiries, setInquiries] = useState<UserInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
    }
  }, [profile?.id, profile?.user])

  const fetchDashboardData = async () => {
    const profileId = profile?.id || profile?.user;
    if (!profile || !profileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Quick API calls with 2 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const [likesResult, inquiriesResult] = await Promise.allSettled([
        apiClient.getLikes(),
        apiClient.getInquiries({ user_id: profileId })
      ]);
      
      clearTimeout(timeoutId);

      // Process results quickly
      if (likesResult.status === 'fulfilled' && !likesResult.value.error) {
        setSavedProperties(likesResult.value.data || []);
      } else {
        setSavedProperties([]);
      }
      
      if (inquiriesResult.status === 'fulfilled' && !inquiriesResult.value.error) {
        setInquiries(inquiriesResult.value.data || []);
      } else {
        setInquiries([]);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setSavedProperties([])
      setInquiries([])
    } finally {
      setLoading(false)
    }
  }

  const removeSavedProperty = async (savedPropertyId: string) => {
    try {
      const { error } = await apiClient.unlikeProperty(savedPropertyId);

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

  const getStatusColor = (status: string) => {
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
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {profile?.fullName}</h1>
            <p className="text-muted-foreground mt-3">Find your dream property with MilkatPost</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link to="/properties">
                <Search className="w-4 h-4 mr-2" />
                Browse Properties
              </Link>
            </Button>
            <Button asChild>
              <Link to="/post-property">
                <Home className="w-4 h-4 mr-2" />
                List Property
              </Link>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
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
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Inquiries</p>
                  <div className="text-2xl font-bold">
                    {inquiries.filter(inq => inq.status === 'pending').length}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Scheduled Visits</p>
                  <div className="text-2xl font-bold">0</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="saved" className="space-y-4">
          <TabsList>
            <TabsTrigger value="saved">Saved Properties</TabsTrigger>
            <TabsTrigger value="inquiries">My Inquiries</TabsTrigger>
            <TabsTrigger value="visits">Scheduled Visits</TabsTrigger>
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedProperties.map((saved) => {
                      const property = saved.properties
                      return (
                        <Card key={saved.id} className="overflow-hidden">
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
                                
                                <Badge variant="outline" className="capitalize">
                                  {property.property_type}
                                </Badge>
                              </div>
                              
                              <div className="flex gap-2 pt-2">
                                <Button asChild size="sm" className="flex-1">
                                  <Link to={`/property/${property.id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View
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

          <TabsContent value="inquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Inquiries</CardTitle>
                <CardDescription>Track your property inquiries and responses</CardDescription>
              </CardHeader>
              <CardContent>
                {inquiries.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
                    <p className="text-muted-foreground">Start exploring properties and make inquiries!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {inquiries.map((inquiry) => (
                      <div key={inquiry.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{inquiry.subject}</h4>
                            {inquiry.properties && (
                              <p className="text-sm text-muted-foreground">
                                {inquiry.properties.title} - {inquiry.properties.location}
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusColor(inquiry.status)}>
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

          <TabsContent value="visits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Scheduled Visits</CardTitle>
                <CardDescription>Manage your property visit appointments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No scheduled visits</h3>
                  <p className="text-muted-foreground">Visit scheduling feature coming soon!</p>
                </div>
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

export default BuyerDashboard