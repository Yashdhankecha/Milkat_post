import { apiClient } from '@/lib/api';
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
import RedevelopmentModule from "@/components/RedevelopmentModule";
import QueryManagement from "@/components/QueryManagement";
import { DocumentUploadSection, type DocumentFile } from "@/components/DocumentUploadSection";
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
  Trash2,
  Building, 
  UserPlus, 
  Mail, 
  Bell,
  Sparkles,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Shield,
  Home,
  Layers,
  Download
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
  redevelopmentStatus?: {
    isPlanned: boolean;
    plannedDate?: string;
    currentPhase?: string;
    progress?: number;
  };
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


const SocietyOwnerDashboard = () => {
  const { user } = useAuth();
  const [society, setSociety] = useState<Society | null>(null);
  const [members, setMembers] = useState<SocietyMember[]>([]);
  const [queries, setQueries] = useState<any[]>([]);
  const [showSocietyForm, setShowSocietyForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [documentUploads, setDocumentUploads] = useState<DocumentFile[]>([]);
  const [isUploadingDocuments, setIsUploadingDocuments] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);

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
        console.log('Society data fields:', {
          name: societyData.name,
          society_type: societyData.society_type,
          total_area: societyData.total_area,
          total_flats: societyData.total_flats,
          year_built: societyData.year_built,
          contact_person_name: societyData.contact_person_name,
          contact_phone: societyData.contact_phone,
          contact_email: societyData.contact_email
        });
        setSociety(societyData);
        

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


        // Fetch queries for the society
        const societyIdForQueries = getSocietyId(societyData);
        if (societyIdForQueries) {
          try {
            const { data: queriesData, error: queriesError } = await apiClient.getSocietyQueries(societyIdForQueries);
            
            if (queriesError) {
              console.error('Queries fetch error:', queriesError);
              setQueries([]);
            } else {
              const queriesArray = Array.isArray(queriesData) ? queriesData : 
                                 (queriesData?.data && Array.isArray(queriesData.data)) ? queriesData.data : 
                                 (queriesData?.queries && Array.isArray(queriesData.queries)) ? queriesData.queries : [];
              console.log('Queries data structure:', { queriesData, queriesArray });
              setQueries(queriesArray);
            }
          } catch (queriesError) {
            console.error('Queries fetch error:', queriesError);
            setQueries([]);
          }
        }

        // Fetch uploaded documents for the society
        const societyIdForDocs = getSocietyId(societyData);
        
        if (societyIdForDocs) {
          try {
            // Add timestamp to prevent caching issues
            const timestamp = Date.now();
            const { data: documentsData, error: docsError } = await apiClient.getSocietyDocuments(societyIdForDocs, timestamp);
            
            if (docsError) {
              console.error('Documents fetch error:', docsError);
              // Fallback: create documents from society data
              const fallbackDocs = [];
              if (societyData.registration_documents && societyData.registration_documents.length > 0) {
                societyData.registration_documents.forEach((docItem: any, index: number) => {
                  // Handle both string URLs and document objects
                  const docUrl = typeof docItem === 'string' ? docItem : docItem.url;
                  const docName = typeof docItem === 'string' ? 
                    (docItem.split('/').pop() || `Society Document ${index + 1}`) : 
                    (docItem.name || docItem.url.split('/').pop() || `Society Document ${index + 1}`);
                  const docMediaId = typeof docItem === 'object' ? docItem.mediaId : null;
                  const docSize = typeof docItem === 'object' ? docItem.size : null;
                  
                  fallbackDocs.push({
                    id: `doc_${index}`,
                    name: docName,
                    type: 'society_document',
                    url: docUrl,
                    mediaId: docMediaId,
                    uploadedAt: societyData.createdAt || new Date(),
                    size: docSize
                  });
                });
              }
              if (societyData.flat_plan_documents && societyData.flat_plan_documents.length > 0) {
                societyData.flat_plan_documents.forEach((docItem: any, index: number) => {
                  // Handle both string URLs and document objects
                  const docUrl = typeof docItem === 'string' ? docItem : docItem.url;
                  const docName = typeof docItem === 'string' ? 
                    (docItem.split('/').pop() || `Society Document ${fallbackDocs.length + index + 1}`) : 
                    (docItem.name || docItem.url.split('/').pop() || `Society Document ${fallbackDocs.length + index + 1}`);
                  const docMediaId = typeof docItem === 'object' ? docItem.mediaId : null;
                  const docSize = typeof docItem === 'object' ? docItem.size : null;
                  
                  fallbackDocs.push({
                    id: `doc_${fallbackDocs.length + index}`,
                    name: docName,
                    type: 'society_document',
                    url: docUrl,
                    mediaId: docMediaId,
                    uploadedAt: societyData.createdAt || new Date(),
                    size: docSize
                  });
                });
              }
              setUploadedDocuments(fallbackDocs);
            } else {
              const documentsArray = Array.isArray(documentsData) ? documentsData : 
                                   (documentsData?.data && Array.isArray(documentsData.data)) ? documentsData.data : 
                                   (documentsData?.documents && Array.isArray(documentsData.documents)) ? documentsData.documents : [];
              
              console.log('=== DOCUMENTS FETCH DEBUG ===');
              console.log('Documents data from API:', documentsData);
              console.log('Documents array:', documentsArray);
              console.log('Society registration_documents:', societyData.registration_documents);
              console.log('Society flat_plan_documents:', societyData.flat_plan_documents);
              
              // If API returns empty but society has documents, use fallback
              if (documentsArray.length === 0 && (societyData.registration_documents?.length > 0 || societyData.flat_plan_documents?.length > 0)) {
                const fallbackDocs = [];
              if (societyData.registration_documents && societyData.registration_documents.length > 0) {
                console.log('Creating fallback docs from registration_documents');
                societyData.registration_documents.forEach((docItem: any, index: number) => {
                  // Handle both string URLs and document objects
                  const docUrl = typeof docItem === 'string' ? docItem : docItem.url;
                  const docName = typeof docItem === 'string' ? 
                    (docItem.split('/').pop() || `Society Document ${index + 1}`) : 
                    (docItem.name || docItem.url.split('/').pop() || `Society Document ${index + 1}`);
                  const docMediaId = typeof docItem === 'object' ? docItem.mediaId : null;
                  const docSize = typeof docItem === 'object' ? docItem.size : null;
                  
                  console.log(`Registration doc ${index + 1} URL:`, docUrl);
                  fallbackDocs.push({
                    id: `doc_${index}`,
                    name: docName,
                    type: 'society_document',
                    url: docUrl,
                    mediaId: docMediaId,
                    uploadedAt: societyData.createdAt || new Date(),
                    size: docSize
                  });
                });
              }
                if (societyData.flat_plan_documents && societyData.flat_plan_documents.length > 0) {
                  societyData.flat_plan_documents.forEach((docItem: any, index: number) => {
                    // Handle both string URLs and document objects
                    const docUrl = typeof docItem === 'string' ? docItem : docItem.url;
                    const docName = typeof docItem === 'string' ? 
                      (docItem.split('/').pop() || `Society Document ${fallbackDocs.length + index + 1}`) : 
                      (docItem.name || docItem.url.split('/').pop() || `Society Document ${fallbackDocs.length + index + 1}`);
                    const docMediaId = typeof docItem === 'object' ? docItem.mediaId : null;
                    const docSize = typeof docItem === 'object' ? docItem.size : null;
                    
                    fallbackDocs.push({
                      id: `doc_${fallbackDocs.length + index}`,
                      name: docName,
                      type: 'society_document',
                      url: docUrl,
                      mediaId: docMediaId,
                      uploadedAt: societyData.createdAt || new Date(),
                      size: docSize
                    });
                  });
                }
                setUploadedDocuments(fallbackDocs);
              } else {
                setUploadedDocuments(documentsArray);
              }
            }
          } catch (docsError) {
            console.error('Documents fetch error:', docsError);
            // Fallback: create documents from society data
            const fallbackDocs = [];
            if (societyData.registration_documents && societyData.registration_documents.length > 0) {
              societyData.registration_documents.forEach((url: string, index: number) => {
                fallbackDocs.push({
                  id: `doc_${index}`,
                  name: url.split('/').pop() || `Society Document ${index + 1}`,
                  type: 'society_document',
                  url: url,
                  uploadedAt: societyData.createdAt || new Date(),
                  size: null
                });
              });
            }
            if (societyData.flat_plan_documents && societyData.flat_plan_documents.length > 0) {
              societyData.flat_plan_documents.forEach((url: string, index: number) => {
                fallbackDocs.push({
                  id: `doc_${fallbackDocs.length + index}`,
                  name: url.split('/').pop() || `Society Document ${fallbackDocs.length + index + 1}`,
                  type: 'society_document',
                  url: url,
                  uploadedAt: societyData.createdAt || new Date(),
                  size: null
                });
              });
            }
            setUploadedDocuments(fallbackDocs);
          }
        } else {
          setUploadedDocuments([]);
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

  // Monitor document uploads and process when all are complete
  useEffect(() => {
    if (documentUploads.length > 0) {
      processCompletedUploads();
    }
  }, [documentUploads]);

  // Handle document upload completion - called for each individual file
  const handleDocumentUploadComplete = async () => {
    // Don't process here - wait for all uploads to complete
    // The useEffect will handle processing when all uploads are done
  };

  // Process all completed uploads when upload process is done
  const processCompletedUploads = async () => {
    if (society && documentUploads.length > 0) {
      const completedUploads = documentUploads.filter(doc => doc.status === 'completed' && doc.url);
      const pendingUploads = documentUploads.filter(doc => doc.status === 'uploading' || doc.status === 'pending');
      
      console.log('=== UPLOAD STATUS CHECK ===');
      console.log('Total documents:', documentUploads.length);
      console.log('Completed uploads:', completedUploads.length);
      console.log('Pending uploads:', pendingUploads.length);
      
      // Only process if all uploads are complete
      if (completedUploads.length > 0 && pendingUploads.length === 0) {
        console.log('All uploads completed, processing...');
        
        const uploadedDocuments = completedUploads.map(doc => ({
          url: doc.url!,
          mediaId: doc.mediaId,
          name: doc.name,
          size: doc.size
        }));
        
        try {
          const societyId = getSocietyId(society);
          if (societyId) {
            // Get current documents from both arrays
            const currentRegDocs = society.registration_documents || [];
            const currentFloorDocs = society.flat_plan_documents || [];
            
            // Combine all current documents with new uploads
            const allCurrentDocs = [...currentRegDocs, ...currentFloorDocs];
            const updatedDocs = [...allCurrentDocs, ...uploadedDocuments];
            
            console.log('=== DOCUMENT UPLOAD DEBUG ===');
            console.log('Society ID:', societyId);
            console.log('Current registration docs:', currentRegDocs);
            console.log('Current floor plan docs:', currentFloorDocs);
            console.log('Uploaded documents:', uploadedDocuments);
            console.log('Updated docs array:', updatedDocs);
            console.log('Society object before update:', society);
            
            // Debug each uploaded document
            uploadedDocuments.forEach((doc, index) => {
              console.log(`Uploaded document ${index + 1}:`, doc);
              console.log(`Document type:`, typeof doc);
              console.log(`Document URL:`, doc.url);
              console.log(`Document mediaId:`, doc.mediaId);
            });
            
            // Update society with all documents in registration_documents array
            // We'll use registration_documents as the main document storage
            const updateData = {
              registration_documents: updatedDocs,
              flat_plan_documents: [] // Clear floor plan docs since we're unifying
            };
            
            console.log('Sending update data:', updateData);
            
            const updateResult = await apiClient.updateSociety(societyId, updateData);
            console.log('Update result:', updateResult);
            
            if (updateResult.error) {
              console.error('Update failed:', updateResult.error);
              throw new Error(updateResult.error);
            }
            
            console.log('Society updated successfully');
            
            // Clear upload state and close form
            setIsUploadingDocuments(false);
            setShowUploadForm(false);
            setDocumentUploads([]);
            
            // Refresh the documents list
            await fetchSocietyData();
            toast("Success", {
              description: "Documents uploaded successfully!",
            });
          }
        } catch (error) {
          console.error('Error updating society documents:', error);
          toast("Error", {
            description: "Failed to save documents. Please try again.",
          });
        }
      }
    }
  };

  const handleDocumentUploadStart = () => {
    setIsUploadingDocuments(true);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

              {/* Stat Card 2: Total Blocks */}
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

              {/* Stat Card 3: Active Members */}
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

              {/* Stat Card 4: Member Queries */}
              <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-orange-500/40">
                <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-orange-400/20 dark:bg-orange-600/20 blur-xl animate-pulse-slow delay-300"></div>
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Member Queries</p>
                    <div className="p-2 rounded-full bg-orange-500/20 dark:bg-orange-700/30 backdrop-blur-sm">
                      <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <p className="text-5xl font-extrabold text-orange-900 dark:text-orange-100 leading-none">
                    {queries && Array.isArray(queries) ? queries.length : 0}
                  </p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">
                    {queries && Array.isArray(queries) ? 
                      `${queries.filter(q => q.status === 'open').length} pending` : 
                      'No queries'
                    }
                  </p>
                </CardContent>
              </Card>


            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="society" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto p-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-gray-700/20 dark:to-gray-800/20 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
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
                  value="documents"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-purple-400 dark:data-[state=active]:border-purple-700 rounded-lg py-2 px-4 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300"
                >
                  <FileText className="h-4 w-4 mr-2" /> Documents ({uploadedDocuments && Array.isArray(uploadedDocuments) ? uploadedDocuments.length : 0})
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
                        <Dialog key={society?._id || society?.id || 'edit'}>
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

                </div>
              </TabsContent>

              <TabsContent value="members">
            <MemberManagement 
              societyId={getSocietyId(society) || ''} 
            />
              </TabsContent>

              <TabsContent value="documents">
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                        <FileText className="h-8 w-8 text-purple-500" />
                        Uploaded Documents
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Manage and view all society documents including registration papers and floor plans
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => fetchSocietyData()} 
                        variant="outline" 
                        size="sm"
                        className="flex items-center gap-2"
                        disabled={isUploadingDocuments}
                      >
                        <RefreshCw className={`h-4 w-4 ${isUploadingDocuments ? 'animate-spin' : ''}`} />
                        Refresh
                      </Button>
                      {isUploadingDocuments && (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span className="text-sm text-blue-600 dark:text-blue-400">Uploading...</span>
                        </div>
                      )}
                    </div>
                  </div>


                  {/* Documents Grid */}
                  {uploadedDocuments && uploadedDocuments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {uploadedDocuments.map((doc: any, index: number) => (
                        <Card key={doc.id || index} className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 hover:shadow-xl transition-all duration-300">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30">
                                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                  <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-100 line-clamp-2">
                                    {doc.name}
                                  </CardTitle>
                                  <Badge 
                                    variant="default"
                                    className="mt-1 text-xs"
                                  >
                                    Society Document
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Calendar className="h-4 w-4" />
                                <span>Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</span>
                              </div>
                              {doc.size && (
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <FileText className="h-4 w-4" />
                                  <span>Size: {(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                </div>
                              )}
                              <div className="flex gap-2 pt-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => {
                                    console.log('Document URL:', doc.url);
                                    console.log('Document name:', doc.name);
                                    window.open(doc.url, '_blank');
                                  }}
                                  className="flex-1 text-purple-600 hover:text-purple-700 border-purple-200 hover:border-purple-300"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = doc.url;
                                    link.download = doc.name;
                                    link.click();
                                  }}
                                  className="flex-1 text-green-600 hover:text-green-700 border-green-200 hover:border-green-300"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={async () => {
                                    if (confirm('Are you sure you want to delete this document?')) {
                                      try {
                                        const societyId = getSocietyId(society);
                                        if (societyId) {
                                          console.log('Deleting document:', doc.url);
                                          
                                          // First, try to delete from Cloudinary/Media collection if we have a mediaId
                                          if (doc.mediaId) {
                                            try {
                                              console.log('Deleting media from Cloudinary:', doc.mediaId);
                                              await apiClient.deleteMedia(doc.mediaId);
                                              console.log('Media deleted from Cloudinary successfully');
                                            } catch (mediaError) {
                                              console.warn('Failed to delete from Cloudinary, continuing with local deletion:', mediaError);
                                            }
                                          } else if (doc.url && doc.url.includes('localhost:5000/uploads/')) {
                                            // For local development files, we can't delete them from the server
                                            // but we can remove them from the society's documents array
                                            console.log('Local file detected, will be removed from society documents only');
                                          }
                                          
                                          // Remove document from society
                                          const currentRegDocs = society.registration_documents || [];
                                          const currentFloorDocs = society.flat_plan_documents || [];
                                          
                                          // Combine all documents and remove the specific one
                                          const allDocs = [...currentRegDocs, ...currentFloorDocs];
                                          const updatedDocs = allDocs.filter((docItem: any) => {
                                            // Handle both string URLs and document objects
                                            const docUrl = typeof docItem === 'string' ? docItem : docItem.url;
                                            return docUrl !== doc.url;
                                          });
                                          
                                          await apiClient.updateSociety(societyId, {
                                            registration_documents: updatedDocs,
                                            flat_plan_documents: [] // Clear floor plan docs since we're unifying
                                          });
                                          
                                          // Refresh documents
                                          await fetchSocietyData();
                                          
                                          toast("Success", {
                                            description: "Document deleted successfully!",
                                          });
                                        }
                                      } catch (error) {
                                        console.error('Error deleting document:', error);
                                        toast("Error", {
                                          description: "Failed to delete document. Please try again.",
                                        });
                                      }
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900">
                      <CardContent className="p-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 rounded-full bg-purple-100 dark:bg-purple-900/30">
                            <FileText className="h-12 w-12 text-purple-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                              No Documents Uploaded
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                              Upload society documents to get started
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Document Upload Section */}
                  {showUploadForm ? (
                    <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
                      <CardHeader className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                              <FileText className="h-6 w-6 text-blue-500" />
                              Upload Society Documents
                            </CardTitle>
                            <CardDescription className="text-gray-600 dark:text-gray-400 mt-2">
                              Upload all society-related documents including registration papers, approvals, and floor plans
                            </CardDescription>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowUploadForm(false)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <DocumentUploadSection
                          title="Society Documents"
                          description="Upload all society-related documents including registration certificates, building approvals, NOC documents, floor plans, and other relevant papers"
                          bucketName="society-documents"
                          folderPath={`${getSocietyId(society) || 'unknown'}/documents`}
                          documents={documentUploads}
                          onDocumentsChange={setDocumentUploads}
                          acceptedTypes=".pdf,.jpg,.jpeg,.png,.doc,.docx,.txt,.dwg,.dxf"
                          maxSizeMessage="PDF, DOC, DOCX, JPG, PNG, TXT, DWG, DXF files up to 10MB each"
                          uploadButtonColor="primary"
                          onUploadStart={handleDocumentUploadStart}
                          onUploadComplete={handleDocumentUploadComplete}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
                      <CardContent className="p-8 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30">
                            <FileText className="h-12 w-12 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
                              Upload Society Documents
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md">
                              Upload all society-related documents including registration papers, approvals, floor plans, and other relevant documents
                            </p>
                            <Button 
                              onClick={() => setShowUploadForm(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Documents
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
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