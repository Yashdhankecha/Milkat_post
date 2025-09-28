import apiClient from '@/lib/api';
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { User, Building2, Shield, Users, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

const RoleSelection = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { switchRole, fetchUserRoles } = useProfile();
  
  const { phone, roles } = location.state || {};
  
  const roleInfoMap = {
    'buyer_seller': { 
      label: 'Property Buyer & Seller', 
      icon: User,
      color: 'text-blue-600'
    },
    'broker': { 
      label: 'Real Estate Broker', 
      icon: Briefcase,
      color: 'text-purple-600'
    },
    'developer': { 
      label: 'Property Developer', 
      icon: Building2,
      color: 'text-orange-600'
    },
    'society_owner': { 
      label: 'Society Owner/Secretary', 
      icon: Shield,
      color: 'text-red-600'
    },
    'society_member': { 
      label: 'Society Member', 
      icon: Users,
      color: 'text-indigo-600'
    },
    'admin': { 
      label: 'Administrator', 
      icon: User,
      color: 'text-gray-600'
    }
  };

  const handleRoleSelect = async (role: string) => {
    try {
      // Switch to the selected role
      if (user) {
        const { error } = await switchRole(role as any);
        if (error) {
          console.error('Error switching role:', error);
          toast({
            title: "Error",
            description: "Failed to switch role. Please try again.",
            variant: "error",
            duration: 3000,
          });
          
          // If we get a "No profile found" error, we should redirect to auth
          if (error.includes('No profile found')) {
            // Navigate to auth page as we can't switch roles without a profile
            setTimeout(() => {
              navigate("/auth", { replace: true });
            }, 2000);
            return;
          }
          // For other errors, we still navigate to the dashboard to prevent user from being stuck
        }
      } else {
        // Fallback to localStorage only if no user
        localStorage.setItem('selectedRole', role);
      }
      
      // Redirect to appropriate dashboard
      const dashboardPath = getRoleBasedPath(role);
      console.log(`[RoleSelection] Navigating to dashboard: ${dashboardPath} for role: ${role}`);
      toast({
        title: "Success",
        description: "Role switched successfully!",
        variant: "success",
        duration: 2000,
      });
      navigate(dashboardPath, { replace: true });
    } catch (error) {
      console.error('Error in handleRoleSelect:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "error",
        duration: 3000,
      });
      // Navigate to home page as fallback after a delay so user can see the error
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    }
  };

  const getRoleBasedPath = (role: string): string => {
    switch (role) {
      case 'admin':
        return '/admin/dashboard';
      case 'buyer_seller':
        return '/buyer-seller/dashboard';
      case 'broker':
        return '/broker/dashboard';
      case 'developer':
        return '/developer/dashboard';
      case 'society_owner':
        return '/society-owner/dashboard';
      case 'society_member':
        return '/society-member/dashboard';
      default:
        return '/';
    }
  };

  // If no roles data and no phone, show error and redirect to auth after a delay
  useEffect(() => {
    if ((!roles || !phone) && user) {
      console.log('[RoleSelection] No roles or phone data provided, attempting to fetch roles');
      
      // Try to get phone from user
      const userPhone = (user as any)?.phone || (user as any)?.user_metadata?.phone || '';
      if (!userPhone) {
        console.log('[RoleSelection] No phone found for user, redirecting to auth');
        setTimeout(() => {
          navigate('/auth');
        }, 3000);
        return;
      }
      
      // Try to fetch roles
      const fetchRoles = async () => {
        try {
          const mockEnabled = typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_MOCK_OTP === 'true';
          if (mockEnabled) {
            const existingProfilesRaw = localStorage.getItem(`mock_profiles_${userPhone}`);
            if (existingProfilesRaw) {
              const existingProfiles = JSON.parse(existingProfilesRaw);
              const fetchedRoles = existingProfiles.map((p: any) => ({
                role: p.role,
                full_name: p.fullName || p.full_name || 'User'
              }));
              
              // If we only have one role, select it automatically
              if (fetchedRoles.length === 1) {
                handleRoleSelect(fetchedRoles[0].role);
              }
              // If we have multiple roles, we should show them but we can't update state here
              return;
            }
          } else {
            const { data: profiles, error } = await apiClient
              
              ;
            
            if (!error && profiles && profiles.length > 0) {
              const fetchedRoles = profiles.map(p => ({
                role: p.role,
                full_name: p.full_name || 'User'
              }));
              
              // If we only have one role, select it automatically
              if (fetchedRoles.length === 1) {
                handleRoleSelect(fetchedRoles[0].role);
              }
              // If we have multiple roles, we should show them but we can't update state here
              return;
            }
          }
          
          // If no roles found, redirect to auth
          console.log('[RoleSelection] No roles found for user, redirecting to auth');
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        } catch (error) {
          console.error('[RoleSelection] Error fetching roles:', error);
          setTimeout(() => {
            navigate('/auth');
          }, 3000);
        }
      };
      
      fetchRoles();
    }
  }, [roles, phone, user, navigate]);

  // If no user at all, redirect to auth immediately
  if (!user) {
    console.log('[RoleSelection] No user found, redirecting to auth');
    navigate('/auth');
    return null;
  }

  // If no roles or phone data and we're still here, show loading message
  if (!roles || !phone) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-estate-blue-lighter to-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-strong border-0 w-full">
            <CardHeader className="space-y-1 text-center">
              <div className="text-xl sm:text-2xl font-bold text-estate-blue mb-2">
                Milkat<span className="text-accent">Post</span>
              </div>
              <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                Loading Roles...
              </CardTitle>
              <CardDescription>
                Please wait while we load your available roles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-muted-foreground">
                If you're not redirected automatically, please go back and try again.
              </p>
              <Button onClick={() => navigate('/auth')}>
                Back to Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-estate-blue-lighter to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-strong border-0 w-full">
          <CardHeader className="space-y-1 text-center">
            <div className="text-xl sm:text-2xl font-bold text-estate-blue mb-2">
              Milkat<span className="text-accent">Post</span>
            </div>
            <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
              Select Your Role
            </CardTitle>
            <CardDescription>
              You have multiple roles. Please select which one you want to use.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roles && roles.map((roleData: {role: string, full_name: string}, index: number) => {
              const roleInfo = roleInfoMap[roleData.role as keyof typeof roleInfoMap] || { 
                label: roleData.role, 
                icon: User, 
                color: 'text-gray-600' 
              };
              const IconComponent = roleInfo.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full h-auto p-4 justify-start"
                  onClick={() => handleRoleSelect(roleData.role)}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`h-5 w-5 ${roleInfo.color}`} />
                    <div className="text-left">
                      <div className="font-medium">{roleInfo.label}</div>
                      <div className="text-sm text-muted-foreground">{roleData.full_name}</div>
                    </div>
                  </div>
                </Button>
              );
            })}
            <div className="text-center">
              <Button
                variant="link"
                className="p-0 h-auto font-medium text-muted-foreground hover:text-foreground"
                onClick={() => navigate('/auth')}
              >
                ← Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleSelection;