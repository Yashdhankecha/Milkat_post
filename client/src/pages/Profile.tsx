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
  MapPin,
  Save,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Comment out role-related state variables
  // const [website, setWebsite] = useState("");
  // const [companyName, setCompanyName] = useState("");
  // const [businessType, setBusinessType] = useState("");
  // const [role, setRole] = useState<"admin" | "buyer_seller" | "broker" | "developer" | "society_owner" | "society_member">("buyer_seller");
  // const [userRoles, setUserRoles] = useState<any[]>([]);
  // const [loadingRoles, setLoadingRoles] = useState(false);
  // const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Comment out role-related options
  // const roleOptions = [
  //   { value: "buyer_seller", label: "Property Buyer & Seller", icon: Home, color: "text-blue-600" },
  //   { value: "broker", label: "Real Estate Broker", icon: Briefcase, color: "text-purple-600" },
  //   { value: "developer", label: "Property Developer", icon: Building2, color: "text-orange-600" },
  //   { value: "society_owner", label: "Society Owner/Secretary", icon: Shield, color: "text-red-600" },
  //   { value: "society_member", label: "Society Member", icon: Users, color: "text-indigo-600" },
  // ];

  // const businessTypeOptions = [
  //   "Real Estate Agency",
  //   "Property Development",
  //   "Construction Company",
  //   "Property Management",
  //   "Investment Firm",
  //   "Legal Services",
  //   "Architecture & Design",
  //   "Other"
  // ];

  useEffect(() => {
    if (profile || user) {
      setFullName(profile?.fullName || "");
      setEmail(user?.email || "");
      setPhone(user?.phone || (profile as any)?.phone || "");
      setAddress(profile?.address || "");
      // Comment out professional fields
      // setWebsite(profile.website || "");
      // setCompanyName(profile.companyName || "");
      // setBusinessType(profile.businessType || "");
      // Use activeRole from user data if available, otherwise fallback to currentRole or profile.role
      // const activeRole = user?.activeRole || user?.currentRole || (profile as any).activeRole || (profile as any).currentRole || profile.role;
      // setRole(activeRole as any ?? "buyer_seller");
    }
  }, [profile, user]);

  // Comment out role fetching functionality
  // useEffect(() => {
  //   if (user) {
  //     fetchUserRoles();
  //   }
  // }, [user]);

  // const fetchUserRoles = async () => {
  //   try {
  //     setLoadingRoles(true);
  //     const result = await apiClient.getMyRoles();
  //     if (result.data) {
  //       setUserRoles(result.data.roles || []);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching user roles:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to fetch your roles",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setLoadingRoles(false);
  //   }
  // };

  // Comment out role switching functionality
  // const handleRoleSwitch = async (newRole: string) => {
  //   try {
  //     const result = await apiClient.switchRole(newRole);
  //     if (result.error) {
  //       throw new Error(result.error);
  //     }
      
  //     // Update local state with new active role
  //     if (result.data.activeRole) {
  //       console.log('Role switched to:', result.data.activeRole);
        
  //       // Refresh user data to update the active role in the context
  //       await refreshUser();
  //     }
      
  //     toast({
  //       title: "Role Switched",
  //       description: `Successfully switched to ${getRoleInfo(newRole).label}`,
  //     });
      
  //     // Get the dashboard path for the new role
  //     const dashboardPath = getRoleBasedPath(newRole);
      
  //     // Use navigate instead of window.location.href for better UX
  //     navigate(dashboardPath);
  //   } catch (error: any) {
  //     toast({
  //       title: "Error",
  //       description: error.message || "Failed to switch role",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // const getRoleBasedPath = (role: string): string => {
  //   switch (role) {
  //     case 'admin':
  //       return '/admin/dashboard';
  //     case 'buyer_seller':
  //       return '/buyer-seller/dashboard';
  //     case 'broker':
  //       return '/broker/dashboard';
  //     case 'developer':
  //       return '/developer/dashboard';
  //     case 'society_owner':
  //       return '/society-owner/dashboard';
  //     case 'society_member':
  //       return '/society-member/dashboard';
  //     default:
  //       return '/';
  //   }
  // };

  // Check for changes - only personal information
  useEffect(() => {
    if (profile) {
      const hasFormChanges = 
        fullName !== (profile.fullName || "") ||
        email !== (user?.email || "") ||
        address !== (profile.address || "");
        // Comment out professional field changes
        // website !== (profile.website || "") ||
        // companyName !== (profile.companyName || "") ||
        // businessType !== (profile.businessType || "") ||
        // role !== profile.role;
      
      setHasChanges(hasFormChanges);
    }
  }, [fullName, email, address, profile, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Comment out website validation
    // if (website && !/^https?:\/\/.+/.test(website)) {
    //   newErrors.website = "Please enter a valid URL (e.g., https://example.com)";
    // }
    
    if (address && address.length > 500) {
      newErrors.address = "Address must be less than 500 characters";
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
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        // Comment out professional fields
        // website: website.trim(),
        // companyName: companyName.trim(),
        // businessType: businessType,
        // role: role as any,
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

  // Comment out getRoleInfo function
  // const getRoleInfo = (roleValue: string) => {
  //   return roleOptions.find(r => r.value === roleValue) || roleOptions[0];
  // };

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
              Personal Profile
            </h1>
            <p className="text-muted-foreground text-lg">Manage your personal information</p>
          </div>

          {/* Comment out Role Management Section */}
          {/* <Card className="shadow-soft border-0 bg-gradient-to-r from-estate-blue/5 to-estate-blue-lighter/5">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-estate-blue" />
                My Registered Roles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              Role management content commented out
            </CardContent>
          </Card> */}

          {/* Personal Information Only */}
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-estate-blue" />
                  Personal Information
                  {profile && (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full ml-auto">
                      ✓ Saved
                    </span>
                  )}
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
                      placeholder={profile?.fullName ? "" : "Enter your full name"}
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
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email"
                        type="email"
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={user?.email ? "" : "Enter your email"}
                        className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Registered Mobile Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      value={phone || "Not registered"} 
                      disabled 
                      className="pl-10 bg-muted/50"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Mobile number cannot be changed</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Current Role</Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-3 h-3 bg-estate-blue rounded-full"></div>
                    </div>
                    <Input 
                      value={user?.role ? user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : (profile?.role ? profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not assigned')} 
                      disabled 
                      className="pl-10 bg-muted/50 font-medium"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Your current system role</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    Address
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Textarea 
                      id="address" 
                      rows={4} 
                      value={address} 
                      onChange={(e) => setAddress(e.target.value)} 
                      placeholder={profile?.address ? "" : "Enter your complete address..."}
                      className={`pl-10 ${errors.address ? "border-destructive" : ""}`}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    {errors.address && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.address}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground ml-auto">
                      {address.length}/500 characters
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="flex justify-center">
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


