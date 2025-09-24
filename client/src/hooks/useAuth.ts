import React, { useState, useEffect, createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/integrations/supabase/client'

export type UserRole = 'admin' | 'buyer_seller' | 'broker' | 'developer' | 'society_owner' | 'society_member'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signOut: () => Promise<{ error: any }>
  isUserSuspended: boolean
  sendOTP: (phone: string, role?: UserRole) => Promise<{ data: any; error: any }>
  verifyOTP: (phone: string, otp: string, role?: UserRole, fullName?: string) => Promise<{ data: any; error: any }>
  signUpWithSMSForNewRole: (phone: string, fullName: string, role: UserRole) => Promise<{ data: any; error: any }>
  // Removed email-based methods: signUp, signInWithPassword, resetPassword
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUserSuspended, setIsUserSuspended] = useState(false)

  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true'

  useEffect(() => {
    let isMounted = true;
    
    const handleBeforeUnload = () => {
      console.log('[AuthProvider] Page before unload, sessionStorage contents:', {
        mock_user: sessionStorage.getItem('mock_user'),
        mock_session: sessionStorage.getItem('mock_session')
      });
    };
    
    // Log session storage on page load
    console.log('[AuthProvider] Page loaded, sessionStorage contents:', {
      mock_user: sessionStorage.getItem('mock_user'),
      mock_session: sessionStorage.getItem('mock_session')
    });
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    const initializeAuth = async () => {
      console.log('[AuthProvider] Starting initialization, mockEnabled:', mockEnabled);
      console.log('[AuthProvider] Current sessionStorage contents:', {
        mock_user: sessionStorage.getItem('mock_user'),
        mock_session: sessionStorage.getItem('mock_session')
      });
      
      // First check for persisted mock session
      if (mockEnabled) {
        console.log('[AuthProvider] Checking for persisted mock session');
        const mockUserRaw = sessionStorage.getItem('mock_user');
        const mockSessionRaw = sessionStorage.getItem('mock_session');
        
        console.log('[AuthProvider] Session storage items:', {
          mockUserRaw: !!mockUserRaw,
          mockSessionRaw: !!mockSessionRaw
        });
        
        if (mockUserRaw && mockSessionRaw) {
          try {
            const mockUser = JSON.parse(mockUserRaw);
            const mockSession = JSON.parse(mockSessionRaw);
            
            console.log('[AuthProvider] Parsed session data:', {
              userId: mockUser?.id,
              userEmail: mockUser?.email,
              userPhone: mockUser?.phone,
              sessionExpiresAt: mockSession?.expires_at,
              currentTime: Math.floor(Date.now() / 1000)
            });
            
            // Check if session is still valid (not expired)
            // Handle both old and new session formats
            const expiresAt = mockSession.expires_at;
            console.log('[AuthProvider] Session expiration check:', {
              expiresAt,
              currentTime: Math.floor(Date.now() / 1000),
              isValid: typeof expiresAt === 'number' && expiresAt > Math.floor(Date.now() / 1000)
            });
            
            const isValid = typeof expiresAt === 'number' && expiresAt > Math.floor(Date.now() / 1000);
            
            if (isValid) {
              console.log('[AuthProvider] Restored mock session');
              if (isMounted) {
                setUser(mockUser);
                setSession(mockSession);
                setLoading(false);
                console.log('[AuthProvider] Session restored, user set to:', mockUser?.id);
                
                // Verify that the user and session are set correctly
                console.log('[AuthProvider] After setting state - user:', mockUser?.id, 'session:', !!mockSession);
              }
              return;
            } else {
              console.log('[AuthProvider] Mock session expired or invalid, clearing it');
              sessionStorage.removeItem('mock_user');
              sessionStorage.removeItem('mock_session');
            }
          } catch (error) {
            console.error('[AuthProvider] Error parsing mock session:', error);
            // Clear invalid session data
            sessionStorage.removeItem('mock_user');
            sessionStorage.removeItem('mock_session');
          }
        } else {
          console.log('[AuthProvider] No mock session found in storage');
        }
      }
      
      // For non-mock mode or if no valid mock session, get session from Supabase
      console.log('[AuthProvider] Getting session from Supabase');
      if (isMounted) {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        console.log('[AuthProvider] Initial session check result:', currentSession ? 'Session found' : 'No session');
        setSession(currentSession)
        setUser(currentSession?.user ?? null)
        console.log('[AuthProvider] Session set from Supabase:', currentSession?.user?.id);
        setLoading(false)
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);
        if (!isMounted) return;
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Check if user is suspended (non-blocking)
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from('profiles')
                .select('status')
                .eq('id', session.user.id)
                .single()
              
              if (isMounted) {
                setIsUserSuspended(profile?.status === 'suspended')
              }
            } catch (error) {
              console.error('Error checking user status:', error)
            }
          }, 0)
        } else {
          if (isMounted) {
            setIsUserSuspended(false)
          }
        }
      }
    )

    initializeAuth();

    return () => {
      isMounted = false;
      window.removeEventListener('beforeunload', handleBeforeUnload);
      subscription.unsubscribe()
    }
  }, [])

  // Removed email-based methods: signUp, signInWithPassword, resetPassword

  const signOut = async () => {
    console.log('[AuthProvider] Signing out');
    const { error } = await supabase.auth.signOut();
    console.log('[AuthProvider] Supabase signOut result:', error);
    
    if (!error) {
      console.log('[AuthProvider] Sign out successful, clearing state');
      setUser(null);
      setSession(null);
      setIsUserSuspended(false);
      
      // Clear mock session data if in mock mode
      if (mockEnabled) {
        console.log('[AuthProvider] Clearing mock session data');
        sessionStorage.removeItem('mock_user');
        sessionStorage.removeItem('mock_session');
      }
    } else {
      console.error('[AuthProvider] Sign out error:', error);
    }
    return { error };
  }

  const sendOTP = async (phone: string, role?: UserRole) => {
    console.log('[sendOTP] Starting OTP send for:', { phone, role })
    
    if (mockEnabled) {
      console.log('[sendOTP] Mock mode enabled, returning success')
      return { 
        data: { user: null, session: null }, 
        error: null 
      }
    }

    try {
      // Get all profiles for this phone number
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('phone', phone)

      if (profileError) {
        console.error('Error fetching profiles:', profileError)
        return { 
          data: null, 
          error: { message: 'Error checking user registration.' } as any 
        }
      }

      if (!profiles || profiles.length === 0) {
        return { 
          data: null, 
          error: { message: 'User not found. Please register first.' } as any 
        }
      }

      // If a specific role is requested, check if user has that role
      if (role) {
        const hasRole = profiles.some(profile => profile.role === role)
        if (!hasRole) {
          return { 
            data: null, 
            error: { message: `You are not registered as a ${role.replace('_', ' ')}.` } as any 
          }
        }
      }

      // Send OTP
      const { data, error } = await supabase.auth.signInWithOtp({
        phone: phone,
      })

      return { data, error }
    } catch (error) {
      console.error('Error in sendOTP:', error)
      return { 
        data: null, 
        error: error as any 
      }
    }
  }

  const verifyOTP = async (phone: string, otp: string, role?: UserRole, fullName?: string) => {
    console.log('[verifyOTP] Starting OTP verification for:', { phone, role });
    
    if (mockEnabled) {
      if (otp === '123456') {
        console.log('[verifyOTP] Mock OTP accepted');
        
        try {
          const existingProfilesRaw = localStorage.getItem(`mock_profiles_${phone}`);
          console.log('[verifyOTP] Existing profiles for phone:', { phone, existingProfilesRaw: !!existingProfilesRaw });
          
          if (!existingProfilesRaw) {
            return { 
              data: null, 
              error: { message: 'Profile not found. Please register first.' } as any 
            }
          }

          const existingProfiles = JSON.parse(existingProfilesRaw);
          console.log('[verifyOTP] Parsed profiles:', existingProfiles);
          
          // Create mock user and session with proper UUID
          const mockUser = {
            id: `550e8400-e29b-41d4-a716-${phone.replace(/[^0-9]/g, '').slice(-12).padStart(12, '0')}`,
            email: `${phone}@mock.com`,
            phone: phone,
            user_metadata: {
              full_name: existingProfiles[0]?.fullName || 'User',
              role: role || existingProfiles[0]?.role || 'buyer_seller'
            }
          };
          
          // Create a more realistic mock session structure
          const mockSession = {
            provider_token: null,
            provider_refresh_token: null,
            access_token: 'mock_access_token',
            refresh_token: 'mock_refresh_token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600, // Unix timestamp
            token_type: 'bearer',
            user: mockUser
          };
          
          console.log('[verifyOTP] Created mock session:', { mockUser, mockSession });
          
          // Set the user and session state
          setUser(mockUser as any);
          setSession(mockSession as any);
          
          // Also store in sessionStorage for persistence across reloads
          console.log('[verifyOTP] Storing session in sessionStorage');
          const userString = JSON.stringify(mockUser);
          const sessionString = JSON.stringify(mockSession);
          console.log('[verifyOTP] Storing user:', userString);
          console.log('[verifyOTP] Storing session:', sessionString);
          sessionStorage.setItem('mock_user', userString);
          sessionStorage.setItem('mock_session', sessionString);
          console.log('[verifyOTP] Session storage items after storing:', {
            mock_user: sessionStorage.getItem('mock_user'),
            mock_session: sessionStorage.getItem('mock_session')
          });
          
          // Verify that the data was stored correctly
          const storedUser = sessionStorage.getItem('mock_user');
          const storedSession = sessionStorage.getItem('mock_session');
          console.log('[verifyOTP] Verified stored data:', {
            userStored: !!storedUser,
            sessionStored: !!storedSession,
            userParsed: storedUser ? JSON.parse(storedUser) : null,
            sessionParsed: storedSession ? JSON.parse(storedSession) : null
          });
          
          if (role) {
            const filteredRoles = existingProfiles.filter((p: any) => p.role === role).map((p: any) => ({
              role: p.role,
              full_name: p.fullName || 'User'
            }));
            
            if (filteredRoles.length === 0) {
              return { 
                data: null, 
                error: { message: `You are not registered as a ${role.replace('_', ' ')}.` } as any 
              }
            }
            
            return { 
              data: { 
                user: mockUser,
                session: mockSession,
                userExists: true, 
                roles: filteredRoles 
              }, 
              error: null 
            }
          }
          
          // Return all roles for this user
          const allRoles = existingProfiles.map((p: any) => ({
            role: p.role,
            full_name: p.fullName || 'User'
          }));
          
          return { 
            data: { 
              user: mockUser,
              session: mockSession,
              userExists: true,
              roles: allRoles
            }, 
            error: null 
          }
          
        } catch (error) {
          console.error('Error parsing mock profile:', error);
          return { 
            data: null, 
            error: { message: 'Error loading user profile' } as any 
          }
        }
      } else {
        return {
          data: null,
          error: { message: 'Invalid OTP code' } as any
        }
      }
    }

    try {
      // Get all profiles for this phone number  
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('phone', phone)

      if (profileError) {
        console.error('Error fetching profiles:', profileError)
        return { 
          data: null, 
          error: { message: 'Error loading user profiles.' } as any 
        }
      }

      if (!profiles || profiles.length === 0) {
        return { 
          data: null, 
          error: { message: 'User not found. Please register first.' } as any 
        }
      }

      // Verify the OTP first
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: otp,
        type: 'sms'
      })

      if (error) {
        console.error('OTP verification failed:', error)
        return { data: null, error }
      }

      // If a specific role was requested, filter for that role
      if (role) {
        const roleProfile = profiles.find(profile => profile.role === role)
        if (!roleProfile) {
          return { 
            data: null, 
            error: { message: `You are not registered as a ${role.replace('_', ' ')}.` } as any 
          }
        }

        return { 
          data: { 
            user: data.user,
            session: data.session,
            userExists: true,
            roles: [{
              role: roleProfile.role,
              full_name: roleProfile.full_name
            }]
          }, 
          error: null 
        }
      }

      // Return all available roles for this user
      const allRoles = profiles.map(profile => ({
        role: profile.role,
        full_name: profile.full_name
      }))

      return { 
        data: { 
          user: data.user,
          session: data.session,
          userExists: true,
          roles: allRoles
        }, 
        error: null 
      }
    } catch (error) {
      console.error('Error verifying OTP:', error)
      return { 
        data: null, 
        error: error as any 
      }
    }
  }

  const signUpWithSMSForNewRole = async (phone: string, fullName: string, role: UserRole) => {
    console.log('[signUpWithSMSForNewRole] Starting registration for:', { phone, role });
    
    if (mockEnabled) {
      const existingProfilesRaw = localStorage.getItem(`mock_profiles_${phone}`);
      let existingProfiles = existingProfilesRaw ? JSON.parse(existingProfilesRaw) : [];
      console.log('[signUpWithSMSForNewRole] Existing profiles:', existingProfiles);
      
      // Check if this role already exists
      if (existingProfiles.some((p: any) => p.role === role)) {
        return { 
          data: null, 
          error: { 
            message: 'You already have this role. Please login instead.',
            code: 'ROLE_EXISTS'
          } as any 
        }
      }
      
      // Add new role to the profiles array
      const newProfile = {
        phone: phone,
        role: role,
        fullName: fullName
      };
      
      existingProfiles.push(newProfile);
      localStorage.setItem(`mock_profiles_${phone}`, JSON.stringify(existingProfiles));
      console.log('[signUpWithSMSForNewRole] Updated profiles in localStorage');
      
      // Create mock user for successful signup with proper UUID
      const mockUser = {
        id: `550e8400-e29b-41d4-a716-${phone.replace(/[^0-9]/g, '').slice(-12).padStart(12, '0')}`,
        email: `${phone}@mock.com`,
        phone: phone,
        user_metadata: {
          full_name: fullName,
          role: role
        }
      };
      
      // Create a more realistic mock session structure
      const mockSession = {
        provider_token: null,
        provider_refresh_token: null,
        access_token: 'mock_access_token',
        refresh_token: 'mock_refresh_token',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600, // Unix timestamp
        token_type: 'bearer',
        user: mockUser
      };
      
      console.log('[signUpWithSMSForNewRole] Created mock session for new user');
      const userString = JSON.stringify(mockUser);
      const sessionString = JSON.stringify(mockSession);
      console.log('[signUpWithSMSForNewRole] Storing user:', userString);
      console.log('[signUpWithSMSForNewRole] Storing session:', sessionString);
      sessionStorage.setItem('mock_user', userString);
      sessionStorage.setItem('mock_session', sessionString);
      console.log('[signUpWithSMSForNewRole] Session storage items after storing:', {
        mock_user: sessionStorage.getItem('mock_user'),
        mock_session: sessionStorage.getItem('mock_session')
      });
      
      // Verify that the data was stored correctly
      const storedUser = sessionStorage.getItem('mock_user');
      const storedSession = sessionStorage.getItem('mock_session');
      console.log('[signUpWithSMSForNewRole] Verified stored data:', {
        userStored: !!storedUser,
        sessionStored: !!storedSession,
        userParsed: storedUser ? JSON.parse(storedUser) : null,
        sessionParsed: storedSession ? JSON.parse(storedSession) : null
      });
      
      console.log('[signUpWithSMSForNewRole] Mock mode - new role added');
      return { 
        data: { 
          user: mockUser
        }, 
        error: null 
      }
    }

    try {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('phone', phone)
        .single()
      
      if (existingProfile && existingProfile.role === role) {
        return { 
          data: null, 
          error: { 
            message: 'You already have this role. Please login instead.',
            code: 'ROLE_EXISTS'
          } as any 
        }
      }
      
      console.log('[signUpWithSMSForNewRole] Sending OTP for new role')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          data: {
            full_name: fullName,
            role: role,
            is_new_role: true,
          },
          shouldCreateUser: true,
        },
      })

      if (signInError) {
        console.error('Error sending OTP for new role:', signInError)
        return { data: null, error: signInError }
      }

      if (signInData?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: (signInData.user as any).id,
            phone: phone,
            role: role,
            full_name: fullName,
          })

        if (profileError) {
          console.error('Error updating profile:', profileError)
          return { data: null, error: profileError }
        }
      }

      return { data: signInData, error: null }
    } catch (error) {
      console.error('Error in signUpWithSMSForNewRole:', error)
      return { data: null, error: error as any }
    }
  }

  const value: AuthContextType = {
    user,
    session,
    loading,
    signOut,
    isUserSuspended,
    sendOTP,
    verifyOTP,
    signUpWithSMSForNewRole,
    // Removed email-based methods: signUp, signInWithPassword, resetPassword
  }

  console.log('[AuthProvider] Providing context value:', {
    user: user?.id,
    session: !!session,
    loading,
    isUserSuspended
  });

  return React.createElement(AuthContext.Provider, { value: value }, children)
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}