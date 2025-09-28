import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PropertyCard from "./PropertyCard";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

const FeaturedProperties = () => {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const result = await apiClient.getProperties({ limit: 6, status: 'active' });
      
      if (result.error) throw new Error(result.error);
      const propertiesData = result.data?.properties || result.data || [];
      setProperties(propertiesData);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to load properties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">Featured Properties</h2>
            <p className="text-muted-foreground">Discover our handpicked premium properties</p>
          </div>
          <Button variant="outline" className="group" onClick={() => navigate('/properties')}>
            See All Properties
            <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.length > 0 ? (
            properties.map((property) => {
              const primaryImage = property.images?.find(img => img.isPrimary) || property.images?.[0];
              const imageUrl = primaryImage?.url || primaryImage || "/placeholder.svg";
              const displayPrice = property.listingType === 'rent' 
                ? `₹${(property.monthlyRent || property.price).toLocaleString()}/month`
                : `₹${property.price.toLocaleString()}`;
              const locationText = `${property.location?.address || ''}, ${property.location?.city || ''}`;
              const propertyTypeDisplay = property.propertyType?.charAt(0).toUpperCase() + property.propertyType?.slice(1) || 'Property';
              const statusDisplay = property.listingType === 'rent' ? 'For Rent' : 
                                   property.status === 'active' ? 'For Sale' : 
                                   property.status === 'sold' ? 'Sold' : 'For Sale';
              
              return (
                <PropertyCard 
                  key={property._id} 
                  id={property._id}
                  title={property.title}
                  location={locationText}
                  price={displayPrice}
                  area={`${property.area} sq ft`}
                  image={imageUrl}
                  type={propertyTypeDisplay}
                  status={statusDisplay}
                />
              );
            })
          ) : (
            <div className="col-span-full text-center py-8">
              <p className="text-muted-foreground">No properties available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProperties;