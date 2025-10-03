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
import InquiryList from "@/components/InquiryList"
import InquiryNotification from "@/components/InquiryNotification"
import SavedProjects from "@/components/SavedProjects"
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
  Edit,
  RefreshCw,
  Building2,
  Users,
  FileText,
  Settings
} from "lucide-react"

interface SavedProperty {
  _id: string
  createdAt: string
  property: {
    _id: string
    title: string
    location: {
      address: string
    city: string
      state: string
    }
    price: number
    propertyType: string
    listingType: string
    images: string[]
    status: string
    area: number
  }
}

interface UserProperty {
  _id: string
  title: string
  location: {
    address: string
  city: string
    state: string
  }
  price: number
  propertyType: string
  listingType: string
  status: string
  images: string[]
  createdAt: string
  area: number
  description?: string
}

interface UserInquiry {
  _id: string
  subject: string
  message: string
  inquiryType: string
  status: string
  createdAt: string
  property?: {
    _id: string
    title: string
    location: {
      address: string
      city: string
    }
  }
}

interface PropertyInquiry {
  _id: string
  subject: string
  message: string
  status: string
  createdAt: string
  user: {
    _id: string
    fullName: string
  }
}

const BuyerSellerDashboard = () => {
  const [savedProperties, setSavedProperties] = useState<SavedProperty[]>([])
  const [myProperties, setMyProperties] = useState<UserProperty[]>([])
  const [myInquiries, setMyInquiries] = useState<UserInquiry[]>([])
  const [propertyInquiries, setPropertyInquiries] = useState<PropertyInquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { user, profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching buyer-seller dashboard data...');
      
      // Fetch all data in parallel
      const [likesResult, propertiesResult, myInquiriesResult, propertyInquiriesResult] = await Promise.allSettled([
        apiClient.getLikes(),
        user?.id ? apiClient.getProperties({ owner_id: user.id }) : Promise.resolve({ error: true, data: [] }),
        apiClient.getMyInquiries().catch(() => ({ error: true, data: [] })), // Inquiries I made
        apiClient.getMyPropertyInquiries().catch(() => ({ error: true, data: [] })) // Inquiries for my properties
      ]);
      
      // Process saved properties (likes)
      if (likesResult.status === 'fulfilled' && !likesResult.value.error) {
        const likesData = likesResult.value.data?.likes || [];
        console.log('✅ Saved properties loaded:', likesData.length);
        setSavedProperties(likesData);
      } else {
        console.log('❌ Failed to load saved properties');
        setSavedProperties([]);
      }
      
      // Process my properties
      if (propertiesResult.status === 'fulfilled' && !propertiesResult.value.error) {
        const propertiesData = propertiesResult.value.data?.properties || propertiesResult.value.data || [];
        console.log('✅ My properties loaded:', propertiesData.length);
        setMyProperties(propertiesData);
      } else {
        console.log('❌ Failed to load my properties');
        setMyProperties([]);
      }
      
      // Process inquiries I made
      if (myInquiriesResult.status === 'fulfilled' && !myInquiriesResult.value.error) {
        const myInquiriesData = myInquiriesResult.value.data?.inquiries || [];
        console.log('✅ My inquiries loaded:', myInquiriesData.length);
        setMyInquiries(myInquiriesData);
      } else {
        console.log('⚠️ My inquiries not available');
        setMyInquiries([]);
      }

      // Process inquiries for my properties
      if (propertyInquiriesResult.status === 'fulfilled' && !propertyInquiriesResult.value.error) {
        const propertyInquiriesData = propertyInquiriesResult.value.data?.inquiries || [];
        console.log('✅ Property inquiries loaded:', propertyInquiriesData.length);
        setPropertyInquiries(propertyInquiriesData);
      } else {
        console.log('⚠️ Property inquiries not available');
        setPropertyInquiries([]);
      }
      
    } catch (error) {
      console.error('❌ Dashboard fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive"
      });
      setSavedProperties([]);
      setMyProperties([]);
      setMyInquiries([]);
      setPropertyInquiries([]);
    } finally {
      setLoading(false);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast({
      title: "Success",
      description: "Dashboard data refreshed successfully!"
    });
  }

  const removeSavedProperty = async (propertyId: string) => {
    try {
      const { error } = await apiClient.unlikeProperty(propertyId);

      if (error) throw error

      toast({
        title: "Success",
        description: "Property removed from saved list"
      })

      setSavedProperties(prev => Array.isArray(prev) ? prev.filter(prop => prop.property._id !== propertyId) : [])
    } catch (error) {
      console.error('Error removing saved property:', error);
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
      const { error } = await apiClient.deleteProperty(propertyId)

      if (error) throw error

      setMyProperties(prev => Array.isArray(prev) ? prev.filter(p => p._id !== propertyId) : [])
      
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

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <DashboardNav />
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading your property dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <DashboardNav />
      {user?.id && (
        <InquiryNotification 
          userId={user.id} 
          onInquiryUpdate={fetchDashboardData}
        />
      )}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-900/10 dark:to-purple-900/10 opacity-70 blur-3xl pointer-events-none"></div>
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 to-blue-600 dark:from-white dark:to-blue-400 bg-clip-text text-transparent">
                  Welcome back, {profile?.fullName || 'Property Owner'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  Manage your properties, track inquiries, and discover new opportunities
                </p>
          </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <Button 
                  asChild 
                  variant="outline" 
                  className="w-full sm:w-auto bg-white/80 backdrop-blur-sm border-gray-300 hover:bg-white hover:border-blue-400 transition-all duration-200"
                >
              <Link to="/properties">
                <Search className="w-4 h-4 mr-2" />
                    Browse Properties
              </Link>
            </Button>
                <Button 
                  asChild 
                  className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
              <Link to="/post-property">
                <Plus className="w-4 h-4 mr-2" />
                    List New Property
              </Link>
            </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 dark:from-red-900/10 dark:to-pink-900/10 opacity-70 blur-3xl pointer-events-none"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Saved Properties</p>
                  <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                    {savedProperties.length}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Properties you love</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                  <Heart className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 dark:from-blue-900/10 dark:to-cyan-900/10 opacity-70 blur-3xl pointer-events-none"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">My Properties</p>
                  <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                    {myProperties.length}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total listings</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Home className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-900/10 dark:to-emerald-900/10 opacity-70 blur-3xl pointer-events-none"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Listings</p>
                  <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                    {myProperties.filter(p => p.status === 'available').length}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Available now</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20 hover:shadow-xl transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 dark:from-purple-900/10 dark:to-indigo-900/10 opacity-70 blur-3xl pointer-events-none"></div>
            <CardContent className="relative p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">New Inquiries</p>
                  <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 mt-1">
                    {propertyInquiries.filter(inq => inq.status === 'pending').length}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Awaiting response</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
                  <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="saved" className="space-y-6">
          <div className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-blue-500/5 dark:from-gray-900/10 dark:to-blue-900/10 opacity-70 blur-3xl pointer-events-none"></div>
            
            <TabsList className="relative grid w-full grid-cols-5 bg-transparent p-2 h-auto">
              <TabsTrigger 
                value="saved" 
                className="relative px-4 py-3 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 rounded-lg"
              >
                <Heart className="w-4 h-4 mr-2" />
                Saved Properties
              </TabsTrigger>
              <TabsTrigger 
                value="saved-projects" 
                className="relative px-4 py-3 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 rounded-lg"
              >
                <Building2 className="w-4 h-4 mr-2" />
                Saved Projects
              </TabsTrigger>
              <TabsTrigger 
                value="my-properties" 
                className="relative px-4 py-3 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 rounded-lg"
              >
                <Home className="w-4 h-4 mr-2" />
                My Properties
              </TabsTrigger>
              <TabsTrigger 
                value="my-inquiries" 
                className="relative px-4 py-3 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 rounded-lg"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                My Inquiries
              </TabsTrigger>
              <TabsTrigger 
                value="property-inquiries" 
                className="relative px-4 py-3 text-sm font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:text-blue-600 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-blue-400 rounded-lg"
              >
                <Users className="w-4 h-4 mr-2" />
                Property Inquiries
              </TabsTrigger>
          </TabsList>
          </div>

          <TabsContent value="saved" className="space-y-6">
            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-red-50 dark:from-gray-800 dark:to-red-900/20">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 dark:from-red-900/10 dark:to-pink-900/10 opacity-70 blur-3xl pointer-events-none"></div>
              
              <CardHeader className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                      <Heart className="h-6 w-6 text-red-500" />
                      Saved Properties
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                      Properties you've saved for later viewing
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    {savedProperties.length} saved
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="relative p-6">
                {savedProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 w-fit mx-auto mb-4">
                      <Heart className="h-12 w-12 text-red-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No saved properties yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Start browsing properties and save the ones you like! Your saved properties will appear here.
                    </p>
                    <Button asChild className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                      <Link to="/properties">
                        <Search className="w-4 h-4 mr-2" />
                        Browse Properties
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedProperties.map((saved) => {
                      const property = saved.property
                      return (
                        <Card key={saved._id} className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all duration-300">
                          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-blue-500/5 dark:from-gray-900/10 dark:to-blue-900/10 opacity-70 blur-3xl pointer-events-none"></div>
                          
                          <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                            {property.images?.[0]?.url ? (
                              <img 
                                src={property.images[0].url} 
                                alt={property.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Home className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                          </div>
                          
                          <CardContent className="relative p-4">
                            <div className="space-y-3">
                              <h3 className="font-semibold text-lg line-clamp-1 text-gray-800 dark:text-gray-100">{property.title}</h3>
                              
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4 mr-1" />
                                <span className="line-clamp-1">{property.location.address}, {property.location.city}</span>
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center text-lg font-bold text-blue-600 dark:text-blue-400">
                                  <IndianRupee className="w-4 h-4" />
                                  <span>{property.price.toLocaleString()}</span>
                                </div>
                                
                                <Badge variant="outline" className="capitalize">
                                  {property.propertyType}
                                </Badge>
                              </div>
                              
                              <div className="flex gap-2 pt-2">
                                <Button asChild size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                                  <Link to={`/property/${property._id}`}>
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Details
                                  </Link>
                                </Button>
                                
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => removeSavedProperty(property._id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

          <TabsContent value="saved-projects" className="space-y-6">
            <SavedProjects />
          </TabsContent>

          <TabsContent value="my-properties" className="space-y-6">
            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 dark:from-blue-900/10 dark:to-cyan-900/10 opacity-70 blur-3xl pointer-events-none"></div>
              
              <CardHeader className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                      <Home className="h-6 w-6 text-blue-500" />
                      My Properties
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                      Manage your property listings and track their performance
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {myProperties.length} total
                    </Badge>
                    <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Link to="/post-property">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Property
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="relative p-6">
                {myProperties.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 w-fit mx-auto mb-4">
                      <Home className="h-12 w-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No properties listed yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                      Start by listing your first property! You can manage all your listings from this dashboard.
                    </p>
                    <Button asChild className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                      <Link to="/post-property">
                        <Plus className="w-4 h-4 mr-2" />
                        List Your First Property
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myProperties.map((property) => (
                      <Card key={property._id} className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all duration-300">
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-blue-500/5 dark:from-gray-900/10 dark:to-blue-900/10 opacity-70 blur-3xl pointer-events-none"></div>
                        
                        <div className="relative aspect-video bg-gray-200 dark:bg-gray-700">
                          {property.images?.[0]?.url ? (
                            <img 
                              src={property.images[0].url} 
                              alt={property.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Home className="h-12 w-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <Badge className={getStatusColor(property.status)}>
                              {property.status}
                            </Badge>
                          </div>
                        </div>
                        
                        <CardContent className="relative p-4">
                          <div className="space-y-3">
                            <h3 className="font-semibold text-lg line-clamp-1 text-gray-800 dark:text-gray-100">{property.title}</h3>
                            
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="line-clamp-1">{property.location.address}, {property.location.city}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-lg font-bold text-blue-600 dark:text-blue-400">
                                <IndianRupee className="w-4 h-4" />
                                <span>{property.price.toLocaleString()}</span>
                              </div>
                              
                              <div className="text-sm text-gray-500">
                                {property.area} sq ft
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Badge variant="outline" className="capitalize text-xs">
                                {property.propertyType}
                              </Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                For {property.listingType}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button asChild size="sm" variant="outline" className="flex-1">
                                <Link to={`/property/${property._id}`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/edit-property/${property._id}`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>

                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteProperty(property._id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
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

          <TabsContent value="my-inquiries" className="space-y-6">
            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-900/10 dark:to-emerald-900/10 opacity-70 blur-3xl pointer-events-none"></div>
              
              <CardHeader className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                      <MessageSquare className="h-6 w-6 text-green-500" />
                      My Inquiries
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                      Track inquiries you've made to property owners and their responses
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {myInquiries.length} inquiries
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="relative p-6">
                <InquiryList 
                  inquiries={myInquiries} 
                  onRefresh={fetchDashboardData}
                  type="sent"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="property-inquiries" className="space-y-6">
            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-500/5 dark:from-purple-900/10 dark:to-indigo-900/10 opacity-70 blur-3xl pointer-events-none"></div>
              
              <CardHeader className="relative p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                      <Users className="h-6 w-6 text-purple-500" />
                      Property Inquiries
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                      Respond to inquiries from potential buyers about your listed properties
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {propertyInquiries.filter(inq => inq.status === 'pending').length} pending
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="relative p-6">
                <InquiryList 
                  inquiries={propertyInquiries} 
                  onRefresh={fetchDashboardData}
                  type="received"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default BuyerSellerDashboard
