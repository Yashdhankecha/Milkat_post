import { MapPin, Calendar, Building2, Ruler, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

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
  project_type 
}: ProjectCardProps) => {
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
  
  return (
    <Link to={`/project/${id}`}>
      <Card className="group hover:shadow-strong transition-all duration-300 overflow-hidden border border-border hover:border-estate-blue/20 cursor-pointer">
        <div className="relative">
          <img 
            src={
              images?.[0]?.url || 
              (typeof images?.[0] === 'string' ? images[0] : null) || 
              "/placeholder.svg"
            } 
            alt={name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <Badge className={`absolute top-3 left-3 ${getStatusColor(status)}`}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
          <Badge variant="secondary" className="absolute top-3 right-3">
            {project_type}
          </Badge>
        </div>
        
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-estate-blue transition-colors">
            {name}
          </h3>
          
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">
              {typeof location === 'string' ? location : 
               location && typeof location === 'object' ? 
                 `${location.address || ''}, ${location.city || ''}, ${location.state || ''}`.trim().replace(/^,\s*|,\s*$/g, '') || 'Location not specified' :
               'Location not specified'}
            </span>
          </div>
          
          <div className="flex items-center justify-between mb-3">
            <div className="text-xl font-bold text-estate-blue">
              {price_range}
            </div>
            {total_units && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{available_units || 0}/{total_units} units</span>
              </div>
            )}
          </div>
          
          {completion_date && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span>Expected: {new Date(completion_date).toLocaleDateString()}</span>
            </div>
          )}
          
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProjectCard;