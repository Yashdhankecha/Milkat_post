import { MapPin, Calendar, Building2, Ruler, Users, Heart, HeartOff, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/lib/api";

interface ProjectCardProps {
  id: string;
  name: string;
  location: string;
  price_range: string;
  completion_date: string | null;
  images: string[];
  status: string;
  total_units?: number;
  available_units?: number;
  project_type: string;
  showSaveButton?: boolean;
  isSaved?: boolean;
  onSaveToggle?: (projectId: string, isSaved: boolean) => void;
}

const ProjectCard = ({ 
  id, 
  name, 
  location, 
  price_range, 
  completion_date, 
  images, 
  status, 
  total_units, 
  available_units,
  project_type,
  showSaveButton = false,
  isSaved = false,
  onSaveToggle
}: ProjectCardProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [saved, setSaved] = useState(isSaved);
  const [saving, setSaving] = useState(false);

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!profile) {
      toast({
        title: "Authentication Required",
        description: "Please log in to save projects",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (saved) {
        await apiClient.unsaveProject(id);
        setSaved(false);
        toast({
          title: "Project Removed",
          description: "Project removed from your saved list",
        });
        onSaveToggle?.(id, false);
      } else {
        await apiClient.saveProject(id);
        setSaved(true);
        toast({
          title: "Project Saved",
          description: "Project added to your saved list",
        });
        onSaveToggle?.(id, true);
      }
    } catch (error: any) {
      console.error('Error toggling save status:', error);
      const errorMessage = error?.message || 'Failed to update save status';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "bg-blue-500 text-white";
      case "completed":
        return "bg-green-500 text-white";
      case "planned":
        return "bg-yellow-500 text-white";
      case "on_hold":
        return "bg-gray-500 text-white";
      default:
        return "bg-blue-500 text-white";
    }
  };

  console.log('ProjectCard rendering with id:', id);
  console.log('ProjectCard images:', images);
  
  // Validate ID before rendering
  if (!id || id === 'undefined' || id === 'null' || id.trim() === '') {
    console.error('ProjectCard: Invalid project ID:', id);
    return (
      <Card className="p-4 text-center">
        <p className="text-red-500">Invalid Project ID</p>
      </Card>
    );
  }
  
  return (
    <Link to={`/project/${id}`}>
      <Card className="group hover:shadow-strong transition-all duration-300 overflow-hidden border border-border hover:border-estate-blue/20 cursor-pointer h-full flex flex-col">
        <div className="relative">
          <img 
            src={
              images && images.length > 0 ? (
                typeof images[0] === 'string' ? images[0] : 
                images[0]?.url || "/placeholder.svg"
              ) : "/placeholder.svg"
            } 
            alt={name}
            className="w-full h-40 sm:h-48 lg:h-52 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              console.log('Image failed to load:', e.currentTarget.src);
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <Badge className={`absolute top-2 left-2 sm:top-3 sm:left-3 text-xs sm:text-sm ${getStatusColor(status)}`}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-1 sm:gap-2">
            <Badge variant="secondary" className="text-xs sm:text-sm">
              {project_type}
            </Badge>
            {showSaveButton && profile && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 sm:h-8 sm:w-8 p-0 bg-white/90 hover:bg-white text-gray-600 hover:text-red-500"
                onClick={handleSaveToggle}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                ) : saved ? (
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4 fill-red-500 text-red-500" />
                ) : (
                  <HeartOff className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
        
        <CardContent className="p-3 sm:p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-base sm:text-lg text-foreground mb-2 group-hover:text-estate-blue transition-colors line-clamp-2">
            {name}
          </h3>
          
          <div className="flex items-start gap-2 text-muted-foreground mb-3">
            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 shrink-0" />
            <span className="text-xs sm:text-sm line-clamp-2">
              {typeof location === 'string' ? location : 
               location && typeof location === 'object' ? 
                 `${location.address || ''}, ${location.city || ''}, ${location.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'Location not specified' :
                 'Location not specified'}
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="text-lg sm:text-xl font-bold text-estate-blue">
              {price_range}
            </div>
            {total_units && (
              <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{available_units || 0}/{total_units} units</span>
                <span className="sm:hidden">{available_units || 0}/{total_units}</span>
              </div>
            )}
          </div>
          
          {completion_date && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mt-auto">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Expected: {new Date(completion_date).toLocaleDateString()}</span>
            </div>
          )}
          
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;