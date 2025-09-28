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
  const [shareCount, setShareCount] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareMethod, setShareMethod] = useState('');
  const [shareWith, setShareWith] = useState('');

  useEffect(() => {
    if (id) {
      fetchPropertyDetails();
      checkIfSaved();
      fetchShareCount();
    }
  }, [id, user]);

  useEffect(() => {
    if (property) {
      fetchRelatedProperties();
    }
  }, [property]);

  const fetchPropertyDetails = async () => {
    try {
      if (!id) return;
      
      const result = await apiClient.getProperty(id);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      const propertyData = result.data?.property || result.data;
      console.log('Property details loaded:', propertyData);
      setProperty(propertyData);
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
      if (!id) return;
      
      // Fetch related properties with same property type and location
      const params = {
        propertyType: property?.propertyType,
        city: property?.location?.city,
        limit: 3
      };
      
      const result = await apiClient.getProperties(params);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Filter out current property
      const relatedData = result.data?.properties || result.data || [];
      const filteredRelated = relatedData.filter((p: any) => p._id !== id);
      setRelatedProperties(filteredRelated);
    } catch (error) {
      console.error('Error fetching related properties:', error);
    }
  };

  const checkIfSaved = async () => {
    if (!user) return;

    try {
      // For now, we'll implement a simple localStorage-based favorites
      const savedProperties = JSON.parse(localStorage.getItem('saved_properties') || '[]');
      setIsSaved(savedProperties.includes(id));
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
      const savedProperties = JSON.parse(localStorage.getItem('saved_properties') || '[]');
      
      if (isSaved) {
        // Remove from favorites
        const updatedSaved = savedProperties.filter((savedId: string) => savedId !== id);
        localStorage.setItem('saved_properties', JSON.stringify(updatedSaved));
        setIsSaved(false);
        toast({ title: "Property removed from favorites" });
      } else {
        // Add to favorites
        const updatedSaved = [...savedProperties, id];
        localStorage.setItem('saved_properties', JSON.stringify(updatedSaved));
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
    
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to send inquiries.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Create inquiry data
      const inquiryData = {
        inquiryType: 'property_inquiry',
        subject: `Inquiry about ${property?.title || 'Property'}`,
        message: `Name: ${contactForm.name}\nEmail: ${contactForm.email}\nPhone: ${contactForm.phone}\n\nMessage: ${contactForm.message}`,
        contactPreference: 'phone',
        propertyId: id,
        propertyTitle: property?.title
      };
      
      const result = await apiClient.createInquiry(inquiryData);
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      toast({
        title: "Message Sent Successfully!",
        description: "Your inquiry has been sent to the property owner. They will contact you soon.",
      });
      setContactForm({ name: '', email: '', phone: '', message: '' });
    } catch (error: any) {
      console.error('Error sending inquiry:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBuyNow = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to proceed with purchase.",
        variant: "destructive",
      });
      return;
    }
    
    // In a real app, this would redirect to payment/checkout
    toast({
      title: "Purchase Initiated",
      description: "Redirecting to payment gateway...",
    });
  };


  // Share functionality
  const fetchShareCount = async () => {
    if (!id) return;
    
    try {
      const result = await apiClient.getShareCount(id);
      if (result.data) {
        setShareCount(result.data.shareCount);
      }
    } catch (error) {
      console.error('Error fetching share count:', error);
    }
  };

  const handleShare = async (method: string, sharedWith?: string) => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to share properties.",
        variant: "destructive",
      });
      return;
    }

    try {
      await apiClient.shareProperty(id!, method, sharedWith);
      setShareCount(prev => prev + 1);
      
      // Handle different share methods
      const shareUrl = window.location.href;
      const shareText = `Check out this amazing property: ${property?.title}`;
      
      switch (method) {
        case 'copy_link':
          navigator.clipboard.writeText(shareUrl);
          toast({
            title: "Link Copied",
            description: "Property link copied to clipboard!",
          });
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'email':
          window.open(`mailto:${sharedWith}?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
      }
      
      toast({
        title: "Property Shared",
        description: `Property shared via ${method}!`,
      });
      
      setShowShareModal(false);
    } catch (error: any) {
      console.error('Error sharing property:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to share property.",
        variant: "destructive",
      });
    }
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
        <div className="h-96 md:h-[500px] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden animate-fade-in-up rounded-lg shadow-lg">
          {property.images && property.images.length > 0 ? (
            <div className="relative w-full h-full">
              {imageLoading && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-estate-blue border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
              <img
                src={property.images[currentImageIndex]?.url || property.images[currentImageIndex] || '/placeholder.svg'}
                alt={`${property.title} - Image ${currentImageIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-500 ease-out"
                onLoad={() => setImageLoading(false)}
                onError={(e) => {
                  e.currentTarget.src = '/placeholder.svg';
                  setImageLoading(false);
                }}
              />
              
              {/* Navigation Arrows */}
              {property.images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white smooth-transition hover:scale-110"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white smooth-transition hover:scale-110"
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
              {property.images.map((image: any, index: number) => (
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
                    src={image?.url || image || '/placeholder.svg'}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className="absolute top-4 right-4 flex gap-2 animate-fade-in-right">
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white smooth-transition hover:scale-105"
            onClick={toggleSave}
          >
            <Heart className={`w-4 h-4 mr-2 smooth-transition ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            {isSaved ? 'Saved' : 'Save'}
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="bg-white/90 hover:bg-white smooth-transition hover:scale-105"
            onClick={() => setShowShareModal(true)}
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share {shareCount > 0 && `(${shareCount})`}
          </Button>
        </div>
      </section>

      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property Header */}
            <div className="animate-fade-in-up bg-white rounded-xl p-6 shadow-lg border border-gray-100" style={{animationDelay: '200ms'}}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">{property.title}</h1>
                  <div className="flex items-center text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span>{property.location?.address}, {property.location?.city}, {property.location?.state}</span>
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
                  <span className="capitalize">{property.propertyType}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="animate-fade-in-up bg-white rounded-xl p-6 shadow-lg border border-gray-100" style={{animationDelay: '400ms'}}>
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">Description</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {property.description || "No description available for this property."}
              </p>
            </div>

            {/* Amenities */}
            {property.amenities && property.amenities.length > 0 && (
              <div className="animate-fade-in-up bg-white rounded-xl p-6 shadow-lg border border-gray-100" style={{animationDelay: '600ms'}}>
                <h2 className="text-2xl font-semibold mb-4 text-gray-900">Amenities</h2>
                <div className="flex flex-wrap gap-3">
                  {property.amenities.map((amenity: string, index: number) => (
                    <Badge key={index} variant="outline" className="smooth-transition hover:scale-105">
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
            <Card className="animate-fade-in-left bg-gradient-to-br from-white to-gray-50 shadow-xl border-0" style={{animationDelay: '300ms'}}>
              <CardHeader className="bg-gradient-to-r from-estate-blue to-estate-blue-light text-white rounded-t-lg">
                <CardTitle className="text-xl">Contact Owner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {property.owner && (
                  <div className="p-4 bg-estate-blue-lighter/20 rounded-lg">
                    <h3 className="font-semibold mb-2">Property Owner</h3>
                    {property.owner.phone && (
                      <div className="flex items-center mb-2">
                        <Phone className="w-4 h-4 mr-2" />
                        <span>{property.owner.phone}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Buy Now Button */}
                {property.listingType === 'sale' && (
                  <Button 
                    onClick={handleBuyNow}
                    className="w-full bg-estate-blue hover:bg-estate-blue-dark text-white smooth-transition hover:scale-105 hover:shadow-lg"
                    size="lg"
                  >
                    <IndianRupee className="w-4 h-4 mr-2" />
                    Buy Now - ₹{property.price.toLocaleString()}
                  </Button>
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
                  <Button type="submit" className="w-full smooth-transition hover:scale-105">
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
              {relatedProperties.map((relatedProperty) => {
                // Get primary image or first image
                const primaryImage = relatedProperty.images?.find((img: any) => img.isPrimary) || relatedProperty.images?.[0];
                const imageUrl = primaryImage?.url || primaryImage || "/placeholder.svg";
                
                // Format price based on listing type
                const displayPrice = relatedProperty.listingType === 'rent' 
                  ? `₹${(relatedProperty.monthlyRent || relatedProperty.price).toLocaleString()}/month`
                  : `₹${relatedProperty.price.toLocaleString()}`;
                
                // Format location
                const locationText = `${relatedProperty.location?.address}, ${relatedProperty.location?.city}`;
                
                // Format property type for display
                const propertyTypeDisplay = relatedProperty.propertyType.charAt(0).toUpperCase() + relatedProperty.propertyType.slice(1);
                
                // Format status
                const statusDisplay = relatedProperty.listingType === 'rent' ? 'For Rent' : 
                                   relatedProperty.status === 'active' ? 'For Sale' : 
                                   relatedProperty.status === 'sold' ? 'Sold' : 'For Sale';
                
                return (
                  <PropertyCard
                    key={relatedProperty._id}
                    id={relatedProperty._id}
                    title={relatedProperty.title}
                    location={locationText}
                    price={displayPrice}
                    area={`${relatedProperty.area} sq ft`}
                    image={imageUrl}
                    type={propertyTypeDisplay}
                    status={statusDisplay}
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-scale-in">
            <h3 className="text-xl font-semibold mb-4">Share Property</h3>
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleShare('copy_link')}
              >
                📋 Copy Link
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleShare('whatsapp')}
              >
                📱 WhatsApp
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleShare('facebook')}
              >
                📘 Facebook
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleShare('twitter')}
              >
                🐦 Twitter
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleShare('linkedin')}
              >
                💼 LinkedIn
              </Button>
              <div className="flex gap-2">
                <Input
                  placeholder="Email address"
                  value={shareWith}
                  onChange={(e) => setShareWith(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => handleShare('email', shareWith)}
                  disabled={!shareWith}
                >
                  📧 Email
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowShareModal(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;