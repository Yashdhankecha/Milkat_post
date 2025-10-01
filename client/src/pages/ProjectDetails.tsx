import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
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
  Home
} from "lucide-react";

const ProjectDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
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
    if (id) {
      fetchProjectDetails();
      fetchRelatedProjects();
    }
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      // First try to get as regular project
      let response = await apiClient.getProject(id!);
      
      // If that fails, try as redevelopment project
      if (response.error) {
        console.log('Regular project not found, trying redevelopment project...');
        response = await apiClient.getRedevelopmentProject(id!);
      }
      
      if (response.error) throw new Error(response.error);
      setProject(response.data);
    } catch (error) {
      console.error('Error fetching project:', error);
      toast({
        title: "Error",
        description: "Failed to load project details.",
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
      const related = projects.filter((p: any) => p._id !== id).slice(0, 3);
      setRelatedProjects(related);
    } catch (error) {
      console.error('Error fetching related projects:', error);
      // Set empty array on error to prevent crashes
      setRelatedProjects([]);
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
      await apiClient
        ({
          user_id: user.id,
          project_id: id,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-estate-blue"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Project Not Found</h2>
          <Link to="/projects">
            <Button>Browse Projects</Button>
          </Link>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Project Images */}
      <section className="relative">
        <div className="h-96 md:h-[500px] bg-gradient-card">
          {project.images && project.images[0] ? (
            <img
              src={project.images[0]}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-estate-gray-light">
              <Building2 className="w-20 h-20 text-estate-gray" />
            </div>
          )}
        </div>
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{project.name}</h1>
                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{project.location}</span>
                  </div>
                </div>
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-lg">
                <div className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2 text-estate-blue" />
                  <span className="font-semibold">{project.price_range}</span>
                </div>
                {project.total_units && (
                  <div className="flex items-center">
                    <Users className="w-5 h-5 mr-2 text-estate-blue" />
                    <span>{project.available_units || 0}/{project.total_units} units</span>
                  </div>
                )}
                {project.completion_date && (
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-estate-blue" />
                    <span>Expected: {new Date(project.completion_date).toLocaleDateString()}</span>
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

            {/* Floor Plans */}
            {project.floor_plans && Object.keys(project.floor_plans).length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Floor Plans</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(project.floor_plans).map(([type, details]: [string, any]) => (
                    <Card key={type}>
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 capitalize">{type.replace('_', ' ')}</h3>
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
          <div className="space-y-6">
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
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={contactForm.name}
                      onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={contactForm.email}
                      onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={contactForm.phone}
                      onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Message</Label>
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