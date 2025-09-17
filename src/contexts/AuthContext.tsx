import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, database } from '../config/firebase';
import { User, LoginCredentials, UserPermissions } from '../types';

// Default permissions for different user roles
const getDefaultPermissions = (role: 'admin' | 'user' | 'operator' | 'viewer'): UserPermissions => {
  const basePermissions: UserPermissions = {
    canViewDashboard: false,
    canViewAnalytics: false,
    canViewMachines: false,
    canControlMachines: false,
    canAddMachines: false,
    canEditMachines: false,
    canDeleteMachines: false,
    canViewProducts: false,
    canManageProducts: false,
    canImportProducts: false,
    canExportProducts: false,
    canViewUsers: false,
    canCreateUsers: false,
    canEditUsers: false,
    canDeleteUsers: false,
    canCreateSubAccounts: false,
    canAssignMachines: false,
    canAssignGroups: false,
    canViewReports: false,
    canExportReports: false,
    canViewDetailedReports: false,
    canViewOperations: false,
    canManageOperations: false,
    canViewAlarms: false,
    canManageAlarms: false,
  };

  switch (role) {
    case 'admin':
      return {
        ...basePermissions,
        canViewDashboard: true,
        canViewAnalytics: true,
        canViewMachines: true,
        canControlMachines: true,
        canAddMachines: true,
        canEditMachines: true,
        canDeleteMachines: true,
        canViewProducts: true,
        canManageProducts: true,
        canImportProducts: true,
        canExportProducts: true,
        canViewUsers: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canCreateSubAccounts: true,
        canAssignMachines: true,
        canAssignGroups: true,
        canViewReports: true,
        canExportReports: true,
        canViewDetailedReports: true,
        canViewOperations: true,
        canManageOperations: true,
        canViewAlarms: true,
        canManageAlarms: true,
      };
    case 'user':
      return {
        ...basePermissions,
        canViewDashboard: true,
        canViewMachines: true,
        canViewProducts: true,
        canViewReports: true,
        canViewAlarms: true,
      };
    case 'operator':
      return {
        ...basePermissions,
        canViewDashboard: true,
        canViewMachines: true,
        canControlMachines: true,
        canViewProducts: true,
        canManageProducts: true,
        canViewAlarms: true,
        canManageAlarms: true,
        canViewOperations: true,
        canManageOperations: true,
      };
    case 'viewer':
      return {
        ...basePermissions,
        canViewDashboard: true,
        canViewMachines: true,
        canViewProducts: true,
        canViewReports: true,
        canViewAlarms: true,
      };
    default:
      return basePermissions;
  }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user token
          const token = await firebaseUser.getIdToken();
          
          // Check if user record exists in database
          const userRef = ref(database, `users/${firebaseUser.uid}`);
          let userSnapshot;
          
          try {
            userSnapshot = await get(userRef);
          } catch (dbError) {
            console.log('Database read permission denied, creating new user record');
            userSnapshot = null;
          }
          
          let userData: User;
          
          if (userSnapshot && userSnapshot.exists()) {
            // User record exists, use it
            const dbUserData = userSnapshot.val();
            userData = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: dbUserData.name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: dbUserData.role || 'admin',
              permissions: (dbUserData.role === 'admin') 
                ? getDefaultPermissions('admin') 
                : (dbUserData.permissions && typeof dbUserData.permissions === 'object' && !Array.isArray(dbUserData.permissions)) 
                  ? dbUserData.permissions 
                  : getDefaultPermissions(dbUserData.role || 'admin'),
              isActive: dbUserData.isActive !== undefined ? dbUserData.isActive : true,
              createdAt: dbUserData.createdAt || new Date().toISOString(),
              updatedAt: dbUserData.updatedAt || new Date().toISOString(),
              accountType: dbUserData.accountType || 'main',
              parentAccountId: dbUserData.parentAccountId,
              subAccountIds: dbUserData.subAccountIds || [],
              assignedMachineIds: dbUserData.assignedMachineIds || [],
              assignedGroupIds: dbUserData.assignedGroupIds || [],
              phone: dbUserData.phone,
              department: dbUserData.department,
              notes: dbUserData.notes,
              lastLogin: dbUserData.lastLogin
            };
            
            // Update last login and ensure admin permissions
            await set(ref(database, `users/${firebaseUser.uid}/lastLogin`), new Date().toISOString());
            
            // If user is admin, ensure they have all permissions in database
            if (dbUserData.role === 'admin') {
              console.log('🔥 ADMIN PERMISSIONS - Updating admin permissions');
              const adminPermissions = getDefaultPermissions('admin');
              console.log('🔥 Admin permissions to set:', adminPermissions);
              
              try {
                await set(ref(database, `users/${firebaseUser.uid}/permissions`), adminPermissions);
                console.log('🔥 Admin permissions updated successfully in database');
                userData.permissions = adminPermissions;
              } catch (permError) {
                console.error('🔥 Failed to update admin permissions:', permError);
                // Use local permissions anyway
                userData.permissions = adminPermissions;
              }
            }
          } else {
            // User record doesn't exist, create it
            const newUserData = {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              role: 'admin' as const, // TEMP: Make first user admin to see all users
              permissions: getDefaultPermissions('admin'),
              isActive: true,
              accountType: 'main' as const,
              assignedMachineIds: [],
              assignedGroupIds: [],
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            // Save to database
            try {
              await set(userRef, newUserData);
              console.log('✅ New user record created successfully');
            } catch (writeError) {
              console.error('❌ Failed to create user record:', writeError);
              // Continue with userData anyway - user can still use the app
            }
            
            userData = {
              id: firebaseUser.uid,
              email: newUserData.email,
              name: newUserData.name,
              role: newUserData.role,
              permissions: newUserData.permissions,
              isActive: newUserData.isActive,
              createdAt: newUserData.createdAt,
              updatedAt: newUserData.updatedAt,
              accountType: newUserData.accountType,
              assignedMachineIds: newUserData.assignedMachineIds,
              assignedGroupIds: newUserData.assignedGroupIds,
              lastLogin: newUserData.lastLogin
            };
            
            console.log('New user record created:', {
              email: userData.email,
              name: userData.name,
              role: userData.role
            });
          }
          
          console.log('User authenticated:', {
            email: userData.email,
            name: userData.name,
            role: userData.role
          });
          
          setUser(userData);
        } catch (error) {
          console.error('Error setting up user:', error);
          // Fallback to temporary data if database fails
          const fallbackUserData: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            role: 'admin' as const,
            permissions: getDefaultPermissions('admin'),
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            accountType: 'main' as const,
            assignedMachineIds: [],
            assignedGroupIds: []
          };
          setUser(fallbackUserData);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      // User state will be updated by the onAuthStateChanged listener
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};