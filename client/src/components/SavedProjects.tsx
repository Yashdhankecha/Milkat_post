import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { Heart, HeartOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProjectCard from "./ProjectCard";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const SavedProjects = () => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.id || profile?.user) {
      fetchSavedProjects();
    }
  }, [profile?.id, profile?.user]);

  const fetchSavedProjects = async (isRefresh = false) => {
    const profileId = profile?.id || profile?.user;
    if (!profileId) {
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const result = await apiClient.getSavedProjects(profileId);
      
      if (result.error) throw new Error(result.error);
      const projectsData = result.data?.projects || [];
      
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
        images: project.images?.map((img: any) => {
          if (!img) return null;
          // Handle both string URLs and object format
          if (typeof img === 'string') {
            return img;
          }
          // Handle object format from database
          return img?.url || null;
        }).filter((url: string | null) => url !== null && url !== '') || [],
        status: project.status === 'under_construction' ? 'ongoing' : 
                project.status === 'ready_to_move' ? 'completed' :
                project.status === 'planning' ? 'planned' : project.status,
        project_type: project.projectType || 'residential',
        total_units: project.totalUnits,
        available_units: project.availableUnits
      }));
      
      setProjects(transformedProjects);
    } catch (error: any) {
      console.error('Error fetching saved projects:', error);
      const errorMessage = error?.message || 'Failed to load saved projects';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setProjects([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveToggle = (projectId: string, isSaved: boolean) => {
    if (!isSaved) {
      // Project was removed from saved list, remove it from local state
      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast({
        title: "Project Removed",
        description: "Project removed from your saved list",
      });
    }
  };

  const handleRefresh = () => {
    fetchSavedProjects(true);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Saved Projects</h2>
            <p className="text-muted-foreground">Projects you've saved for later</p>
          </div>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading saved projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Saved Projects</h2>
          <p className="text-muted-foreground">Projects you've saved for later</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {error ? (
        <div className="text-center py-12">
          <div className="text-red-500 mb-4">
            <HeartOff className="h-16 w-16 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Saved Projects</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Try Again
          </Button>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-12">
          <HeartOff className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No saved projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Start exploring projects and save the ones you like to view them here later.
          </p>
          <Button asChild>
            <a href="/projects">Browse Projects</a>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
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
              showSaveButton={true}
              isSaved={true}
              onSaveToggle={handleSaveToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SavedProjects;
