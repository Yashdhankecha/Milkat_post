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

interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  price_range: string;
  completion_date: string;
  images: string[];
  builder: string;
  status: string;
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
      setProjects(result.data || []);
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
      case 'completed':
        return 'bg-estate-success text-white';
      case 'ongoing':
        return 'bg-estate-blue text-white';
      case 'planning':
        return 'bg-estate-warning text-white';
      default:
        return 'bg-estate-gray text-white';
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
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
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
                <Card key={project.id} className="overflow-hidden hover:shadow-medium transition-shadow cursor-pointer">
                  <div className="relative h-48 bg-gradient-card">
                    {project.images && project.images[0] ? (
                      <img
                        src={project.images[0]}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Building className="w-16 h-16 text-estate-gray" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge className={getStatusColor(project.status)}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{project.name}</h3>
                    
                    <div className="space-y-2 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{project.location}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Building className="w-4 h-4 mr-2" />
                        <span>by {project.builder}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <IndianRupee className="w-4 h-4 mr-2" />
                        <span>{project.price_range}</span>
                      </div>
                      
                      {project.completion_date && (
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>Completion: {new Date(project.completion_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {project.description && (
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {project.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
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