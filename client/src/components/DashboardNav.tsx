import apiClient from '@/lib/api';
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/useAuth"
import { useProfile } from "@/hooks/useProfile"
import { useToast } from "@/hooks/use-toast"
import { 
  Home, 
  User, 
  Settings, 
  LogOut,
  ChevronDown,
  SwitchCamera
} from "lucide-react"
const DashboardNav = () => {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { profile } = useProfile()
  const { toast } = useToast()
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true'

  const handleSignOut = async () => {
    try {
      // Clear selected role before signing out
      localStorage.removeItem('selectedRole');
      const { error } = await signOut()
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "error"
        })
      } else {
        navigate("/")
        toast({
          title: "Signed out",
          description: "You have been successfully signed out",
          variant: "success"
        })
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Something went wrong",
        variant: "error"
      })
    }
  }

  const handleSwitchRole = async () => {
    console.log('[DashboardNav] Switching role, clearing selected role')
    // Clear current role
    localStorage.removeItem('selectedRole')
    
    // Get user's phone number
    const phone = (user as any)?.phone || (user as any)?.user_metadata?.phone || '';
    if (!phone) {
      console.log('[DashboardNav] No phone found, redirecting to role selection without data');
      toast({
        title: "Info",
        description: "Redirecting to role selection...",
        variant: "default",
      });
      navigate("/role-selection");
      return;
    }
    
    try {
      // Fetch user roles
      if (mockEnabled) {
        const existingProfilesRaw = localStorage.getItem(`mock_profiles_${phone}`);
        if (existingProfilesRaw) {
          const existingProfiles = JSON.parse(existingProfilesRaw);
          const roles = existingProfiles.map((p: any) => ({
            role: p.role,
            full_name: p.fullName || p.full_name || 'User'
          }));
          
          console.log(`[DashboardNav] Found ${roles.length} roles for user, redirecting to role selection`);
          if (roles.length > 0) {
            toast({
              title: "Info",
              description: "Loading your roles...",
              variant: "default",
              duration: 3000,
            });
            navigate("/role-selection", { state: { phone, roles } });
          } else {
            toast({
              title: "Info",
              description: "No roles found. Redirecting to login...",
              variant: "default",
              duration: 3000,
            });
            setTimeout(() => {
              navigate('/auth');
            }, 2000);
          }
          return;
        } else {
          console.log('[DashboardNav] No profiles found in localStorage, redirecting to auth');
          toast({
            title: "Info",
            description: "No profiles found. Redirecting to login...",
            variant: "default",
            duration: 3000,
          });
          setTimeout(() => {
            navigate('/auth');
          }, 2000);
          return;
        }
      } else {
        const { data: profiles, error } = await apiClient
          
          ;
        
        if (!error && profiles) {
          const roles = profiles.map(p => ({
            role: p.role,
            full_name: p.full_name || 'User'
          }));
          
          console.log(`[DashboardNav] Found ${roles.length} roles for user, redirecting to role selection`);
          if (roles.length > 0) {
            toast({
              title: "Info",
              description: "Loading your roles...",
              variant: "default",
              duration: 3000,
            });
            navigate("/role-selection", { state: { phone, roles } });
          } else {
            toast({
              title: "Info",
              description: "No roles found. Redirecting to login...",
              variant: "default",
              duration: 3000,
            });
            setTimeout(() => {
              navigate('/auth');
            }, 2000);
          }
          return;
        } else if (error) {
          console.error('[DashboardNav] Error fetching profiles:', error);
          toast({
            title: "Error",
            description: "Failed to load roles. Redirecting to login.",
            variant: "error",
            duration: 3000,
          });
          setTimeout(() => {
            navigate('/auth');
          }, 2000);
          return;
        }
      }
      
      // Fallback if no roles found
      console.log('[DashboardNav] No roles found, redirecting to role selection without data');
      toast({
        title: "Info",
        description: "Redirecting to role selection...",
        variant: "default",
        duration: 2000,
      });
      navigate("/role-selection");
    } catch (error) {
      console.error('[DashboardNav] Error fetching user roles:', error);
      // Show error to user and fallback
      toast({
        title: "Error",
        description: "Failed to load roles. Redirecting to role selection.",
        variant: "error",
        duration: 3000,
      });
      // Still navigate to role selection so user isn't stuck
      setTimeout(() => {
        navigate("/role-selection");
      }, 2000);
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800'
      case 'buyer_seller': return 'bg-blue-100 text-blue-800'
      case 'broker': return 'bg-purple-100 text-purple-800'
      case 'developer': return 'bg-orange-100 text-orange-800'
      case 'society_owner': return 'bg-teal-100 text-teal-800'
      case 'society_member': return 'bg-indigo-100 text-indigo-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Home Link */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-xl font-bold text-estate-blue">
              Milkat<span className="text-accent">Post</span>
            </Link>
            
            <Button asChild variant="ghost" size="sm">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>

          {/* Right side - User Profile Dropdown */}
          <div className="flex items-center space-x-4">
            {profile && profile.role && (
              <div className="flex items-center space-x-2">
                <Badge className={getRoleColor(profile.role)}>
                  {profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{profile.fullName || 'User'}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="flex items-center cursor-pointer"
                      onClick={handleSwitchRole}
                    >
                      <SwitchCamera className="w-4 h-4 mr-2" />
                      Switch Role
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem 
                      className="text-red-600 focus:text-red-600 cursor-pointer"
                      onClick={handleSignOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default DashboardNav