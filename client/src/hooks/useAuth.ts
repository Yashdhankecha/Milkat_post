import React, { useState, useEffect, createContext, useContext } from 'react';
import apiClient from '@/lib/api';

export type UserRole = 'admin' | 'buyer_seller' | 'broker' | 'developer' | 'society_owner' | 'society_member';

export interface User {
  id: string;
  phone: string;
  email?: string;
  isVerified: boolean;
  authMethod: 'phone' | 'email';
  currentRole?: string;
  activeRole?: string;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  user: string;
  fullName: string;
  role: UserRole;
  bio?: string;
  profilePicture?: string;
  companyName?: string;
  businessType?: string;
  website?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: User;
  profile: Profile;
  expiresAt: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: AuthSession | null;
  loading: boolean;
  signOut: () => Promise<{ error: any }>;
  isUserSuspended: boolean;
  sendOTP: (phone: string, role?: UserRole) => Promise<{ data: any; error: any }>;
  verifyOTP: (phone: string, otp: string, role?: UserRole, fullName?: string) => Promise<{ data: any; error: any }>;
  register: (phone: string, otp: string, fullName: string, role: UserRole) => Promise<{ data: any; error: any }>;
  login: (phone: string, otp: string) => Promise<{ data: any; error: any }>;
  refreshSession: () => Promise<{ data: any; error: any }>;
  refreshUser: () => Promise<void>;
  signUpWithSMSForNewRole: (phone: string, fullName: string, role: UserRole) => Promise<{ data: any; error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserSuspended, setIsUserSuspended] = useState(false);

  // Check if mock mode is enabled
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';

  // Helper function to parse expiration time from backend
  const parseExpirationTime = (expiresIn: string | number): number => {
    if (typeof expiresIn === 'number') {
      return expiresIn * 1000; // Convert seconds to milliseconds
    }
    
    // Parse string format like "7d", "24h", "30m"
    const match = expiresIn.toString().match(/^(\d+)([dhms])$/);
    if (match) {
      const value = parseInt(match[1]);
      const unit = match[2];
      
      switch (unit) {
        case 'd': return value * 24 * 60 * 60 * 1000; // days to milliseconds
        case 'h': return value * 60 * 60 * 1000; // hours to milliseconds
        case 'm': return value * 60 * 1000; // minutes to milliseconds
        case 's': return value * 1000; // seconds to milliseconds
        default: return 7 * 24 * 60 * 60 * 1000; // default 7 days
      }
    }
    
    // Default to 7 days if parsing fails
    return 7 * 24 * 60 * 60 * 1000;
  };

  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      console.log('[AuthProvider] Starting initialization, mockEnabled:', mockEnabled);

      // Check for existing session in localStorage
      const savedSession = localStorage.getItem('auth_session');
      const savedUser = localStorage.getItem('auth_user');
      const savedProfile = localStorage.getItem('auth_profile');

      console.log('[AuthProvider] localStorage check:', {
        savedSession: !!savedSession,
        savedUser: !!savedUser,
        savedProfile: !!savedProfile,
        savedProfileContent: savedProfile ? JSON.parse(savedProfile) : null
      });

