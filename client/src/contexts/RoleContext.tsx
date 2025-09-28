import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface RoleContextType {
  activeRole: string | null;
  setActiveRole: (role: string) => void;
  switchRole: (role: string) => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [activeRole, setActiveRoleState] = useState<string | null>(null);

  // Initialize active role from user data
  useEffect(() => {
    if (user) {
      const role = user.activeRole || user.currentRole;
      if (role) {
        setActiveRoleState(role);
      }
    }
  }, [user]);

  const setActiveRole = (role: string) => {
    setActiveRoleState(role);
  };

  const switchRole = async (role: string) => {
    // This will be handled by the API call in the component
    // We just update the local state here
    setActiveRoleState(role);
  };

  return (
    <RoleContext.Provider value={{ activeRole, setActiveRole, switchRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
