import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/integrations/supabase/client"
import { useProfile } from "@/hooks/useProfile"
import { useToast } from "@/hooks/use-toast"
import DashboardNav from "@/components/DashboardNav"
import { 
  Handshake, 
  Users, 
  DollarSign, 
  TrendingUp,
  Building,
  MessageSquare,
  UserPlus,
  Star,
  MapPin,
  IndianRupee,
  Eye,
  Edit
} from "lucide-react"

interface BrokerProfile {
  id: string
  specialization: string[]
  office_address: string | null
  contact_info: Record<string, any>
  commission_rate: number
  years_experience: number | null
  license_number: string | null
  status: string
}

interface BrokerListing {
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

const BrokerDashboard = () => {
  const [brokerProfile, setBrokerProfile] = useState<BrokerProfile | null>(null)
  const [listings, setListings] = useState<BrokerListing[]>([])
  const [stats, setStats] = useState({
    totalListings: 0,
    activeClients: 0,
    totalCommission: 0,
    pendingInquiries: 0
  })
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

      // Fetch broker profile
      const { data: brokerData, error: brokerError } = await supabase
        .from('brokers')
        .select('*')
        .eq('user_id', profile.id)
        .single()

      if (brokerError && brokerError.code !== 'PGRST116') {
        throw brokerError
      }

      setBrokerProfile(brokerData as BrokerProfile)

      // Fetch statistics (if broker profile exists)
      if (brokerData) {
        // Fetch broker's property listings
        const { data: listingsData, error: listingsError } = await supabase
          .from('properties')
          .select('id, status, price')
          .eq('broker_id', profile.id)

        if (listingsError) throw listingsError

        // Fetch inquiries on broker's properties
        const { data: inquiriesData, error: inquiriesError } = await supabase
          .from('inquiries')
          .select('id, status')
          .in('property_id', (listingsData || []).map(l => l.id))

        if (inquiriesError) throw inquiriesError

        // Calculate total commission (simplified - 2% of total property values)
        const totalCommission = (listingsData || [])
          .filter(l => l.status === 'sold')
          .reduce((sum, listing) => sum + ((listing.price || 0) * 0.02), 0)

        // Fetch unique clients (buyers who made inquiries)
        const { data: clientsData, error: clientsError } = await supabase
          .from('inquiries')
          .select('user_id')
          .in('property_id', (listingsData || []).map(l => l.id))

        if (clientsError) throw clientsError

        const uniqueClients = new Set((clientsData || []).map(c => c.user_id)).size

        setStats({
          totalListings: listingsData?.length || 0,
          activeClients: uniqueClients,
          totalCommission: Math.round(totalCommission),
          pendingInquiries: (inquiriesData || []).filter(i => i.status === 'pending').length
        })

        // Fetch full listing details for display
        const { data: fullListingsData, error: fullListingsError } = await supabase
          .from('properties')
          .select('*')
          .eq('broker_id', profile.id)
          .order('created_at', { ascending: false })

        if (fullListingsError) throw fullListingsError
        setListings(fullListingsData || [])
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'sold': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const createBrokerProfile = async () => {
    if (!profile) return

    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('brokers')
        .insert({
          user_id: profile.id,
          specialization: ['Residential Properties'],
          commission_rate: 2.0,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      setBrokerProfile(data as BrokerProfile)
      
      // Refresh the dashboard data to show the new profile
      await fetchDashboardData()
      
      toast({
        title: "Success",
        description: "Broker profile created successfully! You can now access all broker features."
      })
    } catch (error) {
      console.error('Error creating broker profile:', error)
      toast({
        title: "Error",
        description: "Failed to create broker profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If no broker profile exists, show setup screen
  if (!brokerProfile) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center py-12">
            <CardHeader>
              <Handshake className="h-16 w-16 text-primary mx-auto mb-4" />
              <CardTitle className="text-3xl">Welcome to Your Broker Dashboard</CardTitle>
              <CardDescription className="text-lg mt-2">
                Complete your broker profile to start managing listings and clients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <Card>
                  <CardContent className="p-6">
                    <Building className="h-8 w-8 text-blue-500 mb-3" />
                    <h3 className="font-semibold mb-2">Manage Listings</h3>
                    <p className="text-sm text-muted-foreground">
                      List properties for your clients and manage multiple listings efficiently
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <Users className="h-8 w-8 text-green-500 mb-3" />
                    <h3 className="font-semibold mb-2">Client Management</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep track of buyers, sellers, and their property requirements
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <DollarSign className="h-8 w-8 text-purple-500 mb-3" />
                    <h3 className="font-semibold mb-2">Commission Tracking</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor your earnings and commission payments automatically
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex gap-4 justify-center">
                <Button onClick={createBrokerProfile} size="lg" disabled={loading}>
                  <UserPlus className="w-5 h-5 mr-2" />
                  {loading ? "Creating Profile..." : "Set Up Broker Profile"}
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
            <h1 className="text-3xl font-bold">Broker Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Welcome back, {profile?.full_name} 
              {brokerProfile.status === 'pending' && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-800">
                  Pending Approval
                </Badge>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <Link to="/post-property">
                <Building className="w-4 h-4 mr-2" />
                Add Listing
              </Link>
            </Button>
          </div>
        </div>

        {/* Approval Notice */}
        {brokerProfile.status === 'pending' && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-yellow-600" />
                <div>
                  <h4 className="font-medium text-yellow-800">Profile Under Review</h4>
                  <p className="text-sm text-yellow-700">
                    Your broker profile is being reviewed by our team. Full features will be available once approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Listings</p>
                  <div className="text-2xl font-bold">{stats.totalListings}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Active Clients</p>
                  <div className="text-2xl font-bold">{stats.activeClients}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                  <div className="text-2xl font-bold">₹{stats.totalCommission.toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">New Inquiries</p>
                  <div className="text-2xl font-bold">{stats.pendingInquiries}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="listings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="listings">My Listings</TabsTrigger>
            <TabsTrigger value="clients">Clients</TabsTrigger>
            <TabsTrigger value="leads">Leads</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="profile">Broker Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="listings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Property Listings</CardTitle>
                <CardDescription>Manage properties you're representing</CardDescription>
              </CardHeader>
              <CardContent>
                {listings.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                    <p className="text-muted-foreground mb-4">Start by adding properties for your clients</p>
                    <Button asChild>
                      <Link to="/post-property">Add First Listing</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {listings.map((listing) => (
                      <Card key={listing.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          {listing.images?.[0] ? (
                            <img 
                              src={listing.images[0]} 
                              alt={listing.title}
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
                            <h3 className="font-semibold text-lg line-clamp-1">{listing.title}</h3>
                            
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="line-clamp-1">{listing.location}, {listing.city}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-lg font-bold text-primary">
                                <IndianRupee className="w-4 h-4" />
                                <span>{listing.price.toLocaleString()}</span>
                              </div>
                              
                              <Badge className={getStatusColor(listing.status)}>
                                {listing.status}
                              </Badge>
                            </div>

                            <div className="flex gap-1">
                              <Badge variant="outline" className="capitalize text-xs">
                                {listing.property_type}
                              </Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                For {listing.listing_type}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button asChild size="sm" variant="outline" className="flex-1">
                                <Link to={`/property/${listing.id}`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  <span className="hidden xs:inline">View</span>
                                </Link>
                              </Button>
                              
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/edit-property/${listing.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
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

          <TabsContent value="clients" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Client Management</CardTitle>
                <CardDescription>Manage your buyer and seller clients</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No clients yet</h3>
                  <p className="text-muted-foreground">Client management features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Lead Management</CardTitle>
                <CardDescription>Track and convert your property leads</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No leads yet</h3>
                  <p className="text-muted-foreground">Lead tracking features coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Commission Tracking</CardTitle>
                <CardDescription>Monitor your earnings and payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No commission data</h3>
                  <p className="text-muted-foreground">Commission tracking coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Broker Profile</CardTitle>
                <CardDescription>Manage your professional information and specializations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {brokerProfile.specialization.map((spec, index) => (
                        <Badge key={index} variant="outline">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Commission Rate</h4>
                    <p className="text-lg font-bold text-primary">{brokerProfile.commission_rate}%</p>
                  </div>
                  
                  {brokerProfile.years_experience && (
                    <div>
                      <h4 className="font-medium mb-2">Experience</h4>
                      <p>{brokerProfile.years_experience} years</p>
                    </div>
                  )}
                  
                  {brokerProfile.license_number && (
                    <div>
                      <h4 className="font-medium mb-2">License Number</h4>
                      <p className="font-mono">{brokerProfile.license_number}</p>
                    </div>
                  )}
                </div>
                
                <Button variant="outline" disabled>
                  Update Profile (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default BrokerDashboard