import React, { useState, useEffect, createContext, useContext } from 'react'
import { authAPI, apiClient } from '@/lib/api'

export type UserRole = 'admin' | 'buyer_seller' | 'broker' | 'developer' | 'society_owner' | 'society_member'

interface User {
  id: string
  phone: string
  email?: string
  isVerified: boolean
  lastLogin?: string
}

interface Profile {
  _id: string
  user: string
  fullName?: string
  role: UserRole
  status: string
  verificationStatus: string
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<{ error: any }>
  isUserSuspended: boolean
  sendOTP: (phone: string, role?: UserRole) => Promise<{ data: any; error: any }>
  verifyOTP: (phone: string, otp: string, role?: UserRole, fullName?: string) => Promise<{ data: any; error: any }>
  signUpWithSMSForNewRole: (phone: string, fullName: string, role: UserRole) => Promise<{ data: any; error: any }>
  switchRole: (role: UserRole) => Promise<{ data: any; error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isUserSuspended, setIsUserSuspended] = useState(false)

  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true'

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      console.log('[AuthProvider] Starting initialization');
      
      // Check for stored token
      const token = localStorage.getItem('authToken');
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (token) {
        try {
          // Set token in API client
          apiClient.setToken(token);
          
          // Get current user data
          const response = await authAPI.getCurrentUser();
          
          if (isMounted && response.status === 'success') {
            setUser(response.data.user);
            
            // Set the first profile as current profile
            if (response.data.profiles && response.data.profiles.length > 0) {
              setProfile(response.data.profiles[0]);
              setIsUserSuspended(response.data.profiles[0].status === 'suspended');
            }
            
            console.log('[AuthProvider] User authenticated:', response.data.user.id);
          }
        } catch (error) {
          console.error('[AuthProvider] Token validation failed:', error);
          
          // Try to refresh token
          if (refreshToken) {
            try {
              const refreshResponse = await authAPI.refreshToken(refreshToken);
              
              if (refreshResponse.status === 'success') {
                apiClient.setToken(refreshResponse.data.token);
                localStorage.setItem('refreshToken', refreshResponse.data.refreshToken);
                
                // Get user data again
                const userResponse = await authAPI.getCurrentUser();
                
                if (isMounted && userResponse.status === 'success') {
                  setUser(userResponse.data.user);
                  
                  if (userResponse.data.profiles && userResponse.data.profiles.length > 0) {
                    setProfile(userResponse.data.profiles[0]);
                    setIsUserSuspended(userResponse.data.profiles[0].status === 'suspended');
                  }
                }
              } else {
                // Clear invalid tokens
                localStorage.removeItem('authToken');
                localStorage.removeItem('refreshToken');
                apiClient.setToken(null);
              }
            } catch (refreshError) {
              console.error('[AuthProvider] Token refresh failed:', refreshError);
              localStorage.removeItem('authToken');
              localStorage.removeItem('refreshToken');
              apiClient.setToken(null);
            }
          } else {
            localStorage.removeItem('authToken');
            apiClient.setToken(null);
          }
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const signOut = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
      
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      
      // Clear API client token
      apiClient.setToken(null);
      
      // Clear state
      setUser(null);
      setProfile(null);
      setIsUserSuspended(false);
      
      console.log('[AuthProvider] Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('[AuthProvider] Sign out error:', error);
      
      // Clear local storage even if API call fails
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
      apiClient.setToken(null);
      setUser(null);
      setProfile(null);
      setIsUserSuspended(false);
      
      return { error };
    }
  };

  const sendOTP = async (phone: string, role?: UserRole) => {
    console.log('[sendOTP] Starting OTP send for:', { phone, role });
    
    if (mockEnabled) {
      console.log('[sendOTP] Mock mode enabled, returning success');
      return { 
        data: { message: 'OTP sent successfully' }, 
        error: null 
      };
    }

    try {
      const response = await authAPI.sendOTP(phone, role);
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('Error in sendOTP:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to send OTP' }
      };
    }
  };

  const verifyOTP = async (phone: string, otp: string, role?: UserRole, fullName?: string) => {
    console.log('[verifyOTP] Starting OTP verification for:', { phone, role });
    
    if (mockEnabled) {
      if (otp === '123456') {
        console.log('[verifyOTP] Mock OTP accepted');
        
        // Create mock user and profile
        const mockUser = {
          id: `mock-user-${phone}`,
          phone: phone,
          email: `${phone}@mock.com`,
          isVerified: true
        };
        
        const mockProfile = {
          _id: `mock-profile-${phone}`,
          user: mockUser.id,
          fullName: fullName || 'Mock User',
          role: role || 'buyer_seller',
          status: 'active',
          verificationStatus: 'verified'
        };
        
        // Set mock tokens
        const mockToken = 'mock-jwt-token';
        const mockRefreshToken = 'mock-refresh-token';
        
        localStorage.setItem('authToken', mockToken);
        localStorage.setItem('refreshToken', mockRefreshToken);
        apiClient.setToken(mockToken);
        
        setUser(mockUser);
        setProfile(mockProfile);
        setIsUserSuspended(false);
        
        return { 
          data: { 
            user: mockUser,
            profile: mockProfile,
            token: mockToken,
            refreshToken: mockRefreshToken
          }, 
          error: null 
        };
      } else {
        return {
          data: null,
          error: { message: 'Invalid OTP code' }
        };
      }
    }

    try {
      const response = await authAPI.verifyOTP(phone, otp, role);
      
      if (response.status === 'success') {
        // Store tokens
        if (response.data.token) {
          localStorage.setItem('authToken', response.data.token);
          apiClient.setToken(response.data.token);
        }
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Set user and profile
        setUser(response.data.user);
        
        if (response.data.profile) {
          setProfile(response.data.profile);
          setIsUserSuspended(response.data.profile.status === 'suspended');
        }
        
        return { data: response.data, error: null };
      } else {
        return { data: null, error: { message: response.message } };
      }
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to verify OTP' }
      };
    }
  };

  const signUpWithSMSForNewRole = async (phone: string, fullName: string, role: UserRole) => {
    console.log('[signUpWithSMSForNewRole] Starting registration for:', { phone, role });
    
    if (mockEnabled) {
      console.log('[signUpWithSMSForNewRole] Mock mode - registration successful');
      return { 
        data: { message: 'Registration successful. Please verify your phone number.' }, 
        error: null 
      };
    }

    try {
      const response = await authAPI.register(phone, fullName, role);
      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('Error in signUpWithSMSForNewRole:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to register' }
      };
    }
  };

  const switchRole = async (role: UserRole) => {
    try {
      const response = await authAPI.switchRole(role);
      
      if (response.status === 'success') {
        setProfile(response.data.profile);
        setIsUserSuspended(response.data.profile.status === 'suspended');
        return { data: response.data, error: null };
      } else {
        return { data: null, error: { message: response.message } };
      }
    } catch (error: any) {
      console.error('Error switching role:', error);
      return { 
        data: null, 
        error: { message: error.message || 'Failed to switch role' }
      };
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signOut,
    isUserSuspended,
    sendOTP,
    verifyOTP,
    signUpWithSMSForNewRole,
    switchRole
  }

  console.log('[AuthProvider] Providing context value:', {
    user: user?.id,
    profile: profile?.role,
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