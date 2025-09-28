import apiClient from '@/lib/api';
import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, Home, ImagePlus, ArrowLeft } from "lucide-react";

const EditProperty = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [fetchingProperty, setFetchingProperty] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    area: '',
    location: '',
    city: '',
    state: '',
    country: 'India',
    property_type: '',
    listing_type: '',
    images: [] as string[],
    amenities: [] as string[]
  });
  const [otherAmenity, setOtherAmenity] = useState('');

  // Common amenities list
  const commonAmenities = [
    'Swimming Pool',
    'Gym/Fitness Center',
    'Parking',
    'Security',
    '24/7 Power Backup',
    'Elevator/Lift',
    'Garden/Landscaping',
    'Playground',
    'Club House',
    'Internet/Wi-Fi',
    'Air Conditioning',
    'Balcony',
    'Furnished',
    'Semi-Furnished'
  ];

  // Fetch property data for editing
  useEffect(() => {
    const fetchProperty = async () => {
      if (!id || !user) return;

      try {
        setFetchingProperty(true);
        const { data, error } = await apiClient
          
          
           // Ensure user owns the property
          ;

        if (error) throw error;

        if (data) {
          setFormData({
            title: data.title || '',
            description: data.description || '',
            price: data.price?.toString() || '',
            area: data.area?.toString() || '',
            location: data.location || '',
            city: data.city || '',
            state: data.state || '',
            country: data.country || 'India',
            property_type: data.property_type || '',
            listing_type: data.listing_type || '',
            images: data.images || [],
            amenities: data.amenities || []
          });
        }
      } catch (error) {
        console.error('Error fetching property:', error);
        toast({
          title: "Error",
          description: "Failed to load property data",
          variant: "destructive",
        });
        navigate('/seller/dashboard');
      } finally {
        setFetchingProperty(false);
      }
    };

    fetchProperty();
  }, [id, user, navigate, toast]);

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Home className="w-16 h-16 text-estate-gray mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please login to edit your property listing.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fetchingProperty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const addOtherAmenity = () => {
    if (otherAmenity.trim() && !formData.amenities.includes(otherAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        amenities: [...prev.amenities, otherAmenity.trim()]
      }));
      setOtherAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await apiClient.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = apiClient.storage
          .from('property-images')
          .getPublicUrl(filePath);

        uploadedUrls.push(data.publicUrl);
      }

      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));

      toast({
        title: "Success!",
        description: `${uploadedUrls.length} image(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingImages(false);
    }
  };

  const removeImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) return;

    setLoading(true);
    
    try {
      const { error } = await apiClient
        ({
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          area: parseInt(formData.area),
          location: formData.location,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          property_type: formData.property_type,
          listing_type: formData.listing_type,
          images: formData.images,
          amenities: formData.amenities,
        })
        
        ; // Ensure user owns the property

      if (error) throw error;

      toast({
        title: "Property Updated Successfully!",
        description: "Your property listing has been updated.",
      });

      navigate(`/property/${id}`);
    } catch (error) {
      console.error('Error updating property:', error);
      toast({
        title: "Error",
        description: "Failed to update property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-hero py-16">
        <div className="container mx-auto px-6">
          <div className="flex items-center mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/seller/dashboard')}
                className="text-white hover:text-white/80 p-0 h-auto"
              >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Edit Your Property
          </h1>
          <p className="text-xl text-white/90 text-center max-w-2xl mx-auto">
            Update your property details to keep your listing current and attract the right buyers.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Spacious 3BHK Apartment in Prime Location"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your property, its features, and surroundings..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="property_type">Property Type *</Label>
                    <Select value={formData.property_type} onValueChange={(value) => handleInputChange('property_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="apartment">Apartment</SelectItem>
                        <SelectItem value="villa">Villa</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="industrial">Industrial</SelectItem>
                        <SelectItem value="land">Land</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="listing_type">Listing Type *</Label>
                    <Select value={formData.listing_type} onValueChange={(value) => handleInputChange('listing_type', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sale">For Sale</SelectItem>
                        <SelectItem value="rent">For Rent</SelectItem>
                        <SelectItem value="lease">For Lease</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="5000000"
                    value={formData.price}
                    onChange={(e) => handleInputChange('price', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="area">Area (sq.ft) *</Label>
                  <Input
                    id="area"
                    type="number"
                    placeholder="1200"
                    value={formData.area}
                    onChange={(e) => handleInputChange('area', e.target.value)}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="location">Address/Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g. Sector 21, Near Metro Station"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      placeholder="Maharashtra"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="country">Country *</Label>
                    <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="USA">USA</SelectItem>
                        <SelectItem value="UAE">UAE</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Kenya">Kenya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Amenities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Common Amenities Checkboxes */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">Select Amenities</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {commonAmenities.map((amenity) => (
                      <div key={amenity} className="flex items-center space-x-2">
                        <Checkbox
                          id={amenity}
                          checked={formData.amenities.includes(amenity)}
                          onCheckedChange={() => handleAmenityToggle(amenity)}
                        />
                        <Label 
                          htmlFor={amenity} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {amenity}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Other Amenity Input */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">Other Amenities</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom amenity"
                      value={otherAmenity}
                      onChange={(e) => setOtherAmenity(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOtherAmenity())}
                    />
                    <Button type="button" onClick={addOtherAmenity} variant="outline">
                      Add
                    </Button>
                  </div>
                </div>

                {/* Selected Amenities Display */}
                {formData.amenities.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Selected Amenities</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.amenities.map((amenity, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {amenity}
                          <button
                            type="button"
                            onClick={() => removeAmenity(amenity)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>Property Images</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingImages ? (
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-sm text-muted-foreground">Uploading images...</p>
                    </div>
                  ) : (
                    <>
                      <ImagePlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-2">
                        Click to upload more property images
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Support: JPG, PNG, WEBP (Max 5MB per image)
                      </p>
                    </>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Uploaded Images Display */}
                {formData.images.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Current Images</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={image} 
                            alt={`Property ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(image)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/seller/dashboard')}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Updating Property...
                  </>
                ) : (
                  'Update Property'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProperty;
