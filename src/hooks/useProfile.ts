import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useAuth } from './useAuth'

export interface UserProfile {
  id: string
  full_name: string | null
  phone: string | null
  role: 'admin' | 'buyer' | 'seller' | 'broker' | 'developer' | 'society_owner' | 'society_member'
  bio: string | null
  profile_picture: string | null
  company_name: string | null
  business_type: string | null
  website: string | null
  social_media: Record<string, any>
  verification_status: 'pending' | 'verified' | 'rejected'
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true'

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    if (mockEnabled) {
      // Synthesize a lightweight profile for mock auth
      const role = (user as any)?.user_metadata?.role || 'buyer_seller'
      const fullName = (user as any)?.user_metadata?.full_name || 'Mock User'
      const phone = (user as any)?.user_metadata?.mobile || (user as any)?.phone || ''
      setProfile({
        id: (user as any).id,
        full_name: fullName,
        phone,
        role: role as any,
        bio: null,
        profile_picture: null,
        company_name: null,
        business_type: null,
        website: null,
        social_media: {},
        verification_status: 'verified',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      setLoading(false)
      return
    }

    fetchProfile()
    
    // Auto-create profile if user has role metadata but no profile
    if (user.user_metadata?.role && !profile) {
      createProfile({
        role: user.user_metadata.role,
        full_name: user.user_metadata.full_name || user.email || '',
        phone: user.user_metadata.mobile || '',
      })
    }
  }, [user])

  const fetchProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Profile fetch error:', error)
        setError(error.message)
        return
      }

      setProfile(data as UserProfile)
      setError(null)
    } catch (err) {
      console.error('Profile fetch error:', err)
      setError('Failed to fetch profile')
    } finally {
      setLoading(false)
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
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
        })
        .select()
        .single()

      if (error) {
        return { error: error.message }
      }

      setProfile(data as UserProfile)
      return { data, error: null }
    } catch (err) {
      return { error: 'Failed to create profile' }
    }
  }

  const hasRole = (role: UserProfile['role'] | UserProfile['role'][]) => {
    if (!profile) return false
    
    if (Array.isArray(role)) {
      return role.includes(profile.role)
    }
    
    return profile.role === role
  }

  const isAdmin = () => hasRole('admin')
  const isBuyer = () => hasRole('buyer')
  const isSeller = () => hasRole('seller')
  const isBroker = () => hasRole('broker')
  const isDeveloper = () => hasRole('developer')
  const isSocietyOwner = () => hasRole('society_owner')
  const isSocietyMember = () => hasRole('society_member')

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    createProfile,
    hasRole,
    isAdmin,
    isBuyer,
    isSeller,
    isBroker,
    isDeveloper,
    isSocietyOwner,
    isSocietyMember,
  }
}