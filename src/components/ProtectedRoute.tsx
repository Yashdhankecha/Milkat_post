import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useProfile, UserProfile } from '@/hooks/useProfile'
import { Loader2 } from 'lucide-react'
import SuspendedUserMessage from './SuspendedUserMessage'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: UserProfile['role'] | UserProfile['role'][]
  requireAuth?: boolean
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { user, loading: authLoading, isUserSuspended } = useAuth()
  const { profile, loading: profileLoading, hasRole } = useProfile()

  // Show loading spinner while checking authentication
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If authentication is required but no user → go to auth page
  if (requireAuth && !user) {
    return <Navigate to="/auth" replace />
  }

  // If user is suspended → show suspended message
  if (user && isUserSuspended) {
    return <SuspendedUserMessage />
  }

  // ✅ After login/signup → always send to their dashboard
  if (user && profile && !requiredRole) {
    const redirectPath = getRoleBasedPath(profile.role)
    return <Navigate to={redirectPath} replace />
  }

  // Check role-based access
  if (requiredRole && profile && !hasRole(requiredRole)) {
    const redirectPath = getRoleBasedPath(profile.role)
    return <Navigate to={redirectPath} replace />
  }

  return <>{children}</>
}

const getRoleBasedPath = (role: UserProfile['role']): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard'
    case 'buyer':
      return '/buyer/dashboard'
    case 'seller':
      return '/seller/dashboard'
    case 'broker':
      return '/broker/dashboard'
    case 'developer':
      return '/developer/dashboard'
    case 'society_owner':
      return '/society-owner/dashboard'
    case 'society_member':
      return '/society-member/dashboard'
    default:
      return '/'
  }
}

export default ProtectedRoute
