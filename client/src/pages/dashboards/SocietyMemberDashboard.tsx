import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import DashboardNav from '@/components/DashboardNav';
import RedevelopmentModule from '@/components/RedevelopmentModule';

interface Society {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  totalFlats: number;
  society_type: string;
  amenities: string[];
}

interface RedevelopmentProject {
  _id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
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
  createdAt: string;
}

const SocietyMemberDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [societies, setSocieties] = useState<Society[]>([]);
  const [selectedSociety, setSelectedSociety] = useState<Society | null>(null);
  const [projects, setProjects] = useState<RedevelopmentProject[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchSocieties();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (selectedSociety) {
      fetchProjects();
    }
  }, [selectedSociety]);

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getMySocieties();
      
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to fetch societies",
          variant: "destructive",
        });
        return;
      }

      setSocieties(response.data.societies || []);
      if (response.data.societies && response.data.societies.length > 0) {
        setSelectedSociety(response.data.societies[0]);
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

  const getStatusColor = (status: string) => {
    const statusColors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-800',
      tender_open: 'bg-yellow-100 text-yellow-800',
      proposals_received: 'bg-purple-100 text-purple-800',
      voting: 'bg-orange-100 text-orange-800',
      developer_selected: 'bg-green-100 text-green-800',
      construction: 'bg-indigo-100 text-indigo-800',
      completed: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
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
      <div className="min-h-screen bg-gray-50">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Society Memberships</h3>
              <p className="text-muted-foreground">
                You are not a member of any society yet.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Society Member Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {user?.name || user?.phone}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {societies.length > 1 && (
                <select
                  value={selectedSociety?._id || ''}
                  onChange={(e) => {
                    const society = societies.find(s => s._id === e.target.value);
                    setSelectedSociety(society || null);
                  }}
                  className="px-3 py-2 border rounded-md"
                >
                  {societies.map((society) => (
                    <option key={society._id} value={society._id}>
                      {society.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Society Info */}
          {selectedSociety && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {selectedSociety.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedSociety.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{selectedSociety.city}, {selectedSociety.state}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Flats</p>
                    <p className="font-medium">{selectedSociety.totalFlats}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="redevelopment">Redevelopment</TabsTrigger>
              <TabsTrigger value="notifications">
                Notifications ({notifications.filter(n => !n.isRead).length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                        <p className="text-2xl font-bold">{projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled').length}</p>
                      </div>
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Pending Votes</p>
                        <p className="text-2xl font-bold text-orange-600">
                          {projects.filter(p => p.status === 'voting').length}
                        </p>
                      </div>
                      <Vote className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Unread Updates</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {projects.reduce((sum, p) => sum + p.updates.length, 0)}
                        </p>
                      </div>
                      <Bell className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Open Queries</p>
                        <p className="text-2xl font-bold text-red-600">
                          {projects.reduce((sum, p) => sum + p.queries.filter(q => q.status === 'open').length, 0)}
                        </p>
                      </div>
                      <MessageSquare className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Projects */}
              {projects.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Redevelopment Projects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projects.slice(0, 3).map((project) => (
                        <div key={project._id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h4 className="font-semibold">{project.title}</h4>
                                <Badge className={getStatusColor(project.status)}>
                                  {project.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-sm line-clamp-2">
                                {project.description}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-4 w-4" />
                                  <span>{project.progress}% Complete</span>
                                </div>
                                {project.votingResults && (
                                  <div className="flex items-center gap-1">
                                    <Vote className="h-4 w-4" />
                                    <span>{project.votingResults.approvalPercentage}% Approval</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setActiveTab('redevelopment')}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Redevelopment Projects</h3>
                    <p className="text-muted-foreground">
                      No redevelopment projects are currently active in your society.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="redevelopment">
              <RedevelopmentModule 
                societyId={selectedSociety?._id} 
                isOwner={false}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              {notifications.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                    <p className="text-muted-foreground">
                      You don't have any notifications yet.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification) => (
                    <Card key={notification._id} className={!notification.isRead ? 'border-primary' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${notification.isRead ? 'bg-gray-100' : 'bg-primary/10'}`}>
                            {notification.type === 'vote' ? (
                              <Vote className="h-4 w-4 text-primary" />
                            ) : notification.type === 'update' ? (
                              <TrendingUp className="h-4 w-4 text-blue-600" />
                            ) : notification.type === 'query' ? (
                              <MessageSquare className="h-4 w-4 text-orange-600" />
                            ) : (
                              <Bell className="h-4 w-4 text-gray-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-semibold">{notification.title}</h4>
                                <p className="text-muted-foreground text-sm mt-1">
                                  {notification.message}
                                </p>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {formatDate(notification.createdAt)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SocietyMemberDashboard;