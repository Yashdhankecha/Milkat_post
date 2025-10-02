import { Facebook, MessageSquare, Phone, Mail, User, LogIn, LogOut, Settings, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import apiClient from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "./NotificationBell";

const Header = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';

  const handleSignOut = async () => {
    try {
      // Clear selected role before signing out
      localStorage.removeItem('selectedRole');
      const { error } = await signOut();
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive"
        });
      } else {
        navigate("/");
        toast({
          title: "Signed out",
          description: "You have been successfully signed out",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive"
      });
    }
  };

  const handleAuthRedirect = () => {
    if (user) {
      // Use role-based navigation
      const dashboardPath = getDashboardPath()
      console.log('[Header] Navigating to dashboard:', dashboardPath, 'for user role:', (user as any)?.role || profile?.role)
      navigate(dashboardPath)
    } else {
      navigate('/auth')
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/'
    
    // Use role from user data or profile
    const userRole = (user as any)?.role || profile?.role;
    
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard'
      case 'buyer_seller':
        return '/buyer-seller/dashboard'
      case 'broker':
        return '/broker/dashboard'
      case 'developer':
        return '/developer/dashboard'
      case 'society_owner':
        return '/society-owner/dashboard'
      case 'society_member':
        return '/society-member/dashboard'
      default:
        return '/dashboard' // Default dashboard if role not found
    }
  };

  // Check if we're on a dashboard page
  const isOnDashboard = location.pathname.includes('/dashboard');
  
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-backdrop-blur:bg-background/60 border-b border-border shadow-soft">
      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:text-estate-blue hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring lg:hidden"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Brand */}
            <Link to="/" className="shrink-0 text-xl sm:text-2xl font-bold text-estate-blue mr-8 sm:mr-10">
              Milkat<span className="text-accent">Post</span>
            </Link>

            {/* Desktop nav with overflow handling - centered */}
            <nav className="hidden lg:flex items-center justify-center flex-1 gap-4 sm:gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none]" style={{ WebkitOverflowScrolling: 'touch' }}>
              <Link to="/" className="text-foreground hover:text-estate-blue transition-colors font-medium text-sm sm:text-base">Home</Link>
              <Link to="/projects" className="text-foreground hover:text-estate-blue transition-colors text-sm sm:text-base">Projects</Link>
              <Link to="/properties" className="text-foreground hover:text-estate-blue transition-colors text-sm sm:text-base">Properties</Link>
              <Link to="/post-property" className="text-foreground hover:text-estate-blue transition-colors text-sm sm:text-base">Post Your Property</Link>
              <Link to="/about" className="text-foreground hover:text-estate-blue transition-colors text-sm sm:text-base">About Us</Link>
              <Link to="/contact" className="text-foreground hover:text-estate-blue transition-colors text-sm sm:text-base">Contact Us</Link>
            </nav>
          </div>

          {/* Account area */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      <User className="h-4 w-4 mr-1" />
                      <span className="max-w-[120px] sm:max-w-[160px] truncate inline-block align-middle">
                        {profile?.fullName || user?.email?.split('@')[0] || 'User'}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Profile Settings
                      </Link>
                    </DropdownMenuItem>
                    {!isOnDashboard && (
                      <DropdownMenuItem onClick={handleAuthRedirect} className="flex items-center">
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} className="flex items-center text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                    <User className="h-4 w-4 mr-1" />
                    <span className="hidden xs:inline">Sign In</span>
                  </Button>
                </Link>
                <Link to="/auth?mode=register">
                  <Button size="sm" className="bg-estate-blue hover:bg-estate-blue-light text-xs sm:text-sm">
                    <LogIn className="h-4 w-4 mr-1" />
                    <span className="hidden xs:inline">Register</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="container mx-auto px-4 py-3">
            <nav className="flex flex-col gap-2">
              <Link to="/" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">Home</Link>
              <Link to="/projects" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">Projects</Link>
              <Link to="/properties" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">Properties</Link>
              <Link to="/post-property" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">Post Your Property</Link>
              <Link to="/about" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">About Us</Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">Contact Us</Link>

              <div className="mt-2 border-t border-border pt-2">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-2 py-2 rounded-md text-foreground hover:bg-secondary transition-colors">Profile Settings</Link>
                    {!isOnDashboard && (
                      <button onClick={() => { setMobileOpen(false); handleAuthRedirect(); }} className="mt-1 w-full text-left px-2 py-2 rounded-md text-foreground hover:bg-secondary transition-colors">
                        Dashboard
                      </button>
                    )}
                    <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className="mt-1 w-full text-left px-2 py-2 rounded-md text-destructive hover:bg-secondary transition-colors">Sign Out</button>
                  </>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link to="/auth" onClick={() => setMobileOpen(false)} className="flex-1">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/auth?mode=register" onClick={() => setMobileOpen(false)} className="flex-1">
                      <Button className="w-full bg-estate-blue hover:bg-estate-blue-light">Register</Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;