import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import apiClient from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { PhoneNumberInput } from "@/components/CountryCodeSelector";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Briefcase, 
  FileText, 
  Building2, 
  Shield, 
  Users, 
  Home,
  Save,
  Upload,
  Camera,
  CheckCircle2,
  AlertCircle,
  Edit3
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [role, setRole] = useState<"admin" | "buyer_seller" | "broker" | "developer" | "society_owner" | "society_member">("buyer_seller");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userRoles, setUserRoles] = useState<any[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  const roleOptions = [
    { value: "buyer_seller", label: "Property Buyer & Seller", icon: Home, color: "text-blue-600" },
    { value: "broker", label: "Real Estate Broker", icon: Briefcase, color: "text-purple-600" },
    { value: "developer", label: "Property Developer", icon: Building2, color: "text-orange-600" },
    { value: "society_owner", label: "Society Owner/Secretary", icon: Shield, color: "text-red-600" },
    { value: "society_member", label: "Society Member", icon: Users, color: "text-indigo-600" },
  ];

  const businessTypeOptions = [
    "Real Estate Agency",
    "Property Development",
    "Construction Company",
    "Property Management",
    "Investment Firm",
    "Legal Services",
    "Architecture & Design",
    "Other"
  ];

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setPhone((profile as any).phone || "");
      setBio(profile.bio || "");
      setWebsite(profile.website || "");
      setCompanyName(profile.companyName || "");
      setBusinessType(profile.businessType || "");
      // Use activeRole from user data if available, otherwise fallback to currentRole or profile.role
      const activeRole = user?.activeRole || user?.currentRole || (profile as any).activeRole || (profile as any).currentRole || profile.role;
      setRole(activeRole as any ?? "buyer_seller");
    }
  }, [profile, user]);

  // Fetch user roles
  useEffect(() => {
    if (user) {
      fetchUserRoles();
    }
  }, [user]);

  const fetchUserRoles = async () => {
    try {
      setLoadingRoles(true);
      const result = await apiClient.getMyRoles();
      if (result.data) {
        setUserRoles(result.data.roles || []);
      }
    } catch (error) {
      console.error('Error fetching user roles:', error);
      toast({
        title: "Error",
        description: "Failed to fetch your roles",
        variant: "destructive",
      });
    } finally {
      setLoadingRoles(false);
    }
  };

  const handleRoleSwitch = async (newRole: string) => {
    try {
      const result = await apiClient.switchRole(newRole);
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Update local state with new active role
      if (result.data.activeRole) {
        console.log('Role switched to:', result.data.activeRole);
        
        // Refresh user data to update the active role in the context
        await refreshUser();
      }
      
      toast({
        title: "Role Switched",
        description: `Successfully switched to ${getRoleInfo(newRole).label}`,
      });
      
      // Get the dashboard path for the new role
      const dashboardPath = getRoleBasedPath(newRole);
      
      // Use navigate instead of window.location.href for better UX
      navigate(dashboardPath);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to switch role",
        variant: "destructive",
      });
    }
  };

  const getRoleBasedPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'buyer_seller':
        return '/buyer-seller/dashboard';
      case 'broker':
        return '/broker/dashboard';
      case 'developer':
        return '/developer/dashboard';
      case 'society_owner':
        return '/society-owner/dashboard';
      case 'society_member':
        return '/society-member/dashboard';
      default:
        return '/';
    }
  };

  // Check for changes
  useEffect(() => {
    if (profile) {
      const hasFormChanges = 
        fullName !== (profile.fullName || "") ||
        phone !== ((profile as any).phone || "") ||
        bio !== (profile.bio || "") ||
        website !== (profile.website || "") ||
        companyName !== (profile.companyName || "") ||
        businessType !== (profile.businessType || "") ||
        role !== profile.role;
      
      setHasChanges(hasFormChanges);
    }
  }, [fullName, phone, bio, website, companyName, businessType, role, profile]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (website && !/^https?:\/\/.+/.test(website)) {
      newErrors.website = "Please enter a valid URL (e.g., https://example.com)";
    }
    
    if (bio && bio.length > 500) {
      newErrors.bio = "Bio must be less than 500 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSave = async () => {
    if (!user) return;
    
    if (!validateForm()) {
      toast({ 
        title: "Validation Error", 
        description: "Please fix the errors before saving.", 
        variant: "destructive" 
      });
      return;
    }
    
    setSaving(true);
    setErrors({});
    
    try {
      const { error } = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        website: website.trim(),
        companyName: companyName.trim(),
        businessType: businessType,
        role: role as any,
      } as any);
      
      if (error) {
        toast({ 
          title: "Error", 
          description: String(error), 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Profile Updated", 
          description: "Your changes have been saved successfully.",
          action: <CheckCircle2 className="h-4 w-4 text-green-600" />
        });
        setHasChanges(false);
      }
    } catch (err) {
      toast({ 
        title: "Error", 
        description: "An unexpected error occurred. Please try again.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const getRoleInfo = (roleValue: string) => {
    return roleOptions.find(r => r.value === roleValue) || roleOptions[0];
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-6 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <div className="bg-muted/50 rounded-lg p-12">
              <User className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Sign In Required</h2>
              <p className="text-muted-foreground mb-6">Please sign in to manage your profile settings.</p>
              <Button asChild>
                <a href="/auth">Sign In</a>
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-estate-blue to-estate-blue-light bg-clip-text text-transparent">
              Profile Settings
            </h1>
            <p className="text-muted-foreground text-lg">Manage your personal information and professional details</p>
          </div>

          {/* Role Management Section - Moved to Top */}
          <Card className="shadow-soft border-0 bg-gradient-to-r from-estate-blue/5 to-estate-blue-lighter/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-estate-blue" />
                My Registered Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingRoles ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-muted/50 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : userRoles.length > 0 ? (
                <div className="space-y-3">
                  {userRoles.map((userRole, index) => {
                    const roleInfo = getRoleInfo(userRole.role);
                    const IconComponent = roleInfo.icon;
                    const isCurrentRole = userRole.role === role;
                    
                    return (
                      <div
                        key={userRole.role}
                        className={`relative p-4 rounded-lg border transition-all duration-200 ${
                          isCurrentRole 
                            ? 'border-estate-blue bg-estate-blue/5 shadow-md' 
                            : 'border-border hover:border-estate-blue/30 hover:shadow-sm'
                        }`}
                      >
                        {isCurrentRole && (
                          <div className="absolute -top-2 -right-2">
                            <Badge className="bg-estate-blue text-white text-xs">
                              Current
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-2 rounded-lg ${isCurrentRole ? 'bg-estate-blue/10' : 'bg-muted/50'}`}>
                              <IconComponent className={`h-5 w-5 ${roleInfo.color}`} />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground">
                                {roleInfo.label}
                              </h3>
                              <div className="flex items-center gap-4 mt-1">
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    userRole.status === 'active' ? 'bg-green-500' : 
                                    userRole.status === 'pending_verification' ? 'bg-yellow-500' : 
                                    'bg-red-500'
                                  }`}></div>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {userRole.status.replace('_', ' ')}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    userRole.verificationStatus === 'verified' ? 'bg-green-500' : 
                                    userRole.verificationStatus === 'pending' ? 'bg-yellow-500' : 
                                    'bg-gray-400'
                                  }`}></div>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {userRole.verificationStatus}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {!isCurrentRole && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRoleSwitch(userRole.role)}
                                className="hover:bg-estate-blue hover:text-white hover:border-estate-blue transition-colors"
                              >
                                Switch Role
                              </Button>
                            )}
                            {isCurrentRole && (
                              <Badge variant="secondary" className="text-xs">
                                Active
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-medium text-foreground mb-2">No Roles Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    You don't have any registered roles yet.
                  </p>
                  <Button variant="outline" size="sm">
                    Contact Support
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Form Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-soft">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-estate-blue" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Full Name *
                      </Label>
                      <Input 
                        id="fullName" 
                        value={fullName} 
                        onChange={(e) => setFullName(e.target.value)} 
                        placeholder="Enter your full name"
                        className={errors.fullName ? "border-destructive" : ""}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                          value={user.email || ""} 
                          disabled 
                          className="pl-10 bg-muted/50"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <PhoneNumberInput value={phone} onChange={setPhone} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Bio
                    </Label>
                    <Textarea 
                      id="bio" 
                      rows={4} 
                      value={bio} 
                      onChange={(e) => setBio(e.target.value)} 
                      placeholder="Tell us about yourself, your experience, and what you're looking for..."
                      className={errors.bio ? "border-destructive" : ""}
                    />
                    <div className="flex justify-between items-center">
                      {errors.bio && (
                        <p className="text-sm text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.bio}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground ml-auto">
                        {bio.length}/500 characters
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Information */}
              <Card className="shadow-soft">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-estate-blue" />
                    Professional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium">
                      Your Role *
                    </Label>
                    <Select value={role} onValueChange={(v) => setRole(v as any)}>
                      <SelectTrigger id="role" className="h-11">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roleOptions.map((option) => {
                          const IconComponent = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-3">
                                <IconComponent className={`h-4 w-4 ${option.color}`} />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-sm font-medium">
                        Company Name
                      </Label>
                      <Input 
                        id="companyName" 
                        value={companyName} 
                        onChange={(e) => setCompanyName(e.target.value)} 
                        placeholder="Your company or organization"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessType" className="text-sm font-medium">
                        Business Type
                      </Label>
                      <Select value={businessType} onValueChange={setBusinessType}>
                        <SelectTrigger id="businessType" className="h-11">
                          <SelectValue placeholder="Select business type" />
                        </SelectTrigger>
                        <SelectContent>
                          {businessTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-sm font-medium">
                      Website
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="website" 
                        value={website} 
                        onChange={(e) => setWebsite(e.target.value)} 
                        placeholder="https://your-website.com"
                        className={`pl-10 ${errors.website ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.website && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.website}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Role Statistics */}
              {userRoles.length > 0 && (
                <Card className="shadow-soft">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-estate-blue" />
                      Role Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Roles</span>
                        <span className="text-sm font-medium">{userRoles.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Active Roles</span>
                        <span className="text-sm font-medium">
                          {userRoles.filter(r => r.status === 'active').length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Verified Roles</span>
                        <span className="text-sm font-medium">
                          {userRoles.filter(r => r.verificationStatus === 'verified').length}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={onSave} 
              disabled={saving || !hasChanges} 
              className="min-w-32 bg-estate-blue hover:bg-estate-blue-light"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Profile;


