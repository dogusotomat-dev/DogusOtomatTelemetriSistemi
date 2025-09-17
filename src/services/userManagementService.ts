import { ref, push, set, update, remove, get, onValue, off } from 'firebase/database';
import { createUserWithEmailAndPassword, updatePassword, deleteUser as deleteFirebaseUser, signInWithEmailAndPassword } from 'firebase/auth';
import { database, auth } from '../config/firebase';
import { User, CreateUserRequest, UpdateUserRequest, UserRole, UserPermissions } from '../types';

export class UserManagementService {
  private static readonly USERS_PATH = 'users';

  /**
   * Get role-based permissions
   */
  static getRolePermissions(role: UserRole): UserPermissions {
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
          canManageProducts: true,
          canImportProducts: true,
          canExportProducts: true,
          canCreateSubAccounts: true,
          canViewReports: true,
          canViewOperations: true,
          canViewAlarms: true,
        };

      case 'operator':
        return {
          ...basePermissions,
          canViewDashboard: true,
          canViewMachines: true,
          canControlMachines: true,
          canViewProducts: true,
          canViewReports: true,
          canViewOperations: true,
          canManageOperations: true,
          canViewAlarms: true,
        };

      case 'viewer':
        return {
          ...basePermissions,
          canViewDashboard: true,
          canViewMachines: true,
          canViewProducts: true,
          canViewReports: true,
          canViewOperations: true,
          canViewAlarms: true,
        };