      if (savedSession && savedUser) {
        try {
          const sessionData = JSON.parse(savedSession);
          const userData = JSON.parse(savedUser);
          const profileData = savedProfile ? JSON.parse(savedProfile) : null;

          // Check if session is still valid
          const now = Date.now();
          const expiresAt = sessionData.expiresAt;
          const isValid = expiresAt && expiresAt > now;
          
          console.log('[AuthProvider] Session validation:', {
            expiresAt: new Date(expiresAt).toISOString(),
            now: new Date(now).toISOString(),
            isValid,
            timeRemaining: expiresAt ? Math.round((expiresAt - now) / 1000 / 60) : 0 // minutes
          });
          
          if (isValid) {
            console.log('[AuthProvider] Restored valid session');
            console.log('[AuthProvider] Profile data from localStorage:', profileData);
            console.log('[AuthProvider] Profile data from session:', sessionData.profile);
            
            if (isMounted) {
              setUser(userData);
              setSession(sessionData);
              apiClient.setToken(sessionData.accessToken);
              
              // Try profile from localStorage first, then from session
              const finalProfile = profileData || sessionData.profile;
              console.log('[AuthProvider] Setting profile to:', finalProfile);
              
              if (finalProfile) {
                setProfile(finalProfile);
                setLoading(false);
              } else {
                // If no profile found, try to fetch it from API
                console.log('[AuthProvider] No profile found, fetching from API...');
                try {
                  const profileResult = await apiClient.getProfile();
                  if (profileResult.data && !profileResult.error) {
                    console.log('[AuthProvider] Profile fetched from API:', profileResult.data);
                    setProfile(profileResult.data);
                  } else {
                    console.error('[AuthProvider] Failed to fetch profile:', profileResult.error);
                  }
                } catch (error) {
                  console.error('[AuthProvider] Error fetching profile:', error);
                }
                setLoading(false);
              }
            }
            return;
          } else {
            console.log('[AuthProvider] Session expired, clearing storage');
            clearAuthStorage();
          }
          } catch (error) {
          console.error('[AuthProvider] Error parsing saved session:', error);
          clearAuthStorage();
        }
      }

      // If no valid session, try to refresh token
      const refreshToken = localStorage.getItem('auth_refresh_token');
      if (refreshToken) {
        try {
          console.log('[AuthProvider] Attempting to refresh token...');
          const result = await refreshSession();
          if (result.error) {
            console.log('[AuthProvider] Token refresh failed, clearing auth:', result.error);
            clearAuthStorage();
          } else {
            console.log('[AuthProvider] Token refreshed successfully');
          }
        } catch (error) {
          console.error('[AuthProvider] Error refreshing token:', error);
          clearAuthStorage();
        }
      } else {
        console.log('[AuthProvider] No refresh token found');
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

  const clearAuthStorage = () => {
    localStorage.removeItem('auth_session');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_profile');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_refresh_token');
    setUser(null);
    setProfile(null);
    setSession(null);
    setIsUserSuspended(false);
    apiClient.setToken(null);
    apiClient.setRefreshToken(null);
  };

  const saveAuthData = (sessionData: AuthSession) => {
    localStorage.setItem('auth_session', JSON.stringify(sessionData));
    localStorage.setItem('auth_user', JSON.stringify(sessionData.user));
    localStorage.setItem('auth_profile', JSON.stringify(sessionData.profile));
    localStorage.setItem('auth_token', sessionData.accessToken);
    localStorage.setItem('auth_refresh_token', sessionData.refreshToken);
    apiClient.setToken(sessionData.accessToken);
    apiClient.setRefreshToken(sessionData.refreshToken);
  };

  const signOut = async () => {
    console.log('[AuthProvider] Signing out');
    
    try {
      // Call backend logout endpoint
      await apiClient.logout();
    } catch (error) {
      console.error('[AuthProvider] Logout API call failed:', error);
    }

    clearAuthStorage();
    return { error: null };
  };

  const sendOTP = async (phone: string, role?: UserRole) => {
    console.log('[sendOTP] Starting OTP send for:', { phone, role });
    
    if (mockEnabled) {
      console.log('[sendOTP] Mock mode enabled, returning success');
      return { 
        data: { message: 'OTP sent successfully (mock mode)' },
        error: null 
      };
    }

    try {
      const result = await apiClient.sendOTP(phone, role);
      return { data: result.data, error: result.error };
    } catch (error) {
      console.error('Error in sendOTP:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to send OTP'
      };
    }
  };

