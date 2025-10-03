import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  FileText, 
  Vote, 
  Bell,
  MessageSquare,
  Download,
  Eye,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Star,
  Award,
  Activity,
  BarChart3,
  Home,
  Shield,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Sparkles,
  TrendingDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import apiClient from '@/lib/api';
import DashboardNav from '@/components/DashboardNav';
import RedevelopmentModule from '@/components/RedevelopmentModule';
import { MemberInvitationsPanel } from '@/components/MemberInvitationsPanel';
import MemberQueryForm from '@/components/MemberQueryForm';
import MemberQueriesList from '@/components/MemberQueriesList';

interface Society {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  totalFlats: number;
  society_type: string;
  amenities: string[];
  isMember?: boolean;
  isOwner?: boolean;
}

interface RedevelopmentProject {
  _id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  createdAt: string;
  votingDeadline?: string;
  estimatedBudget?: number;
  corpusAmount?: number;
  rentAmount?: number;
  votingResults?: {
    totalMembers: number;
    votesCast: number;
    yesVotes: number;
    noVotes: number;
    approvalPercentage: number;
    isApproved: boolean;
  };
  updates: Array<{
    _id: string;
    title: string;
    description: string;
    postedBy: string;
    postedAt: string;
    isImportant: boolean;
  }>;
  queries: Array<{
    _id: string;
    title: string;
    description: string;
    status: string;
    response?: string;
  }>;
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

interface Stats {
  activeProjects: number;
  pendingVotes: number;
  totalUpdates: number;
  openQueries: number;
  approvalRate: number;
  participationRate: number;
}

const SocietyMemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [projects, setProjects] = useState<RedevelopmentProject[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<Stats>({
    activeProjects: 0,
    pendingVotes: 0,
    totalUpdates: 0,
    openQueries: 0,
    approvalRate: 0,
    participationRate: 0
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    fetchSocieties();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (selectedSociety) {
      fetchProjects();
    }
  }, [selectedSociety]);

  useEffect(() => {
    calculateStats();
  }, [projects]);

  const calculateStats = () => {
    const activeProjects = projects.filter(p => 
      p.status !== 'completed' && p.status !== 'cancelled'
    ).length;

    const pendingVotes = projects.filter(p => p.status === 'voting').length;

    const totalUpdates = projects.reduce((sum, p) => sum + (p.updates?.length || 0), 0);

    const openQueries = projects.reduce((sum, p) => 
      sum + (p.queries?.filter(q => q.status === 'open').length || 0), 0
    );

    const approvedProjects = projects.filter(p => 
      p.votingResults?.isApproved
    ).length;
    const approvalRate = projects.length > 0 
      ? Math.round((approvedProjects / projects.length) * 100) 
      : 0;

    const projectsWithVotes = projects.filter(p => 
      p.votingResults && p.votingResults.votesCast > 0
    ).length;
    const participationRate = projects.length > 0
      ? Math.round((projectsWithVotes / projects.length) * 100)
      : 0;

    setStats({
      activeProjects,
      pendingVotes,
      totalUpdates,
      openQueries,
      approvalRate,
      participationRate
    });
  };

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      console.log('Fetching societies for user...');
      const response = await apiClient.getMySocieties();
      console.log('Societies API response:', response);
      
      if (response.error) {
        console.error('Error fetching societies:', response.error);
        toast({
          title: "Error",
          description: "Failed to fetch societies",
          variant: "destructive",
        });
        return;
      }

      const societiesData = response.data.societies || [];
      console.log('Setting societies:', societiesData);
      setSocieties(societiesData);
      
      if (societiesData.length > 0) {
        console.log('Setting selected society:', societiesData[0]);
        setSelectedSociety(societiesData[0]);
      }
    } catch (error) {
      console.error('Error fetching societies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch societies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    if (!selectedSociety) return;

    try {
      const response = await apiClient.getRedevelopmentProjects(`?society_id=${selectedSociety._id}`);
      
      if (response.error) {
        console.error('Error fetching projects:', response.error);
        return;
      }

      setProjects(response.data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await apiClient.get('/notifications');
      
      if (response.error) {
        console.error('Error fetching notifications:', response.error);
        return;
      }

      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await apiClient.post(`/notifications/${notificationId}/read`, {});
      fetchNotifications();
      toast({
        title: "Success",
        description: "Notification marked as read",
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      planning: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
      tender_open: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
      proposals_received: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
      voting: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
      developer_selected: 'bg-gradient-to-r from-green-500 to-green-600 text-white',
      construction: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
      completed: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
      cancelled: 'bg-gradient-to-r from-red-500 to-red-600 text-white',
    };
    return statusColors[status] || 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-50 border-red-200',
      high: 'bg-orange-50 border-orange-200',
      medium: 'bg-yellow-50 border-yellow-200',
      low: 'bg-blue-50 border-blue-200'
    };
    return colors[priority] || 'bg-gray-50 border-gray-200';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl w-1/3 animate-pulse"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="h-20 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (societies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Society Member Dashboard
              </h1>
              <p className="text-gray-600 mt-2 text-lg">
                Welcome, {user?.name || user?.phone}
              </p>
            </div>

            <Tabs defaultValue="invitations" className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12 bg-white shadow-md rounded-xl">
                <TabsTrigger value="invitations" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  <Mail className="h-4 w-4 mr-2" />
                  Invitations
                </TabsTrigger>
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white">
                  <Home className="h-4 w-4 mr-2" />
                  Overview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="invitations">
                <MemberInvitationsPanel />
              </TabsContent>

              <TabsContent value="overview">
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="text-center py-16">
                    <div className="inline-flex p-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mb-6">
                      <Building2 className="h-16 w-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      No Society Memberships
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto text-lg">
                      You are not a member of any society yet. Check your invitations to join a society and unlock amazing features!
                    </p>
                    <Button 
                      onClick={() => setActiveTab('invitations')}
                      className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 rounded-xl"
                      size="lg"
                    >
                      <Mail className="h-5 w-5 mr-2" />
                      Check Invitations
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <DashboardNav />
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-6 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          {/* Modern Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent flex items-center gap-2 sm:gap-3">
                <Sparkles className="h-6 w-6 sm:h-8 sm:w-8 text-indigo-600" />
                <span className="hidden sm:inline">Member Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-base sm:text-lg">
                Welcome back, <span className="font-semibold text-indigo-600">{user?.name || user?.phone}</span>
              </p>
            </div>
            <div className="flex items-center gap-3">
              {societies.length > 1 && (
                <select
                  value={selectedSociety?._id || ''}
                  onChange={(e) => {
                    const society = societies.find(s => s._id === e.target.value);
                    setSelectedSociety(society || null);
                  }}
                  className="px-4 py-3 border-2 border-indigo-200 rounded-xl bg-white shadow-md hover:border-indigo-400 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  {societies.map((society) => (
                    <option key={society._id} value={society._id}>
                      {society.name}
                    </option>
                  ))}
                </select>
              )}
              <div 
                onClick={() => {
                  console.log('View Society button clicked');
                  console.log('Selected society:', selectedSociety);
                  
                  if (selectedSociety?._id) {
                    console.log('Navigating to society:', selectedSociety._id);
                    navigate(`/societies/${selectedSociety._id}`);
                  } else {
                    console.error('No selected society found');
                    toast({
                      title: "Error",
                      description: "No society selected. Please select a society first.",
                      variant: "destructive",
                    });
                  }
                }}
                className={`
                  inline-flex items-center justify-center px-6 py-3 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 min-w-[200px] h-12
                  ${!selectedSociety?._id || loading 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white cursor-pointer'
                  }
                `}
              >
                <Eye className="h-5 w-5 mr-2" />
                {loading ? 'Loading...' : selectedSociety?._id ? 'View Society' : 'Select Society First'}
                <ExternalLink className="h-4 w-4 ml-2" />
              </div>
            </div>
          </div>

          {/* Enhanced Society Info Card */}
          {selectedSociety && (
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50 overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-3xl"></div>
              <CardHeader className="relative pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                      <Building2 className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {selectedSociety.name}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        {selectedSociety.isMember && !selectedSociety.isOwner && (
                          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                            <Shield className="h-3 w-3 mr-1" />
                            Active Member
                          </Badge>
                        )}
                        {selectedSociety.isOwner && (
                          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0 shadow-md">
                            <Award className="h-3 w-3 mr-1" />
                            Society Owner
                          </Badge>
                        )}
                        {selectedSociety.society_type && (
                          <Badge variant="outline" className="border-indigo-300 text-indigo-700">
                            {selectedSociety.society_type}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                      <p className="text-sm font-semibold text-gray-600">Address</p>
                    </div>
                    <p className="font-bold text-gray-800 text-lg">{selectedSociety.address}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <p className="text-sm font-semibold text-gray-600">Location</p>
                    </div>
                    <p className="font-bold text-gray-800 text-lg">{selectedSociety.city}, {selectedSociety.state}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Home className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-semibold text-gray-600">Total Flats</p>
                    </div>
                    <p className="font-bold text-gray-800 text-3xl">{selectedSociety.totalFlats}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-12 sm:h-14 bg-white shadow-lg rounded-xl sm:rounded-2xl p-1 sm:p-2">
              <TabsTrigger 
                value="overview"
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm"
              >
                <Activity className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="invitations"
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm"
              >
                <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Invitations</span>
                <span className="sm:hidden">Invites</span>
              </TabsTrigger>
              <TabsTrigger 
                value="redevelopment"
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm"
              >
                <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Projects</span>
                <span className="sm:hidden">Projects</span>
              </TabsTrigger>
              <TabsTrigger 
                value="notifications"
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 relative text-xs sm:text-sm"
              >
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Alerts</span>
                <span className="sm:hidden">Alerts</span>
                {notifications.filter(n => !n.isRead).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold shadow-lg animate-pulse">
                    {notifications.filter(n => !n.isRead).length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="queries"
                className="rounded-lg sm:rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 text-xs sm:text-sm"
              >
                <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Queries</span>
                <span className="sm:hidden">Queries</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 sm:space-y-8">
              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative group hover:shadow-2xl transition-shadow duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm font-semibold mb-2">Active Projects</p>
                        <p className="text-5xl font-bold mb-1">{stats.activeProjects}</p>
                        <p className="text-blue-200 text-sm">Currently running</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                        <Building2 className="h-10 w-10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-red-600 text-white overflow-hidden relative group hover:shadow-2xl transition-shadow duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm font-semibold mb-2">Pending Votes</p>
                        <p className="text-5xl font-bold mb-1">{stats.pendingVotes}</p>
                        <p className="text-orange-200 text-sm">Action required</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                        <Vote className="h-10 w-10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-pink-600 text-white overflow-hidden relative group hover:shadow-2xl transition-shadow duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm font-semibold mb-2">Recent Updates</p>
                        <p className="text-5xl font-bold mb-1">{stats.totalUpdates}</p>
                        <p className="text-purple-200 text-sm">New announcements</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                        <Bell className="h-10 w-10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white overflow-hidden relative group hover:shadow-2xl transition-shadow duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm font-semibold mb-2">Approval Rate</p>
                        <p className="text-5xl font-bold mb-1">{stats.approvalRate}%</p>
                        <p className="text-green-200 text-sm">Project success</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                        <TrendingUp className="h-10 w-10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-500 to-orange-600 text-white overflow-hidden relative group hover:shadow-2xl transition-shadow duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-100 text-sm font-semibold mb-2">Open Queries</p>
                        <p className="text-5xl font-bold mb-1">{stats.openQueries}</p>
                        <p className="text-yellow-200 text-sm">Need attention</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                        <MessageSquare className="h-10 w-10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white overflow-hidden relative group hover:shadow-2xl transition-shadow duration-300">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <CardContent className="p-6 relative">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-100 text-sm font-semibold mb-2">Participation</p>
                        <p className="text-5xl font-bold mb-1">{stats.participationRate}%</p>
                        <p className="text-indigo-200 text-sm">Member engagement</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm">
                        <Users className="h-10 w-10" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </TabsContent>

            <TabsContent value="invitations">
              <MemberInvitationsPanel />
            </TabsContent>

            <TabsContent value="redevelopment">
              <RedevelopmentModule 
                societyId={selectedSociety?._id} 
                isOwner={false}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              {notifications.length === 0 ? (
                <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="text-center py-16">
                    <div className="inline-flex p-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 mb-6">
                      <Bell className="h-16 w-16 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      No Notifications
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto text-lg">
                      You're all caught up! No new notifications at the moment.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card 
                      key={notification._id} 
                      className={`border-2 ${!notification.isRead ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50' : 'border-gray-200'} hover:shadow-lg transition-all duration-300 overflow-hidden group`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-xl ${!notification.isRead ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-gray-200'} group-hover:scale-110 transition-transform duration-300`}>
                            {notification.type.includes('vote') || notification.type.includes('voting') ? (
                              <Vote className={`h-6 w-6 ${!notification.isRead ? 'text-white' : 'text-gray-600'}`} />
                            ) : notification.type.includes('update') || notification.type.includes('project') ? (
                              <TrendingUp className={`h-6 w-6 ${!notification.isRead ? 'text-white' : 'text-gray-600'}`} />
                            ) : notification.type.includes('query') || notification.type.includes('message') ? (
                              <MessageSquare className={`h-6 w-6 ${!notification.isRead ? 'text-white' : 'text-gray-600'}`} />
                            ) : notification.type.includes('invitation') ? (
                              <Mail className={`h-6 w-6 ${!notification.isRead ? 'text-white' : 'text-gray-600'}`} />
                            ) : (
                              <Bell className={`h-6 w-6 ${!notification.isRead ? 'text-white' : 'text-gray-600'}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-bold text-lg text-gray-800">{notification.title}</h4>
                                  {!notification.isRead && (
                                    <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 shadow-md animate-pulse">
                                      New
                                    </Badge>
                                  )}
                                  {notification.priority === 'urgent' && (
                                    <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0 shadow-md">
                                      <AlertCircle className="h-3 w-3 mr-1" />
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-gray-600 mb-3">
                                  {notification.message}
                                </p>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {formatDate(notification.createdAt)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {!notification.isRead && (
                            <Button
                              onClick={() => markNotificationAsRead(notification._id)}
                              variant="outline"
                              size="sm"
                              className="border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 rounded-xl"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark Read
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="queries" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Submit Query Form */}
                <MemberQueryForm 
                  societyId={selectedSociety?._id || ''} 
                  onQuerySubmitted={() => {
                    // Refresh queries list
                    setRefreshTrigger(prev => prev + 1);
                  }}
                />
                
                {/* My Queries List */}
                <MemberQueriesList 
                  societyId={selectedSociety?._id} 
                  refreshTrigger={refreshTrigger}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SocietyMemberDashboard;