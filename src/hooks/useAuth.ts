import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isUserSuspended, setIsUserSuspended] = useState(false)
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true'

  const MOCK_SESSION_KEY = 'mock_auth_session'

  const getMockSession = () => {
    try {
      const raw = localStorage.getItem(MOCK_SESSION_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const setMockSession = (session: any | null) => {
    if (!session) {
      localStorage.removeItem(MOCK_SESSION_KEY)
      return
    }
    localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
  }

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
    if (mockEnabled) {
      const mock = getMockSession()
      if (mock?.user) {
        setUser(mock.user)
        setTimeout(() => {
          // In mock mode, skip DB check and synthesize a profile shape
          setUserProfile({
            full_name: mock.user.user_metadata?.full_name || 'Mock User',
            role: mock.user.user_metadata?.role || 'buyer_seller',
            status: 'active',
          })
          setIsUserSuspended(false)
        }, 0)
      }
      setLoading(false)
      return
    }

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

  const signInWithSMS = async (phone: string, role?: UserRole) => {
    if (mockEnabled) {
      // Check if user exists in mock mode
      const existingProfileRaw = localStorage.getItem(`mock_profile_${phone}`)
      if (!existingProfileRaw) {
        return { data: null, error: { message: 'User not found. Please register first.' } as any }
      }
      const existingProfile = (() => { try { return JSON.parse(existingProfileRaw) } catch { return null } })()
      
      // If a specific role is requested, check if the user has that role
      if (role && existingProfile.role !== role) {
        return { 
          data: null, 
          error: { message: `You are not registered as a ${role.replace('_', ' ')}.` } as any 
        }
      }
      
      const mockOtp = '123456'
      const mockUser: any = {
        id: `mock-user-${phone}`,
        email: null,
        phone,
        user_metadata: {
          full_name: existingProfile?.fullName || 'Mock User',
          role: existingProfile?.role || 'buyer_seller',
          mobile: phone,
        },
      }
      sessionStorage.setItem(`mock_otp_${phone}`, mockOtp)
      console.info('[MOCK OTP] code for', phone, 'is', mockOtp)
      setMockSession({ user: mockUser })
      setUser(mockUser)
      setUserProfile({ full_name: mockUser.user_metadata.full_name, role: mockUser.user_metadata.role, status: 'active' })
      setIsUserSuspended(false)
      return { data: { user: mockUser }, error: null as any }
    }
    
    // Check if user exists in database before sending OTP
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone')
      .eq('phone', phone)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      return { data: null, error: profileError }
    }
    
    if (!existingProfile) {
      return { data: null, error: { message: 'User not found. Please register first.' } as any }
    }
    
    // If a specific role is provided, check if the user has that role
    if (role) {
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('phone', phone)
        .eq('role', role)
        .single()
      
      if (roleError || !roleData) {
        return { 
          data: null, 
          error: { message: `You are not registered as a ${role.replace('_', ' ')}.` } as any 
        }
      }
    }
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
    })
    return { data, error }
  }

  const checkUserRoles = async (phone: string, role?: UserRole) => {
    if (mockEnabled) {
      const existingProfileRaw = localStorage.getItem(`mock_profile_${phone}`);
      if (!existingProfileRaw) {
        return { data: null, error: { message: 'User not found. Please register first.' } as any };
      }
      
      try {
        // Parse the existing profile
        let existingProfile = JSON.parse(existingProfileRaw);
        let mockRoles: Array<{role: string, full_name: string}> = [];
        
        // Handle different profile formats
        if (Array.isArray(existingProfile.roles)) {
          // New format with roles array
          mockRoles = existingProfile.roles.map((r: any) => ({
            role: r.role || 'buyer_seller',
            full_name: r.full_name || existingProfile.fullName || 'User'
          }));
        } else if (existingProfile.role) {
          // Old format with single role
          mockRoles = [{
            role: existingProfile.role,
            full_name: existingProfile.fullName || 'User'
          }];
          
          // Update to new format
          existingProfile.roles = mockRoles;
          localStorage.setItem(`mock_profile_${phone}`, JSON.stringify(existingProfile));
        }
        
        // If a specific role is requested, filter by that role
        if (role) {
          const filteredRoles = mockRoles.filter(r => r.role === role);
          if (filteredRoles.length === 0) {
            return { 
              data: null, 
              error: { message: `You are not registered as a ${role.replace('_', ' ')}.` } as any 
            };
          }
          return { 
            data: { 
              userExists: true, 
              roles: filteredRoles 
            }, 
            error: null 
          };
        }
        
        // Return all roles if no specific role requested
        return { 
          data: { 
            userExists: true, 
            roles: mockRoles 
          }, 
          error: null 
        };
        
      } catch (error) {
        console.error('Error parsing mock profile:', error);
        return { 
          data: null, 
          error: { message: 'Error loading user profile' } as any 
        };
      }
      
      return { 
        data: { 
          userExists: true, 
          roles: filteredRoles
        }, 
        error: null as any 
      }
    }

    try {
      // First, check if the user exists in the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (profileError || !profile) {
        return { 
          data: null, 
          error: { message: 'User not found. Please register first.' } as any 
        };
      }

      // Get all active roles for the user
      let query = supabase
        .from('user_roles')
        .select('role, full_name, is_active')
        .eq('phone', phone)
        .eq('is_active', true);
      
      // If a specific role is requested, filter by that role
      if (role) {
        query = query.eq('role', role);
      }
      
      const { data: userRoles, error } = await query;
      
      if (error) {
        console.error('Error fetching user roles:', error);
        return { data: null, error };
      }
      
      if (!userRoles || userRoles.length === 0) {
        const message = role 
          ? `You are not registered as a ${role.replace('_', ' ')}. Please register first.`
          : 'No roles found for this user.';
        return { data: null, error: { message } as any };
      }
      
      return { 
        data: { 
          userExists: true, 
          roles: userRoles.map(ur => ({ 
            role: ur.role, 
            full_name: ur.full_name || 'User' 
          }))
        }, 
        error: null as any 
      };
    } catch (error) {
      console.error('Error in checkUserRoles:', error);
      return { 
        data: null, 
        error: { message: 'An error occurred while checking user roles.' } as any 
      };
    }
  }

  const verifyOTP = async (phone: string, token: string) => {
    if (mockEnabled) {
      const expected = sessionStorage.getItem(`mock_otp_${phone}`)
      if (expected && token === expected) {
        const existing = getMockSession()
        const storedProfileRaw = localStorage.getItem(`mock_profile_${phone}`)
        const storedProfile = (() => { try { return JSON.parse(storedProfileRaw || '{}') } catch { return {} } })()
        const mockUser = existing?.user || {
          id: `mock-user-${phone}`,
          email: null,
          phone,
          user_metadata: {
            full_name: storedProfile.fullName || 'Mock User',
            role: storedProfile.role || 'buyer_seller',
            mobile: phone,
          },
        }
        setMockSession({ user: mockUser })
        setUser(mockUser)
        setUserProfile({ full_name: mockUser.user_metadata.full_name, role: mockUser.user_metadata.role, status: 'active' })
        setIsUserSuspended(false)
        // Clear OTP from session storage after successful verification
        sessionStorage.removeItem(`mock_otp_${phone}`)
        return { data: { user: mockUser }, error: null as any }
      }
      return { data: { user: null }, error: { message: 'Invalid OTP' } as any }
    }
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms'
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

  const signUpWithSMS = async (phone: string, fullName: string, role: string) => {
    if (mockEnabled) {
      // Check if user already exists in mock mode
      const existingProfile = localStorage.getItem(`mock_profile_${phone}`)
      if (existingProfile) {
        return { data: null, error: { message: 'User already exists. Please login instead.' } as any }
      }
      
      const mockOtp = '123456'
      const mockUser: any = {
        id: `mock-user-${phone}`,
        email: null,
        phone,
        user_metadata: {
          full_name: fullName || 'Mock User',
          role: role || 'buyer_seller',
          mobile: phone,
        },
      }
      sessionStorage.setItem(`mock_otp_${phone}`, mockOtp)
      localStorage.setItem(`mock_profile_${phone}`, JSON.stringify({ fullName: mockUser.user_metadata.full_name, role: mockUser.user_metadata.role, phone }))
      console.info('[MOCK OTP] code for', phone, 'is', mockOtp)
      setMockSession({ user: mockUser })
      setUser(mockUser)
      setUserProfile({ full_name: mockUser.user_metadata.full_name, role: mockUser.user_metadata.role, status: 'active' })
      setIsUserSuspended(false)
      return { data: { user: mockUser }, error: null as any }
    }
    
    // Check if user already exists in database
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone')
      .eq('phone', phone)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      return { data: null, error: profileError }
    }
    
    if (existingProfile) {
      return { data: null, error: { message: 'User already exists. Please login instead.' } as any }
    }
    
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    })
    return { data, error }
  }

  type UserRole = 'admin' | 'buyer_seller' | 'broker' | 'developer' | 'society_owner' | 'society_member';

  const signUpWithSMSForNewRole = async (phone: string, fullName: string, role: UserRole) => {
    console.log('[signUpWithSMSForNewRole] Starting registration for:', { phone, role });
    if (mockEnabled) {
      // For mock mode, handle multiple roles per user
      const existingProfileRaw = localStorage.getItem(`mock_profile_${phone}`);
      let existingProfile = existingProfileRaw ? JSON.parse(existingProfileRaw) : null;
      
      // Check if this is an old format profile (single role)
      if (existingProfile && !Array.isArray(existingProfile.roles)) {
        existingProfile = {
          phone,
          fullName: existingProfile.fullName || fullName,
          roles: [{
            role: existingProfile.role || role,
            full_name: existingProfile.fullName || fullName
          }]
        };
      } else if (!existingProfile) {
        // Create new profile with initial role
        existingProfile = {
          phone,
          fullName,
          roles: []
        };
      }
      
      // Check if role already exists for this user
      const roleExists = existingProfile.roles.some((r: any) => r.role === role);
      if (roleExists) {
        return { 
          data: null, 
          error: { message: 'You already have this role. Please login instead.' } as any 
        };
      }
      
      // Add new role to user's roles
      existingProfile.roles.push({ role, full_name: fullName });
      
      // Update the stored profile
      localStorage.setItem(`mock_profile_${phone}`, JSON.stringify(existingProfile));
      
      // Create mock user session
      const mockOtp = '123456';
      const mockUser: any = {
        id: `mock-user-${phone}`,
        email: null,
        phone,
        user_metadata: {
          full_name: fullName,
          role: role,
          mobile: phone,
        },
      };
      
      // Store OTP and set session
      sessionStorage.setItem(`mock_otp_${phone}`, mockOtp);
      console.info('[MOCK OTP] code for', phone, 'is', mockOtp);
      
      // Update auth state
      setMockSession({ user: mockUser });
      setUser(mockUser);
      setUserProfile({ 
        full_name: fullName, 
        role: role, 
        status: 'active' 
      });
      setIsUserSuspended(false);
      
      return { data: { user: mockUser }, error: null as any };
    }
    
    // Check if user already exists in database
    console.log('[signUpWithSMSForNewRole] Checking for existing profile with phone:', phone);
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, phone')
      .eq('phone', phone)
      .single()
    
    console.log('[signUpWithSMSForNewRole] Profile check result:', { 
      hasProfile: !!existingProfile, 
      error: profileError,
      errorCode: profileError?.code
    });
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking existing profile:', profileError)
      return { data: null, error: profileError }
    }
    
    if (existingProfile) {
      // Check if role already exists for this user
      console.log('[signUpWithSMSForNewRole] Checking for existing role:', { phone, role });
      const { data: existingRole, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('phone', phone)
        .eq('role', role)
        .single()
      
      console.log('[signUpWithSMSForNewRole] Role check result:', { existingRole, roleError });
      
      if (existingRole) {
        return { 
          data: null, 
          error: { 
            message: 'You already have this role. Please login instead.',
            code: 'ROLE_EXISTS'
          } as any 
        }
      }
      
      // First, sign in the user with OTP
      console.log('[signUpWithSMSForNewRole] Sending OTP for new role');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          data: {
            full_name: fullName,
            role: role,
            is_new_role: true,
          },
          // Add this to ensure we can add a new role
          shouldCreateUser: true,
        },
      })

      if (signInError) {
        console.error('Error sending OTP for new role:', signInError)
        return { data: null, error: signInError }
      }

      // After successful sign-in, add the new role
      if (signInData.user) {
        const { error: roleInsertError } = await supabase
          .from('user_roles')
          .insert([
            {
              user_id: signInData.user.id,
              phone: phone,
              role: role,
              full_name: fullName,
              is_active: true
            }
          ])

        if (roleInsertError) {
          console.error('Error adding new role:', roleInsertError)
          return { data: null, error: roleInsertError }
        }
      }

      return { data: signInData, error: null }
    }
    
    // New user registration
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        data: {
          full_name: fullName,
          role: role,
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
    if (mockEnabled) {
      setMockSession(null)
      setUser(null)
      setUserProfile(null)
      setIsUserSuspended(false)
      return { error: null as any }
    }
    const { error } = await supabase.auth.signOut()
    return { error }
  }


  return {
    user,
    loading,
    userProfile,
    isUserSuspended,
    signIn,
    signUp,
    signInWithSMS,
    signUpWithSMS,
    signUpWithSMSForNewRole,
    checkUserRoles,
    verifyOTP,
    signOut,
    resetPassword,
  }
}