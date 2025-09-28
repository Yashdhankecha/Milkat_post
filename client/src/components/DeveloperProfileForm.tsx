import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";

interface DeveloperProfile {
  id?: string;
  company_name: string;
  company_description: string;
  established_year: number | null;
  website: string;
  contact_info: {
    email?: string;
    phone?: string;
    address?: string;
  };
  social_media: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

interface DeveloperProfileFormProps {
  onUpdate: () => void;
  existingProfile?: DeveloperProfile;
}

const DeveloperProfileForm = ({ onUpdate, existingProfile }: DeveloperProfileFormProps) => {
  const { profile } = useProfile();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<DeveloperProfile>({
    company_name: '',
    company_description: '',
    established_year: null,
    website: '',
    contact_info: {
      email: '',
      phone: '',
      address: ''
    },
    social_media: {
      linkedin: '',
      twitter: '',
      facebook: ''
    }
  });

  useEffect(() => {
    if (existingProfile) {
      setFormData(existingProfile);
    }
  }, [existingProfile]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContactInfoChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [field]: value
      }
    }));
  };

  const handleSocialMediaChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;

    setSaving(true);
    
    try {
      const updateData = {
        user_id: profile.id,
        company_name: formData.company_name,
        company_description: formData.company_description,
        established_year: formData.established_year,
        website: formData.website,
        contact_info: formData.contact_info,
        social_media: formData.social_media,
        verification_status: 'pending',
        status: 'active'
      };

      if (existingProfile?.id) {
        // Update existing profile
        const { error } = await apiClient
          (updateData)
          ;
        
        if (error) throw error;
      } else {
        // Create new profile
        const { error } = await apiClient
          (updateData);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Developer profile updated successfully!",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating developer profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Company Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company_name">Company Name</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="established_year">Established Year</Label>
              <Input
                id="established_year"
                type="number"
                min="1900"
                max={new Date().getFullYear()}
                value={formData.established_year || ''}
                onChange={(e) => handleInputChange('established_year', parseInt(e.target.value) || null)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="company_description">Company Description</Label>
            <Textarea
              id="company_description"
              placeholder="Tell us about your company, specialization, and experience..."
              className="min-h-[100px]"
              value={formData.company_description}
              onChange={(e) => handleInputChange('company_description', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              type="url"
              placeholder="https://www.yourcompany.com"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contact_email">Business Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_info.email || ''}
                  onChange={(e) => handleContactInfoChange('email', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="contact_phone">Business Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_info.phone || ''}
                  onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="contact_address">Business Address</Label>
              <Textarea
                id="contact_address"
                placeholder="Complete business address..."
                value={formData.contact_info.address || ''}
                onChange={(e) => handleContactInfoChange('address', e.target.value)}
              />
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Media (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="linkedin">LinkedIn Profile</Label>
                <Input
                  id="linkedin"
                  placeholder="https://linkedin.com/company/..."
                  value={formData.social_media.linkedin || ''}
                  onChange={(e) => handleSocialMediaChange('linkedin', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="twitter">Twitter Handle</Label>
                <Input
                  id="twitter"
                  placeholder="@yourcompany"
                  value={formData.social_media.twitter || ''}
                  onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="facebook">Facebook Page</Label>
                <Input
                  id="facebook"
                  placeholder="https://facebook.com/yourcompany"
                  value={formData.social_media.facebook || ''}
                  onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Updating..." : "Update Profile"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DeveloperProfileForm;