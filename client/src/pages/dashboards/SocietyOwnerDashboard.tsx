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
import QueryManagement from "@/components/QueryManagement";
import { 
  Building2, 
  Users, 
  FileText, 
  Plus, 
  Settings, 
  Eye, 
  X, 
  Upload, 
  CheckCircle2, 
  RefreshCw, 
  Building, 
  UserPlus, 
  Mail, 
  Bell,
  Sparkles,
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  Mail as MailIcon,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Shield,
  Home,
  Layers
} from "lucide-react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                <Sparkles className="h-6 w-6 text-blue-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-6 text-lg font-medium">Loading your society dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('Dashboard render - society:', society, 'showSocietyForm:', showSocietyForm, 'loading:', loading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-gray-900 dark:text-gray-100">
      <DashboardNav />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                <Sparkles className="h-10 w-10 text-blue-500 animate-pulse" />
                Society Management Dashboard
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-2 animate-fade-in">
                Welcome back, <span className="font-semibold">{user?.phone}</span>! Manage your society with confidence.
              </p>
          </div>
            <div className="flex items-center gap-3">
            <Button 
                variant="ghost"
                size="sm"
              onClick={fetchSocietyData}
              disabled={loading}
                className="px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 group"
            >
                <RefreshCw className={`h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500 ${loading ? 'animate-spin' : ''}`} />
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
                      className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group"
                  >
                      <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                    Create Society Profile
                      <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
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
          <Card className="relative overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
            <CardHeader className="text-center p-12">
              <div className="relative mb-6">
                <Building2 className="h-20 w-20 text-blue-500 mx-auto animate-bounce-slow" />
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-yellow-800 animate-pulse" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">No Society Profile Found</CardTitle>
              <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                Create your society profile to start managing members and redevelopment requirements with our comprehensive tools.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center p-8">
              <Dialog open={showSocietyForm} onOpenChange={setShowSocietyForm}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg"
                    onClick={() => {
                      console.log('Opening society form dialog from main content');
                      setShowSocietyForm(true);
                    }}
                    className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group text-lg font-semibold"
                  >
                    <Plus className="h-5 w-5 mr-3 group-hover:scale-110 transition-transform" />
                    Create Society Profile
                    <ArrowRight className="h-5 w-5 ml-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
              {/* Stat Card 1: Total Flats */}
              <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-blue-500/40">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-xl animate-pulse-slow"></div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Flats</p>
                    <div className="p-2 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <p className="text-5xl font-extrabold text-blue-900 dark:text-blue-100 leading-none">
                    {society.total_flats}
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">Residential units</p>
                </CardContent>
              </Card>

              {/* Stat Card 2: Active Members */}
              <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-green-500/40">
                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-green-400/20 dark:bg-green-600/20 blur-xl animate-pulse-slow delay-100"></div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Active Members</p>
                    <div className="p-2 rounded-full bg-green-500/20 dark:bg-green-700/30 backdrop-blur-sm">
                      <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <p className="text-5xl font-extrabold text-green-900 dark:text-green-100 leading-none">
                    {members.length}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">Society residents</p>
                </CardContent>
              </Card>

              {/* Stat Card 3: Total Blocks */}
              <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-purple-500/40">
                <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-xl animate-pulse-slow delay-200"></div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Blocks</p>
                    <div className="p-2 rounded-full bg-purple-500/20 dark:bg-purple-700/30 backdrop-blur-sm">
                      <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-5xl font-extrabold text-purple-900 dark:text-purple-100 leading-none">
                    {society.number_of_blocks || 'N/A'}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">Building blocks</p>
                </CardContent>
              </Card>

              {/* Stat Card 4: Requirements */}
              <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-orange-500/40">
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-orange-400/20 dark:bg-orange-600/20 blur-xl animate-pulse-slow delay-300"></div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Requirements</p>
                    <div className="p-2 rounded-full bg-orange-500/20 dark:bg-orange-700/30 backdrop-blur-sm">
                      <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <p className="text-5xl font-extrabold text-orange-900 dark:text-orange-100 leading-none">
                    {requirements && Array.isArray(requirements) ? requirements.length : 0}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">Active requests</p>
                </CardContent>
              </Card>

              {/* Stat Card 5: Pending Approvals */}
              <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-red-500/40">
                <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-red-400/20 dark:bg-red-600/20 blur-xl animate-pulse-slow delay-400"></div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-red-800 dark:text-red-200">Pending Approvals</p>
                    <div className="p-2 rounded-full bg-red-500/20 dark:bg-red-700/30 backdrop-blur-sm">
                      <Clock className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                  </div>
                  <p className="text-5xl font-extrabold text-red-900 dark:text-red-100 leading-none">
                    {proposals && Array.isArray(proposals) ? proposals.filter(p => p.status === 'submitted').length : 0}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-2">Awaiting review</p>
                </CardContent>
              </Card>

              {/* Stat Card 6: Document Status */}
              <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-indigo-500/40">
                <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-xl animate-pulse-slow delay-500"></div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Document Status</p>
                    <div className="p-2 rounded-full bg-indigo-500/20 dark:bg-indigo-700/30 backdrop-blur-sm">
                      <Shield className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <p className="text-5xl font-extrabold text-indigo-900 dark:text-indigo-100 leading-none">
                    {registrationDocuments.length + floorPlanDocuments.length}
                  </p>
                  <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">Files uploaded</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="society" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-7 h-auto p-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-gray-700/20 dark:to-gray-800/20 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
                <TabsTrigger
                  value="society"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-blue-400 dark:data-[state=active]:border-blue-700 rounded-lg py-2 px-4 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300"
                >
                  <Building2 className="h-4 w-4 mr-2" /> Society Details
                </TabsTrigger>
                <TabsTrigger
                  value="members"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-green-400 dark:data-[state=active]:border-green-700 rounded-lg py-2 px-4 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-300"
                >
                  <Users className="h-4 w-4 mr-2" /> Members ({members && Array.isArray(members) ? members.length : 0})
                </TabsTrigger>
                <TabsTrigger
                  value="invitations"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-purple-400 dark:data-[state=active]:border-purple-700 rounded-lg py-2 px-4 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300"
                >
                  <Mail className="h-4 w-4 mr-2" /> Invitations
                </TabsTrigger>
                <TabsTrigger
                  value="requirements"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-orange-400 dark:data-[state=active]:border-orange-700 rounded-lg py-2 px-4 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-300"
                >
                  <FileText className="h-4 w-4 mr-2" /> Requirements ({requirements && Array.isArray(requirements) ? requirements.length : 0})
                </TabsTrigger>
                <TabsTrigger
                  value="proposals"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-indigo-400 dark:data-[state=active]:border-indigo-700 rounded-lg py-2 px-4 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300"
                >
                  <BarChart3 className="h-4 w-4 mr-2" /> Proposals ({proposals && Array.isArray(proposals) ? proposals.length : 0})
                </TabsTrigger>
                <TabsTrigger
                  value="redevelopment"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-emerald-400 dark:data-[state=active]:border-emerald-700 rounded-lg py-2 px-4 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-300"
                >
                  <TrendingUp className="h-4 w-4 mr-2" /> Redevelopment
                </TabsTrigger>
                <TabsTrigger
                  value="queries"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-orange-400 dark:data-[state=active]:border-orange-700 rounded-lg py-2 px-4 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-300"
                >
                  <FileText className="h-4 w-4 mr-2" /> Queries
                </TabsTrigger>
       </TabsList>

              <TabsContent value="society">
                <div className="space-y-6">
                  <Card className="relative overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                        <div>
                        <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800 dark:text-gray-100">
                          <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                          {society.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4" />
                          {society.address}, {society.city}, {society.state}
                        </CardDescription>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                          <Button 
                            variant="outline"
                            className="mt-4 md:mt-0 px-6 py-2 rounded-full text-blue-600 dark:text-blue-300 border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 shadow-lg transition-all duration-300 group"
                          >
                            <Settings className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                              Edit Society
                            <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
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
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-blue-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Society Type</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{society.society_type}</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4 text-purple-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Blocks</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{society.number_of_blocks}</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-green-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Area</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{society.total_area} sq ft</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Year Built</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{society.year_built}</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-indigo-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Registration Date</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{new Date(society.registration_date).toLocaleDateString()}</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-red-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">FSI</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{society.fsi}</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-teal-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Road Facing</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{society.road_facing}</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-yellow-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Condition Status</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                            {society.condition_status}
                          </Badge>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-pink-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Person</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{society.contact_person_name}</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <MailIcon className="h-4 w-4 text-cyan-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Email</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{society.contact_email}</p>
                        </div>
                        <div className="space-y-2 p-4 rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-emerald-500" />
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Phone</p>
                          </div>
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{society.contact_phone}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Amenities */}
                  {society.amenities && society.amenities.length > 0 && (
                    <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-900">
                      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-900/20 dark:to-emerald-900/20 opacity-70 blur-3xl pointer-events-none"></div>
                      <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-100">
                          <Home className="h-6 w-6 text-green-600 dark:text-green-400" />
                          Amenities
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="flex flex-wrap gap-3">
                          {society.amenities.map((amenity, index) => (
                            <Badge 
                              key={index} 
                              className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                              {amenity}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Flat Variants */}
                  {society.flat_variants && society.flat_variants.length > 0 && (
                    <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-900/20 dark:to-pink-900/20 opacity-70 blur-3xl pointer-events-none"></div>
                      <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-gray-100">
                          <Layers className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                          Flat Variants
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {society.flat_variants.map((variant: any, index: number) => (
                            <div 
                              key={index} 
                              className="p-6 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                            >
                              <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-3">{variant.name}</h4>
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <BarChart3 className="h-4 w-4 text-purple-500" />
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Area: <span className="font-medium text-gray-800 dark:text-gray-200">{variant.area} sq ft</span></p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Home className="h-4 w-4 text-purple-500" />
                                  <p className="text-sm text-gray-600 dark:text-gray-400">Bathrooms: <span className="font-medium text-gray-800 dark:text-gray-200">{variant.bathrooms}</span></p>
                                </div>
                              </div>
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
                      <Button 
                        onClick={updateSocietyDocuments}
                        className="px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 group"
                      >
                        <Upload className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                        Update Society Documents
                        <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
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
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-orange-500" />
                        Redevelopment Requirements
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your society's redevelopment needs and track progress</p>
                    </div>
                    <Dialog open={showRequirementForm} onOpenChange={setShowRequirementForm}>
                      <DialogTrigger asChild>
                        <Button className="px-6 py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-orange-500/30 transition-all duration-300 group">
                          <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                          Create Requirement
                          <ArrowRight className="h-4 w-4 ml-2 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
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
                    <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-gray-900">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 dark:from-orange-900/20 dark:to-red-900/20 opacity-70 blur-3xl pointer-events-none"></div>
                      <CardContent className="text-center py-12">
                        <div className="relative mb-6">
                          <FileText className="h-16 w-16 text-orange-500 mx-auto animate-bounce-slow" />
                          <div className="absolute -top-2 -right-2 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-yellow-800 animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">No Requirements Posted</h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                          Create a redevelopment requirement to start receiving proposals from developers and transform your society.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {requirements && Array.isArray(requirements) && requirements.map((requirement) => (
                        <Card key={requirement._id || requirement.id} className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-gray-900 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/5 to-transparent opacity-50 animate-gradient-pulse"></div>
                          <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                  <FileText className="h-5 w-5 text-orange-500" />
                                  {requirement.requirement_type}
                                </CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">{requirement.description}</CardDescription>
                              </div>
                              <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${
                                requirement.status === 'active' 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                              }`}>
                                {requirement.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-orange-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Budget Range:</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{requirement.budget_range}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-orange-500" />
                                <span className="text-sm text-gray-600 dark:text-gray-400">Created on</span>
                                <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(requirement.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="proposals">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                      <BarChart3 className="h-8 w-8 text-indigo-500" />
                      Developer Proposals
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Review and manage proposals from developers for your redevelopment projects</p>
                  </div>
                  
                  {!proposals || !Array.isArray(proposals) || proposals.length === 0 ? (
                    <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-900">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 dark:from-indigo-900/20 dark:to-blue-900/20 opacity-70 blur-3xl pointer-events-none"></div>
                      <CardContent className="text-center py-12">
                        <div className="relative mb-6">
                          <BarChart3 className="h-16 w-16 text-indigo-500 mx-auto animate-bounce-slow" />
                          <div className="absolute -top-2 -right-2 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                            <Sparkles className="h-3 w-3 text-yellow-800 animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">No Proposals Yet</h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                          Proposals from developers will appear here once they respond to your requirements. Create requirements to get started!
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-6">
                      {proposals && Array.isArray(proposals) && proposals.map((proposal) => (
                        <Card key={proposal._id || proposal.id} className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-indigo-50 dark:from-gray-800 dark:to-gray-900 transform transition-all duration-300 hover:scale-[1.01] hover:shadow-lg">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-indigo-500/5 to-transparent opacity-50 animate-gradient-pulse"></div>
                          <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                                  <BarChart3 className="h-5 w-5 text-indigo-500" />
                                  {proposal.title}
                                </CardTitle>
                                <CardDescription className="text-gray-600 dark:text-gray-400 mt-2 flex items-center gap-2">
                                  <Building className="h-4 w-4" />
                                  By {proposal.developers?.company_name}
                                </CardDescription>
                              </div>
                              <Badge className={`px-3 py-1 rounded-full text-xs font-medium ${
                                proposal.status === 'submitted' 
                                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                                  : 'bg-gradient-to-r from-gray-500 to-gray-600 text-white'
                              }`}>
                                {proposal.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="p-6">
                            <div className="space-y-4">
                              <p className="text-gray-700 dark:text-gray-300">{proposal.description}</p>
                              <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-4 w-4 text-indigo-500" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Budget Estimate:</span>
                                  <span className="font-semibold text-gray-800 dark:text-gray-200">₹{proposal.budget_estimate?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-indigo-500" />
                                  <span className="text-sm text-gray-600 dark:text-gray-400">Submitted on</span>
                                  <span className="font-semibold text-gray-800 dark:text-gray-200">{new Date(proposal.submitted_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                            </div>
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

              <TabsContent value="queries">
                <QueryManagement 
                  societyId={getSocietyId(society) || ''} 
                />
              </TabsContent>
            </Tabs>
          </>
        )}
        </div>
      </main>
    </div>
  );
};

export default SocietyOwnerDashboard;