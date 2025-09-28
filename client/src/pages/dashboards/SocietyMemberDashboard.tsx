import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardNav from "@/components/DashboardNav";
import { FlatDetailsForm } from "@/components/FlatDetailsForm";
import { VotingSystem } from "@/components/VotingSystem";
import { Building2, Home, FileText, Users, MessageSquare, Vote, Settings } from "lucide-react";
import { toast } from "sonner";

interface Society {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  year_built: number;
  total_flats: number;
  condition_status: string;
}

interface SocietyMember {
  id: string;
  society_id: string;
  flat_number: string;
  status: string;
  joined_at: string;
  societies?: Society;
}

interface RedevelopmentRequirement {
  id: string;
  requirement_type: string;
  description: string;
  timeline_expectation: string;
  status: string;
  created_at: string;
}

const SocietyMemberDashboard = () => {
  const { user } = useAuth();
  const [membership, setMembership] = useState<SocietyMember | null>(null);
  const [requirements, setRequirements] = useState<RedevelopmentRequirement[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchMembershipData();
    }
  }, [user]);

  const fetchMembershipData = async () => {
    try {
      console.log('Fetching membership data for user:', user?.id)
      
      // First fetch member's society membership without join
      const membershipResult = await apiClient.getProfile();
      const { data: membershipData, error: membershipError } = membershipResult;

      console.log('Membership data (no join):', { membershipData, membershipError })

      if (membershipError) {
        if (typeof membershipError === 'object' && membershipError && 'code' in membershipError && (membershipError as any).code !== 'PGRST116') {
          console.error('Error fetching membership:', membershipError);
          return;
        }
      }

      if (membershipData) {
        console.log('Society ID from membership:', membershipData.society_id)
        
        // Now fetch society data separately
        const societyResult = await apiClient.getSociety(membershipData.society_id);
        const { data: societyData, error: societyError } = societyResult;
          
        console.log('Society data:', { societyData, societyError })
        
        if (societyData) {
          // Combine the data
          const combinedData = {
            ...membershipData,
            societies: societyData
          };
          console.log('Combined membership data:', combinedData)
          setMembership(combinedData);
        } else {
          console.error('No society found for ID:', membershipData.society_id)
          setMembership(membershipData);
        }

        // Fetch society requirements
        const requirementsResult = await apiClient.getSocieties({ society_id: membershipData.society_id });
        const { data: requirementsData, error: requirementsError } = requirementsResult;

        if (requirementsError) {
          console.error('Error fetching requirements:', requirementsError);
        } else {
          setRequirements(requirementsData || []);
        }

        // Fetch proposals for voting
        const result = await apiClient.getDevelopers();
        const proposalsData = result.data || [];
        const proposalsError = result.error;
          

        if (proposalsError) {
          console.error('Error fetching proposals:', proposalsError);
        } else {
          setProposals(proposalsData || []);
        }
      } else {
        console.log('No membership data found')
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-4">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Member Dashboard</h1>
            <p className="text-muted-foreground">View your society information and requirements</p>
          </div>
        </div>

        {!membership ? (
          <Card>
            <CardHeader className="text-center">
              <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>No Society Membership Found</CardTitle>
              <CardDescription>
                You are not currently a member of any society. Contact your society owner/secretary to get added.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact Support
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Your Flat</CardTitle>
                  <Home className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">#{membership.flat_number}</div>
                  <p className="text-xs text-muted-foreground">
                    Status: <Badge variant="secondary" className="text-xs">{membership.status}</Badge>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Society Flats</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{membership.societies?.total_flats || 'N/A'}</div>
                  <p className="text-xs text-muted-foreground">Total units</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Proposals</CardTitle>
                  <Vote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{proposals.length}</div>
                  <p className="text-xs text-muted-foreground">Awaiting votes</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="society" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="society">Society Info</TabsTrigger>
                <TabsTrigger value="requirements">Requirements ({requirements.length})</TabsTrigger>
                <TabsTrigger value="proposals">Voting ({proposals.length})</TabsTrigger>
                <TabsTrigger value="flat">My Flat</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>

              <TabsContent value="society">
                <Card>
                  <CardHeader>
                    <CardTitle>{membership.societies?.name || 'Unknown Society'}</CardTitle>
                    <CardDescription>
                      {membership.societies?.address || 'Address not available'}, {membership.societies?.city || ''}, {membership.societies?.state || ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="font-medium mb-3">Society Details</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Year Built</p>
                            <p className="font-medium">{membership.societies?.year_built || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Flats</p>
                            <p className="font-medium">{membership.societies?.total_flats || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Condition</p>
                            <Badge variant="secondary">{membership.societies?.condition_status || 'Unknown'}</Badge>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h3 className="font-medium mb-3">Your Membership</h3>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Flat Number</p>
                            <p className="font-medium">#{membership.flat_number}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Member Since</p>
                            <p className="font-medium">{new Date(membership.joined_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={membership.status === 'active' ? 'default' : 'secondary'}>
                              {membership.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="requirements">
                <Card>
                  <CardHeader>
                    <CardTitle>Active Redevelopment Requirements</CardTitle>
                    <CardDescription>
                      Requirements posted by your society that need member input
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {requirements.map((req) => (
                        <div key={req.id} className="p-4 border rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium capitalize">{req.requirement_type}</h3>
                            <div className="flex items-center gap-2">
                              <Badge variant="default">{req.status}</Badge>
                              <Button size="sm">View Details</Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Timeline: {req.timeline_expectation}</span>
                            <span>Posted: {new Date(req.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                      {requirements.length === 0 && (
                        <div className="text-center py-8">
                          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">No active requirements at this time</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="proposals">
                <div className="space-y-6">
                  {/* Proposals Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Developer Proposals</CardTitle>
                      <CardDescription>
                        Review and vote on proposals submitted by developers for your society's redevelopment
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {proposals.map((proposal) => {
                          const requirement = requirements.find(r => r.id === proposal.requirement_id);
                          return (
                            <div key={proposal.id} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="font-semibold text-lg mb-1">{proposal.title}</h3>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    For: {requirement?.requirement_type} • From: {proposal.developers?.company_name}
                                  </p>
                                  <Badge variant={
                                    proposal.status === 'submitted' ? 'default' : 
                                    proposal.status === 'approved' ? 'secondary' : 
                                    'outline'
                                  }>
                                    {proposal.status}
                                  </Badge>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">Budget Estimate</p>
                                  <p className="font-semibold">₹{proposal.budget_estimate?.toLocaleString('en-IN')}</p>
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-3">
                                {proposal.description}
                              </p>
                              
                              <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                  <p className="text-sm font-medium">Timeline</p>
                                  <p className="text-sm text-muted-foreground">{proposal.timeline}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium">Submitted</p>
                                  <p className="text-sm text-muted-foreground">
                                    {new Date(proposal.submitted_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {proposals.length === 0 && (
                          <div className="text-center py-8">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No proposals available yet</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Proposals will appear here when developers submit them for your society's requirements
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Voting System */}
                  {membership && (
                    <VotingSystem 
                      societyMemberId={membership.id} 
                      societyId={membership.society_id} 
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="flat">
                {membership && (
                  <FlatDetailsForm 
                    societyMemberId={membership.id} 
                    onSave={() => toast.success("Flat details updated successfully!")} 
                  />
                )}
              </TabsContent>

              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <CardTitle>Member Profile & Settings</CardTitle>
                      <Button variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-medium mb-3">Membership Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Flat Number</p>
                            <p className="font-medium">#{membership.flat_number}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Member Status</p>
                            <Badge variant={membership.status === 'active' ? 'default' : 'secondary'}>
                              {membership.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Member Since</p>
                            <p className="font-medium">{new Date(membership.joined_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Society</p>
                            <p className="font-medium">{membership.societies?.name || 'Unknown Society'}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-3">Voting Preferences</h3>
                        <div className="p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-3">
                            Set your preferences for future redevelopment decisions and notifications
                          </p>
                          <div className="space-y-2">
                            <Button variant="outline" size="sm" className="mr-2">
                              Email Notifications
                            </Button>
                            <Button variant="outline" size="sm">
                              SMS Alerts
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default SocietyMemberDashboard;