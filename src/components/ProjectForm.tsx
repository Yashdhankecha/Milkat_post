import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

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
  const [newAmenity, setNewAmenity] = useState("");
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: '',
    builder: '',
    project_type: 'residential',
    status: 'planned',
    price_range: '',
    total_units: '',
    available_units: '',
    completion_date: '',
    amenities: [] as string[],
    images: [] as string[]
  });

  useEffect(() => {
    fetchDeveloperProfile();
    if (existingProject) {
      setFormData({
        name: existingProject.name || '',
        location: existingProject.location || '',
        description: existingProject.description || '',
        builder: existingProject.builder || '',
        project_type: existingProject.project_type || 'residential',
        status: existingProject.status || 'planned',
        price_range: existingProject.price_range || '',
        total_units: existingProject.total_units?.toString() || '',
        available_units: existingProject.available_units?.toString() || '',
        completion_date: existingProject.completion_date || '',
        amenities: existingProject.amenities || [],
        images: existingProject.images || []
      });
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
      const { data, error } = await supabase
        .from('developers')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle();

      console.log('Developer profile query result:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
      
      if (data) {
        console.log('Developer profile found:', data);
        setDeveloperProfile(data);
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

  const addAmenity = () => {
    if (newAmenity.trim() && !amenities.includes(newAmenity.trim())) {
      const updatedAmenities = [...amenities, newAmenity.trim()];
      setAmenities(updatedAmenities);
      setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
      setNewAmenity("");
    }
  };

  const removeAmenity = (amenity: string) => {
    const updatedAmenities = amenities.filter(a => a !== amenity);
    setAmenities(updatedAmenities);
    setFormData(prev => ({ ...prev, amenities: updatedAmenities }));
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

    setSaving(true);
    
    try {
      const projectData = {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        builder: formData.builder,
        project_type: formData.project_type,
        status: formData.status,
        price_range: formData.price_range,
        total_units: formData.total_units ? parseInt(formData.total_units) : null,
        available_units: formData.available_units ? parseInt(formData.available_units) : null,
        completion_date: formData.completion_date || null,
        amenities: formData.amenities,
        images: formData.images,
        developer_id: developerProfile.id
      };

      if (existingProject) {
        const { error } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', existingProject.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('projects')
          .insert(projectData);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Project ${existingProject ? 'updated' : 'created'} successfully!`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <Label htmlFor="builder">Builder/Developer</Label>
              <Input
                id="builder"
                value={formData.builder}
                onChange={(e) => handleInputChange('builder', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="project_type">Project Type</Label>
              <Select value={formData.project_type} onValueChange={(value) => handleInputChange('project_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="luxury_villas">Luxury Villas</SelectItem>
                  <SelectItem value="mixed_use">Mixed Use</SelectItem>
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
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="ongoing">Ongoing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="completion_date">Expected Completion</Label>
              <Input
                id="completion_date"
                type="date"
                value={formData.completion_date}
                onChange={(e) => handleInputChange('completion_date', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="price_range">Price Range</Label>
              <Input
                id="price_range"
                placeholder="e.g., ₹50L - ₹1.2Cr"
                value={formData.price_range}
                onChange={(e) => handleInputChange('price_range', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="total_units">Total Units</Label>
              <Input
                id="total_units"
                type="number"
                value={formData.total_units}
                onChange={(e) => handleInputChange('total_units', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="available_units">Available Units</Label>
              <Input
                id="available_units"
                type="number"
                value={formData.available_units}
                onChange={(e) => handleInputChange('available_units', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Amenities</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add amenity..."
                value={newAmenity}
                onChange={(e) => setNewAmenity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
              />
              <Button type="button" onClick={addAmenity}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity) => (
                <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                  {amenity}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeAmenity(amenity)} />
                </Badge>
              ))}
            </div>
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