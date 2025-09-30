import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardNav from "@/components/DashboardNav";
import { SocietyForm } from "@/components/SocietyForm";
import { MemberManagement } from "@/components/MemberManagement";
import { RequirementForm } from "@/components/RequirementForm";
import { DocumentUploadSection, type DocumentFile } from "@/components/DocumentUploadSection";
import RedevelopmentModule from "@/components/RedevelopmentModule";
import InvitationManagement from "@/components/InvitationManagement";
import { Building2, Users, FileText, Plus, Settings, Eye, X, Upload, CheckCircle2, RefreshCw, Building, UserPlus, Mail, Bell } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Society {
  id?: string;
  _id?: string;
  name: string;
  society_type: string;
  number_of_blocks: number;
  total_area: number;
  registration_date: string;
  address: string;
  city: string;
  state: string;
  year_built: number;
  total_flats: number;
  society_code: string;
  condition_status: string;
  amenities: string[];
  flat_variants: any;
  fsi: number;
  road_facing: string;
  contact_person_name: string;
  contact_phone: string;
  contact_email: string;
  created_at: string;
  registration_documents?: any;
  flat_plan_documents?: any;
}

interface SocietyMember {
  id: string;
  userId: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
  isOwner: boolean;
}

interface Requirement {
  id?: string;
  _id?: string;
  requirement_type: string;
  description: string;
  budget_range: string;
  status: string;
  created_at: string;
}

interface Proposal {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  budget_estimate: number;
  status: string;
  submitted_at: string;
  developers?: {
    company_name: string;
  };
}

