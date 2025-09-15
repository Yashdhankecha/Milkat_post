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
import { Eye, EyeOff } from "lucide-react";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const [isLogin, setIsLogin] = useState(mode !== 'reset');
  const [isForgotPassword, setIsForgotPassword] = useState(mode === 'reset');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn, signUp, signInWithGoogle, resetPassword, user } = useAuth();
  const { profile, loading: profileLoading, createProfile } = useProfile();

  const roles = [
    { value: 'buyer', label: 'Buyer', description: 'Looking for properties to buy or rent' },
    { value: 'seller', label: 'Seller', description: 'Selling or renting out properties' },
    { value: 'broker', label: 'Broker', description: 'Real estate professional' },
    { value: 'developer', label: 'Developer', description: 'Property developer, builder & redevelopment specialist' },
    { value: 'society_owner', label: 'Society Owner/Secretary', description: 'Managing society redevelopment' },
    { value: 'society_member', label: 'Society Member', description: 'Flat owner in housing society' },
  ];

  // Handle authenticated user redirects
  useEffect(() => {
    if (user && !profileLoading && profile) {
      // User has profile, redirect to appropriate dashboard
      const roleBasedPath = getRoleBasedPath(profile.role);
      navigate(roleBasedPath);
    }
  }, [user, profile, profileLoading, navigate]);

  const getRoleBasedPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'buyer':
        return '/buyer/dashboard';
      case 'seller':
        return '/seller/dashboard';
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
    setLoading(true);

    try {
      if (isForgotPassword) {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Reset password failed",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Password reset sent!",
            description: "Check your email for password reset instructions.",
          });
        }
      } else if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Login failed",
              description: "Invalid email or password. Please check your credentials.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Login failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Welcome back!",
            description: "You've been successfully logged in.",
          });
        }
      } else {
        if (!selectedRole) {
          toast({
            title: "Role required",
            description: "Please select your role to continue.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(email, password, fullName, selectedRole, mobile);
        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Account exists",
              description: "An account with this email already exists. Try logging in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign up failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          // Create profile with registration data including mobile
          await createProfile({
            role: selectedRole as any,
            full_name: fullName,
            phone: mobile,
          });
          
          toast({
            title: "Account created!",
            description: "Your account has been created successfully.",
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

  const handleGoogleAuth = async () => {
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast({
          title: "Google sign in failed",
          description: error.message,
          variant: "destructive",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-estate-blue-lighter to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-strong border-0">
          <CardHeader className="space-y-1 text-center">
            <div className="text-2xl font-bold text-estate-blue mb-2">
              RealEstate<span className="text-accent">Pro</span>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              {isForgotPassword ? "Reset password" : isLogin ? "Welcome back" : "Create account"}
            </CardTitle>
            <CardDescription>
              {isForgotPassword 
                ? "Enter your email to receive reset instructions"
                : isLogin 
                ? "Sign in to your account to continue" 
                : "Sign up to start exploring properties"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isForgotPassword && (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleAuth}
                  type="button"
                >
                  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && !isForgotPassword && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile Number</Label>
                    <Input
                      id="mobile"
                      placeholder="Enter your mobile number"
                      type="tel"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  placeholder="Enter your email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              {!isForgotPassword && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              <div>
                                <div className="font-medium">{role.label}</div>
                                <div className="text-sm text-muted-foreground">{role.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}

              <Button
                className="w-full bg-estate-blue hover:bg-estate-blue-light"
                type="submit"
                disabled={loading}
              >
                {loading 
                  ? "Please wait..." 
                  : isForgotPassword 
                  ? "Send Reset Email"
                  : isLogin 
                  ? "Sign In" 
                  : "Create Account"
                }
              </Button>
            </form>

            <div className="text-center text-sm space-y-2">
              {!isForgotPassword && (
                <div>
                  <span className="text-muted-foreground">
                    {isLogin ? "Don't have an account?" : "Already have an account?"}
                  </span>{" "}
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-estate-blue hover:text-estate-blue-light"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setIsForgotPassword(false);
                    }}
                  >
                    {isLogin ? "Sign up" : "Sign in"}
                  </Button>
                </div>
              )}
              
              {isLogin && !isForgotPassword && (
                <div>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-estate-blue hover:text-estate-blue-light"
                    onClick={() => setIsForgotPassword(true)}
                  >
                    Forgot your password?
                  </Button>
                </div>
              )}

              {isForgotPassword && (
                <div>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-medium text-estate-blue hover:text-estate-blue-light"
                    onClick={() => {
                      setIsForgotPassword(false);
                      setIsLogin(true);
                    }}
                  >
                    Back to sign in
                  </Button>
                </div>
              )}
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
      </div>
    </div>
  );
};

export default Auth;