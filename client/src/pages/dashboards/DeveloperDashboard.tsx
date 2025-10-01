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
import DeveloperProfileForm from "@/components/DeveloperProfileForm";
import ProjectForm from "@/components/ProjectForm";
import { ProposalForm } from "@/components/ProposalForm";
import RedevelopmentDetails from "@/components/RedevelopmentDetails";
import GlobalRedevelopmentProjects from "@/components/GlobalRedevelopmentProjects";
import { 
  Building, 
  Plus, 
  MessageSquare, 
  TrendingUp,
  Users,
  Calendar,
  MapPin,
  Star,
  UserPlus,
  Home,
  IndianRupee,
  Eye,
  Edit,
  Trash2,
  Hammer,
  FileText,
  Clock,
  CheckCircle,
  X,
  Sparkles,
  ArrowRight,
  BarChart3,
  Shield,
  Layers,
  Phone,
  Mail as MailIcon,
  User,
  AlertCircle,
  RefreshCw,
  Settings,
  Target,
  Award,
  Zap
} from "lucide-react"

interface DeveloperProfile {
  id: string
  company_name: string
  company_description: string | null
  established_year: number | null
  contact_info: Record<string, any>
  website: string | null
  social_media: Record<string, any>
  verification_status: string
  status: string
}

interface DeveloperProject {
  id: string
  name: string
  location: string
  status: string
  completion_date: string | null
  price_range: string
  images: string[]
  created_at: string
}

