import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { 
  Building, 
  Plus, 
  X, 
  Upload, 
  Star, 
  Award, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  FileText,
  Shield,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";

interface DeveloperProfile {
  id?: string;
  _id?: string;
  companyName: string;
  companyDescription: string;
  establishedYear: number | null;
  contactInfo: {
    phone?: string;
    email?: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
  businessType: string;
  registrationNumber: string;
  panNumber: string;
  gstNumber: string;
  reraRegistration: Array<{
    state: string;
    registrationNumber: string;
    registrationDate: string;
    expiryDate: string;
    documentUrl: string;
  }>;
  specializations: string[];
  serviceAreas: Array<{
    city: string;
    state: string;
    localities: string[];
  }>;
  languages: string[];
  certifications: Array<{
    name: string;
    issuingAuthority: string;
    issueDate: string;
    expiryDate: string;
    certificateUrl: string;
  }>;
  awards: Array<{
    title: string;
    description: string;
    year: number;
    organization: string;
    category: string;
  }>;
  team: Array<{
    name: string;
    designation: string;
    experience: number;
    specialization: string;
    photo: string;
    linkedin: string;
  }>;
  status: string;
  verificationStatus: string;
  verificationDocuments: Array<{
    type: string;
    url: string;
    status: string;
    uploadedAt: string;
  }>;
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
    companyName: '',
    companyDescription: '',
    establishedYear: null,
    contactInfo: {
      phone: '',
      email: '',
      alternatePhone: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    },
    businessType: 'private_limited',
    registrationNumber: '',
    panNumber: '',
    gstNumber: '',
    reraRegistration: [],
    specializations: [],
    serviceAreas: [],
    languages: [],
    certifications: [],
    awards: [],
    team: [],
    status: 'active',
    verificationStatus: 'unverified',
    verificationDocuments: []
  });

  useEffect(() => {
    if (existingProfile) {
      setFormData({
        companyName: existingProfile.companyName || existingProfile.company_name || '',
        companyDescription: existingProfile.companyDescription || existingProfile.company_description || '',
        establishedYear: existingProfile.establishedYear || existingProfile.established_year || null,
        contactInfo: {
          phone: existingProfile.contactInfo?.phone || existingProfile.contact_info?.phone || '',
          email: existingProfile.contactInfo?.email || existingProfile.contact_info?.email || '',
          alternatePhone: existingProfile.contactInfo?.alternatePhone || '',
          address: existingProfile.contactInfo?.address || existingProfile.contact_info?.address || '',
          city: existingProfile.contactInfo?.city || '',
          state: existingProfile.contactInfo?.state || '',
          pincode: existingProfile.contactInfo?.pincode || ''
        },
        socialMedia: {
          facebook: existingProfile.socialMedia?.facebook || existingProfile.social_media?.facebook || '',
          twitter: existingProfile.socialMedia?.twitter || existingProfile.social_media?.twitter || '',
          linkedin: existingProfile.socialMedia?.linkedin || existingProfile.social_media?.linkedin || '',
          instagram: existingProfile.socialMedia?.instagram || '',
          youtube: existingProfile.socialMedia?.youtube || '',
        },
        businessType: existingProfile.businessType || 'private_limited',
        registrationNumber: existingProfile.registrationNumber || '',
        panNumber: existingProfile.panNumber || '',
        gstNumber: existingProfile.gstNumber || '',
        reraRegistration: existingProfile.reraRegistration || [],
        specializations: existingProfile.specializations || [],
        serviceAreas: existingProfile.serviceAreas || [],
        languages: existingProfile.languages || [],
        certifications: existingProfile.certifications || [],
        awards: existingProfile.awards || [],
        team: existingProfile.team || [],
        status: existingProfile.status || 'active',
        verificationStatus: existingProfile.verificationStatus || 'unverified',
        verificationDocuments: existingProfile.verificationDocuments || []
      });
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
      contactInfo: {
        ...prev.contactInfo,
        [field]: value
      }
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!profile) return;

    setSaving(true);
    
    try {
      // Validate required fields
      if (!formData.companyName || formData.companyName.trim().length < 2) {
        toast({
          title: "Validation Error",
          description: "Company name is required and must be at least 2 characters long.",
          variant: "destructive"
        });
        return;
      }

      const updateData = {
        companyName: formData.companyName.trim(),
        ...(formData.companyDescription && { companyDescription: formData.companyDescription.trim() }),
        ...(formData.establishedYear && { establishedYear: parseInt(formData.establishedYear.toString()) }),
        ...(formData.contactInfo && Object.keys(formData.contactInfo).length > 0 && { contactInfo: formData.contactInfo }),
        ...(formData.socialMedia && Object.keys(formData.socialMedia).length > 0 && { socialMedia: formData.socialMedia }),
        ...(formData.businessType && { businessType: formData.businessType }),
        ...(formData.registrationNumber && { registrationNumber: formData.registrationNumber }),
        ...(formData.panNumber && { panNumber: formData.panNumber }),
        ...(formData.gstNumber && { gstNumber: formData.gstNumber }),
        ...(formData.specializations && formData.specializations.length > 0 && { specializations: formData.specializations }),
        ...(formData.serviceAreas && formData.serviceAreas.length > 0 && { serviceAreas: formData.serviceAreas }),
        ...(formData.languages && formData.languages.length > 0 && { languages: formData.languages })
      };

      console.log('Sending developer data:', updateData);
      console.log('Existing profile:', existingProfile);

      const profileId = existingProfile?.id || existingProfile?._id;
      
      if (profileId) {
        // Update existing profile
        console.log('Updating existing profile with ID:', profileId);
        const { error } = await apiClient.updateDeveloper(profileId, updateData);
        
        if (error) throw error;
      } else {
        // Create new profile
        console.log('Creating new profile');
        const { error } = await apiClient.createDeveloper(updateData);
        
        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Developer profile updated successfully!",
      });
      
      onUpdate();
    } catch (error) {
      console.error('Error updating developer profile:', error);
      
      // Show specific validation errors if available
      let errorMessage = "Failed to update developer profile. Please try again.";
      if (error?.response?.data?.errors) {
        const validationErrors = error.response.data.errors.map((err: any) => err.msg).join(', ');
        errorMessage = `Validation failed: ${validationErrors}`;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-70 blur-3xl pointer-events-none"></div>
        <CardHeader className="relative">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-blue-500/20 dark:bg-blue-700/30 backdrop-blur-sm">
              <Building className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                Company Profile
                {formData.verificationStatus === 'verified' && (
                  <Badge className="px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 shadow-md">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                )}
                {formData.verificationStatus === 'pending' && (
                  <Badge className="px-2 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0 shadow-md">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                )}
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Complete your company information to build trust with potential clients
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Company Information */}
        <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-900/10 dark:to-emerald-900/10 opacity-70 blur-3xl pointer-events-none"></div>
          <CardHeader className="relative">
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-green-500" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  required
                  className="mt-1"
                  placeholder="Enter your company name"
                />
              </div>
              
              <div>
                <Label htmlFor="establishedYear" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Established Year
                </Label>
                <Input
                  id="establishedYear"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={formData.establishedYear || ''}
                  onChange={(e) => handleInputChange('establishedYear', parseInt(e.target.value) || null)}
                  className="mt-1"
                  placeholder="e.g., 2010"
                />
                {formData.establishedYear && (
                  <p className="text-sm text-green-600 mt-1">
                    Experience: {new Date().getFullYear() - formData.establishedYear} years
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="companyDescription" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Company Description
              </Label>
              <Textarea
                id="companyDescription"
                placeholder="Tell us about your company, specialization, and experience..."
                className="min-h-[120px] mt-1"
                value={formData.companyDescription}
                onChange={(e) => handleInputChange('companyDescription', e.target.value)}
              />
            </div>

          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 dark:from-purple-900/10 dark:to-pink-900/10 opacity-70 blur-3xl pointer-events-none"></div>
          <CardHeader className="relative">
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Phone className="h-5 w-5 text-purple-500" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Email
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactInfo.email || ''}
                    onChange={(e) => handleContactInfoChange('email', e.target.value)}
                    className="pl-10"
                    placeholder="contact@yourcompany.com"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Phone
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactPhone"
                    value={formData.contactInfo.phone || ''}
                    onChange={(e) => handleContactInfoChange('phone', e.target.value)}
                    className="pl-10"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="contactCity" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  City
                </Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="contactCity"
                    value={formData.contactInfo.city || ''}
                    onChange={(e) => handleContactInfoChange('city', e.target.value)}
                    className="pl-10"
                    placeholder="Mumbai"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="contactState" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  State
                </Label>
                <Input
                  id="contactState"
                  value={formData.contactInfo.state || ''}
                  onChange={(e) => handleContactInfoChange('state', e.target.value)}
                  className="mt-1"
                  placeholder="Maharashtra"
                />
              </div>

              <div>
                <Label htmlFor="contactPincode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Pincode
                </Label>
                <Input
                  id="contactPincode"
                  value={formData.contactInfo.pincode || ''}
                  onChange={(e) => handleContactInfoChange('pincode', e.target.value)}
                  className="mt-1"
                  placeholder="400001"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="contactAddress" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Complete Address
              </Label>
              <Textarea
                id="contactAddress"
                placeholder="Complete business address..."
                className="min-h-[100px] mt-1"
                value={formData.contactInfo.address || ''}
                onChange={(e) => handleContactInfoChange('address', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>


        {/* Business Information */}
        <Card className="relative overflow-hidden rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-white to-teal-50 dark:from-gray-800 dark:to-teal-900/20">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-500/5 dark:from-teal-900/10 dark:to-cyan-900/10 opacity-70 blur-3xl pointer-events-none"></div>
          <CardHeader className="relative">
            <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Shield className="h-5 w-5 text-teal-500" />
              Business Information
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Legal and registration details for verification
            </p>
          </CardHeader>
          <CardContent className="relative space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="businessType" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Type
                </Label>
                <Select value={formData.businessType} onValueChange={(value) => handleInputChange('businessType', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private_limited">Private Limited</SelectItem>
                    <SelectItem value="public_limited">Public Limited</SelectItem>
                    <SelectItem value="partnership">Partnership</SelectItem>
                    <SelectItem value="sole_proprietorship">Sole Proprietorship</SelectItem>
                    <SelectItem value="llp">LLP</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="registrationNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Registration Number
                </Label>
                <Input
                  id="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={(e) => handleInputChange('registrationNumber', e.target.value)}
                  className="mt-1"
                  placeholder="Company registration number"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="panNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  PAN Number
                </Label>
                <Input
                  id="panNumber"
                  value={formData.panNumber}
                  onChange={(e) => handleInputChange('panNumber', e.target.value.toUpperCase())}
                  className="mt-1"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                />
              </div>
              
              <div>
                <Label htmlFor="gstNumber" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  GST Number
                </Label>
                <Input
                  id="gstNumber"
                  value={formData.gstNumber}
                  onChange={(e) => handleInputChange('gstNumber', e.target.value.toUpperCase())}
                  className="mt-1"
                  placeholder="22ABCDE1234F1Z5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={saving}
            className="px-8 py-3 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group text-lg font-semibold"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                Updating...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Update Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DeveloperProfileForm;