import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import ProjectCard from "@/components/ProjectCard";
import { 
  Heart, 
  Share2, 
  MapPin, 
  Building2, 
  Users, 
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  Home,
  FileText,
  ArrowLeft
} from "lucide-react";

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Extract ID from URL if useParams fails
  const projectId = id || window.location.pathname.split('/').pop();
  
  // Additional fallback: try to extract from URL hash or query params
  const urlParams = new URLSearchParams(window.location.search);
  const hashId = window.location.hash.split('/').pop();
  const finalProjectId = projectId || urlParams.get('id') || hashId;
  
  console.log('ProjectDetails component loaded with ID:', id);
  console.log('Extracted project ID:', projectId);
  console.log('Current URL:', window.location.href);
  console.log('URL pathname:', window.location.pathname);
  console.log('URL search params:', window.location.search);
  console.log('URL hash:', window.location.hash);
  console.log('useParams result:', useParams());
  console.log('Final Project ID:', finalProjectId);
  
  // Additional debugging for URL parsing
  const urlParts = window.location.pathname.split('/');
  console.log('URL parts:', urlParts);
  console.log('Last URL part:', urlParts[urlParts.length - 1]);
  console.log('Is last part "undefined"?', urlParts[urlParts.length - 1] === 'undefined');
  const [project, setProject] = useState<any>(null);
  const [relatedProjects, setRelatedProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    // Check if we have a valid project ID (not undefined, not empty, not the string 'undefined')
    const isValidId = finalProjectId && 
                     finalProjectId !== 'undefined' && 
                     finalProjectId !== '' && 
                     finalProjectId.length > 0 &&
                     finalProjectId !== 'null' &&
                     !finalProjectId.includes('undefined');
    
    if (isValidId) {
      fetchProjectDetails();
      fetchRelatedProjects();
    } else {
      console.error('Project ID is undefined or invalid:', { id, projectId, finalProjectId });
      console.log('Current URL:', window.location.href);
      console.log('URL pathname:', window.location.pathname);
      
      // Check if the URL itself contains "undefined"
      const urlContainsUndefined = window.location.href.includes('/undefined');
      console.log('URL contains "undefined":', urlContainsUndefined);
      
      const errorMessage = urlContainsUndefined 
        ? "The URL contains 'undefined' instead of a valid project ID. This usually happens when navigation occurs with an undefined project ID."
        : "The project ID in the URL is invalid or missing.";
      
      toast({
        title: "Invalid Project ID",
        description: errorMessage + " Redirecting to projects page.",
        variant: "destructive",
      });
      
      // Redirect to projects page after a short delay
      setTimeout(() => {
        navigate('/projects');
      }, 2000);
      
      setLoading(false);
    }
  }, [finalProjectId]);

  const fetchProjectDetails = async () => {
    // Use the same validation logic
    const isValidId = finalProjectId && 
                     finalProjectId !== 'undefined' && 
                     finalProjectId !== '' && 
                     finalProjectId.length > 0 &&
                     finalProjectId !== 'null' &&
                     !finalProjectId.includes('undefined');
    
    if (!isValidId) {
      console.error('Cannot fetch project details: ID is invalid:', finalProjectId);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching project details for ID:', finalProjectId);
      
      // First try to get as regular project
      let response = await apiClient.getProject(finalProjectId);
      console.log('Regular project response:', response);
      
      // If that fails, try as redevelopment project
      if (response.error) {
        console.log('Regular project not found, trying redevelopment project...');
        response = await apiClient.getRedevelopmentProject(finalProjectId);
        console.log('Redevelopment project response:', response);
      }
      
      if (response.error) {
        console.error('Both project types failed:', response.error);
        toast({
          title: "Project Not Found",
          description: "The project you're looking for doesn't exist or has been removed.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      console.log('Project data received:', response.data);
      
      // Handle different response structures
      const rawProject = response.data?.project || response.data;
      console.log('Raw project data:', rawProject);
      
      if (!rawProject) {
        throw new Error('No project data found in response');
      }
      
      // Transform the data to match the expected structure
      const projectData = {
        ...rawProject,
        name: rawProject.name || rawProject.title || 'Untitled Project', // Handle both regular and redevelopment projects
        location: rawProject.location ? 
          (typeof rawProject.location === 'string' ? rawProject.location :
           `${rawProject.location.address || ''}, ${rawProject.location.city || ''}, ${rawProject.location.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')) :
          'Location not specified',
        price_range: rawProject.priceRange ? 
          `₹${rawProject.priceRange.min}${rawProject.priceRange.unit === 'lakh' ? 'L' : rawProject.priceRange.unit === 'crore' ? 'Cr' : ''} - ₹${rawProject.priceRange.max}${rawProject.priceRange.unit === 'lakh' ? 'L' : rawProject.priceRange.unit === 'crore' ? 'Cr' : ''}` :
          rawProject.price_range || 'Price on request',
        total_units: rawProject.totalUnits || rawProject.total_units,
        available_units: rawProject.availableUnits || rawProject.available_units,
        completion_date: rawProject.completionDate || rawProject.completion_date || rawProject.timeline?.expectedCompletionDate,
        status: rawProject.status || 'unknown',
        amenities: rawProject.amenities || rawProject.expectedAmenities || [],
        images: rawProject.images || [],
        brochures: rawProject.brochures || [], // Keep brochures for regular projects
        documents: rawProject.documents || [], // Keep documents for redevelopment projects
        description: rawProject.description || 'No description available',
        developers: rawProject.developer || rawProject.developers, // Handle developer info
        project_type: rawProject.projectType || rawProject.project_type || 'residential'
      };
      
      console.log('Transformed project data:', projectData);
      setProject(projectData);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to load project details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProjects = async () => {
    try {
      const response = await apiClient.getProjects();
      
      if (response.error) throw new Error(response.error);
      
      // Handle different response formats
      let projects = [];
      if (Array.isArray(response.data)) {
        projects = response.data;
      } else if (response.data && Array.isArray(response.data.projects)) {
        projects = response.data.projects;
      } else if (response.data && Array.isArray(response.data.data)) {
        projects = response.data.data;
      }
      
      // Filter out the current project and limit to 3 related projects
      const filteredProjects = projects.filter((p: any) => p._id !== id).slice(0, 3);
      
      // Transform the related projects to match ProjectCard interface
      const transformedRelated = filteredProjects.map((project: any) => ({
        id: project._id || project.id,
        name: project.name,
        location: project.location ? 
          (typeof project.location === 'string' ? project.location :
           `${project.location.address || ''}, ${project.location.city || ''}, ${project.location.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')) :
          'Location not specified',
        price_range: project.priceRange ? 
          `₹${project.priceRange.min}${project.priceRange.unit === 'lakh' ? 'L' : project.priceRange.unit === 'crore' ? 'Cr' : ''} - ₹${project.priceRange.max}${project.priceRange.unit === 'lakh' ? 'L' : project.priceRange.unit === 'crore' ? 'Cr' : ''}` :
          project.price_range || 'Price on request',
        completion_date: project.completionDate || project.completion_date,
        images: project.images?.map((img: any) => {
          if (!img) return null;
          return typeof img === 'string' ? img : img?.url || null;
        }).filter(Boolean) || [],
        status: project.status === 'under_construction' ? 'ongoing' : 
                project.status === 'ready_to_move' ? 'completed' :
                project.status === 'planning' ? 'planned' : project.status,
        project_type: project.projectType || project.project_type || 'residential',
        total_units: project.totalUnits || project.total_units,
        available_units: project.availableUnits || project.available_units
      }));
      
      setRelatedProjects(transformedRelated);
    } catch (error) {
      console.error('Error fetching related projects:', error);
      // Set empty array on error to prevent crashes
      setRelatedProjects([]);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: project.name,
      text: `Check out this amazing project: ${project.name}`,
      url: window.location.href
    };

    // Check if Web Share API is supported (mainly mobile)
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User cancelled sharing or error occurred
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
          // Fallback to copy to clipboard
          await copyToClipboard();
        }
      }
    } else {
      // Fallback for desktop browsers
      await copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Project link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      fallbackCopyToClipboard();
    }
  };

  const fallbackCopyToClipboard = () => {
    const textArea = document.createElement('textarea');
    textArea.value = window.location.href;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      toast({
        title: "Link Copied!",
        description: "Project link has been copied to your clipboard.",
      });
    } catch (error) {
      console.error('Fallback copy failed:', error);
      toast({
        title: "Copy Failed",
        description: "Unable to copy link. Please copy manually from the address bar.",
        variant: "destructive",
      });
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to contact developers.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiClient.createInquiry({
        user_id: user.id,
        project_id: projectId,
        developer_id: project?.developer_id,
        inquiry_type: 'project_inquiry',
        subject: `Interest in ${project?.name}`,
        message: contactForm.message,
        contact_preference: 'email'
      });

      toast({
        title: "Message Sent",
        description: "Your inquiry has been sent to the developer.",
      });
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error sending inquiry:', error);
      toast({
        title: "Error",
        description: "Failed to send inquiry. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Early return for invalid IDs
  if (!projectId || projectId === 'undefined') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Invalid Project ID</h2>
          <p className="text-muted-foreground mb-4">The project ID in the URL is invalid or missing.</p>
          <Link to="/projects">
            <Button>Browse Projects</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-estate-blue mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist or has been removed.</p>
          <div className="flex gap-4 justify-center">
            <Link to="/projects">
              <Button>Browse Projects</Button>
            </Link>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing": return "bg-blue-500 text-white";
      case "completed": return "bg-green-500 text-white"; 
      case "planned": return "bg-yellow-500 text-white";
      case "on_hold": return "bg-gray-500 text-white";
      default: return "bg-blue-500 text-white";
    }
  };

  console.log('ProjectDetails rendering with project:', project);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Project Media Gallery */}
      <section className="relative">
        <div className="h-96 md:h-[500px] bg-gradient-card">
          {project.images && project.images[0] ? (
            <img
              src={
                project.images[0]?.url || 
                (typeof project.images[0] === 'string' ? project.images[0] : null)
              }
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-estate-gray-light">
              <Building2 className="w-20 h-20 text-estate-gray" />
            </div>
          )}
        </div>
        
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Project Header */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-6 gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">{project.name || 'Untitled Project'}</h1>
                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="break-words">{project.location || 'Location not specified'}</span>
                  </div>
                </div>
                <Badge className={`${getStatusColor(project.status)} self-start`}>
                  {project.status ? project.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-base sm:text-lg">
                <div className="flex items-center min-w-0">
                  <Building2 className="w-5 h-5 mr-2 text-estate-blue flex-shrink-0" />
                  <span className="font-semibold truncate">{project.price_range || 'Price on request'}</span>
                </div>
                {project.total_units && (
                  <div className="flex items-center min-w-0">
                    <Users className="w-5 h-5 mr-2 text-estate-blue flex-shrink-0" />
                    <span className="truncate">{project.available_units || 0}/{project.total_units} units</span>
                  </div>
                )}
                {project.completion_date && (
                  <div className="flex items-center min-w-0">
                    <Calendar className="w-5 h-5 mr-2 text-estate-blue flex-shrink-0" />
                    <span className="truncate">Expected: {new Date(project.completion_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">About Project</h2>
              <p className="text-muted-foreground leading-relaxed">
                {project.description || "No description available for this project."}
              </p>
            </div>

            {/* Amenities */}
            {project.amenities && project.amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {project.amenities.map((amenity: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Project Images Gallery */}
            {project.images && project.images.length > 1 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Project Images</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {project.images.map((image: any, index: number) => (
                    <div key={index} className="relative group cursor-pointer">
                      <img
                        src={image?.url || (typeof image === 'string' ? image : null)}
                        alt={`${project.name} - Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border hover:shadow-lg transition-shadow"
                      />
                      {image?.isPrimary && (
                        <Badge className="absolute top-2 left-2 text-xs">Primary</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Videos */}
            {project.videos && project.videos.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Project Videos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {project.videos.map((video: any, index: number) => (
                    <div key={index} className="relative">
                      <video
                        src={video?.url || (typeof video === 'string' ? video : null)}
                        controls
                        className="w-full h-64 object-cover rounded-lg border"
                        poster={video?.thumbnail}
                      >
                        Your browser does not support the video tag.
                      </video>
                      {video?.caption && (
                        <p className="text-sm text-muted-foreground mt-2">{video.caption}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Project Brochures */}
            {project.brochures && project.brochures.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Project Brochures</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.brochures.map((brochure: any, index: number) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {brochure?.name || `Project Brochure ${index + 1}`}
                            </h3>
                            <p className="text-sm text-muted-foreground">PDF Document</p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = brochure?.url || (typeof brochure === 'string' ? brochure : null);
                              if (url) window.open(url, '_blank');
                            }}
                          >
                            View PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Project Documents (for redevelopment projects) */}
            {project.documents && project.documents.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Project Documents</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.documents.map((document: any, index: number) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-6 w-6 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">
                              {document?.name || `Project Document ${index + 1}`}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {document?.type ? document.type.replace('_', ' ').toUpperCase() : 'PDF Document'}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const url = document?.url || (typeof document === 'string' ? document : null);
                              if (url) window.open(url, '_blank');
                            }}
                          >
                            View PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Floor Plans */}
            {project.floor_plans && Object.keys(project.floor_plans).length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Floor Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(project.floor_plans).map(([type, details]: [string, any]) => (
                    <Card key={type}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 capitalize">{type ? type.replace('_', ' ') : 'Unknown Type'}</h3>
                        <div className="space-y-2 text-sm">
                          {details.area && <p>Area: {details.area}</p>}
                          {details.price && <p>Price: {details.price}</p>}
                          {details.description && <p>{details.description}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-8">
            {/* Contact Developer */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Developer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.developers && (
                  <div className="p-4 bg-estate-blue-lighter/20 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      {project.developers.company_name || 'Developer'}
                      {project.developers.verification_status === 'verified' && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Verified</Badge>
                      )}
                    </h3>
                    {project.developers.website && (
                      <div className="flex items-center mb-2">
                        <Mail className="w-4 h-4 mr-2" />
                        <a 
                          href={project.developers.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      placeholder="Your full name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone *</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      placeholder="+91 9876543210"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="I'm interested in this project..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Inquiry
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-semibold mb-8">Similar Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProjects.map((relatedProject) => (
                <ProjectCard
                  key={relatedProject.id}
                  id={relatedProject.id}
                  name={relatedProject.name}
                  location={relatedProject.location}
                  price_range={relatedProject.price_range}
                  completion_date={relatedProject.completion_date}
                  images={relatedProject.images || []}
                  status={relatedProject.status}
                  total_units={relatedProject.total_units}
                  available_units={relatedProject.available_units}
                  project_type={relatedProject.project_type}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProjectDetails;