import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import DashboardNav from "@/components/DashboardNav";
import { SocietyForm } from "@/components/SocietyForm";
import { MemberManagement } from "@/components/MemberManagement";
import { RequirementForm } from "@/components/RequirementForm";
import { DocumentUploadSection, type DocumentFile } from "@/components/DocumentUploadSection";
import { Building2, Users, FileText, Plus, Settings, Eye, X, Upload, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Society {
  id: string;
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
  flat_number: string;
  user_id: string;
  status: string;
  joined_at: string;
  profiles?: {
    full_name: string;
    phone: string;
  };
}

interface Requirement {
  id: string;
  requirement_type: string;
  description: string;
  budget_range: string;
  status: string;
  created_at: string;
}

interface Proposal {
  id: string;
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

  const fetchSocietyData = async () => {
    if (!user) return;
    
    try {
      // Fetch societies owned by the current user
      const { data: societiesData, error: societyError } = await supabase
        .from('societies')
        .select('*')
        .eq('owner_id', user.id);

      // Use the first society for now (TODO: Add society selector if multiple)
      const societyData = societiesData?.[0];

      if (societyError && societyError.code !== 'PGRST116') {
        console.error('Society fetch error:', societyError);
        return;
      }

      if (societyData) {
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

        // Fetch society members
        const { data: membersData, error: membersError } = await supabase
          .from('society_members')
          .select('*')
          .eq('society_id', societyData.id);

        if (membersError) {
          console.error('Members fetch error:', membersError);
        } else if (membersData && membersData.length > 0) {
          // Fetch profiles separately to avoid relation issues
          const memberIds = membersData.map(member => member.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .in('id', memberIds);

          // Combine the data
          const membersWithProfiles = membersData.map(member => {
            const profile = profilesData?.find(p => p.id === member.user_id);
            return {
              ...member,
              profiles: profile || null
            };
          });
          
          setMembers(membersWithProfiles);
        } else {
          setMembers([]);
        }

        // Fetch requirements
        const { data: requirementsData, error: requirementsError } = await supabase
          .from('redevelopment_requirements')
          .select('*')
          .eq('society_id', societyData.id)
          .order('created_at', { ascending: false });

        if (requirementsError) {
          console.error('Requirements fetch error:', requirementsError);
        } else {
          setRequirements(requirementsData || []);
        }

        // Fetch proposals for requirements
        const requirementIds = requirementsData?.map(req => req.id) || [];
        if (requirementIds.length > 0) {
          const { data: proposalsData, error: proposalsError } = await supabase
            .from('proposals')
            .select(`
              *,
              developers:developer_id (
                company_name
              )
            `)
            .in('requirement_id', requirementIds)
            .order('submitted_at', { ascending: false });

          if (proposalsError) {
            console.error('Proposals fetch error:', proposalsError);
          } else {
            setProposals(proposalsData || []);
          }
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
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

      const { error } = await supabase
        .from('societies')
        .update({
          registration_documents: registrationDocUrls,
          flat_plan_documents: floorPlanDocUrls
        })
        .eq('id', society.id);

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

  return (
    <div className="min-h-screen bg-background">
      <DashboardNav />
      
      <main className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Society Management Dashboard</h1>
            <p className="text-muted-foreground">Manage your society and members</p>
          </div>
          {!society && (
            <Dialog open={showSocietyForm} onOpenChange={setShowSocietyForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Society Profile
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Society Profile</DialogTitle>
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
                  <Button size="lg">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Society Profile
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Society Profile</DialogTitle>
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
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Flats</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{society.total_flats}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{members.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{society.number_of_blocks}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Requirements</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{requirements.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Proposals</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{proposals.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Society Code</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-mono">{society.society_code}</div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="society" className="space-y-6">
              <TabsList>
                <TabsTrigger value="society">Society Details</TabsTrigger>
                <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
                <TabsTrigger value="requirements">Requirements ({requirements.length})</TabsTrigger>
                <TabsTrigger value="proposals">Proposals ({proposals.length})</TabsTrigger>
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
                      folderPath={`${society.id}/registration`}
                      documents={registrationDocuments}
                      onDocumentsChange={setRegistrationDocuments}
                      uploadButtonColor="primary"
                      className="mb-6"
                    />

                    <DocumentUploadSection
                      title="Floor Plans & Layout Documents"
                      description="Upload floor plans, layout drawings for each block"
                      bucketName="society-documents"
                      folderPath={`${society.id}/floor-plans`}
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
              societyId={society.id} 
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
                        </DialogHeader>
                        <RequirementForm 
                          societyId={society.id}
                          onSuccess={() => {
                            setShowRequirementForm(false);
                            fetchSocietyData();
                          }}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>

                  {requirements.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Requirements Posted</h3>
                        <p className="text-muted-foreground">Create a redevelopment requirement to start receiving proposals from developers.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {requirements.map((requirement) => (
                        <Card key={requirement.id}>
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
                  
                  {proposals.length === 0 ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Proposals Yet</h3>
                        <p className="text-muted-foreground">Proposals from developers will appear here once they respond to your requirements.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {proposals.map((proposal) => (
                        <Card key={proposal.id}>
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
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

export default SocietyOwnerDashboard;