      default:
        return basePermissions;
    }
  }

  /**
   * Create a new user account
   */
  static async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      console.log('🔥 CREATING USER - Starting user creation process');
      console.log('🔥 User data:', userData);
      
      // Store current user info to restore later
      const currentUser = auth.currentUser;
      const currentUserEmail = currentUser?.email;
      console.log('🔥 Current user before creation:', currentUserEmail);
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      
      const uid = userCredential.user.uid;
      console.log('🔥 Firebase Auth user created with UID:', uid);
      
      // Sign out the newly created user and restore original user
      await auth.signOut();
      console.log('🔥 Signed out newly created user');
      
      // Don't try to restore here - let the component handle it with page reload
      const permissions = (userData as any).permissions || this.getRolePermissions(userData.role);
      
      const newUser: User = {
        id: uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        permissions: permissions,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        accountType: userData.accountType,
        parentAccountId: userData.parentAccountId,
        assignedMachineIds: userData.assignedMachineIds || [],
        assignedGroupIds: userData.assignedGroupIds || [],
        phone: userData.phone,
        department: userData.department,
        notes: userData.notes,
      };

      // Save to database
      console.log('🔥 CREATING USER - Attempting to save to database:', uid);
      console.log('🔥 User data to save:', newUser);
      console.log('🔥 Database path:', `${this.USERS_PATH}/${uid}`);
      
      try {
        await set(ref(database, `${this.USERS_PATH}/${uid}`), newUser);
        console.log('🔥 SUCCESS - User saved to database successfully');
      } catch (dbError) {
        console.error('🔥 ERROR - Failed to save user to database:', dbError);
        throw new Error(`Database save failed: ${dbError}`);
      }

      // If this is a sub-account, update parent's subAccountIds
      if (userData.parentAccountId) {
        const parentRef = ref(database, `${this.USERS_PATH}/${userData.parentAccountId}`);
        const parentSnapshot = await get(parentRef);
        
        if (parentSnapshot.exists()) {
          const parentData = parentSnapshot.val();
          const subAccountIds = parentData.subAccountIds || [];
          subAccountIds.push(uid);
          
          await update(parentRef, {
            subAccountIds: subAccountIds,
            updatedAt: new Date().toISOString()
          });
        }
      }

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get all users (for admin users only)
   */
  static async getAllUsers(): Promise<User[]> {
    try {
      const userRef = ref(database, this.USERS_PATH);
      const snapshot = await get(userRef);
      
      if (!snapshot.exists()) {
        return [];
      }

      const usersData = snapshot.val();
      
      if (!usersData || typeof usersData !== 'object') {
        return [];
      }
      
      const userKeys = Object.keys(usersData);
      const users: User[] = [];
      
      // Process users in batches to avoid blocking
      const batchSize = 10;
      for (let i = 0; i < userKeys.length; i += batchSize) {
        const batch = userKeys.slice(i, i + batchSize);
        
        for (const userId of batch) {
          const userData = usersData[userId];
          
          if (userData && typeof userData === 'object') {
            const user: User = {
              id: userId,
              email: userData.email || '',
              name: userData.name || '',
              role: userData.role || 'user',
              permissions: userData.permissions || {},
              isActive: userData.isActive !== undefined ? userData.isActive : true,
              createdAt: userData.createdAt || new Date().toISOString(),
              updatedAt: userData.updatedAt || new Date().toISOString(),
              accountType: userData.accountType || 'main',
              parentAccountId: userData.parentAccountId,
              subAccountIds: userData.subAccountIds || [],
              assignedMachineIds: userData.assignedMachineIds || [],
              assignedGroupIds: userData.assignedGroupIds || [],
              phone: userData.phone,
              department: userData.department,
              notes: userData.notes,
              lastLogin: userData.lastLogin
            };
            users.push(user);
          }
        }
        
        // Allow UI to update between batches
        if (i + batchSize < userKeys.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<User | null> {
    try {
      const snapshot = await get(ref(database, `${this.USERS_PATH}/${userId}`));
      if (!snapshot.exists()) return null;

      return snapshot.val() as User;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Get users by parent account (sub-accounts)
   */
  static async getSubAccounts(parentAccountId: string): Promise<User[]> {
    try {
      const snapshot = await get(ref(database, this.USERS_PATH));
      if (!snapshot.exists()) return [];

      const usersData = snapshot.val();
      const users = Object.values(usersData) as User[];
      
      return users.filter(user => user.parentAccountId === parentAccountId);
    } catch (error) {
      console.error('Error fetching sub-accounts:', error);
      throw error;
    }
  }

  /**
   * Update user information
   */
  static async updateUser(userId: string, updates: UpdateUserRequest): Promise<void> {
    try {
      console.log('Updating user:', userId, 'with updates:', updates);
      
      // Get current user data first to preserve existing fields
      const currentUser = await this.getUserById(userId);
      if (!currentUser) {
        throw new Error('User not found');
      }
      
      console.log('Current user data:', currentUser);

      const updateData: any = {
        ...updates,
        updatedAt: new Date().toISOString(),
        // Preserve existing fields that might be missing in updates
        accountType: updates.accountType || currentUser.accountType || 'main',
        assignedMachineIds: updates.assignedMachineIds || currentUser.assignedMachineIds || [],
        assignedGroupIds: updates.assignedGroupIds || currentUser.assignedGroupIds || [],
        isActive: updates.isActive !== undefined ? updates.isActive : currentUser.isActive,
        // Preserve other existing fields
        email: currentUser.email,
        createdAt: currentUser.createdAt,
        // Don't include 'id' field - it's already in the path
      };
      
      console.log('🔥 UPDATE DEBUG:');
      console.log('🔥 Updates.name:', updates.name);
      console.log('🔥 CurrentUser.name:', currentUser.name);
      console.log('🔥 CurrentUser.id:', currentUser.id);
      console.log('🔥 UpdateData.name after spread:', updateData.name);
      console.log('🔥 Final updateData:', updateData);
      
      // Check for undefined values
      const undefinedFields = Object.entries(updateData).filter(([key, value]) => value === undefined);
      if (undefinedFields.length > 0) {
        console.error('🔥 WARNING: Undefined fields detected:', undefinedFields);
        // Remove undefined fields
        undefinedFields.forEach(([key]) => delete updateData[key]);
        console.log('🔥 Cleaned updateData:', updateData);
      }

      // If role is being updated, update permissions (unless custom permissions provided)
      if (updates.role && !(updates as any).permissions) {
        updateData.permissions = this.getRolePermissions(updates.role);
      } else if ((updates as any).permissions) {
        updateData.permissions = (updates as any).permissions;
      } else {
        // For admin users, always ensure they have full permissions
        updateData.permissions = (currentUser.role === 'admin' || updates.role === 'admin') 
          ? this.getRolePermissions('admin')
          : currentUser.permissions;
      }

      console.log('Final update data:', updateData);
      console.log('Update path:', `${this.USERS_PATH}/${userId}`);
      
      try {
        await update(ref(database, `${this.USERS_PATH}/${userId}`), updateData);
        console.log('User update completed successfully');
      } catch (firebaseError: any) {
        console.error('Firebase update error:', firebaseError);
        console.error('Error code:', firebaseError.code);
        console.error('Error message:', firebaseError.message);
        console.error('Error details:', firebaseError.details);
        throw new Error(`Firebase güncelleme hatası: ${firebaseError.message || firebaseError.code || 'Bilinmeyen hata'}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      // Get user data first
      const user = await this.getUserById(userId);
      if (!user) throw new Error('User not found');
      
      // Protect admin accounts from deletion
      if (user.role === 'admin') {
        throw new Error('Admin hesapları silinemez!');
      }

      // If this is a main account with sub-accounts, delete all sub-accounts first
      if (user.accountType === 'main' && user.subAccountIds) {
        for (const subAccountId of user.subAccountIds) {
          await this.deleteUser(subAccountId);
        }
      }

      // If this is a sub-account, remove from parent's subAccountIds
      if (user.parentAccountId) {
        const parentRef = ref(database, `${this.USERS_PATH}/${user.parentAccountId}`);
        const parentSnapshot = await get(parentRef);
        
        if (parentSnapshot.exists()) {
          const parentData = parentSnapshot.val();
          const subAccountIds = (parentData.subAccountIds || []).filter(
            (id: string) => id !== userId
          );
          
          await update(parentRef, {
            subAccountIds: subAccountIds,
            updatedAt: new Date().toISOString()
          });
        }
      }

      // Remove from database
      await remove(ref(database, `${this.USERS_PATH}/${userId}`));

      // Note: Firebase Auth user deletion would require admin SDK
      // For now, we just deactivate the account in our database
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Assign machines to user
   */
  static async assignMachinesToUser(userId: string, machineIds: string[]): Promise<void> {
    try {
      await update(ref(database, `${this.USERS_PATH}/${userId}`), {
        assignedMachineIds: machineIds,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error assigning machines to user:', error);
      throw error;
    }
  }

  /**
   * Assign machine groups to user
   */
  static async assignGroupsToUser(userId: string, groupIds: string[]): Promise<void> {
    try {
      await update(ref(database, `${this.USERS_PATH}/${userId}`), {
        assignedGroupIds: groupIds,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error assigning groups to user:', error);
      throw error;
    }
  }

  /**
   * Get machines accessible by user
   */
  static async getUserAccessibleMachines(userId: string): Promise<string[]> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return [];

      let accessibleMachines = [...user.assignedMachineIds];

      // If user has assigned groups, get machines from those groups
      if (user.assignedGroupIds.length > 0) {
        const machineGroupsSnapshot = await get(ref(database, 'machineGroups'));
        if (machineGroupsSnapshot.exists()) {
          const groupsData = machineGroupsSnapshot.val();
          
          for (const groupId of user.assignedGroupIds) {
            if (groupsData[groupId]) {
              accessibleMachines.push(...groupsData[groupId].machineIds);
            }
          }
        }
      }

      // Remove duplicates
      return Array.from(new Set(accessibleMachines));
    } catch (error) {
      console.error('Error getting user accessible machines:', error);
      throw error;
    }
  }

  /**
   * Subscribe to users updates
   */
  static subscribeToUsers(callback: (users: User[]) => void): () => void {
    const usersRef = ref(database, this.USERS_PATH);
    
    const unsubscribe = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val();
        const users = Object.values(usersData) as User[];
        callback(users);
      } else {
        callback([]);
      }
    });

    return () => off(usersRef, 'value', unsubscribe);
  }

  /**
   * Check if user has permission
   */
  static hasPermission(user: User, permission: keyof UserPermissions): boolean {
    return user.permissions[permission] === true;
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    mainAccounts: number;
    subAccounts: number;
    usersByRole: Record<UserRole, number>;
  }> {
    try {
      const users = await this.getAllUsers();
      
      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.isActive).length,
        mainAccounts: users.filter(u => u.accountType === 'main').length,
        subAccounts: users.filter(u => u.accountType === 'sub').length,
        usersByRole: {
          admin: users.filter(u => u.role === 'admin').length,
          user: users.filter(u => u.role === 'user').length,
          operator: users.filter(u => u.role === 'operator').length,
          viewer: users.filter(u => u.role === 'viewer').length,
        }
      };

      return stats;
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw error;
    }
  }
}
