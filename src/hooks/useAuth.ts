import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isUserSuspended, setIsUserSuspended] = useState(false)

  // Function to check user status
  const checkUserStatus = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('status, full_name, role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      setUserProfile(profile)
      setIsUserSuspended(profile?.status === 'suspended')
    } catch (error) {
      console.error('Error checking user status:', error)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setTimeout(() => {
          checkUserStatus(session.user.id)
        }, 0)
      }
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        setTimeout(() => {
          checkUserStatus(session.user.id)
        }, 0)
      } else {
        setUserProfile(null)
        setIsUserSuspended(false)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    
    // Check user status after successful login
    if (data.user && !error) {
      setTimeout(() => {
        checkUserStatus(data.user.id)
      }, 0)
    }
    
    return { data, error }
  }

  const signUp = async (email: string, password: string, fullName: string, role: string, mobile?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          role: role,
          mobile: mobile,
        },
      },
    })

    return { data, error }
  }

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth?mode=reset`,
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    })
    return { data, error }
  }

  return {
    user,
    loading,
    userProfile,
    isUserSuspended,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resetPassword,
  }
}