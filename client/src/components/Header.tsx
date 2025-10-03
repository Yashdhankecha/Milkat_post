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
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-backdrop-blur:bg-background/80 border-b border-border shadow-soft">
      {/* Main Navigation */}
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Mobile hamburger */}
            <button
              className="inline-flex items-center justify-center rounded-md p-1.5 sm:p-2 text-foreground hover:text-estate-blue hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring lg:hidden transition-colors"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
            </button>

            {/* Brand */}
            <Link to="/" className="shrink-0 text-lg sm:text-xl lg:text-2xl font-bold text-estate-blue mr-4 sm:mr-6 lg:mr-8">
              Milkat<span className="text-accent">Post</span>
            </Link>

            {/* Desktop nav with overflow handling - centered */}
            <nav className="hidden lg:flex items-center justify-center flex-1 gap-4 xl:gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none]" style={{ WebkitOverflowScrolling: 'touch' }}>
              <Link to="/" className="text-foreground hover:text-estate-blue transition-colors font-medium text-sm xl:text-base px-2 py-1 rounded-md hover:bg-secondary/50">Home</Link>
              <Link to="/projects" className="text-foreground hover:text-estate-blue transition-colors text-sm xl:text-base px-2 py-1 rounded-md hover:bg-secondary/50">Projects</Link>
              <Link to="/properties" className="text-foreground hover:text-estate-blue transition-colors text-sm xl:text-base px-2 py-1 rounded-md hover:bg-secondary/50">Properties</Link>
              <Link to="/post-property" className="text-foreground hover:text-estate-blue transition-colors text-sm xl:text-base px-2 py-1 rounded-md hover:bg-secondary/50">Post Your Property</Link>
              <Link to="/about" className="text-foreground hover:text-estate-blue transition-colors text-sm xl:text-base px-2 py-1 rounded-md hover:bg-secondary/50">About Us</Link>
              <Link to="/contact" className="text-foreground hover:text-estate-blue transition-colors text-sm xl:text-base px-2 py-1 rounded-md hover:bg-secondary/50">Contact Us</Link>
            </nav>
          </div>

          {/* Account area */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {user ? (
              <div className="flex items-center gap-1 sm:gap-2">
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                      <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="max-w-[80px] sm:max-w-[120px] lg:max-w-[160px] truncate inline-block align-middle">
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
              <div className="flex items-center gap-1 sm:gap-2">
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                    <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Sign In</span>
                  </Button>
                </Link>
                <Link to="/auth?mode=register">
                  <Button size="sm" className="bg-estate-blue hover:bg-estate-blue-light text-xs sm:text-sm px-2 sm:px-3">
                    <LogIn className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="hidden sm:inline">Register</span>
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <div className="container mx-auto px-3 sm:px-4 py-3">
            <nav className="flex flex-col gap-1">
              <Link to="/" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors font-medium">Home</Link>
              <Link to="/projects" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors font-medium">Projects</Link>
              <Link to="/properties" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors font-medium">Properties</Link>
              <Link to="/post-property" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors font-medium">Post Your Property</Link>
              <Link to="/about" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors font-medium">About Us</Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors font-medium">Contact Us</Link>

              <div className="mt-3 border-t border-border pt-3">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-md text-foreground hover:bg-secondary transition-colors font-medium">Profile Settings</Link>
                    {!isOnDashboard && (
                      <button onClick={() => { setMobileOpen(false); handleAuthRedirect(); }} className="mt-1 w-full text-left px-3 py-2.5 rounded-md text-foreground hover:bg-secondary transition-colors font-medium">
                        Dashboard
                      </button>
                    )}
                    <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className="mt-1 w-full text-left px-3 py-2.5 rounded-md text-destructive hover:bg-secondary transition-colors font-medium">Sign Out</button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link to="/auth" onClick={() => setMobileOpen(false)}>
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/auth?mode=register" onClick={() => setMobileOpen(false)}>
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