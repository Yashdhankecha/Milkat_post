import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Calendar, Building, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ProjectCard from "@/components/ProjectCard";

interface Project {
  _id: string;
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
  };
  priceRange: {
    min: number;
    max: number;
    unit: string;
  };
  completionDate: string;
  images: any[];
  developer: {
    _id: string;
    phone: string;
  };
  status: string;
  projectType: string;
  totalUnits: number;
  availableUnits: number;
}

const Projects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, [sortBy, filterStatus, searchTerm]);

  const fetchProjects = async () => {
    try {
      // Apply filters
      if (filterStatus !== 'all') {
        // Apply status filter
        // This would be handled by the API client
      }

      // Apply search
      if (searchTerm) {
        // Apply search filter
        // This would be handled by the API client
      }

      // Apply sorting
      // This would be handled by the API client

      const result = await apiClient.getProjects();

      if (result.error) throw result.error;
      setProjects(result.data?.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready_to_move':
        return 'bg-green-500 text-white';
      case 'under_construction':
        return 'bg-blue-500 text-white';
      case 'planning':
        return 'bg-yellow-500 text-white';
      case 'launched':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'ready_to_move':
        return 'Ready to Move';
      case 'under_construction':
        return 'Under Construction';
      case 'planning':
        return 'Planning';
      case 'launched':
        return 'Launched';
      default:
        return status;
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <Header />
      {/* Header */}
      <section className="bg-gradient-hero py-16">
        <div className="container mx-auto px-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Builder Projects
          </h1>
          <p className="text-xl text-white/90 text-center max-w-2xl mx-auto">
            Explore ongoing and upcoming real estate projects from leading developers 
            and builders across the country.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="py-8 border-b">
        <div className="container mx-auto px-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="planning">Planning</SelectItem>
                    <SelectItem value="under_construction">Under Construction</SelectItem>
                    <SelectItem value="ready_to_move">Ready to Move</SelectItem>
                    <SelectItem value="launched">Launched</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Newest First</SelectItem>
                    <SelectItem value="completion_date">Completion Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={fetchProjects} variant="outline">
                  Refresh
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Projects Grid */}
      <section className="py-12">
        <div className="container mx-auto px-6">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map((project) => (
                <ProjectCard
                  key={project._id}
                  id={project._id}
                  name={project.name}
                  location={`${project.location?.city || ''}, ${project.location?.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '')}
                  price_range={`₹${project.priceRange?.min || 0} - ₹${project.priceRange?.max || 0} ${project.priceRange?.unit || ''}`}
                  completion_date={project.completionDate}
                  images={project.images?.map((img: any) => {
                    if (!img) return null;
                    return typeof img === 'string' ? img : img?.url || null;
                  }).filter(Boolean) || []}
                  status={project.status === 'under_construction' ? 'ongoing' : 
                          project.status === 'ready_to_move' ? 'completed' :
                          project.status === 'planning' ? 'planned' : project.status}
                  project_type={project.projectType || 'residential'}
                  total_units={project.totalUnits}
                  available_units={project.availableUnits}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-2xl font-semibold mb-4">No Projects Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Projects;