interface UserProperty {
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

interface RedevelopmentRequirement {
  id: string
  society_id: string
  requirement_type: string
  description: string
  budget_range: string
  timeline_expectation: string
  special_needs: string[]
  status: string
  created_at: string
  societies: {
    name: string
    address: string
    city: string
    total_flats: number
  }
}

interface Proposal {
  id: string
  title: string
  description: string
  budget_estimate: number
  timeline: string
  status: string
  created_at: string
  requirement: {
    requirement_type: string
    societies: {
      name: string
      city: string
    }
  }
}

const DeveloperDashboard = () => {
  const [developerProfile, setDeveloperProfile] = useState<DeveloperProfile | null>(null)
  const [projects, setProjects] = useState<DeveloperProject[]>([])
  const [properties, setProperties] = useState<UserProperty[]>([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalProperties: 0,
    totalInquiries: 0,
    completedProjects: 0,
    totalProposals: 0,
    acceptedProposals: 0
  })
  const [requirements, setRequirements] = useState<RedevelopmentRequirement[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [showProposalForm, setShowProposalForm] = useState(false)
  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(null)
  const [showRequirementDetails, setShowRequirementDetails] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProject, setEditingProject] = useState<any>(null)
  const { profile } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    if (profile) {
      fetchDashboardData()
    }
  }, [profile?.id, profile?.user])

  const fetchDashboardData = async () => {
    const profileId = profile?.id || profile?.user;
    if (!profile || !profileId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Quick API calls with 2 second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const [developerResult, projectsResult] = await Promise.allSettled([
        apiClient.getMyDeveloperProfile(),
        apiClient.getMyProjects()
      ]);
      
      clearTimeout(timeoutId);
      
      // Process results quickly
      if (developerResult.status === 'fulfilled' && !developerResult.value.error) {
        setDeveloperProfile(developerResult.value.data?.developer as DeveloperProfile || null);
      } else {
        setDeveloperProfile(null);
      }
      
      if (projectsResult.status === 'fulfilled' && !projectsResult.value.error) {
        setProjects(projectsResult.value.data?.projects || []);
      } else {
        setProjects([]);
      }
      
      // Set basic stats
      setStats({
        totalProjects: projectsResult.status === 'fulfilled' ? (projectsResult.value.data?.projects || []).length : 0,
        activeProjects: 0,
        totalProperties: 0,
        totalInquiries: 0,
        completedProjects: 0,
        totalProposals: 0,
        acceptedProposals: 0
      });

    } catch (error) {
      console.error('Error fetching developer dashboard data:', error)
      setDeveloperProfile(null)
      setProjects([])
      setProperties([])
      setRequirements([])
      setProposals([])
      setStats({
        totalProjects: 0,
        totalProperties: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalInquiries: 0,
        totalProposals: 0,
        acceptedProposals: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const createDeveloperProfile = async () => {
    if (!profile) return

    try {
      const { data, error } = await apiClient.createDeveloper({
        companyName: profile.companyName || 'My Development Company',
        companyDescription: 'A professional development company',
        establishedYear: new Date().getFullYear()
      })
        

      if (error) throw error

      setDeveloperProfile(data as DeveloperProfile)
      toast({
        title: "Success",
        description: "Developer profile created! Please complete your company information."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create developer profile",
        variant: "destructive"
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ongoing': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'planned': return 'bg-yellow-100 text-yellow-800'
      case 'on_hold': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPropertyStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'sold': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDeleteProperty = async (propertyId: string) => {
    if (!window.confirm('Are you sure you want to delete this property? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await apiClient.deleteProperty(propertyId)
        

      if (error) throw error

      setProperties(prev => prev.filter(p => p.id !== propertyId))
      
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
              <p className="text-gray-600 dark:text-gray-400 mt-6 text-lg font-medium">Loading your developer dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no developer profile exists, show setup screen
  if (!developerProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-gray-900 dark:text-gray-100">
        <DashboardNav />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Card className="relative overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
              <CardHeader className="text-center p-12">
                <div className="relative mb-6">
                  <Building className="h-20 w-20 text-blue-500 mx-auto animate-bounce-slow" />
                  <div className="absolute -top-2 -right-2 h-6 w-6 bg-yellow-400 rounded-full flex items-center justify-center">
                    <Sparkles className="h-3 w-3 text-yellow-800 animate-pulse" />
                  </div>
                </div>
                <CardTitle className="text-4xl font-bold text-gray-800 dark:text-gray-100 mb-3">Welcome to Your Developer Dashboard</CardTitle>
                <CardDescription className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                  Set up your developer profile to showcase your projects, manage inquiries, and connect with potential clients in the real estate market.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-900/20 dark:to-indigo-900/20 opacity-70 blur-3xl pointer-events-none"></div>
                    <CardContent className="p-6 text-center">
                      <div className="p-3 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm w-fit mx-auto mb-4">
                        <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Project Showcase</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Display your residential and commercial development projects with stunning visuals and detailed information.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-gray-900 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 dark:from-green-900/20 dark:to-emerald-900/20 opacity-70 blur-3xl pointer-events-none"></div>
                    <CardContent className="p-6 text-center">
                      <div className="p-3 rounded-full bg-green-500/20 dark:bg-green-700/30 backdrop-blur-sm w-fit mx-auto mb-4">
                        <MessageSquare className="h-8 w-8 text-green-600 dark:text-green-400" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Inquiry Management</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Handle customer inquiries and project interest efficiently with our integrated communication tools.
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-gray-900 transform transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 dark:from-purple-900/20 dark:to-pink-900/20 opacity-70 blur-3xl pointer-events-none"></div>
                    <CardContent className="p-6 text-center">
                      <div className="p-3 rounded-full bg-purple-500/20 dark:bg-purple-700/30 backdrop-blur-sm w-fit mx-auto mb-4">
                        <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">Performance Analytics</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Track project views, inquiries, and customer engagement with detailed analytics and insights.
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={createDeveloperProfile} 
                    size="lg"
                    className="px-8 py-4 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group text-lg font-semibold"
                  >
                    <UserPlus className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                    Set Up Developer Profile
                    <ArrowRight className="h-5 w-5 ml-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg"
                    className="px-8 py-4 rounded-full border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/50 shadow-lg transition-all duration-300 group text-lg font-semibold"
                  >
                    <Link to="/projects">
                      <Eye className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                      View All Projects
                      <ArrowRight className="h-5 w-5 ml-3 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                    </Link>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 text-gray-900 dark:text-gray-100">
      <DashboardNav />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 flex items-center gap-3">
                <Sparkles className="h-10 w-10 text-blue-500 animate-pulse" />
                Developer Dashboard
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-lg text-gray-600 dark:text-gray-400 font-medium">{developerProfile.company_name}</span>
                {developerProfile.verification_status === 'pending' && (
                  <Badge className="px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-md">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Verification
                  </Badge>
                )}
                {developerProfile.verification_status === 'verified' && (
                  <Badge className="px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                    <Star className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {developerProfile.verification_status === 'rejected' && (
                  <Badge className="px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 shadow-md">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Verification Rejected
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost"
                size="sm"
                onClick={fetchDashboardData}
                className="px-4 py-2 rounded-full bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm shadow-lg hover:bg-white/70 dark:hover:bg-gray-700/70 transition-all duration-300 group"
              >
                <RefreshCw className="h-4 w-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                Refresh Status
              </Button>
              <Button 
                asChild
                className="px-4 py-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-green-500/30 transition-all duration-300 group"
              >
                <Link to="/post-property">
                  <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                  Post New Property
                </Link>
              </Button>
              <Button 
                onClick={() => setShowProjectForm(true)}
                className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group"
              >
                <Plus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Add Project
              </Button>
            </div>
          </div>

          {/* Verification Notice */}
          {developerProfile.verification_status === 'pending' && (
            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 dark:from-yellow-900/20 dark:to-orange-900/20 opacity-70 blur-3xl pointer-events-none"></div>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-yellow-500/20 dark:bg-yellow-700/30 backdrop-blur-sm">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Profile Under Verification</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Your developer profile is being verified by our team. This helps build trust with potential customers.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-6">
            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-blue-500/40">
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-xl animate-pulse-slow"></div>
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Projects</p>
                  <div className="p-2 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm">
                    <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-blue-900 dark:text-blue-100 leading-none">
                  {stats.totalProjects}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">Development projects</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-green-500/40">
              <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-green-400/20 dark:bg-green-600/20 blur-xl animate-pulse-slow delay-100"></div>
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Active Projects</p>
                  <div className="p-2 rounded-full bg-green-500/20 dark:bg-green-700/30 backdrop-blur-sm">
                    <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-green-900 dark:text-green-100 leading-none">
                  {stats.activeProjects}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300 mt-2">Currently active</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-indigo-500/40">
              <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-indigo-400/20 dark:bg-indigo-600/20 blur-xl animate-pulse-slow delay-200"></div>
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">Properties Listed</p>
                  <div className="p-2 rounded-full bg-indigo-500/20 dark:bg-indigo-700/30 backdrop-blur-sm">
                    <Home className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-100 leading-none">
                  {stats.totalProperties}
                </p>
                <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-2">Properties listed</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-purple-500/40">
              <div className="absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-purple-400/20 dark:bg-purple-600/20 blur-xl animate-pulse-slow delay-300"></div>
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Project Inquiries</p>
                  <div className="p-2 rounded-full bg-purple-500/20 dark:bg-purple-700/30 backdrop-blur-sm">
                    <MessageSquare className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-purple-900 dark:text-purple-100 leading-none">
                  {stats.totalInquiries}
                </p>
                <p className="text-sm text-purple-700 dark:text-purple-300 mt-2">Customer interest</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-orange-500/40">
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-orange-400/20 dark:bg-orange-600/20 blur-xl animate-pulse-slow delay-400"></div>
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-orange-800 dark:text-orange-200">Completed</p>
                  <div className="p-2 rounded-full bg-orange-500/20 dark:bg-orange-700/30 backdrop-blur-sm">
                    <Calendar className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-orange-900 dark:text-orange-100 leading-none">
                  {stats.completedProjects}
                </p>
                <p className="text-sm text-orange-700 dark:text-orange-300 mt-2">Successfully delivered</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-teal-500/40">
              <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-teal-400/20 dark:bg-teal-600/20 blur-xl animate-pulse-slow delay-500"></div>
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-teal-800 dark:text-teal-200">Total Proposals</p>
                  <div className="p-2 rounded-full bg-teal-500/20 dark:bg-teal-700/30 backdrop-blur-sm">
                    <Hammer className="h-6 w-6 text-teal-600 dark:text-teal-400" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-teal-900 dark:text-teal-100 leading-none">
                  {stats.totalProposals}
                </p>
                <p className="text-sm text-teal-700 dark:text-teal-300 mt-2">Proposals submitted</p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 transform transition-all duration-300 hover:scale-[1.03] hover:shadow-emerald-500/40">
              <div className="absolute -top-8 -left-8 h-24 w-24 rounded-full bg-emerald-400/20 dark:bg-emerald-600/20 blur-xl animate-pulse-slow delay-600"></div>
              <CardContent className="p-6 flex flex-col justify-between h-full">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Accepted Proposals</p>
                  <div className="p-2 rounded-full bg-emerald-500/20 dark:bg-emerald-700/30 backdrop-blur-sm">
                    <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
                <p className="text-3xl font-extrabold text-emerald-900 dark:text-emerald-100 leading-none">
                  {stats.acceptedProposals}
                </p>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-2">Successfully accepted</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="company" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 dark:from-gray-700/20 dark:to-gray-800/20 rounded-xl shadow-inner border border-gray-200 dark:border-gray-700">
              <TabsTrigger
                value="company"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-blue-400 dark:data-[state=active]:border-blue-700 rounded-lg py-2 px-3 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-300 text-xs md:text-sm"
              >
                <Building className="h-3 w-3 mr-1 md:mr-2" /> Company
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-green-400 dark:data-[state=active]:border-green-700 rounded-lg py-2 px-3 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-green-600 dark:hover:text-green-300 text-xs md:text-sm"
              >
                <Layers className="h-3 w-3 mr-1 md:mr-2" /> Projects
              </TabsTrigger>
              <TabsTrigger
                value="properties"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-indigo-400 dark:data-[state=active]:border-indigo-700 rounded-lg py-2 px-3 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-300 text-xs md:text-sm"
              >
                <Home className="h-3 w-3 mr-1 md:mr-2" /> Properties
              </TabsTrigger>
              <TabsTrigger
                value="redevelopment"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-orange-400 dark:data-[state=active]:border-orange-700 rounded-lg py-2 px-3 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-300 text-xs md:text-sm"
              >
                <Hammer className="h-3 w-3 mr-1 md:mr-2" /> Redevelopment
              </TabsTrigger>
              <TabsTrigger
                value="inquiries"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-purple-400 dark:data-[state=active]:border-purple-700 rounded-lg py-2 px-3 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-300 text-xs md:text-sm"
              >
                <MessageSquare className="h-3 w-3 mr-1 md:mr-2" /> Inquiries
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-[1.02] data-[state=active]:border-teal-400 dark:data-[state=active]:border-teal-700 rounded-lg py-2 px-3 transition-all duration-300 text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-300 text-xs md:text-sm"
              >
                <BarChart3 className="h-3 w-3 mr-1 md:mr-2" /> Analytics
              </TabsTrigger>
            </TabsList>

          <TabsContent value="projects" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Development Projects</CardTitle>
                <CardDescription>Manage your residential and commercial projects</CardDescription>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                    <p className="text-muted-foreground mb-4">Start showcasing your development projects</p>
                    <Button onClick={() => setShowProjectForm(true)}>
                      Add First Project
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                      <Card key={project.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          {project.images?.[0] ? (
                            <img 
                              src={project.images[0]} 
                              alt={project.name}
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
                            <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
                            
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="line-clamp-1">{project.location}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{project.price_range}</span>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            {project.completion_date && (
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="w-4 h-4 mr-1" />
                                <span>Completion: {new Date(project.completion_date).toLocaleDateString()}</span>
                              </div>
                            )}
                            
                            <div className="flex gap-2 pt-2">
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/project/${project.id}`}>
                                  View Details
                                </Link>
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setEditingProject(project);
                                  setShowProjectForm(true);
                                }}
                              >
                                Edit
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

          <TabsContent value="properties" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Properties</CardTitle>
                <CardDescription>Manage your property listings</CardDescription>
              </CardHeader>
              <CardContent>
                {properties.length === 0 ? (
                  <div className="text-center py-8">
                    <Home className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No properties listed yet</h3>
                    <p className="text-muted-foreground mb-4">Start by listing your first property!</p>
                    <Button asChild>
                      <Link to="/post-property">List Property</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {properties.map((property) => (
                      <Card key={property.id} className="overflow-hidden">
                        <div className="aspect-video bg-muted relative">
                          {property.images?.[0] ? (
                            <img 
                              src={property.images[0]} 
                              alt={property.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Home className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg line-clamp-1">{property.title}</h3>
                            
                            <div className="flex items-center text-sm text-muted-foreground">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="line-clamp-1">{property.location}, {property.city}</span>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-lg font-bold text-primary">
                                <IndianRupee className="w-4 h-4" />
                                <span>{property.price.toLocaleString()}</span>
                              </div>
                              
                              <Badge className={getPropertyStatusColor(property.status)}>
                                {property.status}
                              </Badge>
                            </div>

                            <div className="flex gap-1">
                              <Badge variant="outline" className="capitalize text-xs">
                                {property.property_type}
                              </Badge>
                              <Badge variant="outline" className="capitalize text-xs">
                                For {property.listing_type}
                              </Badge>
                            </div>
                            
                            <div className="flex gap-2 pt-2">
                              <Button asChild size="sm" variant="outline" className="flex-1">
                                <Link to={`/property/${property.id}`}>
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Link>
                              </Button>
                              
                              <Button asChild size="sm" variant="outline">
                                <Link to={`/edit-property/${property.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Link>
                              </Button>

                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDeleteProperty(property.id)}
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

          <TabsContent value="redevelopment" className="space-y-4">
            <GlobalRedevelopmentProjects />
          </TabsContent>

          <TabsContent value="inquiries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Inquiries</CardTitle>
                <CardDescription>Customer inquiries about your projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No inquiries yet</h3>
                  <p className="text-muted-foreground">Project inquiries will appear here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Analytics</CardTitle>
                <CardDescription>Track project views and customer engagement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-blue-900 dark:text-blue-100">Project Views</h4>
                    <p className="text-2xl font-bold text-blue-600">{projects.length * 15}</p>
                    <p className="text-sm text-blue-600/70">Total views this month</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-green-900 dark:text-green-100">Inquiries</h4>
                    <p className="text-2xl font-bold text-green-600">{projects.length * 3}</p>
                    <p className="text-sm text-green-600/70">New inquiries</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                    <Star className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-semibold text-purple-900 dark:text-purple-100">Engagement</h4>
                    <p className="text-2xl font-bold text-purple-600">85%</p>
                    <p className="text-sm text-purple-600/70">Response rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <DeveloperProfileForm 
              onUpdate={fetchDashboardData}
              existingProfile={developerProfile}
            />
          </TabsContent>
        </Tabs>

        {/* Proposal Form Modal */}
        {showProposalForm && selectedRequirement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center">
                <h2 className="text-lg font-semibold">Submit Proposal</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setShowProposalForm(false)
                    setSelectedRequirement(null)
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <ProposalForm
                  requirementId={selectedRequirement}
                  onSuccess={() => {
                    setShowProposalForm(false)
                    setSelectedRequirement(null)
                    fetchDashboardData()
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Redevelopment Details Modal */}
        {showRequirementDetails && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
              <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-background z-10">
                <h2 className="text-lg font-semibold">Redevelopment Details</h2>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowRequirementDetails(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <RedevelopmentDetails requirementId={showRequirementDetails} />
              </div>
            </div>
          </div>
        )}

        {/* Project Form Modal */}
        {showProjectForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <ProjectForm
                onSuccess={() => {
                  setShowProjectForm(false);
                  setEditingProject(null);
                  fetchDashboardData();
                }}
                onCancel={() => {
                  setShowProjectForm(false);
                  setEditingProject(null);
                }}
                existingProject={editingProject}
              />
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

export default DeveloperDashboard