import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  MapPin, 
  Users, 
  Home,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Star,
  Shield,
  Award,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import apiClient from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Society {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  totalFlats: number;
  society_type: string;
  amenities: string[];
  images: { url: string; isPrimary: boolean }[];
  description?: string;
  createdAt: string;
  owner: {
    phone: string;
    fullName?: string;
  };
}

interface SocietyMember {
  id: string;
  userId: string;
  phone: string;
  email?: string;
  fullName: string | null;
  profilePicture?: string | null;
  role: 'society_member' | 'committee_member' | 'treasurer' | 'secretary' | 'society_owner';
  status: 'active' | 'inactive' | 'pending' | 'removed' | 'suspended';
  joinedAt: string;
  isOwner: boolean;
  flatNumber?: string;
  blockNumber?: string;
  ownershipType?: 'owner' | 'tenant' | 'family_member';
}

const SocietyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [society, setSociety] = useState<Society | null>(null);
  const [members, setMembers] = useState<SocietyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) {
      fetchSocietyDetails();
      fetchSocietyMembers();
    }
  }, [id]);

  const fetchSocietyDetails = async () => {
    setLoading(true);
    try {
      console.log('Fetching society details for ID:', id);
      const response = await apiClient.getSociety(id!);
      console.log('Society API response:', response);
      
      if (response.error) {
        console.error('Society API error:', response.error);
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      console.log('Setting society data:', response.data);
      const societyData = response.data.society || response.data;
      
      if (!societyData) {
        console.error('No society data found in response');
        toast({
          title: "Error",
          description: "Society not found or no data available.",
          variant: "destructive",
        });
        return;
      }
      
      setSociety(societyData);
    } catch (error) {
      console.error('Error fetching society:', error);
      toast({
        title: "Error",
        description: "Failed to load society details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSocietyMembers = async () => {
    if (!id) return;
    
    setMembersLoading(true);
    try {
      console.log('Fetching society members for ID:', id);
      const response = await apiClient.getSocietyMembers(id);
      console.log('Society members API response:', response);
      
      if (response.error) {
        console.error('Society members API error:', response.error);
        return;
      }

      const membersData = response.data.members || response.data || [];
      console.log('Setting members data:', membersData);
      setMembers(membersData);
    } catch (error) {
      console.error('Error fetching society members:', error);
    } finally {
      setMembersLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!society) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Society Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The society you're looking for doesn't exist or has been removed.
              </p>
              <Button onClick={() => navigate('/')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const primaryImage = society.images?.find(img => img.isPrimary)?.url || society.images?.[0]?.url;
  const activeMembers = members.filter(m => m.status === 'active');
  const pendingMembers = members.filter(m => m.status === 'pending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)}
              className="bg-white/80 backdrop-blur-sm border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-300 rounded-xl px-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          {/* Hero Section */}
          <div className="relative mb-16">
          {primaryImage && (
              <div className="relative h-[400px] md:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={primaryImage}
                alt={society.name}
                className="w-full h-full object-cover"
              />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-lg">
                      <Shield className="h-3 w-3 mr-1" />
                      {society.society_type}
                    </Badge>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      <Users className="h-3 w-3 mr-1" />
                      {activeMembers.length} Members
                    </Badge>
                  </div>
                  <h1 className="text-3xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {society.name}
                  </h1>
                  <div className="flex items-center gap-2 text-lg md:text-xl mb-4">
                    <MapPin className="h-5 w-5 md:h-6 md:w-6 text-blue-200" />
                    <span className="text-blue-100">{society.city}, {society.state}</span>
                </div>
                  <p className="text-blue-100 text-base md:text-lg max-w-2xl">
                    {society.description || 'A well-maintained society with modern amenities and excellent community living.'}
                  </p>
              </div>
            </div>
          )}
          </div>
          
          {/* Stats Cards - Separate Section */}
          <div className="mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Home className="h-6 w-6 text-indigo-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{society.totalFlats}</p>
                  <p className="text-sm text-gray-600">Total Flats</p>
                </CardContent>
              </Card>
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{activeMembers.length}</p>
                  <p className="text-sm text-gray-600">Active Members</p>
                </CardContent>
              </Card>
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-6 w-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{society.amenities?.length || 0}</p>
                  <p className="text-sm text-gray-600">Amenities</p>
                </CardContent>
              </Card>
              <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <CardContent className="p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800">
                    {new Date(society.createdAt).getFullYear()}
                  </p>
                  <p className="text-sm text-gray-600">Established</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content with Tabs */}
          <div className="pt-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 h-12 md:h-14 bg-white shadow-lg rounded-2xl p-1 md:p-2">
                <TabsTrigger 
                  value="overview"
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-sm"
                >
                  <Building2 className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Overview</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="members"
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-sm"
                >
                  <Users className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Members ({activeMembers.length})</span>
                  <span className="sm:hidden">({activeMembers.length})</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="amenities"
                  className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs md:text-sm"
                >
                  <Star className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Amenities</span>
                  <span className="sm:hidden">Features</span>
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Society Information */}
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
            <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Building2 className="h-6 w-6 text-indigo-600" />
                Society Information
              </CardTitle>
            </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                          <div className="flex items-center gap-3 mb-2">
                            <MapPin className="h-5 w-5 text-indigo-600" />
                            <p className="text-sm font-semibold text-gray-600">Complete Address</p>
                          </div>
                          <p className="font-bold text-gray-800 text-lg">{society.address}</p>
                          <p className="text-sm text-gray-600">{society.city}, {society.state} - {society.pincode}</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                            <div className="flex items-center gap-3 mb-2">
                              <Home className="h-5 w-5 text-green-600" />
                              <p className="text-sm font-semibold text-gray-600">Total Flats</p>
                            </div>
                            <p className="font-bold text-gray-800 text-2xl">{society.totalFlats}</p>
                          </div>
                          <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200">
                            <div className="flex items-center gap-3 mb-2">
                              <Building2 className="h-5 w-5 text-purple-600" />
                              <p className="text-sm font-semibold text-gray-600">Society Type</p>
                </div>
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                              {society.society_type}
                            </Badge>
                </div>
                </div>
              </div>

              {society.description && (
                        <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200">
                          <p className="text-sm font-semibold text-gray-600 mb-2">Description</p>
                          <p className="text-gray-700 leading-relaxed">{society.description}</p>
                </div>
              )}

                      <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200">
                        <div className="flex items-center gap-3 mb-2">
                          <Calendar className="h-5 w-5 text-yellow-600" />
                          <p className="text-sm font-semibold text-gray-600">Registration Date</p>
                  </div>
                        <p className="font-bold text-gray-800">
                          {new Date(society.createdAt).toLocaleDateString('en-IN', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

                  {/* Contact Information */}
                  <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Phone className="h-6 w-6 text-green-600" />
                        Contact Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                        <div className="flex items-center gap-3 mb-3">
                          <Award className="h-5 w-5 text-green-600" />
                          <p className="text-sm font-semibold text-gray-600">Society Owner</p>
                        </div>
                        <p className="font-bold text-gray-800 text-lg">{society.owner?.fullName || 'Not specified'}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                          <Phone className="h-4 w-4" />
                          {society.owner?.phone}
                        </p>
                      </div>
                      
                      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                        <div className="flex items-center gap-3 mb-3">
                          <Mail className="h-5 w-5 text-blue-600" />
                          <p className="text-sm font-semibold text-gray-600">Contact Methods</p>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-800">Society Management</p>
                          <p className="text-sm text-gray-600">Contact the owner for inquiries and support</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Members Tab */}
              <TabsContent value="members" className="space-y-6">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Users className="h-6 w-6 text-green-600" />
                      Society Members ({activeMembers.length} Active)
                    </CardTitle>
              </CardHeader>
              <CardContent>
                    {membersLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                      </div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Members Found</h3>
                        <p className="text-gray-500">No members have been added to this society yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Member Statistics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{members.length}</p>
                            <p className="text-sm text-gray-600">Total Members</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{activeMembers.length}</p>
                            <p className="text-sm text-gray-600">Active</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{pendingMembers.length}</p>
                            <p className="text-sm text-gray-600">Pending</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {members.filter(m => m.role === 'society_owner' || m.role === 'secretary' || m.role === 'treasurer').length}
                            </p>
                            <p className="text-sm text-gray-600">Committee</p>
                          </div>
                        </div>
                      <div className="space-y-4">
                        {/* Active Members */}
                        {activeMembers.length > 0 && (
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              Active Members ({activeMembers.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {activeMembers.map((member) => (
                                <Card key={member.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-bold text-lg">
                                        {member.fullName?.charAt(0) || member.phone.charAt(0)}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-semibold text-gray-800">
                                          {member.fullName || 'Member'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {member.flatNumber ? `Flat ${member.flatNumber}` : 'No flat assigned'}
                                        </p>
                                        {member.blockNumber && (
                                          <p className="text-xs text-gray-500">{member.blockNumber}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1">
                                          <Badge className={`text-xs ${
                                            member.role === 'society_owner' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                            member.role === 'secretary' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                                            member.role === 'treasurer' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                                            member.role === 'committee_member' ? 'bg-gradient-to-r from-indigo-500 to-purple-500' :
                                            'bg-gradient-to-r from-green-500 to-emerald-500'
                                          } text-white border-0`}>
                                            {member.role === 'society_owner' ? 'Owner' :
                                             member.role === 'committee_member' ? 'Committee' :
                                             member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                          </Badge>
                                          {member.ownershipType && (
                                            <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 text-xs">
                                              {member.ownershipType.charAt(0).toUpperCase() + member.ownershipType.slice(1)}
                                            </Badge>
                                          )}
                                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pending Members */}
                        {pendingMembers.length > 0 && (
                          <div className="mt-8">
                            <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                              <Clock className="h-5 w-5 text-yellow-600" />
                              Pending Members ({pendingMembers.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {pendingMembers.map((member) => (
                                <Card key={member.id} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-yellow-50 to-orange-50">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                                        {member.fullName?.charAt(0) || member.phone.charAt(0)}
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-semibold text-gray-800">
                                          {member.fullName || 'Member'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                          {member.flatNumber ? `Flat ${member.flatNumber}` : 'No flat assigned'}
                                        </p>
                                        {member.blockNumber && (
                                          <p className="text-xs text-gray-500">{member.blockNumber}</p>
                                        )}
                                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 text-xs mt-1">
                                          <Clock className="h-3 w-3 mr-1" />
                                          Pending
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Amenities Tab */}
              <TabsContent value="amenities" className="space-y-6">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50">
              <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Star className="h-6 w-6 text-yellow-600" />
                      Society Amenities ({society.amenities?.length || 0})
                    </CardTitle>
              </CardHeader>
              <CardContent>
                    {society.amenities && society.amenities.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {society.amenities.map((amenity, index) => (
                          <div key={index} className="p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 hover:shadow-md transition-shadow duration-300">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 flex items-center justify-center">
                                <Star className="h-5 w-5 text-white" />
                              </div>
                              <p className="font-semibold text-gray-800">{amenity}</p>
                            </div>
                    </div>
                  ))}
                </div>
                    ) : (
                      <div className="text-center py-12">
                        <Star className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Amenities Listed</h3>
                        <p className="text-gray-500">Amenities information will be updated soon.</p>
                      </div>
                    )}
              </CardContent>
            </Card>
              </TabsContent>

            </Tabs>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SocietyDetails;

