import { MapPin, Calendar, Ruler } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface PropertyCardProps {
  id: string;
  title: string;
  location: string;
  price: string;
  area: string;
  image: string;
  type: string;
  status: "For Sale" | "For Rent" | "Sold";
}

const PropertyCard = ({ id, title, location, price, area, image, type, status }: PropertyCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "For Sale":
        return "bg-estate-success text-white";
      case "For Rent":
        return "bg-accent text-accent-foreground";
      case "Sold":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-estate-success text-white";
    }
  };

  // Handle image fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/placeholder.svg';
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Image loaded successfully
  };

  return (
    <Link to={`/property/${id}`}>
      <Card className="group hover:shadow-strong transition-all duration-500 overflow-hidden border border-border hover:border-estate-blue/20 cursor-pointer hover-lift smooth-transition">
      <div className="relative overflow-hidden">
        <img 
          src={image || '/placeholder.svg'} 
          alt={title}
          className="w-full h-48 object-cover group-hover:scale-110 transition-all duration-500 ease-out"
          onError={handleImageError}
          onLoad={handleImageLoad}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        <Badge className={`absolute top-3 left-3 ${getStatusColor(status)} smooth-transition group-hover:scale-105`}>
          {status}
        </Badge>
        <Badge variant="secondary" className="absolute top-3 right-3 smooth-transition group-hover:scale-105">
          {type}
        </Badge>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-estate-blue transition-colors">
          {title}
        </h3>
        
        <div className="flex items-center gap-2 text-muted-foreground mb-3">
          <MapPin className="h-4 w-4" />
          <span className="text-sm">{location}</span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div className="text-2xl font-bold text-estate-blue">
            {price}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Ruler className="h-4 w-4" />
            <span>{area}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

export default PropertyCard;