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
  const { signOut } = useAuth()
  const { profile } = useProfile()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      const { error } = await signOut()
      if (error) {
        toast({
          title: "Error",
          description: "Failed to sign out",
          variant: "destructive"
        })
      } else {
        navigate("/")
        toast({
          title: "Signed out",
          description: "You have been successfully signed out"
        })
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Something went wrong",
        variant: "destructive"
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'buyer': return 'bg-blue-100 text-blue-800'
      case 'seller': return 'bg-green-100 text-green-800'
      case 'broker': return 'bg-purple-100 text-purple-800'
      case 'developer': return 'bg-orange-100 text-orange-800'
      case 'admin': return 'bg-red-100 text-red-800'
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
              RealEstate<span className="text-accent">Pro</span>
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
            {profile && (
              <div className="flex items-center space-x-2">
                <Badge className={getRoleColor(profile.role)}>
                  {profile.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Badge>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{profile.full_name || 'User'}</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/" className="flex items-center">
                        <Home className="w-4 h-4 mr-2" />
                        Back to Home
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem asChild>
                      <Link to="/properties" className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Browse Properties
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
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