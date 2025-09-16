import { Facebook, MessageSquare, Phone, Mail, User, LogIn, LogOut, Settings, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const Header = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleAuthRedirect = () => {
    if (user) {
      navigate(getDashboardPath());
    } else {
      navigate('/auth');
    }
  };

  const getDashboardPath = () => {
    if (!profile) return '/';
    
    switch (profile.role) {
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

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur supports-backdrop-blur:bg-background/60 border-b border-border shadow-soft">
      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 lg:gap-8 min-w-0">
            {/* Mobile hamburger */}
            <button
              className="inline-flex items-center justify-center rounded-md p-2 text-foreground hover:text-estate-blue hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring lg:hidden"
              aria-label="Toggle navigation menu"
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Brand */}
            <Link to="/" className="shrink-0 text-2xl font-bold text-estate-blue">
              RealEstate<span className="text-accent">Pro</span>
            </Link>

            {/* Desktop nav with overflow handling */}
            <nav className="hidden lg:flex items-center gap-6 overflow-x-auto whitespace-nowrap [scrollbar-width:none] [-ms-overflow-style:none]" style={{ WebkitOverflowScrolling: 'touch' }}>
              <Link to="/" className="text-foreground hover:text-estate-blue transition-colors font-medium">Home</Link>
              <Link to="/about" className="text-foreground hover:text-estate-blue transition-colors">About Us</Link>
              <Link to="/post-property" className="text-foreground hover:text-estate-blue transition-colors">Post Your Property</Link>
              <Link to="/submit-requirement" className="text-foreground hover:text-estate-blue transition-colors">Submit Requirement</Link>
              <Link to="/properties" className="text-foreground hover:text-estate-blue transition-colors">Properties</Link>
              <Link to="/contact" className="text-foreground hover:text-estate-blue transition-colors">Contact Us</Link>
            </nav>
          </div>

          {/* Account area */}
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-1" />
                      <span className="max-w-[160px] truncate inline-block align-middle">
                        {profile?.full_name || user.email}
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
                  <Button variant="outline" size="sm">
                    <User className="h-4 w-4 mr-1" />
                    Sign In
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-estate-blue hover:bg-estate-blue-light">
                    <LogIn className="h-4 w-4 mr-1" />
                    Register
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
              <Link to="/about" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">About Us</Link>
              <Link to="/post-property" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">Post Your Property</Link>
              <Link to="/submit-requirement" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">Submit Requirement</Link>
              <Link to="/properties" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">Properties</Link>
              <Link to="/contact" onClick={() => setMobileOpen(false)} className="px-2 py-2 rounded-md text-foreground hover:bg-secondary hover:text-estate-blue transition-colors">Contact Us</Link>

              <div className="mt-2 border-t border-border pt-2">
                {user ? (
                  <>
                    <Link to="/profile" onClick={() => setMobileOpen(false)} className="block px-2 py-2 rounded-md text-foreground hover:bg-secondary transition-colors">Profile Settings</Link>
                    <button onClick={() => { setMobileOpen(false); handleSignOut(); }} className="mt-1 w-full text-left px-2 py-2 rounded-md text-destructive hover:bg-secondary transition-colors">Sign Out</button>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <Link to="/auth" onClick={() => setMobileOpen(false)} className="flex-1">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link to="/auth" onClick={() => setMobileOpen(false)} className="flex-1">
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