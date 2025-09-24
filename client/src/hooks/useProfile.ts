import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth, UserRole } from '@/hooks/useAuth'

export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: UserRole
  bio: string | null
  profile_picture: string | null
  company_name: string | null
  business_type: string | null
  website: string | null
  social_media: any
  verification_status: string | null
  status: string | null
  created_at: string
  updated_at: string
}

// Interface for user roles - supports multiple roles per user
export interface UserRoles {
  id: string
  user_id: string
  phone: string
  role: UserRole
  full_name: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userRoles, setUserRoles] = useState<UserRoles[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true'
  
  // Log state changes for debugging
  useEffect(() => {
    console.log('[useProfile] Profile state changed:', profile?.id, profile?.role)
  }, [profile])
  
  useEffect(() => {
    console.log('[useProfile] Loading state changed:', loading)
  }, [loading])

  useEffect(() => {
    console.log('[useProfile] User changed:', user?.id)
    if (!user) {
      setProfile(null)
      setUserRoles([])
      setLoading(false)
      return
    }

    if (mockEnabled) {
      // Get profile data from localStorage if available
      const phone = (user as any)?.phone || (user as any)?.user_metadata?.phone || ''
      const existingProfilesRaw = localStorage.getItem(`mock_profiles_${phone}`)
      let profileData = null
      
      if (existingProfilesRaw) {
        try {
          const existingProfiles = JSON.parse(existingProfilesRaw)
          // Find the profile that matches the current user's role
          const selectedRole = localStorage.getItem('selectedRole')
          const userRole = selectedRole || (user as any)?.user_metadata?.role
          profileData = existingProfiles.find((p: any) => p.role === userRole) || existingProfiles[0]
        } catch (error) {
          console.error('Error parsing mock profiles:', error)
        }
      }
      
      // Use either localStorage data or metadata from user
      const role = profileData?.role || (user as any)?.user_metadata?.role || 'buyer_seller'
      const fullName = profileData?.fullName || (user as any)?.user_metadata?.full_name || 'Mock User'
      
      setProfile({
        id: (user as any).id,
        full_name: fullName,
        phone,
        role: role as any,
        bio: profileData?.bio || null,
        profile_picture: profileData?.avatar_url || null,
        company_name: profileData?.company_name || null,
        business_type: profileData?.business_type || null,
        website: profileData?.website || null,
        social_media: profileData?.social_media || {},
        verification_status: 'verified',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      
      // Set user roles
      if (existingProfilesRaw) {
        try {
          const existingProfiles = JSON.parse(existingProfilesRaw)
          const roles = existingProfiles.map((p: any) => ({
            id: `mock-${p.role}`,
            user_id: (user as any).id,
            phone,
            role: p.role,
            full_name: p.fullName || fullName,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
          setUserRoles(roles)
        } catch (error) {
          console.error('Error parsing mock profiles for roles:', error)
        }
      }
      
      setLoading(false)
      return
    }

    fetchProfile()
    fetchUserRoles()
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      // Check if a specific role is selected
      const selectedRole = localStorage.getItem('selectedRole')
      
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
      
      // If a role is selected, filter by that role
      if (selectedRole) {
        query = query.eq('role', selectedRole)
      }
      
      const { data, error } = await query.single()

      if (error) {
        // If we get an error and have a selected role, try without the role filter
        if (selectedRole) {
          const { data: retryData, error: retryError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          if (retryError) {
            setError(retryError.message)
            return
          }
          
          // Update the profile to use the selected role
          if (retryData) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: selectedRole })
              .eq('id', user.id)
            
            setProfile({ ...retryData, role: selectedRole } as UserProfile)
            setError(null)
            return
          }
        }
        
        setError(error.message)
        return
      }

      setProfile(data as UserProfile)
      setError(null)
    } catch (err) {
      setError('Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserRoles = async () => {
    if (!user) return

    try {
      const phone = (user as any)?.phone
      if (!phone) return

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('phone', phone)

      if (error) {
        console.error('User roles fetch error:', error)
        return
      }

      setUserRoles(data as UserRoles[])
    } catch (err) {
      console.error('User roles fetch error:', err)
    }
  }

  const switchRole = async (newRole: UserRole) => {
    if (!user) return { error: 'No user found' }

    try {
      // Check if we're in mock mode
      const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true'
      
      if (mockEnabled) {
        // In mock mode, we don't update all profiles, we just set the selected role in localStorage
        // This allows switching between existing roles without changing the actual profile data
        const phone = (user as any)?.phone || (user as any)?.user_metadata?.phone || ''
        if (phone) {
          const existingProfilesRaw = localStorage.getItem(`mock_profiles_${phone}`)
          if (existingProfilesRaw) {
            const existingProfiles = JSON.parse(existingProfilesRaw)
            // Check if the user actually has this role
            const hasRole = existingProfiles.some((p: any) => p.role === newRole)
            if (!hasRole) {
              return { error: `You are not registered as a ${newRole.replace('_', ' ')}.` }
            }
            
            // Update local state
            if (profile) {
              setProfile({
                ...profile,
                role: newRole
              })
            }
            
            // Also update localStorage
            localStorage.setItem('selectedRole', newRole)
            
            return { data: { ...profile, role: newRole } as any, error: null }
          }
        }
        
        return { error: 'No profile found for user' }
      }

      // For real mode, check if user has this role first
      // Get all profiles for this user's phone number
      const phone = (user as any)?.phone || (user as any)?.user_metadata?.phone || '';
      if (phone) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, role')
          .eq('phone', phone);
        
        if (profilesError) {
          console.error('[switchRole] Error fetching profiles by phone:', profilesError);
          return { error: profilesError.message };
        }
        
        // Check if user has this role
        const hasRole = profiles?.some(p => p.role === newRole);
        if (!hasRole) {
          return { error: `You are not registered as a ${newRole.replace('_', ' ')}.` };
        }
        
        // Find the profile with this specific role
        const profileWithRole = profiles?.find(p => p.role === newRole);
        if (profileWithRole) {
          // Update that specific profile with the role (this is just to ensure consistency)
          const { data: updatedData, error: updateError } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', profileWithRole.id)
            .select()
            .single();
          
          if (updateError) {
            console.error('[switchRole] Error updating profile:', updateError);
            return { error: updateError.message };
          }
          
          // Update local state immediately
          setProfile(updatedData as UserProfile);
          
          // Also update localStorage
          localStorage.setItem('selectedRole', newRole);
          
          return { data: updatedData, error: null };
        }
      }
      
      // Fallback: update the current user's profile
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('[switchRole] Error updating profile:', error);
        return { error: error.message }
      }

      // Update local state immediately
      setProfile(data as UserProfile)
      
      // Also update localStorage
      localStorage.setItem('selectedRole', newRole)
      
      return { data, error: null }
    } catch (err) {
      console.error('[switchRole] Unexpected error:', err);
      return { error: 'Failed to switch role' }
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user found' }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      setProfile(data as UserProfile)
      return { data, error: null }
    } catch (err) {
      return { error: 'Failed to update profile' }
    }
  }

  const createProfile = async (profileData: {
    role: UserProfile['role']
    full_name: string
    phone?: string
    company_name?: string
    business_type?: string
  }) => {
    if (!user) return { error: 'No user found' }

    try {
      // First, create or update the main profile
      const { data: profileData_result, error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          full_name: profileData.full_name,
          phone: profileData.phone,
          role: profileData.role, // Keep the current role in profiles table
          company_name: profileData.company_name,
          business_type: profileData.business_type,
        })
        .select()
        .single()

      if (profileError) {
        return { error: profileError.message }
      }

      // Then, create or update the user role in user_roles table
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: user.id,
          phone: profileData.phone || '',
          role: profileData.role,
          full_name: profileData.full_name,
          is_active: true,
        })

      if (roleError) {
        console.error('Role creation error:', roleError)
        // Don't fail the entire operation if role creation fails
      }

      setProfile(profileData_result as UserProfile)
      return { data: profileData_result, error: null }
    } catch (err) {
      return { error: 'Failed to create profile' }
    }
  }

  const addRole = async (roleData: {
    role: UserRole
    full_name: string
    phone: string
  }) => {
    if (!user) return { error: 'No user found' }

    try {
      // Add the new role to user_roles table
      const { data, error } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          phone: roleData.phone,
          role: roleData.role,
          full_name: roleData.full_name,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      // Update local state
      setUserRoles(prev => [...prev, data as UserRoles])
      return { data, error: null }
    } catch (err) {
      return { error: 'Failed to add role' }
    }
  }

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!profile) return false
    
    if (Array.isArray(role)) {
      return role.includes(profile.role)
    }
    
    return profile.role === role
  }

  const hasAnyRole = (roles: UserRole[]) => {
    if (userRoles.length === 0) return false
    return userRoles.some(userRole => roles.includes(userRole.role))
  }

  const isAdmin = () => hasRole('admin')
  const isBuyerSeller = () => hasRole('buyer_seller')
  const isBroker = () => hasRole('broker')
  const isDeveloper = () => hasRole('developer')
  const isSocietyOwner = () => hasRole('society_owner')
  const isSocietyMember = () => hasRole('society_member')

  return {
    profile,
    userRoles,
    loading,
    error,
    fetchProfile,
    fetchUserRoles,
    updateProfile,
    createProfile,
    addRole,
    switchRole,
    hasRole,
    hasAnyRole,
    isAdmin,
    isBuyerSeller,
    isBroker,
    isDeveloper,
    isSocietyOwner,
    isSocietyMember,
  }
}