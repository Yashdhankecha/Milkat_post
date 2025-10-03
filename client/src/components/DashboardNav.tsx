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
  ChevronDown
} from "lucide-react"
const DashboardNav = () => {
  const navigate = useNavigate()
  const { signOut, user } = useAuth()
  const { profile } = useProfile()
  const { toast } = useToast()

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
    <nav className="bg-white border-b border-border sticky top-0 z-50 shadow-soft">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side - Logo and Home Link */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <Link to="/" className="text-lg sm:text-xl font-bold text-estate-blue shrink-0">
              Milkat<span className="text-accent">Post</span>
            </Link>
            
            <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Home
              </Link>
            </Button>
          </div>

          {/* Right side - User Profile Dropdown */}
          <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
            {profile && profile.role && (
              <div className="flex items-center space-x-2">
                <Badge className={`${getRoleColor(profile.role)} text-xs sm:text-sm hidden sm:inline-flex`}>
                  {profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline max-w-[100px] lg:max-w-[150px] truncate">
                        {profile.fullName || 'User'}
                      </span>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
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