const SocietyOwnerDashboard = () => {
  const { user } = useAuth();
  const [society, setSociety] = useState<Society | null>(null);
  const [members, setMembers] = useState<SocietyMember[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [showSocietyForm, setShowSocietyForm] = useState(false);
  const [showRequirementForm, setShowRequirementForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [registrationDocuments, setRegistrationDocuments] = useState<DocumentFile[]>([]);
  const [floorPlanDocuments, setFloorPlanDocuments] = useState<DocumentFile[]>([]);

  // Helper function to get society ID (handles both id and _id)
  const getSocietyId = (societyData: Society | null): string | undefined => {
    return societyData?.id || societyData?._id;
  };

  const fetchSocietyData = async () => {
    if (!user) {
      console.log('No user found, cannot fetch society data');
      return;
    }
    
    try {
      console.log('Fetching society data for user:', user.id, 'role:', user.currentRole);
      // Fetch societies owned by the current user
      const { data: responseData, error: societyError } = await apiClient.getMySocieties();
      console.log('Societies response data:', responseData);
      
      // Extract societies array from the response
      const societiesData = responseData?.societies || responseData || [];
      console.log('Societies array:', societiesData);

      // Use the first society for now (TODO: Add society selector if multiple)
      const societyData = societiesData?.[0];

      if (societyError) {
        console.error('Society fetch error:', societyError);
        toast("Error", {
          description: "Failed to fetch society data. Please try again.",
        });
        return;
      }

      if (societyData) {
        console.log('Setting society data:', societyData);
        setSociety(societyData);
        
        // Load existing documents
        if (societyData.registration_documents && Array.isArray(societyData.registration_documents)) {
          const existingRegDocs: DocumentFile[] = societyData.registration_documents.map((url: string) => ({
            url,
            name: url.split('/').pop() || 'Registration Document',
            status: 'completed' as const
          }));
          setRegistrationDocuments(existingRegDocs);
        }
        
        if (societyData.flat_plan_documents && Array.isArray(societyData.flat_plan_documents)) {
          const existingFloorDocs: DocumentFile[] = societyData.flat_plan_documents.map((url: string) => ({
            url,
            name: url.split('/').pop() || 'Floor Plan Document',
            status: 'completed' as const
          }));
          setFloorPlanDocuments(existingFloorDocs);
        }

        // Fetch society members using the new API endpoint
        const societyId = getSocietyId(societyData);
        console.log('Society ID for members fetch:', societyId);
        if (societyId) {
          const { data: membersResponse, error: membersError } = await apiClient.getSocietyMembers(societyId);
        
        if (membersError) {
          console.error('Members fetch error:', membersError);
          toast("Warning", {
            description: "Failed to fetch member data. Please refresh the page.",
          });
          setMembers([]);
        } else if (membersResponse && membersResponse.members) {
          console.log('Members data received:', membersResponse.members);
          setMembers(membersResponse.members);
        } else {
          console.log('No members data found');
          setMembers([]);
        }
        } else {
          console.log('No society ID available for members fetch');
          setMembers([]);
        }

        // Fetch requirements
        const societyIdForRequirements = getSocietyId(societyData);
        const { data: requirementsData, error: requirementsError } = await apiClient.getRequirements({ society_id: societyIdForRequirements });

        let requirementsArray: any[] = [];
        
        if (requirementsError) {
          console.error('Requirements fetch error:', requirementsError);
          toast("Warning", {
            description: "Failed to fetch requirements data.",
          });
          setRequirements([]); // Ensure it's always an array
        } else {
          // Ensure requirementsData is an array
          requirementsArray = Array.isArray(requirementsData) ? requirementsData : 
                             (requirementsData?.data && Array.isArray(requirementsData.data)) ? requirementsData.data : 
                             (requirementsData?.requirements && Array.isArray(requirementsData.requirements)) ? requirementsData.requirements : [];
          console.log('Requirements data structure:', { requirementsData, requirementsArray });
          setRequirements(requirementsArray);
        }

        // Fetch proposals for requirements
        const requirementIds = requirementsArray?.map(req => req._id || req.id) || [];
        if (requirementIds.length > 0) {
          const { data: proposalsData, error: proposalsError } = await apiClient.getRequirements({ society_id: societyData.id });

          if (proposalsError) {
            console.error('Proposals fetch error:', proposalsError);
            toast("Warning", {
              description: "Failed to fetch proposals data.",
            });
            setProposals([]); // Ensure it's always an array
          } else {
            // Ensure proposalsData is an array
            const proposalsArray = Array.isArray(proposalsData) ? proposalsData : 
                                 (proposalsData?.data && Array.isArray(proposalsData.data)) ? proposalsData.data : 
                                 (proposalsData?.proposals && Array.isArray(proposalsData.proposals)) ? proposalsData.proposals : [];
            console.log('Proposals data structure:', { proposalsData, proposalsArray });
            setProposals(proposalsArray);
          }
        } else {
          setProposals([]); // No requirements, so no proposals
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      toast("Error", {
        description: "Failed to load dashboard data. Please refresh the page.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSocietyData();
  }, [user]);

  const updateSocietyDocuments = async () => {
    if (!society) return;

    try {
      // Get document URLs from the uploaded documents
      const registrationDocUrls = registrationDocuments
        .filter(doc => doc.status === 'completed' && doc.url)
        .map(doc => doc.url!);
      
      const floorPlanDocUrls = floorPlanDocuments
        .filter(doc => doc.status === 'completed' && doc.url)
        .map(doc => doc.url!);

      const societyId = getSocietyId(society);
      if (!societyId) {
        toast("Error", {
          description: "Society ID not available",
        });
        return;
      }
      const { error } = await apiClient.updateSociety(societyId, {
        registration_documents: registrationDocUrls,
        flat_plan_documents: floorPlanDocUrls
      });

      if (error) throw error;

      await fetchSocietyData();

      toast("Documents Updated", {
        description: "Society documents have been updated successfully.",
      });

    } catch (error) {
      console.error('Update error:', error);
      toast("Update Failed", {
        description: "Failed to update documents. Please try again.",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardNav />
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-4">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Dashboard render - society:', society, 'showSocietyForm:', showSocietyForm, 'loading:', loading);

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Society Management Dashboard</h1>
            <p className="text-muted-foreground">Manage your society and members</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={fetchSocietyData}
              disabled={loading}
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!society && (
              <Dialog open={showSocietyForm} onOpenChange={setShowSocietyForm}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={() => {
                      console.log('Opening society form dialog');
                      setShowSocietyForm(true);
                    }}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Society Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Society Profile</DialogTitle>
                    <DialogDescription>
                      Fill out the form below to create your society profile with all the necessary details.
                    </DialogDescription>
                  </DialogHeader>
                  <SocietyForm 
                    onSuccess={() => {
                      setShowSocietyForm(false);
                      fetchSocietyData();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {!society ? (
          <Card>
            <CardHeader className="text-center">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <CardTitle>No Society Profile Found</CardTitle>
              <CardDescription>
                Create your society profile to start managing members and redevelopment requirements.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Dialog open={showSocietyForm} onOpenChange={setShowSocietyForm}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg"
                    onClick={() => {
                      console.log('Opening society form dialog from main content');
                      setShowSocietyForm(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Society Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Society Profile</DialogTitle>
                    <DialogDescription>
                      Fill out the form below to create your society profile with all the necessary details.
                    </DialogDescription>
                  </DialogHeader>
                  <SocietyForm 
                    onSuccess={() => {
                      setShowSocietyForm(false);
                      fetchSocietyData();
                    }} 
                  />
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 font-medium">Total Flats</p>
                      <p className="text-3xl font-bold text-blue-800">{society.total_flats}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 font-medium">Active Members</p>
                      <p className="text-3xl font-bold text-green-800">{members.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-600 font-medium">Total Blocks</p>
                      <p className="text-3xl font-bold text-purple-800">{society.number_of_blocks || 'N/A'}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                      <Building2 className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-600 font-medium">Requirements</p>
                      <p className="text-3xl font-bold text-orange-800">{requirements && Array.isArray(requirements) ? requirements.length : 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                      <FileText className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>


            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="society" className="space-y-6">
       <TabsList>
         <TabsTrigger value="society">Society Details</TabsTrigger>
         <TabsTrigger value="members">Members ({members && Array.isArray(members) ? members.length : 0})</TabsTrigger>
         <TabsTrigger value="invitations">Invitations</TabsTrigger>
         <TabsTrigger value="requirements">Requirements ({requirements && Array.isArray(requirements) ? requirements.length : 0})</TabsTrigger>
         <TabsTrigger value="proposals">Proposals ({proposals && Array.isArray(proposals) ? proposals.length : 0})</TabsTrigger>
         <TabsTrigger value="redevelopment">Redevelopment</TabsTrigger>
       </TabsList>

              <TabsContent value="society">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <div>
                          <CardTitle>{society.name}</CardTitle>
                          <CardDescription>{society.address}, {society.city}, {society.state}</CardDescription>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <Settings className="h-4 w-4 mr-2" />
                              Edit Society
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit Society Profile</DialogTitle>
                              <DialogDescription>
                                Update your society profile information below.
                              </DialogDescription>
                            </DialogHeader>
                            <SocietyForm 
                              society={society} 
                              isEditing={true} 
                              onSuccess={fetchSocietyData} 
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Society Type</p>
                        <p className="font-medium">{society.society_type}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Blocks</p>
                        <p className="font-medium">{society.number_of_blocks}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Total Area</p>
                        <p className="font-medium">{society.total_area} sq ft</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Year Built</p>
                        <p className="font-medium">{society.year_built}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Registration Date</p>
                        <p className="font-medium">{new Date(society.registration_date).toLocaleDateString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">FSI</p>
                        <p className="font-medium">{society.fsi}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Road Facing</p>
                        <p className="font-medium">{society.road_facing}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Condition Status</p>
                        <Badge variant="secondary">{society.condition_status}</Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Contact Person</p>
                        <p className="font-medium">{society.contact_person_name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Contact Email</p>
                        <p className="font-medium">{society.contact_email}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Contact Phone</p>
                        <p className="font-medium">{society.contact_phone}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Amenities */}
                  {society.amenities && society.amenities.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Amenities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {society.amenities.map((amenity, index) => (
                            <Badge key={index} variant="outline">{amenity}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Flat Variants */}
                  {society.flat_variants && society.flat_variants.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Flat Variants</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {society.flat_variants.map((variant: any, index: number) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <h4 className="font-semibold">{variant.name}</h4>
                              <p className="text-sm text-muted-foreground">Area: {variant.area} sq ft</p>
                              <p className="text-sm text-muted-foreground">Bathrooms: {variant.bathrooms}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Documents Upload Section */}
                  <div className="space-y-6">
                    <DocumentUploadSection
                      title="Society Registration Documents"
                      description="Upload society registration certificate, building approvals, NOC documents"
                      bucketName="society-documents"
                      folderPath={`${getSocietyId(society) || 'unknown'}/registration`}
                      documents={registrationDocuments}
                      onDocumentsChange={setRegistrationDocuments}
                      uploadButtonColor="primary"
                      className="mb-6"
                    />

                    <DocumentUploadSection
                      title="Floor Plans & Layout Documents"
                      description="Upload floor plans, layout drawings for each block"
                      bucketName="society-documents"
                      folderPath={`${getSocietyId(society) || 'unknown'}/floor-plans`}
                      documents={floorPlanDocuments}
                      onDocumentsChange={setFloorPlanDocuments}
                      uploadButtonColor="orange"
                    />

                    <div className="flex justify-end">
                      <Button onClick={updateSocietyDocuments}>
                        <Upload className="h-4 w-4 mr-2" />
                        Update Society Documents
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="members">
            <MemberManagement 
              societyId={getSocietyId(society) || ''} 
            />
              </TabsContent>

              <TabsContent value="invitations">
                <InvitationManagement 
                  societyId={getSocietyId(society) || ''} 
                  societyName={society.name} 
                />
              </TabsContent>

              <TabsContent value="requirements">
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Redevelopment Requirements</h2>
                    <Dialog open={showRequirementForm} onOpenChange={setShowRequirementForm}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Requirement
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Create Redevelopment Requirement</DialogTitle>
                          <DialogDescription>
                            Submit a redevelopment requirement for your society.
                          </DialogDescription>
                        </DialogHeader>
                        <RequirementForm 
                          societyId={getSocietyId(society) || ''}
                          onSuccess={() => {
                            setShowRequirementForm(false);
                            fetchSocietyData();
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>

                  {!requirements || !Array.isArray(requirements) || requirements.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Requirements Posted</h3>
                        <p className="text-muted-foreground">Create a redevelopment requirement to start receiving proposals from developers.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {requirements && Array.isArray(requirements) && requirements.map((requirement) => (
                        <Card key={requirement._id || requirement.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{requirement.requirement_type}</CardTitle>
                                <CardDescription>{requirement.description}</CardDescription>
                              </div>
                              <Badge variant={requirement.status === 'active' ? 'default' : 'secondary'}>
                                {requirement.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p><strong>Budget Range:</strong> {requirement.budget_range}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Created on {new Date(requirement.created_at).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="proposals">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold">Developer Proposals</h2>
                  
                  {!proposals || !Array.isArray(proposals) || proposals.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
                        <p className="text-muted-foreground">Proposals from developers will appear here once they respond to your requirements.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {proposals && Array.isArray(proposals) && proposals.map((proposal) => (
                        <Card key={proposal._id || proposal.id}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle>{proposal.title}</CardTitle>
                                <CardDescription>By {proposal.developers?.company_name}</CardDescription>
                              </div>
                              <Badge variant={proposal.status === 'submitted' ? 'default' : 'secondary'}>
                                {proposal.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="mb-2">{proposal.description}</p>
                            <p><strong>Budget Estimate:</strong> ₹{proposal.budget_estimate?.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground mt-2">
                              Submitted on {new Date(proposal.submitted_at).toLocaleDateString()}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="redevelopment">
                <RedevelopmentModule 
                  societyId={getSocietyId(society) || ''} 
                  isOwner={true}
                />
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default SocietyOwnerDashboard;