  const verifyOTP = async (phone: string, otp: string, role?: UserRole, fullName?: string) => {
    console.log('[verifyOTP] Starting OTP verification for:', { phone, role });
    
    if (mockEnabled) {
      if (otp === '123456') {
        console.log('[verifyOTP] Mock OTP accepted');
        
        // Create mock session
        const mockUser: User = {
          id: `mock-user-${phone.replace(/[^0-9]/g, '')}`,
          phone,
          isVerified: true,
          authMethod: 'phone',
          lastLogin: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const mockProfile: Profile = {
          id: `mock-profile-${phone.replace(/[^0-9]/g, '')}`,
          user: mockUser.id,
          fullName: fullName || 'Mock User',
          role: role || 'buyer_seller',
          status: 'active',
          verificationStatus: 'verified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const mockSession: AuthSession = {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
                user: mockUser,
          profile: mockProfile,
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        };

        setUser(mockUser);
        setProfile(mockProfile);
        setSession(mockSession);
        saveAuthData(mockSession);
          
          return { 
            data: { 
              user: mockUser,
            profile: mockProfile,
              session: mockSession,
              userExists: true,
            roles: [{ role: mockProfile.role, full_name: mockProfile.fullName }]
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
      const result = await apiClient.verifyOTP(phone, otp, role);
      
      if (result.error) {
        return { data: null, error: result.error };
      }

      // If verification successful, get user profile if not already included
      let profileData = result.data.profile;
      if (!profileData) {
        const profileResult = await apiClient.getProfile();
        if (profileResult.error) {
          return { data: null, error: profileResult.error };
        }
        profileData = profileResult.data;
      }

      const sessionData: AuthSession = {
        accessToken: result.data.accessToken || result.data.token,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
        profile: profileData,
        expiresAt: Date.now() + parseExpirationTime(result.data.expiresIn || '7d'),
      };

      setUser(sessionData.user);
      setProfile(sessionData.profile);
      setSession(sessionData);
      saveAuthData(sessionData);

      return { 
        data: { 
          user: sessionData.user,
          profile: sessionData.profile,
          session: sessionData,
          userExists: true,
          roles: [{ role: sessionData.profile.role, full_name: sessionData.profile.fullName }]
        }, 
        error: null 
      };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to verify OTP'
      };
    }
  };

  const register = async (phone: string, otp: string, fullName: string, role: UserRole) => {
    console.log('[register] Starting registration for:', { phone, role });
    
    if (mockEnabled) {
      console.log('[register] Mock mode enabled');
      
      const mockUser: User = {
        id: `mock-user-${phone.replace(/[^0-9]/g, '')}`,
        phone,
        isVerified: true,
        authMethod: 'phone',
        lastLogin: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockProfile: Profile = {
        id: `mock-profile-${phone.replace(/[^0-9]/g, '')}`,
        user: mockUser.id,
        fullName,
        role,
        status: 'active',
        verificationStatus: 'verified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const mockSession: AuthSession = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: mockUser,
        profile: mockProfile,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      setUser(mockUser);
      setProfile(mockProfile);
      setSession(mockSession);
      saveAuthData(mockSession);

      return {
        data: { user: mockUser, profile: mockProfile },
        error: null
      };
    }

    try {
      const result = await apiClient.register(phone, otp, fullName, role);
      
      if (result.error) {
        return { data: null, error: result.error };
      }

      // Get the created profile if not already included
      let profileData = result.data.profile;
      if (!profileData) {
        const profileResult = await apiClient.getProfile();
        if (profileResult.error) {
          return { data: null, error: profileResult.error };
        }
        profileData = profileResult.data;
      }

      const sessionData: AuthSession = {
        accessToken: result.data.accessToken || result.data.token,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
        profile: profileData,
        expiresAt: Date.now() + parseExpirationTime(result.data.expiresIn || '7d'),
      };

      setUser(sessionData.user);
      setProfile(sessionData.profile);
      setSession(sessionData);
      saveAuthData(sessionData);

      return {
        data: { user: sessionData.user, profile: sessionData.profile },
        error: null
      };
    } catch (error) {
      console.error('Error in register:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to register'
      };
    }
  };

  const login = async (phone: string, otp: string) => {
    console.log('[login] Starting login for:', { phone });

    try {
      const result = await apiClient.login(phone, otp);
      
      if (result.error) {
        return { data: null, error: result.error };
      }

      // Get user profile if not already included
      let profileData = result.data.profile;
      if (!profileData) {
        const profileResult = await apiClient.getProfile();
        if (profileResult.error) {
          return { data: null, error: profileResult.error };
        }
        profileData = profileResult.data;
      }

      const sessionData: AuthSession = {
        accessToken: result.data.accessToken || result.data.token,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
        profile: profileData,
        expiresAt: Date.now() + parseExpirationTime(result.data.expiresIn || '7d'),
      };

      setUser(sessionData.user);
      setProfile(sessionData.profile);
      setSession(sessionData);
      saveAuthData(sessionData);

      // Check if user is suspended
      setIsUserSuspended(sessionData.profile.status === 'suspended');

      return {
        data: { user: sessionData.user, profile: sessionData.profile, session: sessionData },
        error: null
      };
    } catch (error) {
      console.error('Error in login:', error);
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to login'
      };
    }
  };

  const refreshSession = async () => {
    try {
      const result = await apiClient.refreshToken();
      
      if (result.error) {
        clearAuthStorage();
        return { data: null, error: result.error };
      }

      const sessionData: AuthSession = {
        accessToken: result.data.accessToken || result.data.token,
        refreshToken: result.data.refreshToken,
        user: result.data.user,
        profile: result.data.profile,
        expiresAt: Date.now() + parseExpirationTime(result.data.expiresIn || '7d'),
      };

      setUser(sessionData.user);
      setProfile(sessionData.profile);
      setSession(sessionData);
      saveAuthData(sessionData);

      return { data: sessionData, error: null };
    } catch (error) {
      console.error('Error refreshing session:', error);
      clearAuthStorage();
      return {
        data: null,
        error: error instanceof Error ? error.message : 'Failed to refresh session'
      };
    }
  };

  const signUpWithSMSForNewRole = async (phone: string, fullName: string, role: UserRole) => {
    console.log('[signUpWithSMSForNewRole] Starting signup for new role:', { phone, fullName, role });
    
    if (mockEnabled) {
      console.log('[signUpWithSMSForNewRole] Mock mode enabled, returning success');
      
      // Store mock OTP for verification
      sessionStorage.setItem(`mock_otp_${phone}`, '123456');
      
      // Store mock profiles for role selection
      const existingProfilesRaw = localStorage.getItem(`mock_profiles_${phone}`);
      const existingProfiles = existingProfilesRaw ? JSON.parse(existingProfilesRaw) : [];
      
      const newProfile = {
        role,
        fullName,
        phone,
        createdAt: new Date().toISOString()
      };
      
      const updatedProfiles = [...existingProfiles, newProfile];
      localStorage.setItem(`mock_profiles_${phone}`, JSON.stringify(updatedProfiles));
      
      return { 
        data: { message: 'OTP sent successfully (mock mode)' },
        error: null 
      };
    }

    try {
      const result = await apiClient.signUpWithSMSForNewRole(phone, fullName, role);
      console.log('[useAuth] signUpWithSMSForNewRole result:', result);
      return { data: result.data, error: result.error };
    } catch (error) {
      console.error('Error in signUpWithSMSForNewRole:', error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Failed to send OTP for new role'
      };
    }
  };

  // Update user suspended status when profile changes
  useEffect(() => {
    if (profile) {
      setIsUserSuspended(profile.status === 'suspended');
    }
  }, [profile]);

  const refreshUser = async () => {
    try {
      console.log('[AuthProvider] Refreshing user data...');
      const result = await apiClient.getProfile();
      if (result.data) {
        const profileData = result.data;
        setProfile(profileData);
        
        // Update user data with active role from profile
        if (user) {
          const updatedUser = {
            ...user,
            activeRole: profileData.activeRole || profileData.currentRole,
            currentRole: profileData.currentRole
          };
          setUser(updatedUser);
          
          // Update localStorage
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
          localStorage.setItem('auth_profile', JSON.stringify(profileData));
        }
        
        console.log('[AuthProvider] User data refreshed successfully');
      }
    } catch (error) {
      console.error('[AuthProvider] Error refreshing user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signOut,
    isUserSuspended,
    sendOTP,
    verifyOTP,
    register,
    login,
    refreshSession,
    refreshUser,
    signUpWithSMSForNewRole,
  };

  console.log('[AuthProvider] Providing context value:', {
    user: user?.id,
    profile: profile?.id,
    session: !!session,
    loading,
    isUserSuspended
  });

  return React.createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}