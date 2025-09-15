import { Facebook, MessageSquare, Phone, Mail, User, LogIn, LogOut, Settings, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Link, useNavigate } from "react-router-dom";

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

  return (
    <header className="bg-background border-b border-border shadow-soft">
      {/* Top Bar */}
      <div className="bg-estate-blue text-primary-foreground py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <span>+1 (555) 123-4567</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <span>info@realestate.com</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-estate-blue-lighter transition-colors">
              <MessageSquare className="h-4 w-4" />
            </a>
            <a href="#" className="hover:text-estate-blue-lighter transition-colors">
              <Facebook className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-2xl font-bold text-estate-blue">
              RealEstate<span className="text-accent">Pro</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/" className="text-foreground hover:text-estate-blue transition-colors font-medium">Home</Link>
              <Link to="/about" className="text-foreground hover:text-estate-blue transition-colors">About Us</Link>
              <Link to="/post-property" className="text-foreground hover:text-estate-blue transition-colors">Post Your Property</Link>
              <Link to="/submit-requirement" className="text-foreground hover:text-estate-blue transition-colors">Submit Requirement</Link>
              <Link to="/properties" className="text-foreground hover:text-estate-blue transition-colors">Properties</Link>
              <Link to="/contact" className="text-foreground hover:text-estate-blue transition-colors">Contact Us</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span className="text-muted-foreground">Search for:</span>
              <Button variant="outline" size="sm" className="h-8" onClick={handleAuthRedirect}>Buy</Button>
              <Button variant="outline" size="sm" className="h-8" onClick={handleAuthRedirect}>Rent/Lease</Button>
              <Button variant="outline" size="sm" className="h-8" onClick={handleAuthRedirect}>Sell</Button>
            </div>
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    Welcome, {profile?.full_name || user.email}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-1" />
                        My Account
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link to={getDashboardPath()} className="flex items-center">
                          <LayoutDashboard className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
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
                <>
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
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;