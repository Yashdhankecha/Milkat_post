import apiClient from '@/lib/api';
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import { X, Upload, Home, ImagePlus, Video, Play, Pause } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StateCitySelector from "@/components/StateCitySelector";

const PostProperty = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
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
    videos: [] as string[],
    amenities: [] as string[]
  });
  const [otherAmenity, setOtherAmenity] = useState('');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);

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

  // Property type options
  const propertyTypes = [
    'Apartment',
    'Villa',
    'Independent House',
    'Duplex',
    'Penthouse',
    'Studio',
    'Farmhouse',
    'Row House',
    'Bungalow',
    'Residential Land',
    'Commercial Space',
    'Office Space',
    'Retail Shop',
    'Warehouse',
    'Industrial Land'
  ];

  // Listing type options
  const listingTypes = [
    'For Sale',
    'For Rent',
    'Redevelopment'
  ];

  // Redirect if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Home className="w-16 h-16 text-estate-gray mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Login Required</h2>
            <p className="text-muted-foreground mb-6">
              Please login to post your property listing.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStateChange = (state: string) => {
    setFormData(prev => ({
      ...prev,
      state: state,
      city: '' // Reset city when state changes
    }));
  };

  const handleCityChange = (city: string) => {
    setFormData(prev => ({
      ...prev,
      city: city
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

    setUploadingMedia(true);
    const uploadedUrls: string[] = [];

    try {
      // Check if we're in mock mode
      const isMockMode = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';
      
      if (isMockMode) {
        // In mock mode, create data URLs for images to avoid network errors
        let processedCount = 0;
        for (const file of Array.from(files)) {
          const fileReader = new FileReader();
          fileReader.onload = (event) => {
            if (event.target?.result) {
              uploadedUrls.push(event.target.result as string);
              processedCount++;
              // Update state when all files are processed
              if (processedCount === files.length) {
                setFormData(prev => ({
                  ...prev,
                  images: [...prev.images, ...uploadedUrls]
                }));
                
                toast({
                  title: "Success!",
                  description: `${uploadedUrls.length} image(s) uploaded successfully.`,
                });
                setUploadingMedia(false);
              }
            }
          };
          fileReader.readAsDataURL(file);
        }
      } else {
        // Real Supabase upload
        for (const file of Array.from(files)) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

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
        setUploadingMedia(false);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast({
        title: "Error",
        description: "Failed to upload images. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (typeof import.meta === 'undefined' || (import.meta as any).env?.VITE_MOCK_OTP !== 'true') {
        setUploadingMedia(false);
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploadingMedia(true);
    const uploadedUrls: string[] = [];

    try {
      // Check if we're in mock mode
      const isMockMode = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';
      
      if (isMockMode) {
        // In mock mode, create mock URLs for videos
        for (const file of Array.from(files)) {
          // Check file size (max 100MB per video)
          if (file.size > 100 * 1024 * 1024) {
            toast({
              title: "File too large",
              description: `${file.name} is larger than 100MB. Please choose a smaller file.`,
              variant: "destructive",
            });
            continue;
          }
          
          // For mock mode, we'll use a placeholder video URL
          // In a real application, you might want to use a data URL or a local video
          const mockUrl = `https://example.com/mock-video-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
          uploadedUrls.push(mockUrl);
        }
        
        setFormData(prev => ({
          ...prev,
          videos: [...prev.videos, ...uploadedUrls]
        }));

        toast({
          title: "Success!",
          description: `${uploadedUrls.length} video(s) uploaded successfully.`,
        });
        setUploadingMedia(false);
      } else {
        // Real Supabase upload
        for (const file of Array.from(files)) {
          const fileExt = file.name.split('.').pop();
          const filePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await apiClient.storage
            .from('property-videos')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = apiClient.storage
            .from('property-videos')
            .getPublicUrl(filePath);

          uploadedUrls.push(data.publicUrl);
        }

        setFormData(prev => ({
          ...prev,
          videos: [...prev.videos, ...uploadedUrls]
        }));

        toast({
          title: "Success!",
          description: `${uploadedUrls.length} video(s) uploaded successfully.`,
        });
        setUploadingMedia(false);
      }
    } catch (error) {
      console.error('Error uploading videos:', error);
      toast({
        title: "Error",
        description: "Failed to upload videos. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleVideoPlay = (url: string) => {
    setPlayingVideo(url);
  };

  const handleVideoPause = () => {
    setPlayingVideo(null);
  };

  const removeImage = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageUrl)
    }));
  };

  const removeVideo = (videoUrl: string) => {
    setFormData(prev => ({
      ...prev,
      videos: prev.videos.filter(vid => vid !== videoUrl)
    }));
    // Stop playing if this video was playing
    if (playingVideo === videoUrl) {
      setPlayingVideo(null);
    }
  };

  const toggleVideoPlay = (videoUrl: string) => {
    if (playingVideo === videoUrl) {
      setPlayingVideo(null);
    } else {
      setPlayingVideo(videoUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);

    try {
      // Check if we're in mock mode
      const isMockMode = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';

      if (isMockMode) {
        // In mock mode, simulate a successful submission
        toast({
          title: "Success!",
          description: "Your property listing has been posted successfully.",
        });
        navigate('/properties');
      } else {
        // Real Supabase insert - fix the data structure to match the database schema
        const { data, error } = await apiClient
          ({
            title: formData.title,
            description: formData.description,
            price: parseFloat(formData.price),
            area: parseFloat(formData.area),
            location: formData.location,
            city: formData.city,
            state: formData.state,
            country: formData.country,
            property_type: formData.property_type,
            listing_type: formData.listing_type, // No longer converting to lowercase since we want to preserve the actual value
            images: formData.images,
            videos: formData.videos,
            amenities: formData.amenities,
            owner_id: user.id
          })
          .select();

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Your property listing has been posted successfully.",
        });

        navigate('/properties');
      }
    } catch (error) {
      console.error('Error posting property:', error);
      toast({
        title: "Error",
        description: "Failed to post property. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Post Your Property</CardTitle>
            <p className="text-muted-foreground">Fill in the details below to list your property</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter property title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your property"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      required
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price (INR) *</Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="Enter price"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Area (sqft) *</Label>
                    <Input
                      id="area"
                      type="number"
                      placeholder="Enter area in sqft"
                      value={formData.area}
                      onChange={(e) => handleInputChange('area', e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Location Section */}
              <div className="border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Location Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location *</Label>
                    <Input
                      id="location"
                      placeholder="Enter detailed location"
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State & City *</Label>
                    <StateCitySelector
                      selectedState={formData.state}
                      selectedCity={formData.city}
                      onStateChange={handleStateChange}
                      onCityChange={handleCityChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="property_type">Property Type *</Label>
                    <Select
                      value={formData.property_type}
                      onValueChange={(value) => handleInputChange('property_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select property type" />
                      </SelectTrigger>
                      <SelectContent>
                        {propertyTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="listing_type">Listing Type *</Label>
                    <Select
                      value={formData.listing_type}
                      onValueChange={(value) => handleInputChange('listing_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select listing type" />
                      </SelectTrigger>
                      <SelectContent>
                        {listingTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Amenities Section */}
              <div className="border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Amenities</h2>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {commonAmenities.map((amenity) => (
                      <div 
                        key={amenity} 
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${
                          formData.amenities.includes(amenity)
                            ? 'border-primary bg-primary/10'
                            : 'border-input hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={amenity}
                            checked={formData.amenities.includes(amenity)}
                            onCheckedChange={() => handleAmenityToggle(amenity)}
                            className="rounded-full"
                          />
                          <Label 
                            htmlFor={amenity} 
                            className="text-sm font-medium cursor-pointer"
                          >
                            {amenity}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Add Custom Amenity */}
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="other-amenity">Add Custom Amenity</Label>
                    <div className="flex gap-2">
                      <Input
                        id="other-amenity"
                        value={otherAmenity}
                        onChange={(e) => setOtherAmenity(e.target.value)}
                        placeholder="Enter a custom amenity"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOtherAmenity())}
                      />
                      <Button 
                        type="button" 
                        onClick={addOtherAmenity} 
                        disabled={!otherAmenity.trim()}
                        variant="outline"
                        className="whitespace-nowrap"
                      >
                        Add Amenity
                      </Button>
                    </div>
                  </div>
                  
                  {/* Selected Amenities Display */}
                  {formData.amenities.length > 0 && (
                    <div className="mt-4">
                      <Label className="text-sm font-medium mb-2 block">Selected Amenities</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.amenities.map((amenity, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 py-2 px-3 text-sm">
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
                </div>
              </div>

              {/* Media Upload Section */}
              <div className="border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Media</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <Label className="block mb-2">Images</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingMedia}
                        className="w-full"
                      >
                        <ImagePlus className="mr-2 h-4 w-4" />
                        {uploadingMedia ? 'Uploading...' : 'Upload Images'}
                      </Button>
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </div>
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        {formData.images.map((url, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={url} 
                              alt={`Property ${index + 1}`} 
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(url)}
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className="block mb-2">Videos</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploadingMedia}
                        className="w-full"
                      >
                        <Video className="mr-2 h-4 w-4" />
                        {uploadingMedia ? 'Uploading...' : 'Upload Videos'}
                      </Button>
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        multiple
                        className="hidden"
                        onChange={handleVideoUpload}
                      />
                    </div>
                    {formData.videos.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                        {formData.videos.map((url, index) => (
                          <div key={index} className="relative group border rounded-lg overflow-hidden">
                            {playingVideo === url ? (
                              <video
                                src={url}
                                className="w-full h-32 object-cover"
                                controls
                                autoPlay
                                onEnded={() => setPlayingVideo(null)}
                              />
                            ) : (
                              <div className="relative">
                                <video
                                  src={url}
                                  className="w-full h-32 object-cover"
                                  muted
                                />
                                <button
                                  type="button"
                                  onClick={() => toggleVideoPlay(url)}
                                  className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/70 transition-colors"
                                >
                                  <Play className="w-8 h-8 text-white" />
                                </button>
                              </div>
                            )}
                            <button
                              type="button"
                              onClick={() => removeVideo(url)}
                              className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full md:w-auto px-8 py-3" disabled={loading || uploadingMedia}>
                {loading ? 'Posting...' : 'Post Property'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default PostProperty;