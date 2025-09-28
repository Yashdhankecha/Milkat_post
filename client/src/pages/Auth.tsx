import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import SMSOTPVerification from "@/components/SMSOTPVerification";
import { PhoneNumberInput } from "@/components/CountryCodeSelector";
import { User, Building2, Shield, Home, Users, Briefcase } from "lucide-react";

const Auth = () => {
  console.log('[Auth] Component initializing');
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'register');
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<Array<{role: string, full_name: string}>>([]);
  const [selectedLoginRole, setSelectedLoginRole] = useState("");
  const [showLoginRoleSelection, setShowLoginRoleSelection] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    user, 
    sendOTP, 
    verifyOTP, 
    signUpWithSMSForNewRole 
  } = useAuth();
  const { profile, loading: profileLoading, createProfile } = useProfile();
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true'

  console.log('[Auth] Initial state:', {
    user: !!user,
    userId: user?.id,
    profile: !!profile,
    profileLoading,
    isLogin,
    mode
  });

  const roles = [
    { 
      value: 'buyer_seller', 
      label: 'Property Buyer & Seller', 
      description: 'Buy, sell, or rent properties - all in one place',
      icon: User,
      color: 'text-blue-600'
    },
    { 
      value: 'broker', 
      label: 'Real Estate Broker', 
      description: 'Licensed real estate professional',
      icon: Briefcase,
      color: 'text-purple-600'
    },
    { 
      value: 'developer', 
      label: 'Property Developer', 
      description: 'Builder & redevelopment specialist',
      icon: Building2,
      color: 'text-orange-600'
    },
    { 
      value: 'society_owner', 
      label: 'Society Owner/Secretary', 
      description: 'Managing society redevelopment',
      icon: Shield,
      color: 'text-red-600'
    },
    { 
      value: 'society_member', 
      label: 'Society Member', 
      description: 'Flat owner in housing society',
      icon: Users,
      color: 'text-indigo-600'
    },
  ];

  // Handle mode changes from URL params
  useEffect(() => {
    const currentMode = searchParams.get('mode');
    setIsLogin(currentMode !== 'register');
  }, [searchParams]);

  // Handle authenticated user redirects
  useEffect(() => {
    console.log('[Auth] Auth redirect effect triggered', {
      user: !!user,
      userId: user?.id,
      profileLoading,
      showOTPVerification,
      showRoleSelection,
      pathname: window.location.pathname
    });
    
    // Redirect authenticated users to appropriate dashboard
    if (user && !profileLoading) {
      console.log('[Auth] User authenticated, checking redirect conditions', {
        pathname: window.location.pathname,
        showOTPVerification,
        showRoleSelection
      });
      
      // If we're on the auth page and user is authenticated, redirect to dashboard
      const isOnAuthPage = window.location.pathname.includes('/auth');
      console.log('[Auth] Is on auth page:', isOnAuthPage);
      
      // Only redirect if we're not in the middle of OTP verification or role selection
      if (isOnAuthPage && !showOTPVerification && !showRoleSelection) {
        // Get user's role from profile and redirect to appropriate dashboard
        if (profile?.role) {
          const dashboardPath = getRoleBasedPath(profile.role);
          console.log('[Auth] Redirecting to dashboard:', dashboardPath);
          navigate(dashboardPath, { replace: true });
        } else {
          console.log('[Auth] No profile role found, redirecting to home');
          navigate('/', { replace: true });
        }
      }
    }
  }, [user, profile, profileLoading, showOTPVerification, showRoleSelection, navigate]);

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

  // Show loading while checking authentication and profile
  if (user && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-estate-blue"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If we're showing role selection, don't process the form submission
    if (showRoleSelection) {
      console.log('[Auth] Form submission blocked - role selection is active');
      return;
    }
    
    console.log('[Auth] handleSubmit called, isLogin:', isLogin, 'selectedLoginRole:', selectedLoginRole);
    
    // Validate phone number format: E.164 like +[country][number]
    if (!mockEnabled) {
      const e164 = /^\+[1-9]\d{7,14}$/
      if (!e164.test(phone)) {
        toast({
          title: "Invalid phone number",
          description: "Enter a valid phone in international format, e.g. +919876543210.",
          variant: "destructive",
        });
        return;
      }
    } else if (!phone) {
      toast({
        title: "Phone required",
        description: "Enter any phone to receive the mock OTP (123456).",
        variant: "destructive",
      });
      return;
    }

    // For login, validate role selection
    if (isLogin && !selectedLoginRole) {
      toast({
        title: "Role required",
        description: "Please select your role to continue.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        console.log('[Auth] Proceeding with login for role:', selectedLoginRole);
        await proceedWithLogin();
      } else {
        // Registration - validate required fields
        if (!fullName || !selectedRole) {
          toast({
            title: "Missing information",
            description: "Please fill in all required fields.",
            variant: "destructive",
          });
          return;
        }

        // Send OTP for registration (new role or new user)
        const { error } = await signUpWithSMSForNewRole(phone, fullName, selectedRole as any);
        if (error) {
          const msg = error.message || 'Failed to send OTP';
          
          // Check if user already has this role
          if (msg.includes('already have this role')) {
            toast({
              title: "Role already exists",
              description: "You already have this role. Please login instead.",
              variant: "destructive",
            });
            return;
          }
          
          toast({
            title: "Failed to send OTP",
            description: /provider|phone auth|sms/i.test(msg)
              ? "SMS provider not enabled. For development, set VITE_MOCK_OTP=true and use code 123456."
              : msg,
            variant: "destructive",
          });
        } else {
          setShowOTPVerification(true);
          const devOtp = mockEnabled ? (sessionStorage.getItem(`mock_otp_${phone}`) || '123456') : null;
          toast({
            title: "OTP Sent!",
            description: mockEnabled
              ? `Development OTP: ${devOtp}`
              : "Please check your phone for the verification code.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = async (role: string) => {
    console.log('[Auth] Role selected:', role);
    console.log('[Auth] Current state - showRoleSelection:', showRoleSelection, 'showOTPVerification:', showOTPVerification);
    
    // Make sure we're not processing a form submission
    if (!showRoleSelection) {
      console.log('[Auth] Role selection called but not in role selection mode');
      return;
    }
    
    setLoading(true);
    setSelectedLoginRole(role);
    console.log('[Auth] selectedLoginRole set to:', role);
    
    // Call proceedWithLogin with the role directly to avoid state timing issues
    try {
      await proceedWithLogin(role);
    } catch (error) {
      console.error('[Auth] Error in handleRoleSelection:', error);
    } finally {
      setLoading(false);
    }
  };

  const proceedWithLogin = async (role?: string) => {
    console.log('[Auth] proceedWithLogin called, passed role:', role, 'selectedLoginRole:', selectedLoginRole);
    try {
      // Use the passed role first, then fall back to selectedLoginRole, then availableRoles
      const roleToUse = role || selectedLoginRole || (availableRoles.length === 1 ? availableRoles[0].role : null);
      console.log('[Auth] roleToUse:', roleToUse);
      
      if (!roleToUse) {
        toast({
          title: "No role selected",
          description: "Please select a role to continue.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await sendOTP(phone, roleToUse as any);
      if (error) {
        const msg = error.message || 'Failed to send OTP'
        toast({
          title: "Failed to send OTP",
          description: /provider|phone auth|sms/i.test(msg)
            ? "SMS provider not enabled. For development, set VITE_MOCK_OTP=true and use code 123456."
            : msg,
          variant: "destructive",
        });
      } else {
        setShowRoleSelection(false);
        setShowOTPVerification(true);
        const devOtp = mockEnabled ? (sessionStorage.getItem(`mock_otp_${phone}`) || '123456') : null;
        toast({
          title: "OTP Sent!",
          description: mockEnabled
            ? `Development OTP: ${devOtp}`
            : "Please check your phone for the verification code.",
        });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setLoading(true);

    try {
      const roleToUse = isLogin ? selectedLoginRole : selectedRole;
      const { data, error } = await verifyOTP(phone, otp, roleToUse as any);
      
      if (error) {
        toast({
          title: "Verification failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        if (!isLogin && data?.user) {
          // For registration, create profile after successful verification
          await createProfile({
            role: selectedRole as any,
            full_name: fullName,
            phone: phone,
          });
        }
        
        toast({
          title: "Success!",
          description: isLogin ? "You've been successfully logged in." : "Your account has been created successfully.",
        });
        
        // Redirect to appropriate dashboard based on role
        const roleToUse = isLogin ? selectedLoginRole : selectedRole;
        const dashboardPath = getRoleBasedPath(roleToUse);
        console.log('[Auth] OTP verification successful, redirecting to dashboard:', dashboardPath);
        navigate(dashboardPath, { replace: true });
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);

    try {
      const { error } = isLogin 
        ? await sendOTP(phone, selectedLoginRole as any)
        : await signUpWithSMSForNewRole(phone, fullName, selectedRole as any);
        
      if (error) {
        toast({
          title: "Failed to resend OTP",
          description: error.message,
          variant: "destructive",
        });
      }
      else {
        const devOtp = mockEnabled ? (sessionStorage.getItem(`mock_otp_${phone}`) || '123456') : null;
        if (mockEnabled) {
          toast({
            title: "OTP Sent",
            description: `Development OTP: ${devOtp}`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-estate-blue-lighter to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {showOTPVerification ? (
          <SMSOTPVerification
            phone={phone}
            onVerify={handleVerifyOTP}
            onResend={handleResendOTP}
            onBack={() => setShowOTPVerification(false)}
            loading={loading}
            resendLoading={resendLoading}
          />
        ) : showRoleSelection ? (
          <Card className="shadow-strong border-0 w-full">
            <CardHeader className="space-y-1 text-center">
              <div className="text-2xl font-bold text-estate-blue mb-2">
                Milkat<span className="text-accent">Post</span>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                Select Your Role
              </CardTitle>
              <CardDescription>
                You have multiple roles. Please select which one you want to sign in as.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableRoles.map((roleData, index) => {
                const roleInfo = roles.find(r => r.value === roleData.role);
                const IconComponent = roleInfo?.icon || User;
                return (
                  <button
                    key={index}
                    className="w-full h-auto p-4 justify-start rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-left"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRoleSelection(roleData.role);
                    }}
                    disabled={loading}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className={`h-5 w-5 ${roleInfo?.color || 'text-gray-600'}`} />
                      <div className="text-left">
                        <div className="font-medium">{roleInfo?.label || roleData.role}</div>
                        <div className="text-sm text-muted-foreground">{roleData.full_name}</div>
                      </div>
                      {loading && selectedLoginRole === roleData.role && (
                        <div className="ml-auto">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-estate-blue border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              <div className="text-center">
                <Button
                  variant="link"
                  className="p-0 h-auto font-medium text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setShowRoleSelection(false);
                    setAvailableRoles([]);
                    setSelectedLoginRole("");
                  }}
                >
                  ← Back to login
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-strong border-0 w-full">
            <CardHeader className="space-y-1 text-center">
              <div className="text-2xl font-bold text-estate-blue mb-2">
                Milkat<span className="text-accent">Post</span>
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                {isLogin ? "Welcome back" : "Create account"}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? "Sign in to your account to continue" 
                  : "Sign up to start exploring properties"
                }
              </CardDescription>
            </CardHeader>
          <CardContent className="space-y-6">

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium text-foreground">
                      Full Name
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role" className="text-sm font-medium text-foreground">
                      Select Your Role
                    </Label>
                    <Select value={selectedRole} onValueChange={setSelectedRole} required>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Choose your role in real estate" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => {
                          const IconComponent = role.icon;
                          return (
                            <SelectItem key={role.value} value={role.value}>
                              <div className="flex items-center gap-3 py-1">
                                <IconComponent className={`h-4 w-4 ${role.color}`} />
                                <div>
                                  <div className="font-medium">{role.label}</div>
                                  <div className="text-sm text-muted-foreground">{role.description}</div>
                                </div>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              {isLogin && (
                <div className="space-y-2">
                  <Label htmlFor="loginRole" className="text-sm font-medium text-foreground">
                    Select Your Role
                  </Label>
                  <Select value={selectedLoginRole} onValueChange={setSelectedLoginRole} required>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choose your role to sign in" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => {
                        const IconComponent = role.icon;
                        return (
                          <SelectItem key={role.value} value={role.value}>
                            <div className="flex items-center gap-3 py-1">
                              <IconComponent className={`h-4 w-4 ${role.color}`} />
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-sm text-muted-foreground">{role.description}</div>
                              </div>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                  Phone Number
                </Label>
                <PhoneNumberInput
                  value={phone}
                  onChange={setPhone}
                  placeholder="Enter your phone number"
                  disabled={loading}
                />
                <p className="text-xs text-muted-foreground">
                  We'll send you a verification code via SMS
                </p>
              </div>

              <Button
                className="w-full h-11 bg-estate-blue hover:bg-estate-blue-light text-white font-medium"
                type="submit"
                disabled={loading}
              >
                {loading 
                  ? "Sending..." 
                  : isLogin 
                  ? "Send Verification Code" 
                  : "Create Account"
                }
              </Button>
            </form>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
              </div>
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-estate-blue hover:text-estate-blue-light"
                onClick={() => {
                  if (isLogin) {
                    // Switch to register mode
                    setIsLogin(false);
                    navigate('/auth?mode=register');
                  } else {
                    // Switch to login mode
                    setIsLogin(true);
                    navigate('/auth');
                  }
                  // Reset form state
                  setPhone("");
                  setFullName("");
                  setSelectedRole("");
                  setSelectedLoginRole("");
                  setShowRoleSelection(false);
                  setShowLoginRoleSelection(false);
                  setAvailableRoles([]);
                }}
              >
                {isLogin ? "Create new account" : "Sign in instead"}
              </Button>
            </div>

            <div className="text-center">
              <Link 
                to="/" 
                className="text-sm text-muted-foreground hover:text-estate-blue transition-colors"
              >
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default Auth;