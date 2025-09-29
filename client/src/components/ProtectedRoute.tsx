import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth, Profile } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import SuspendedUserMessage from './SuspendedUserMessage'
import apiClient from '@/lib/api'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: Profile['role'] | Profile['role'][]
  requireAuth?: boolean
}

export const ProtectedRoute = ({ 
  children, 
  requiredRole, 
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { user, profile, loading: authLoading, isUserSuspended } = useAuth()
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true'
  const navigate = useNavigate()
  const [loadingRoles, setLoadingRoles] = useState(false)

  // Simple hasRole function
  const hasRole = (role: Profile['role'] | Profile['role'][]) => {
    if (!profile) return false;
    if (Array.isArray(role)) {
      return role.includes(profile.role);
    }
    return profile.role === role;
  };

  console.log('[ProtectedRoute] Render - User state:', {
    user: !!user,
    userId: user?.id,
    profile: !!profile,
    profileRole: profile?.role,
    authLoading,
    isUserSuspended,
    requireAuth,
    requiredRole
  });

  // Check if user has multiple roles and needs to select one
  useEffect(() => {
    const checkUserRoles = async () => {
      console.log('[ProtectedRoute] Checking user roles, user:', !!user, 'authLoading:', authLoading, 'profile:', !!profile);
      
      // Only run this check if we have a user but no profile yet
      if (user && !authLoading && !profile) {
        setLoadingRoles(true)
        try {
          // Check if a role has already been selected
          const selectedRole = localStorage.getItem('selectedRole')
          console.log('[ProtectedRoute] Selected role from localStorage:', selectedRole);
          
          if (selectedRole) {
            // If a role is already selected, we don't need to redirect to role selection
            // The profile should load with the correct role
            setLoadingRoles(false)
            return
          }
          
          // Get all roles for this user's phone number
          const phone = (user as any)?.phone || (user as any)?.user_metadata?.phone
          console.log('[ProtectedRoute] User phone:', phone);
          
          if (phone) {
            if (mockEnabled) {
              const existingProfilesRaw = localStorage.getItem(`mock_profiles_${phone}`)
              console.log('[ProtectedRoute] Mock profiles raw:', existingProfilesRaw);
              
              if (existingProfilesRaw) {
                const existingProfiles = JSON.parse(existingProfilesRaw)
                const roles = existingProfiles.map((p: any) => ({
                  role: p.role,
                  full_name: p.fullName
                }))
                
                console.log('[ProtectedRoute] Available roles:', roles);
                
                // If user has multiple roles and no role is selected, redirect to role selection
                if (roles.length > 1 && !localStorage.getItem('selectedRole')) {
                  console.log('[ProtectedRoute] Redirecting to role selection');
                  navigate('/role-selection', { state: { phone, roles }, replace: true })
                }
              }
            } else {
              // For now, we'll assume single role per user with our backend API
              // Multiple roles would need to be implemented in the backend
              console.log('[ProtectedRoute] Using backend API - single role per user');
            }
          }
        } catch (error) {
          console.error('Error checking user roles:', error)
        } finally {
          setLoadingRoles(false)
        }
      }
    }
    
    checkUserRoles()
  }, [user, authLoading, profile, mockEnabled, navigate])

  // Show loading spinner while checking authentication
  if (authLoading || loadingRoles) {
    console.log('[ProtectedRoute] Showing loading spinner');
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
    console.log('[ProtectedRoute] No user found, redirecting to auth')
    return <Navigate to="/auth" replace />
  }

  // If user is suspended → show suspended message
  if (!mockEnabled && user && isUserSuspended) {
    return <SuspendedUserMessage />
  }

  // Check role-based access
  if (requiredRole && profile && !hasRole(requiredRole)) {
    const redirectPath = getRoleBasedPath(profile.role)
    console.log('[ProtectedRoute] Role mismatch - Current role:', profile.role, 'Required role:', requiredRole, 'Redirecting to:', redirectPath)
    return <Navigate to={redirectPath} replace />
  }

  console.log('[ProtectedRoute] Rendering children');
  return <>{children}</>
}

const getRoleBasedPath = (role: Profile['role']): string => {
  console.log('[ProtectedRoute] getRoleBasedPath called with role:', role, 'Type:', typeof role);
  switch (role) {
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
      console.log('[ProtectedRoute] Unknown role, redirecting to home:', role);
      return '/'
  }
}

export default ProtectedRoute