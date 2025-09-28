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
    images: [] as (string | { url: string; caption?: string; isPrimary?: boolean })[],
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

    try {
      // Check if we're in mock mode
      const isMockMode = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';
      
      if (isMockMode) {
        // In mock mode, create data URLs for images to avoid network errors
        const uploadedUrls: string[] = [];
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
        // Real MERN stack upload using Express + Multer
        const fileArray = Array.from(files);
        const result = await apiClient.uploadPropertyImages(fileArray);
        
        if (result.error) {
          throw new Error(result.error);
        }

        // New Cloudinary response format - images are already objects with url, caption, isPrimary
        const uploadedImages = result.data.images.map((img: any) => ({
          url: img.url, // Cloudinary URLs are already absolute
          caption: img.caption || `Property image`,
          isPrimary: img.isPrimary || false
        }));
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedImages]
        }));

        toast({
          title: "Success!",
          description: `${uploadedImages.length} image(s) uploaded successfully.`,
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
      setUploadingMedia(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !user) return;

    setUploadingMedia(true);

    try {
      // Check if we're in mock mode
      const isMockMode = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';
      
      if (isMockMode) {
        // In mock mode, create mock URLs for videos
        const uploadedUrls: string[] = [];
        
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
        // Real MERN stack upload using Express + Multer
        const fileArray = Array.from(files);
        
        // Check file sizes first
        for (const file of fileArray) {
          if (file.size > 100 * 1024 * 1024) {
            toast({
              title: "File too large",
              description: `${file.name} is larger than 100MB. Please choose a smaller file.`,
              variant: "destructive",
            });
            setUploadingMedia(false);
            return;
          }
        }
        
        const result = await apiClient.uploadImages(fileArray); // Using general images endpoint for videos
        
        if (result.error) {
          throw new Error(result.error);
        }

        const uploadedUrls = result.data.files.map((file: any) => {
          // Ensure URL is absolute for proper display
          const url = file.url.startsWith('http') ? file.url : `http://localhost:5000${file.url}`;
          return url;
        });
        
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

    // Validate required fields
    if (!formData.title || formData.title.length < 5) {
      toast({
        title: "Validation Error",
        description: "Title must be at least 5 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.description || formData.description.length < 10) {
      toast({
        title: "Validation Error", 
        description: "Description must be at least 10 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid price.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.area || parseFloat(formData.area) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid area.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.location || formData.location.length < 5) {
      toast({
        title: "Validation Error",
        description: "Location must be at least 5 characters long.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.city || formData.city.length < 2) {
      toast({
        title: "Validation Error",
        description: "Please select a valid city.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.state || formData.state.length < 2) {
      toast({
        title: "Validation Error",
        description: "Please select a valid state.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.property_type) {
      toast({
        title: "Validation Error",
        description: "Please select a property type.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.listing_type) {
      toast({
        title: "Validation Error",
        description: "Please select a listing type.",
        variant: "destructive",
      });
      return;
    }

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
        // Map frontend values to backend expected values
        const propertyTypeMap: { [key: string]: string } = {
          'Apartment': 'apartment',
          'Villa': 'villa',
          'Independent House': 'house',
          'Duplex': 'house',
          'Penthouse': 'apartment',
          'Studio': 'apartment',
          'Farmhouse': 'house',
          'Row House': 'house',
          'Bungalow': 'house',
          'Residential Land': 'plot',
          'Commercial Space': 'commercial',
          'Office Space': 'office',
          'Retail Shop': 'shop',
          'Warehouse': 'warehouse',
          'Industrial Land': 'other'
        };

        const listingTypeMap: { [key: string]: string } = {
          'For Sale': 'sale',
          'For Rent': 'rent',
          'Redevelopment': 'lease'
        };

        // Map amenities to backend enum values
        const amenityMap: { [key: string]: string } = {
          'Swimming Pool': 'swimming_pool',
          'Gym/Fitness Center': 'gym',
          'Parking': 'parking',
          'Security': 'security',
          '24/7 Power Backup': 'power_backup',
          'Elevator/Lift': 'elevator',
          'Garden/Landscaping': 'garden',
          'Playground': 'playground',
          'Club House': 'clubhouse',
          'Internet/Wi-Fi': 'water_supply', // Using water_supply as closest match
          'Air Conditioning': 'ac',
          'Balcony': 'balcony',
          'Furnished': 'furnished',
          'Semi-Furnished': 'semi_furnished'
        };

        // Prepare data for API call
        const propertyData = {
          title: formData.title,
          description: formData.description,
          price: parseFloat(formData.price),
          area: parseFloat(formData.area),
          location: {
            address: formData.location,
            city: formData.city,
            state: formData.state,
            country: formData.country
          },
          propertyType: propertyTypeMap[formData.property_type] || 'other',
          listingType: listingTypeMap[formData.listing_type] || 'sale',
          images: formData.images.map((image, index) => {
            // Handle both string URLs (legacy) and object format (new Cloudinary)
            if (typeof image === 'string') {
              return {
                url: image,
                caption: `Property image ${index + 1}`,
                isPrimary: index === 0
              };
            } else {
              return {
                url: image.url,
                caption: image.caption || `Property image ${index + 1}`,
                isPrimary: image.isPrimary || index === 0
              };
            }
          }),
          videos: formData.videos.map((url, index) => ({
            url: url,
            caption: `Property video ${index + 1}`
          })),
          amenities: formData.amenities.map(amenity => amenityMap[amenity] || amenity.toLowerCase().replace(/\s+/g, '_'))
        };

        // Debug: Log the data being sent
        console.log('Sending property data:', propertyData);

        // Real MERN stack API call with correct data structure
        const result = await apiClient.createProperty(propertyData);

        if (result.error) {
          console.error('Property creation error:', result.error);
          // Display error message
          throw new Error(result.error);
        }

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <main className="container py-8">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Post Your Property</h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              List your property and connect with potential buyers, renters, and investors
            </p>
          </div>
          
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-estate-blue rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900">Property Details</CardTitle>
                  <p className="text-slate-600">Complete all sections to create your listing</p>
                </div>
              </div>
            </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Home className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Basic Information</h2>
                </div>
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
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-8 border border-green-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Location Details</h2>
                </div>
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
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-8 border border-purple-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Amenities & Features</h2>
                </div>
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
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-8 border border-orange-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <ImagePlus className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-slate-800">Photos & Videos</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <Label className="block mb-2">Images</Label>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={uploadingMedia}
                        className="w-full h-12 border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200"
                      >
                        <ImagePlus className="mr-2 h-5 w-5 text-orange-600" />
                        <span className="font-medium">
                          {uploadingMedia ? 'Uploading...' : 'Upload Images'}
                        </span>
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
                      <div className="mt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-medium text-slate-700">
                            {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} uploaded
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                          {formData.images.map((image, index) => {
                            const imageUrl = typeof image === 'string' ? image : image.url;
                            return (
                              <div key={index} className="relative group">
                                <div className="aspect-square overflow-hidden rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-colors">
                                  <img 
                                    src={imageUrl} 
                                    alt={`Property ${index + 1}`} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    onError={(e) => {
                                      console.error('Image failed to load:', imageUrl);
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YzZjRmNiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOWNhM2FmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRXJyb3I8L3RleHQ+PC9zdmc+';
                                  }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(imageUrl)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                            );
                          })}
                        </div>
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
                        className="w-full h-12 border-2 border-dashed border-orange-300 hover:border-orange-400 hover:bg-orange-50 transition-all duration-200"
                      >
                        <Video className="mr-2 h-5 w-5 text-orange-600" />
                        <span className="font-medium">
                          {uploadingMedia ? 'Uploading...' : 'Upload Videos'}
                        </span>
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
              
              {/* Submit Button */}
              <div className="flex justify-center pt-8">
                <Button 
                  type="submit" 
                  className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-estate-blue to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105" 
                  disabled={loading || uploadingMedia}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Posting Property...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Home className="w-5 h-5" />
                      Post Property
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PostProperty;