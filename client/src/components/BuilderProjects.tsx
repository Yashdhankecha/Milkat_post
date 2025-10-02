import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectCard from "./ProjectCard";
import { useToast } from "@/hooks/use-toast";

const BuilderProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const result = await apiClient.getProjects({ limit: 6 });
      
      if (result.error) throw new Error(result.error);
      const projectsData = result.data?.projects || result.data || [];
      
      // Transform project data to match ProjectCard interface
      const transformedProjects = projectsData.map((project: any) => ({
        id: project._id || project.id,
        name: project.name,
        location: project.location ? 
          `${project.location.address || ''}, ${project.location.city || ''}, ${project.location.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') :
          'Location not specified',
        price_range: project.priceRange ? 
          `₹${project.priceRange.min}${project.priceRange.unit === 'lakh' ? 'L' : project.priceRange.unit === 'crore' ? 'Cr' : ''} - ₹${project.priceRange.max}${project.priceRange.unit === 'lakh' ? 'L' : project.priceRange.unit === 'crore' ? 'Cr' : ''}` :
          'Price on request',
        completion_date: project.completionDate,
        images: project.images?.map((img: any) => 
          typeof img === 'string' ? img : img.url
        ) || [],
        status: project.status === 'under_construction' ? 'ongoing' : 
                project.status === 'ready_to_move' ? 'completed' :
                project.status === 'planning' ? 'planned' : project.status,
        project_type: project.projectType || 'residential',
        total_units: project.totalUnits,
        available_units: project.availableUnits
      }));
      
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: "Error",
        description: "Failed to load projects. Showing sample data.",
        variant: "destructive",
      });
      
      // Fallback to sample data if database fetch fails
      setProjects([
        {
          id: "sample-1",
          name: "Skyline Residences",
          location: "Downtown Mumbai, Maharashtra",
          price_range: "₹45L - ₹1.2Cr",
          completion_date: "2024-12-31",
          images: ["/assets/apartment-1.jpg"],
          status: "ongoing",
          project_type: "residential",
          total_units: 120,
          available_units: 85
        },
        {
          id: "sample-2",
          name: "Garden Villas Estate",
          location: "Suburban Bangalore, Karnataka",  
          price_range: "₹80L - ₹2.5Cr",
          completion_date: "2025-06-30",
          images: ["/assets/villa-1.jpg"],
          status: "planned",
          project_type: "luxury_villas",
          total_units: 45,
          available_units: 45
        },
        {
          id: "sample-3",
          name: "Metro Business Hub",
          location: "Financial District, Delhi", 
          price_range: "₹2Cr - ₹8Cr", 
          completion_date: "2025-03-31",
          images: ["/assets/commercial-1.jpg"],
          status: "ongoing",
          project_type: "commercial",
          total_units: 80,
          available_units: 20
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-estate-gray-light">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-estate-gray-light">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Current Builder Projects</h2>
            <p className="text-muted-foreground">Exclusive new developments from trusted builders</p>
          </div>
          <Button variant="outline" className="group">
            See All Projects
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length > 0 ? (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                location={project.location}
                price_range={project.price_range}
                completion_date={project.completion_date}
                images={project.images || []}
                status={project.status}
                total_units={project.total_units}
                available_units={project.available_units}
                project_type={project.project_type}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No projects available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BuilderProjects;