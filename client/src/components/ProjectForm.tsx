import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { X, Upload, FileText, Image, Video, Trash2 } from "lucide-react";
import { indianStatesAndCities, getCitiesByState, getAllStates } from "@/data/indianStatesCities";

interface ProjectFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  existingProject?: any;
}

const ProjectForm = ({ onSuccess, onCancel, existingProject }: ProjectFormProps) => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [developerProfile, setDeveloperProfile] = useState<any>(null);
  const [amenities, setAmenities] = useState<string[]>([]);
  
  // Predefined amenities that match server enum values
  const predefinedAmenities = [
    { label: 'Parking', value: 'parking' },
    { label: 'Security', value: 'security' },
    { label: 'Gym', value: 'gym' },
    { label: 'Swimming Pool', value: 'swimming_pool' },
    { label: 'Garden', value: 'garden' },
    { label: 'Playground', value: 'playground' },
    { label: 'Club House', value: 'clubhouse' },
    { label: 'Power Backup', value: 'power_backup' },
    { label: 'Water Supply', value: 'water_supply' },
    { label: 'Elevator', value: 'elevator' },
    { label: 'Balcony', value: 'balcony' },
    { label: 'Terrace', value: 'terrace' },
    { label: 'Modular Kitchen', value: 'modular_kitchen' },
    { label: 'Wardrobe', value: 'wardrobe' },
    { label: 'Air Conditioning', value: 'ac' },
    { label: 'Furnished', value: 'furnished' },
    { label: 'Semi Furnished', value: 'semi_furnished' },
    { label: 'Conference Room', value: 'conference_room' },
    { label: 'Business Center', value: 'business_center' },
    { label: 'Retail Shops', value: 'retail_shops' },
    { label: 'Restaurant', value: 'restaurant' },
    { label: 'Spa', value: 'spa' },
    { label: 'Tennis Court', value: 'tennis_court' },
    { label: 'Basketball Court', value: 'basketball_court' },
    { label: 'Badminton Court', value: 'badminton_court' },
    { label: 'Cricket Net', value: 'cricket_net' },
    { label: 'Jogging Track', value: 'jogging_track' },
    { label: 'Cycling Track', value: 'cycling_track' },
    { label: 'Amphitheater', value: 'amphitheater' },
    { label: 'Library', value: 'library' },
    { label: 'Kids Play Area', value: 'kids_play_area' }
  ];
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    projectType: 'residential',
    status: 'planning',
    location: {
      address: '',
      city: '',
      state: '',
      country: 'India'
    },
    priceRange: {
      min: '',
      max: '',
      unit: 'lakh'
    },
    totalUnits: '',
    availableUnits: '',
    completionDate: '',
    possessionDate: '',
    launchDate: '',
    amenities: [] as string[],
    images: [] as string[],
    videos: [] as string[],
    brochures: [] as string[],
    reraNumber: ''
  });
  
  const [uploading, setUploading] = useState({
    images: false,
    videos: false,
    brochures: false
  });
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    fetchDeveloperProfile();
    if (existingProject) {
      setFormData({
        name: existingProject.name || '',
        description: existingProject.description || '',
        projectType: existingProject.projectType || 'residential',
        status: existingProject.status || 'planning',
        location: {
          address: existingProject.location?.address || '',
          city: existingProject.location?.city || '',
          state: existingProject.location?.state || '',
          country: existingProject.location?.country || 'India'
        },
        priceRange: {
          min: existingProject.priceRange?.min?.toString() || '',
          max: existingProject.priceRange?.max?.toString() || '',
          unit: existingProject.priceRange?.unit || 'lakh'
        },
        totalUnits: existingProject.totalUnits?.toString() || '',
        availableUnits: existingProject.availableUnits?.toString() || '',
        completionDate: existingProject.completionDate || '',
        possessionDate: existingProject.possessionDate || '',
        launchDate: existingProject.launchDate || '',
        amenities: existingProject.amenities || [],
        images: existingProject.images || [],
        videos: existingProject.videos || [],
        brochures: existingProject.brochures || [],
        reraNumber: existingProject.reraNumber || ''
      });
      
      // Set available cities based on existing state
      if (existingProject.location?.state) {
        setAvailableCities(getCitiesByState(existingProject.location.state));
      }
      setAmenities(existingProject.amenities || []);
    }
  }, [existingProject, profile]);

  const fetchDeveloperProfile = async () => {
    console.log('fetchDeveloperProfile called, profile:', profile);
    if (!profile) {
      console.log('No profile found, returning');
      return;
    }

    try {
      console.log('Fetching developer profile for user_id:', profile.id);
      const { data, error } = await apiClient.getMyDeveloperProfile();

      console.log('Developer profile query result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      if (data?.developer) {
        console.log('Developer profile found:', data.developer);
        setDeveloperProfile(data.developer);
      } else {
        console.log('No developer profile found for user');
        toast({
          title: "Developer Profile Required",
          description: "Please complete your developer profile setup first",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching developer profile:', error);
      toast({
        title: "Error",
        description: "Failed to load developer profile",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setFormData(prev => {
      const newLocation = {
        ...prev.location,
        [field]: value
      };
      
      // If state changes, reset city and update available cities
      if (field === 'state') {
        newLocation.city = '';
        setAvailableCities(getCitiesByState(value));
      }
      
      return {
        ...prev,
        location: newLocation
      };
    });
  };

  const handlePriceRangeChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      priceRange: {
        ...prev.priceRange,
        [field]: value
      }
    }));
  };

  const toggleAmenity = (amenityValue: string) => {
    const isSelected = amenities.includes(amenityValue);
    const updatedAmenities = isSelected 
      ? amenities.filter(a => a !== amenityValue)
      : [...amenities, amenityValue];
    
    setAmenities(updatedAmenities);
    setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
  };

  const removeAmenity = (amenity: string) => {
    const updatedAmenities = amenities.filter(a => a !== amenity);
    setAmenities(updatedAmenities);
    setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
  };

  const handleFileUpload = async (file: File, type: 'images' | 'videos' | 'brochures') => {
    if (!file) return;

    // Validate file types
    if (type === 'images' && !file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }
    
    if (type === 'videos' && !file.type.startsWith('video/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a video file',
        variant: 'destructive',
      });
      return;
    }
    
    if (type === 'brochures' && file.type !== 'application/pdf') {
      toast({
        title: 'Invalid File Type',
        description: 'Please select a PDF file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'File size must be less than 10MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(prev => ({ ...prev, [type]: true }));

    try {
      const { data, error } = await apiClient.uploadSingleFile(file, `project_${type}`);

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], data.url]
      }));

      toast({
        title: 'Upload Successful',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const removeFile = (type: 'images' | 'videos' | 'brochures', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    if (!developerProfile) {
      toast({
        title: "Developer Profile Required",
        description: "Please complete your developer profile setup before adding projects. Go to the Company Profile tab to set up your profile.",
        variant: "destructive",
      });
      return;
    }

    // Validate required fields
    if (!formData.name || formData.name.trim().length < 5) {
      toast({
        title: "Validation Error",
        description: "Project name must be at least 5 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!formData.location.address || formData.location.address.trim().length < 5) {
      toast({
        title: "Validation Error",
        description: "Address must be at least 5 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!formData.location.city || formData.location.city.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "City must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    if (!formData.location.state || formData.location.state.trim().length < 2) {
      toast({
        title: "Validation Error",
        description: "State must be at least 2 characters long",
        variant: "destructive",
      });
      return;
    }

    const minPrice = parseFloat(formData.priceRange.min);
    const maxPrice = parseFloat(formData.priceRange.max);

    if (isNaN(minPrice) || minPrice <= 0) {
      toast({
        title: "Validation Error",
        description: "Minimum price must be a positive number",
        variant: "destructive",
      });
      return;
    }

    if (isNaN(maxPrice) || maxPrice <= 0) {
      toast({
        title: "Validation Error",
        description: "Maximum price must be a positive number",
        variant: "destructive",
      });
      return;
    }

    if (maxPrice <= minPrice) {
      toast({
        title: "Validation Error",
        description: "Maximum price must be greater than minimum price",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    
    try {
      const projectData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        projectType: formData.projectType,
        status: formData.status,
        location: {
          address: formData.location.address.trim(),
          city: formData.location.city.trim(),
          state: formData.location.state.trim(),
          country: formData.location.country || 'India'
        },
        priceRange: {
          min: minPrice,
          max: maxPrice,
          unit: formData.priceRange.unit || 'lakh'
        },
        totalUnits: formData.totalUnits ? parseInt(formData.totalUnits) : undefined,
        availableUnits: formData.availableUnits ? parseInt(formData.availableUnits) : undefined,
        completionDate: formData.completionDate || undefined,
        possessionDate: formData.possessionDate || undefined,
        launchDate: formData.launchDate || undefined,
        amenities: formData.amenities || [],
        images: formData.images || [],
        videos: formData.videos || [],
        brochures: formData.brochures || [],
        reraNumber: formData.reraNumber?.trim() || undefined
      };

      if (existingProject) {
        const { error } = await apiClient.updateProject(existingProject.id, projectData);
        
        if (error) throw error;
      } else {
        const { error } = await apiClient.createProject(projectData);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Project ${existingProject ? 'updated' : 'created'} successfully!`,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error saving project:', error);
      
      // Show specific validation errors if available
      let errorMessage = "Failed to save project. Please try again.";
      
      if (error?.response?.data?.errors) {
        // Handle express-validator errors
        const validationErrors = error.response.data.errors.map((err: any) => err.msg).join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Show message if no developer profile
  if (!developerProfile && profile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Developer Profile Required</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">
              You need to complete your developer profile setup before you can add projects.
            </p>
            <Button onClick={onCancel} variant="outline">
              Go to Company Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{existingProject ? 'Edit Project' : 'Add New Project'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Project Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* Location Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.location.address}
                  onChange={(e) => handleLocationChange('address', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Select value={formData.location.state} onValueChange={(value) => handleLocationChange('state', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAllStates().map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Select 
                  value={formData.location.city} 
                  onValueChange={(value) => handleLocationChange('city', value)}
                  disabled={!formData.location.state}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={formData.location.state ? "Select City" : "Select State first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="projectType">Project Type</Label>
              <Select value={formData.projectType} onValueChange={(value) => handleInputChange('projectType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="mixed_use">Mixed Use</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="under_construction">Under Construction</SelectItem>
                  <SelectItem value="ready_to_move">Ready to Move</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="sold_out">Sold Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reraNumber">RERA Number</Label>
              <Input
                id="reraNumber"
                value={formData.reraNumber}
                onChange={(e) => handleInputChange('reraNumber', e.target.value)}
                placeholder="e.g., P51700012345"
              />
            </div>
          </div>

          {/* Price Range Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Price Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="priceMin">Minimum Price</Label>
                <Input
                  id="priceMin"
                  type="number"
                  value={formData.priceRange.min}
                  onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priceMax">Maximum Price</Label>
                <Input
                  id="priceMax"
                  type="number"
                  value={formData.priceRange.max}
                  onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="priceUnit">Price Unit</Label>
                <Select value={formData.priceRange.unit} onValueChange={(value) => handlePriceRangeChange('unit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lakh">Lakh</SelectItem>
                    <SelectItem value="crore">Crore</SelectItem>
                    <SelectItem value="sqft">Per Sq Ft</SelectItem>
                    <SelectItem value="sqm">Per Sq M</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="totalUnits">Total Units</Label>
              <Input
                id="totalUnits"
                type="number"
                value={formData.totalUnits}
                onChange={(e) => handleInputChange('totalUnits', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="availableUnits">Available Units</Label>
              <Input
                id="availableUnits"
                type="number"
                value={formData.availableUnits}
                onChange={(e) => handleInputChange('availableUnits', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="completionDate">Expected Completion</Label>
              <Input
                id="completionDate"
                type="date"
                value={formData.completionDate}
                onChange={(e) => handleInputChange('completionDate', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="possessionDate">Possession Date</Label>
              <Input
                id="possessionDate"
                type="date"
                value={formData.possessionDate}
                onChange={(e) => handleInputChange('possessionDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="launchDate">Launch Date</Label>
              <Input
                id="launchDate"
                type="date"
                value={formData.launchDate}
                onChange={(e) => handleInputChange('launchDate', e.target.value)}
              />
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Project Media</h3>
            
            {/* Brochures Upload */}
            <div className="space-y-2">
              <Label>Project Brochures (PDF)</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'brochures');
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="brochure-upload"
                />
                <label htmlFor="brochure-upload" className="cursor-pointer flex flex-col items-center">
                  {uploading.brochures ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Click to upload PDF brochure</span>
                    </div>
                  )}
                </label>
              </div>
              {formData.brochures.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.brochures.map((brochure, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Brochure {index + 1}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFile('brochures', index)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Images Upload */}
            <div className="space-y-2">
              <Label>Project Images</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'images');
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer flex flex-col items-center">
                  {uploading.images ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      <span>Click to upload project images</span>
                    </div>
                  )}
                </label>
              </div>
              {formData.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.images.map((image, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Image className="h-3 w-3" />
                      Image {index + 1}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFile('images', index)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Videos Upload */}
            <div className="space-y-2">
              <Label>Project Videos</Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, 'videos');
                    e.target.value = '';
                  }}
                  className="hidden"
                  id="video-upload"
                />
                <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center">
                  {uploading.videos ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>Uploading...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <span>Click to upload project videos</span>
                    </div>
                  )}
                </label>
              </div>
              {formData.videos.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.videos.map((video, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      <Video className="h-3 w-3" />
                      Video {index + 1}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeFile('videos', index)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-2">
              {predefinedAmenities.map((amenity) => (
                <div
                  key={amenity.value}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    amenities.includes(amenity.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => toggleAmenity(amenity.value)}
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={amenities.includes(amenity.value)}
                      onChange={() => toggleAmenity(amenity.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium">{amenity.label}</span>
                  </div>
                </div>
              ))}
            </div>
            {amenities.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium mb-2 block">Selected Amenities ({amenities.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity) => {
                    const amenityLabel = predefinedAmenities.find(a => a.value === amenity)?.label || amenity;
                    return (
                      <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                        {amenityLabel}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeAmenity(amenity)} />
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : existingProject ? "Update Project" : "Create Project"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectForm;