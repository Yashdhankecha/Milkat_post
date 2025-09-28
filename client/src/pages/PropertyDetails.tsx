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
import PropertyCard from "@/components/PropertyCard";
import { 
  Heart, 
  Share2, 
  MapPin, 
  Home, 
  Ruler, 
  IndianRupee,
  Phone,
  Mail,
  MessageCircle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const PropertyDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [property, setProperty] = useState<any>(null);
  const [relatedProperties, setRelatedProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
      fetchRelatedProperties();
      checkIfSaved();
    }
  }, [id, user]);

  const fetchPropertyDetails = async () => {
    try {
      // First get the property
      const { data: propertyData, error: propertyError } = await apiClient
        
        
        .maybeSingle();

      if (propertyError) throw propertyError;

      // Then get the owner profile if property exists
      let ownerProfile = null;
      if (propertyData?.owner_id) {
        const { data: profileData } = await apiClient
          
          
          .maybeSingle();
        
        ownerProfile = profileData;
      }

      // Combine the data
      const combinedData = propertyData ? {
        ...propertyData,
        profiles: ownerProfile
      } : null;

      setProperty(combinedData);
    } catch (error) {
      console.error('Error fetching property:', error);
      toast({
        title: "Error",
        description: "Failed to load property details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProperties = async () => {
    try {
      const { data, error } = await apiClient
        
        .neq('id', id)
        ;

      if (error) throw error;
      setRelatedProperties(data || []);
    } catch (error) {
      console.error('Error fetching related properties:', error);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;

    try {
      const { data } = await apiClient
        
        
        
        ;

      setIsSaved(!!data);
    } catch (error) {
      // Property not saved, which is fine
    }
  };

  const toggleSave = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save properties.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isSaved) {
        await apiClient
          .delete()
          
          ;
        
        setIsSaved(false);
        toast({ title: "Property removed from favorites" });
      } else {
        await apiClient
          ({
            user_id: user.id,
            property_id: id
          });
        
        setIsSaved(true);
        toast({ title: "Property saved to favorites" });
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send an email or notification
    toast({
      title: "Message Sent",
      description: "Your message has been sent to the property owner.",
    });
    setContactForm({ name: '', email: '', phone: '', message: '' });
  };

  const nextImage = () => {
    if (property?.images?.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.images?.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-estate-blue"></div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Property Not Found</h2>
          <Link to="/properties">
            <Button>Browse Properties</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back Button */}
      <div className="container mx-auto px-6 py-4">
        <Link to="/">
          <Button variant="ghost" className="flex items-center gap-2 hover:bg-accent">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>

      {/* Property Images Gallery */}
      <section className="relative">
        <div className="h-96 md:h-[500px] bg-gradient-card relative overflow-hidden">
          {property.images && property.images.length > 0 ? (
            <div className="relative w-full h-full">
              <img
                src={property.images[currentImageIndex]}
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {/* Navigation Arrows */}
              {property.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              {/* Image Counter */}
              {property.images.length > 1 && (
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {property.images.length}
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-estate-gray-light">
              <Home className="w-20 h-20 text-estate-gray" />
            </div>
          )}
        </div>
        
        {/* Image Thumbnails */}
        {property.images && property.images.length > 1 && (
          <div className="container mx-auto px-6 py-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {property.images.map((image: string, index: number) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex 
                      ? 'border-estate-blue' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white"
            onClick={toggleSave}
          >
            <Heart className={`w-4 h-4 mr-2 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
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
            {/* Property Header */}
            <div>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">{property.title}</h1>
                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{property.location}, {property.city}, {property.state}</span>
                  </div>
                </div>
                <Badge variant={property.status === 'available' ? 'default' : 'secondary'}>
                  {property.status}
                </Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-lg">
                <div className="flex items-center">
                  <IndianRupee className="w-5 h-5 mr-2 text-estate-blue" />
                  <span className="font-semibold">₹{property.price.toLocaleString()}</span>
                </div>
                <div className="flex items-center">
                  <Ruler className="w-5 h-5 mr-2 text-estate-blue" />
                  <span>{property.area} sq.ft</span>
                </div>
                <div className="flex items-center">
                  <Home className="w-5 h-5 mr-2 text-estate-blue" />
                  <span className="capitalize">{property.property_type}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Description</h2>
              <p className="text-muted-foreground leading-relaxed">
                {property.description || "No description available for this property."}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div>
                <h2 className="text-2xl font-semibold mb-4">Amenities</h2>
                <div className="flex flex-wrap gap-2">
                  {property.amenities.map((amenity: string, index: number) => (
                    <Badge key={index} variant="outline">
                      {amenity}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Owner */}
            <Card>
              <CardHeader>
                <CardTitle>Contact Owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.profiles && (
                  <div className="p-4 bg-estate-blue-lighter/20 rounded-lg">
                    <h3 className="font-semibold mb-2">{property.profiles.full_name || 'Property Owner'}</h3>
                    {property.profiles.phone && (
                      <div className="flex items-center mb-2">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{property.profiles.phone}</span>
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
                      placeholder="I'm interested in this property..."
                      value={contactForm.message}
                      onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Related Properties */}
        {relatedProperties.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-semibold mb-8">Related Properties</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProperties.map((relatedProperty) => (
                 <PropertyCard
                   key={relatedProperty.id}
                   id={relatedProperty.id}
                   title={relatedProperty.title}
                   location={`${relatedProperty.location}, ${relatedProperty.city}`}
                   price={relatedProperty.listing_type === 'rent' ? `₹${relatedProperty.monthly_rent}/month` : `₹${relatedProperty.price.toLocaleString()}`}
                   area={`${relatedProperty.area} sq.ft`}
                   image={relatedProperty.images?.[0] || "/placeholder.svg"}
                   type={relatedProperty.property_type}
                   status={relatedProperty.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                 />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default PropertyDetails;