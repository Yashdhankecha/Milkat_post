import { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { useAuth, UserRole, Profile } from '@/hooks/useAuth';

export interface UserProfile extends Profile {
  bio?: string;
  profilePicture?: string;
  companyName?: string;
  businessType?: string;
  website?: string;
  phone?: string;
  currentRole?: string;
  activeRole?: string;
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    youtube?: string;
  };
  preferences?: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    privacy: {
      showPhone: boolean;
      showEmail: boolean;
      showProfile: boolean;
    };
  };
  lastActive?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, profile: authProfile } = useAuth();
  const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';

  // Log state changes for debugging
  useEffect(() => {
    console.log('[useProfile] Profile state changed:', profile?.id, profile?.role);
  }, [profile]);

  useEffect(() => {
    console.log('[useProfile] Loading state changed:', loading);
  }, [loading]);

  useEffect(() => {
    console.log('[useProfile] User changed:', user?.id);
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Use profile from auth context (both mock and real mode)
    if (authProfile) {
      const extendedProfile: UserProfile = {
        ...authProfile,
        bio: authProfile.bio || 'User bio',
        profilePicture: authProfile.profilePicture || null,
        companyName: authProfile.companyName,
        businessType: authProfile.businessType,
        website: authProfile.website || 'https://example.com',
        socialMedia: {
          facebook: '',
          twitter: '',
          linkedin: '',
        },
        preferences: {
          notifications: {
            email: true,
            sms: true,
            push: true,
          },
          privacy: {
            showPhone: false,
            showEmail: false,
            showProfile: true,
          },
        },
        lastActive: new Date().toISOString(),
      };
      setProfile(extendedProfile);
      setLoading(false);
      return;
    }

    // If no auth profile, try to fetch from API
    fetchProfile();
  }, [user, authProfile]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const result = await apiClient.getProfile();

      if (result.error) {
        setError(result.error);
        return;
      }

      setProfile(result.data as UserProfile);
    } catch (err) {
      console.error('[useProfile] Error fetching profile:', err);
      setError('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return { error: 'No user found' };

    try {
      setError(null);

      const result = await apiClient.updateProfile(updates);

      if (result.error) {
        setError(result.error);
        return { error: result.error };
      }

      setProfile(result.data as UserProfile);
      return { data: result.data, error: null };
    } catch (err) {
      console.error('[useProfile] Error updating profile:', err);
      const errorMessage = 'Failed to update profile';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const createProfile = async (profileData: {
    role: UserRole;
    fullName: string;
    phone?: string;
    companyName?: string;
    businessType?: string;
    bio?: string;
    website?: string;
  }) => {
    if (!user) return { error: 'No user found' };

    try {
      setError(null);

      const result = await apiClient.updateProfile({
        role: profileData.role,
        fullName: profileData.fullName,
        phone: profileData.phone,
        companyName: profileData.companyName,
        businessType: profileData.businessType,
        bio: profileData.bio,
        website: profileData.website,
      });

      if (result.error) {
        setError(result.error);
        return { error: result.error };
      }

      setProfile(result.data as UserProfile);
      return { data: result.data, error: null };
    } catch (err) {
      console.error('[useProfile] Error creating profile:', err);
      const errorMessage = 'Failed to create profile';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const switchRole = async (newRole: UserRole) => {
    if (!user) return { error: 'No user found' };

    try {
      setError(null);

      const result = await apiClient.updateProfile({ role: newRole });

      if (result.error) {
        setError(result.error);
        return { error: result.error };
      }

      setProfile(result.data as UserProfile);
      return { data: result.data, error: null };
    } catch (err) {
      console.error('[useProfile] Error switching role:', err);
      const errorMessage = 'Failed to switch role';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user) return { error: 'No user found' };

    try {
      setError(null);

      const result = await apiClient.uploadFile(file);

      if (result.error) {
        setError(result.error);
        return { error: result.error };
      }

      // Update profile with new picture URL
      const updateResult = await apiClient.updateProfile({
        profilePicture: result.data.url,
      });

      if (updateResult.error) {
        setError(updateResult.error);
        return { error: updateResult.error };
      }

      setProfile(updateResult.data as UserProfile);
      return { data: updateResult.data, error: null };
    } catch (err) {
      console.error('[useProfile] Error uploading profile picture:', err);
      const errorMessage = 'Failed to upload profile picture';
      setError(errorMessage);
      return { error: errorMessage };
    }
  };

  const hasRole = (role: UserRole | UserRole[]) => {
    if (!profile) return false;

    if (Array.isArray(role)) {
      return role.includes(profile.role);
    }

    return profile.role === role;
  };

  const isAdmin = () => hasRole('admin');
  const isBuyerSeller = () => hasRole('buyer_seller');
  const isBroker = () => hasRole('broker');
  const isDeveloper = () => hasRole('developer');
  const isSocietyOwner = () => hasRole('society_owner');
  const isSocietyMember = () => hasRole('society_member');

  const isVerified = () => {
    return profile?.verificationStatus === 'verified';
  };

  const isActive = () => {
    return profile?.status === 'active';
  };

  const isSuspended = () => {
    return profile?.status === 'suspended';
  };

  const getDisplayName = () => {
    if (!profile) return '';
    return profile.fullName || profile.companyName || 'Unknown User';
  };

  const getRoleDisplayName = () => {
    if (!profile) return '';
    
    const roleMap: Record<UserRole, string> = {
      admin: 'Administrator',
      buyer_seller: 'Buyer/Seller',
      broker: 'Real Estate Broker',
      developer: 'Property Developer',
      society_owner: 'Society Owner',
      society_member: 'Society Member',
    };

    return roleMap[profile.role] || profile.role;
  };

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
    createProfile,
    switchRole,
    uploadProfilePicture,
    hasRole,
    isAdmin,
    isBuyerSeller,
    isBroker,
    isDeveloper,
    isSocietyOwner,
    isSocietyMember,
    isVerified,
    isActive,
    isSuspended,
    getDisplayName,
    getRoleDisplayName,
  };
};