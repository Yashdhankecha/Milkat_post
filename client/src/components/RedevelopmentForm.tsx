import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { 
  X, 
  Plus, 
  Calendar, 
  DollarSign, 
  Target, 
  Building2,
  MapPin,
  Clock,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';

interface Society {
  _id: string;
  name: string;
  address: string;
  city: string;
  state: string;
}

interface RedevelopmentFormProps {
  societyId?: string;
  onClose: () => void;
  onSuccess: (project: any) => void;
  editingProject?: any;
}

const RedevelopmentForm: React.FC<RedevelopmentFormProps> = ({
  societyId,
  onClose,
  onSuccess,
  editingProject
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [societies, setSocieties] = useState<Society[]>([]);
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    society_id: societyId || '',
    expectedAmenities: [] as string[],
    estimatedBudget: '',
    minimumApprovalPercentage: '75',
    timeline: {
      startDate: '',
      expectedCompletionDate: ''
    }
  });
  
  const [newAmenity, setNewAmenity] = useState('');

  useEffect(() => {
    if (!societyId) {
      fetchSocieties();
    }
    
    if (editingProject) {
      setFormData({
        title: editingProject.title || '',
        description: editingProject.description || '',
        society_id: editingProject.society?._id || '',
        expectedAmenities: editingProject.expectedAmenities || [],
        estimatedBudget: editingProject.estimatedBudget?.toString() || '',
        minimumApprovalPercentage: editingProject.minimumApprovalPercentage?.toString() || '75',
        timeline: {
          startDate: editingProject.timeline?.startDate || '',
          expectedCompletionDate: editingProject.timeline?.expectedCompletionDate || ''
        }
      });
    }
  }, [societyId, editingProject]);

  const fetchSocieties = async () => {
    try {
      const response = await apiClient.getMySocieties();
      if (response.error) {
        toast({
          title: "Error",
          description: "Failed to fetch societies",
          variant: "destructive",
        });
        return;
      }
      setSocieties(response.data.societies || []);
    } catch (error) {
      console.error('Error fetching societies:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTimelineChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      timeline: {
        ...prev.timeline,
        [field]: value
      }
    }));
  };

  const addAmenity = () => {
    if (newAmenity.trim() && !formData.expectedAmenities.includes(newAmenity.trim())) {
      setFormData(prev => ({
        ...prev,
        expectedAmenities: [...prev.expectedAmenities, newAmenity.trim()]
      }));
      setNewAmenity('');
    }
  };

  const removeAmenity = (index: number) => {
    setFormData(prev => ({
      ...prev,
      expectedAmenities: prev.expectedAmenities.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.title.trim()) errors.push('Project title is required');
    if (!formData.description.trim()) errors.push('Project description is required');
    if (!formData.society_id) errors.push('Please select a society');
    if (formData.estimatedBudget && parseFloat(formData.estimatedBudget) < 0) {
      errors.push('Estimated budget must be a positive number');
    }
    if (formData.minimumApprovalPercentage && 
        (parseInt(formData.minimumApprovalPercentage) < 50 || parseInt(formData.minimumApprovalPercentage) > 100)) {
      errors.push('Minimum approval percentage must be between 50 and 100');
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => {
        toast({
          title: "Validation Error",
          description: error,
          variant: "destructive",
        });
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        estimatedBudget: formData.estimatedBudget ? parseFloat(formData.estimatedBudget) : undefined,
        minimumApprovalPercentage: parseInt(formData.minimumApprovalPercentage),
        timeline: {
          startDate: formData.timeline.startDate || undefined,
          expectedCompletionDate: formData.timeline.expectedCompletionDate || undefined
        }
      };

      let response;
      if (editingProject) {
        response = await apiClient.updateRedevelopmentProject(editingProject._id, submitData);
      } else {
        response = await apiClient.createRedevelopmentProject(submitData);
      }

      if (response.error) {
        toast({
          title: "Error",
          description: response.error,
          variant: "destructive",
        });
        return;
      }

      onSuccess(response.data.project);
    } catch (error: any) {
      console.error('Error saving project:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {editingProject ? 'Edit Redevelopment Project' : 'Create New Redevelopment Project'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Project Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter project title"
                    required
                  />
                </div>

                {!societyId && (
                  <div className="space-y-2">
                    <Label htmlFor="society">Society *</Label>
                    <Select value={formData.society_id} onValueChange={(value) => handleInputChange('society_id', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select society" />
                      </SelectTrigger>
                      <SelectContent>
                        {societies.map((society) => (
                          <SelectItem key={society._id} value={society._id}>
                            <div className="flex flex-col">
                              <span>{society.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {society.city}, {society.state}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Project Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the redevelopment project, objectives, and expected outcomes"
                  rows={4}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Financial Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedBudget">Estimated Budget (₹ Cr)</Label>
                  <Input
                    id="estimatedBudget"
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.estimatedBudget}
                    onChange={(e) => handleInputChange('estimatedBudget', e.target.value)}
                    placeholder="Enter estimated budget"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="minimumApprovalPercentage">Minimum Approval %</Label>
                  <Input
                    id="minimumApprovalPercentage"
                    type="number"
                    min="50"
                    max="100"
                    value={formData.minimumApprovalPercentage}
                    onChange={(e) => handleInputChange('minimumApprovalPercentage', e.target.value)}
                    placeholder="75"
                  />
                  <p className="text-sm text-muted-foreground">
                    Minimum percentage of votes required for approval
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Project Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Expected Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.timeline.startDate}
                    onChange={(e) => handleTimelineChange('startDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="completionDate">Expected Completion Date</Label>
                  <Input
                    id="completionDate"
                    type="date"
                    value={formData.timeline.expectedCompletionDate}
                    onChange={(e) => handleTimelineChange('expectedCompletionDate', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expected Amenities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4" />
                Expected Amenities
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  placeholder="Add expected amenity"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAmenity())}
                />
                <Button type="button" onClick={addAmenity} variant="outline" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.expectedAmenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.expectedAmenities.map((amenity, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {amenity}
                      <button
                        type="button"
                        onClick={() => removeAmenity(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {editingProject ? 'Update Project' : 'Create Project'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RedevelopmentForm;
