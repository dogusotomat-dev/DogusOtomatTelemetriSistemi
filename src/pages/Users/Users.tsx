import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  Fade,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  ExpandMore as ExpandMoreIcon,
  Group as GroupIcon,
  Computer as ComputerIcon,
  Security as SecurityIcon,
  People as UsersIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { UserManagementService } from '../../services/userManagementService';
import { User, CreateUserRequest, UpdateUserRequest, UserRole, Machine, MachineGroup, UserPermissions } from '../../types';

const Users: React.FC = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  
  // State management - ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  const [users, setUsers] = useState<User[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machineGroups, setMachineGroups] = useState<MachineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSubAccount, setIsSubAccount] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateUserRequest & { permissions?: Partial<UserPermissions> }>({
    email: '',
    name: '',
    password: '',
    role: 'user',
    accountType: 'main',
    assignedMachineIds: [],
    assignedGroupIds: [],
    phone: '',
    department: '',
    notes: '',
    permissions: {},
  });
  
  const [passwordConfirm, setPasswordConfirm] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Load data on component mount
  useEffect(() => {
    loadUsers();
    loadMachines();
    loadMachineGroups();
  }, []); // Empty dependency array to run only once

  // Check if user has permission to view users page - AFTER ALL HOOKS
  
  // If user is not loaded yet, show loading
  if (!currentUser) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Kullanıcı bilgileri yükleniyor...</Typography>
        </Paper>
      </Container>
    );
  }
  
  // Allow admin users OR users with explicit canViewUsers permission
  const hasUsersPermission = currentUser.role === 'admin' || currentUser.permissions?.canViewUsers;
  
  if (!hasUsersPermission) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <SecurityIcon sx={{ fontSize: 80, color: 'rgba(102, 126, 234, 0.3)', mb: 2 }} />
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
            Erişim Reddedildi
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Bu sayfayı görüntüleme izniniz bulunmamaktadır.
            <br />
            Rol: {currentUser.role}
            <br />
            canViewUsers: {currentUser.permissions?.canViewUsers ? 'Evet' : 'Hayır'}
          </Typography>
        </Paper>
      </Container>
    );
  }

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Show loading notification for better UX
      showNotification('Kullanıcılar yükleniyor...', 'info');
      
      const usersData = await UserManagementService.getAllUsers();
      setUsers(usersData);
      
      showNotification(`${usersData.length} kullanıcı başarıyla yüklendi`, 'success');
    } catch (error) {
      console.error('Error loading users:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      showNotification(`Kullanıcılar yüklenirken hata oluştu: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMachines = async () => {
    try {
      // Import MachineService dynamically to avoid circular imports
      const { MachineService } = await import('../../services/machineService');
      const machinesData = await MachineService.getAllMachines();
      setMachines(machinesData);
    } catch (error) {
      console.error('Error loading machines:', error);
      setMachines([]);
    }
  };

  const loadMachineGroups = async () => {
    // TODO: Load machine groups from machine service
    setMachineGroups([]);
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCreateUser = async () => {
    try {
      // Check permission first
      const canCreateUsers = currentUser?.role === 'admin' || currentUser?.permissions?.canCreateUsers;
      if (!canCreateUsers) {
        showNotification('Kullanıcı oluşturma izniniz bulunmamaktadır', 'error');
        return;
      }

      // Validate form
      if (!formData.email || !formData.name || !formData.password) {
        showNotification('Lütfen gerekli alanları doldurun', 'error');
        return;
      }

      if (formData.password !== passwordConfirm) {
        showNotification(t('users.passwordMismatch'), 'error');
        return;
      }

      const userData: CreateUserRequest = {
        ...formData,
        parentAccountId: isSubAccount ? currentUser?.id : undefined,
      };

      console.log('🔥 COMPONENT - Creating user with data:', userData);
      const createdUser = await UserManagementService.createUser(userData);
      console.log('🔥 COMPONENT - User created successfully:', createdUser);
      showNotification(t('users.accountCreated'), 'success');
      
      // Reset form and close dialog
      resetForm();
      setCreateDialogOpen(false);
      
      // Reload users and refresh page to prevent auth state issues
      await loadUsers();
      console.log('🔥 COMPONENT - Reloading page to restore auth state');
      setTimeout(() => {
        window.location.reload();
      }, 500); // Faster reload
    } catch (error) {
      console.error('User creation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      showNotification(`Kullanıcı oluşturulurken hata oluştu: ${errorMessage}`, 'error');
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;

    try {
      console.log('🔥 FORM DATA DEBUG:');
      console.log('🔥 formData.name:', formData.name);
      console.log('🔥 editingUser.name:', editingUser.name);
      console.log('🔥 Full formData:', formData);
      
      const updates: UpdateUserRequest = {
        name: formData.name,
        role: formData.role,
        accountType: editingUser.accountType || 'main', // Preserve existing accountType
        assignedMachineIds: formData.assignedMachineIds,
        assignedGroupIds: formData.assignedGroupIds,
        phone: formData.phone,
        department: formData.department,
        notes: formData.notes,
        isActive: editingUser.isActive, // Preserve existing isActive status
      };

      console.log('🔥 UPDATE REQUEST DEBUG:');
      console.log('🔥 updates.name:', updates.name);
      console.log('🔥 Full updates object:', updates);
      console.log('Attempting to update user:', editingUser.id, 'with updates:', updates);
      await UserManagementService.updateUser(editingUser.id, updates);
      
      // Update local state instead of reloading all users
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...updates, updatedAt: new Date().toISOString() }
            : user
        )
      );
      
      showNotification(t('users.accountUpdated'), 'success');
      setEditDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('User update error in component:', error);
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      showNotification(`Kullanıcı güncellenirken hata oluştu: ${errorMessage}`, 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Find the user to check if they are admin
    const userToDelete = users.find(u => u.id === userId);
    
    if (userToDelete?.role === 'admin') {
      showNotification('Admin hesapları silinemez!', 'error');
      return;
    }
    
    if (userId === currentUser?.id) {
      showNotification('Kendi hesabınızı silemezsiniz!', 'error');
      return;
    }
    
    if (!window.confirm(t('users.confirmDelete'))) return;

    try {
      await UserManagementService.deleteUser(userId);
      showNotification(t('users.accountDeleted'), 'success');
      loadUsers();
    } catch (error) {
      showNotification('Kullanıcı silinirken hata oluştu', 'error');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
      accountType: user.accountType,
      assignedMachineIds: user.assignedMachineIds || [],
      assignedGroupIds: user.assignedGroupIds || [],
      phone: user.phone || '',
      department: user.department || '',
      notes: user.notes || '',
      permissions: user.permissions || {},
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      email: '',
      name: '',
      password: '',
      role: 'user',
      accountType: 'main',
      assignedMachineIds: [],
      assignedGroupIds: [],
      phone: '',
      department: '',
      notes: '',
      permissions: {},
    });
    setPasswordConfirm('');
    setIsSubAccount(false);
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'error';
      case 'user': return 'primary';
      case 'operator': return 'warning';
      case 'viewer': return 'info';
      default: return 'default';
    }
  };

  const getAccountTypeIcon = (accountType: 'main' | 'sub') => {
    return accountType === 'main' ? <SecurityIcon /> : <PersonAddIcon />;
  };

  // Filter users based on current user's permissions
  console.log('🎯 FILTERING DEBUG START');
  console.log('🎯 Current user for filtering:', currentUser);
  console.log('🎯 Current user role:', currentUser?.role);
  console.log('🎯 Current user permissions:', currentUser?.permissions);
  console.log('🎯 Current user canViewUsers:', currentUser?.permissions?.canViewUsers);
  console.log('🎯 All users before filtering:', users);
  console.log('🎯 Users array length:', users.length);
  console.log('🎯 Users array type:', Array.isArray(users));
  console.log('🎯 Users array content:', users.map(u => ({ email: u.email, id: u.id, role: u.role })));
  
  const filteredUsers = users.filter(user => {
    // TEMPORARY FIX: Show all users to everyone (for debugging)
    console.log('TEMP: Showing all users to everyone for debugging');
    return true;
    
    // Admin can see everyone
    if (currentUser?.role === 'admin') {
      console.log('Admin user - showing all users');
      return true;
    }
    
    // Users with canViewUsers permission can see all users
    if (currentUser?.permissions?.canViewUsers) {
      console.log('User has canViewUsers permission - showing all users');
      return true;
    }
    
    // Main accounts can see their sub-accounts and themselves
    if (currentUser?.accountType === 'main') {
      const canSee = user.parentAccountId === currentUser.id || user.id === currentUser.id;
      console.log('Main account user - can see user:', user.email, '?', canSee);
      return canSee;
    }
    
    // Others can only see themselves
    const canSeeUser = user.id === currentUser?.id;
    console.log('User can only see themselves. Showing user:', user.email, '?', canSeeUser);
    return canSeeUser;
  });
  
  console.log('🎯 FILTERING RESULT:', filteredUsers);
  console.log('🎯 Filtered users length:', filteredUsers.length);
  console.log('🎯 Filtered users emails:', filteredUsers.map(u => u.email));
  console.log('🎯 FILTERING DEBUG END');

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);
  
  console.log('📄 PAGINATION DEBUG:');
  console.log('📄 startIndex:', startIndex, 'endIndex:', endIndex);
  console.log('📄 currentUsers length:', currentUsers.length);
  console.log('📄 currentUsers emails:', currentUsers.map(u => u.email));

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // If no users to show, display the placeholder
  if (users.length === 0 && !loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Fade in timeout={600}>
          <Box>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  fontWeight: 800,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {t('users.title')}
              </Typography>
              {(currentUser?.role === 'admin' || currentUser?.permissions?.canCreateUsers) && (
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => {
                    setIsSubAccount(false);
                    setCreateDialogOpen(true);
                  }}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5a6fd8 0%, #654192 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                    }
                  }}
                >
                  {t('users.addUser')}
                </Button>
              )}
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 8,
                background: '#ffffff',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                borderRadius: 3,
                textAlign: 'center'
              }}
            >
              <UsersIcon sx={{ fontSize: 80, color: 'rgba(102, 126, 234, 0.3)', mb: 2 }} />
              <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#667eea' }}>
                {t('users.title')}
              </Typography>
              <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                {t('users.description')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => {
                  setIsSubAccount(false);
                  setCreateDialogOpen(true);
                }}
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                İlk Kullanıcıyı Oluştur
              </Button>
            </Paper>
          </Box>
        </Fade>

        {/* Create/Edit User Dialog */}
        <Dialog 
          open={createDialogOpen || editDialogOpen} 
          onClose={() => {
            setCreateDialogOpen(false);
            setEditDialogOpen(false);
            setEditingUser(null);
            resetForm();
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            {editingUser ? t('users.editUser') : (isSubAccount ? t('users.addSubAccount') : t('users.addUser'))}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* Basic Information */}
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Temel Bilgiler</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label={t('users.name')}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                    <TextField
                      fullWidth
                      label={t('users.email')}
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      disabled={!!editingUser}
                    />
                    {!editingUser && (
                      <>
                        <TextField
                          fullWidth
                          label={t('users.password')}
                          type="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                        />
                        <TextField
                          fullWidth
                          label={t('users.confirmPassword')}
                          type="password"
                          value={passwordConfirm}
                          onChange={(e) => setPasswordConfirm(e.target.value)}
                          required
                        />
                      </>
                    )}
                    <FormControl fullWidth>
                      <InputLabel>{t('users.role')}</InputLabel>
                      <Select
                        value={formData.role}
                        label={t('users.role')}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        disabled={editingUser?.id === currentUser?.id && editingUser?.role === 'admin'}
                      >
                        <MenuItem value="user">{t('roles.user')}</MenuItem>
                        <MenuItem value="operator">{t('roles.operator')}</MenuItem>
                        <MenuItem value="viewer">{t('roles.viewer')}</MenuItem>
                        {currentUser?.role === 'admin' && (
                          <MenuItem value="admin">{t('roles.admin')}</MenuItem>
                        )}
                      </Select>
                      {editingUser?.id === currentUser?.id && editingUser?.role === 'admin' && (
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                          Admin rolünü değiştiremezsiniz
                        </Typography>
                      )}
                    </FormControl>
                  </Box>
                </AccordionDetails>
              </Accordion>

              {/* Additional Information */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">Ek Bilgiler</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                      fullWidth
                      label="Telefon"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Departman"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                    <TextField
                      fullWidth
                      label="Notlar"
                      multiline
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </Box>
                </AccordionDetails>
              </Accordion>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setCreateDialogOpen(false);
                setEditDialogOpen(false);
                setEditingUser(null);
                resetForm();
              }}
            >
              İptal
            </Button>
            <Button
              variant="contained"
              onClick={editingUser ? handleEditUser : handleCreateUser}
            >
              {editingUser ? 'Güncelle' : t('users.createAccount')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Notification Snackbar */}
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={() => setNotification({ ...notification, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setNotification({ ...notification, open: false })}
            severity={notification.severity}
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box className="page-fade-up">
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {t('users.title')}
            </Typography>
            <Box>
              {currentUser?.permissions?.canCreateUsers && (
                <>
                  <Button
                    startIcon={<AddIcon />}
                    variant="contained"
                    onClick={() => {
                      setIsSubAccount(false);
                      setCreateDialogOpen(true);
                    }}
                    sx={{ 
                      mr: 2,
                      borderRadius: 3,
                      fontWeight: 600,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    {t('users.addUser')}
                  </Button>
                  {(currentUser?.role === 'admin' || currentUser?.accountType === 'main') && (
                    <Button
                      startIcon={<PersonAddIcon />}
                      variant="outlined"
                      onClick={() => {
                        setIsSubAccount(true);
                        setFormData({ ...formData, accountType: 'sub' });
                        setCreateDialogOpen(true);
                      }}
                      sx={{ borderRadius: 3, fontWeight: 600 }}
                    >
                      {t('users.addSubAccount')}
                    </Button>
                  )}
                </>
              )}
            </Box>
          </Box>

          {/* Users Table */}
          <Paper 
            sx={{ 
              mb: 3,
              borderRadius: 3,
              border: '1px solid rgba(102, 126, 234, 0.1)',
              boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
            }}
          >
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>{t('users.name')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('users.email')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('users.role')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('users.accountType')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('users.status')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('users.assignedMachines')}</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{t('users.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentUsers.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          {getAccountTypeIcon(user.accountType)}
                          <Box ml={1}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {user.name}
                            </Typography>
                            {user.department && (
                              <Typography variant="caption" color="textSecondary">
                                {user.department}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={t(`roles.${user.role}`)}
                          color={getRoleColor(user.role)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={t(`accountTypes.${user.accountType || 'main'}`)}
                          variant="outlined"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActive ? t('users.active') : t('users.inactive')}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Tooltip title="Atanan Makineler" placement="top">
                            <Chip
                              icon={<ComputerIcon />}
                              label={user.assignedMachineIds?.length || 0}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                          <Tooltip title="Atanan Gruplar" placement="top">
                            <Chip
                              icon={<GroupIcon />}
                              label={user.assignedGroupIds?.length || 0}
                              size="small"
                              variant="outlined"
                            />
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {currentUser?.role !== 'viewer' && (
                          <>
                            {/* Edit button - Admin can edit themselves, others can edit if not themselves */}
                            {(currentUser?.role === 'admin' || user.id !== currentUser?.id) && (
                              <Tooltip title={t('users.editUser')} placement="bottom">
                                <IconButton onClick={() => openEditDialog(user)}>
                                  <EditIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            
                            {/* Delete button - No admin can be deleted, others can delete if not themselves */}
                            {user.role !== 'admin' && user.id !== currentUser?.id && (
                              <Tooltip title={t('users.deleteUser')} placement="bottom">
                                <IconButton 
                                  color="error"
                                  onClick={() => handleDeleteUser(user.id)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Pagination Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, flexWrap: 'wrap', gap: 2 }}>
            {/* Items per page selector */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="textSecondary">
                Sayfa başına:
              </Typography>
              <FormControl size="small" sx={{ minWidth: 80 }}>
                <Select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  variant="outlined"
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="textSecondary">
                kullanıcı
              </Typography>
            </Box>

            {/* Page info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                {filteredUsers.length > 0 ? (
                  <>
                    {startIndex + 1}-{Math.min(endIndex, filteredUsers.length)} / {filteredUsers.length} kullanıcı
                  </>
                ) : (
                  'Kullanıcı bulunamadı'
                )}
              </Typography>
              
              {/* Page navigation */}
              {totalPages > 1 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(1)}
                  >
                    İlk
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  >
                    Önceki
                  </Button>
                  
                  {/* Page numbers */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {(() => {
                      const pages = [];
                      const startPage = Math.max(1, currentPage - 2);
                      const endPage = Math.min(totalPages, currentPage + 2);
                      
                      if (startPage > 1) {
                        pages.push(
                          <Button
                            key={1}
                            size="small"
                            variant={1 === currentPage ? "contained" : "text"}
                            onClick={() => handlePageChange(1)}
                            sx={{ minWidth: 32, height: 32 }}
                          >
                            1
                          </Button>
                        );
                        if (startPage > 2) {
                          pages.push(<Typography key="start-ellipsis" sx={{ px: 1 }}>...</Typography>);
                        }
                      }
                      
                      for (let i = startPage; i <= endPage; i++) {
                        pages.push(
                          <Button
                            key={i}
                            size="small"
                            variant={i === currentPage ? "contained" : "text"}
                            onClick={() => handlePageChange(i)}
                            sx={{ minWidth: 32, height: 32 }}
                          >
                            {i}
                          </Button>
                        );
                      }
                      
                      if (endPage < totalPages) {
                        if (endPage < totalPages - 1) {
                          pages.push(<Typography key="end-ellipsis" sx={{ px: 1 }}>...</Typography>);
                        }
                        pages.push(
                          <Button
                            key={totalPages}
                            size="small"
                            variant={totalPages === currentPage ? "contained" : "text"}
                            onClick={() => handlePageChange(totalPages)}
                            sx={{ minWidth: 32, height: 32 }}
                          >
                            {totalPages}
                          </Button>
                        );
                      }
                      
                      return pages;
                    })()}
                  </Box>
                  
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  >
                    Sonraki
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(totalPages)}
                  >
                    Son
                  </Button>
                </Box>
              )}
            </Box>
          </Box>

          {/* Create/Edit User Dialog */}
          <Dialog 
            open={createDialogOpen || editDialogOpen} 
            onClose={() => {
              setCreateDialogOpen(false);
              setEditDialogOpen(false);
              setEditingUser(null);
              resetForm();
            }}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              {editingUser ? t('users.editUser') : (isSubAccount ? t('users.addSubAccount') : t('users.addUser'))}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 2 }}>
                {/* Basic Information */}
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Temel Bilgiler</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        label={t('users.name')}
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                      <TextField
                        fullWidth
                        label={t('users.email')}
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        disabled={!!editingUser}
                      />
                      {!editingUser && (
                        <>
                          <TextField
                            fullWidth
                            label={t('users.password')}
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                          />
                          <TextField
                            fullWidth
                            label={t('users.confirmPassword')}
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            required
                          />
                        </>
                      )}
                      <FormControl fullWidth>
                        <InputLabel>{t('users.role')}</InputLabel>
                        <Select
                          value={formData.role}
                          label={t('users.role')}
                          onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                        >
                          <MenuItem value="user">{t('roles.user')}</MenuItem>
                          <MenuItem value="operator">{t('roles.operator')}</MenuItem>
                          <MenuItem value="viewer">{t('roles.viewer')}</MenuItem>
                          {currentUser?.role === 'admin' && (
                            <MenuItem value="admin">{t('roles.admin')}</MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Permissions */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      <SecurityIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Sekme İzinleri
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        Bu kullanıcının hangi sekmeleri görebileceğini seçin:
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                        <FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.permissions?.canViewDashboard || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  permissions: {
                                    ...formData.permissions,
                                    canViewDashboard: e.target.checked
                                  }
                                })}
                              />
                            }
                            label="Ana Panel"
                          />
                        </FormControl>
                        <FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.permissions?.canViewMachines || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  permissions: {
                                    ...formData.permissions,
                                    canViewMachines: e.target.checked
                                  }
                                })}
                              />
                            }
                            label="Makineler"
                          />
                        </FormControl>
                        <FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.permissions?.canViewProducts || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  permissions: {
                                    ...formData.permissions,
                                    canViewProducts: e.target.checked
                                  }
                                })}
                              />
                            }
                            label="Ürünler"
                          />
                        </FormControl>
                        <FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.permissions?.canViewReports || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  permissions: {
                                    ...formData.permissions,
                                    canViewReports: e.target.checked
                                  }
                                })}
                              />
                            }
                            label="Raporlar"
                          />
                        </FormControl>
                        <FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.permissions?.canViewAlarms || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  permissions: {
                                    ...formData.permissions,
                                    canViewAlarms: e.target.checked
                                  }
                                })}
                              />
                            }
                            label="Alarmlar"
                          />
                        </FormControl>
                        <FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.permissions?.canViewOperations || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  permissions: {
                                    ...formData.permissions,
                                    canViewOperations: e.target.checked
                                  }
                                })}
                              />
                            }
                            label="Operasyonlar"
                          />
                        </FormControl>
                        <FormControl>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={formData.permissions?.canViewUsers || false}
                                onChange={(e) => setFormData({
                                  ...formData,
                                  permissions: {
                                    ...formData.permissions,
                                    canViewUsers: e.target.checked
                                  }
                                })}
                              />
                            }
                            label="Kullanıcılar"
                          />
                        </FormControl>
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Additional Information */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">Ek Bilgiler</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        fullWidth
                        label="Telefon"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Departman"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      />
                      <TextField
                        fullWidth
                        label="Notlar"
                        multiline
                        rows={3}
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>

                {/* Machine Assignment */}
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      <ComputerIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Makine Atamaları
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {currentUser?.role === 'admin' ? 
                          'Admin kullanıcıları tüm makinelere erişebilir. Diğer roller için makine ataması yapabilirsiniz.' :
                          'Bu kullanıcının erişebileceği makineleri seçin.'
                        }
                      </Typography>
                      
                      <Autocomplete
                        multiple
                        options={machines}
                        getOptionLabel={(option) => `${option.name} (${option.serialNumber})`}
                        value={machines.filter(machine => formData.assignedMachineIds?.includes(machine.id))}
                        onChange={(_, newValue) => {
                          setFormData({
                            ...formData,
                            assignedMachineIds: newValue.map(machine => machine.id)
                          });
                        }}
                        disabled={editingUser?.role === 'admin'}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Atanmış Makineler"
                            placeholder={editingUser?.role === 'admin' ? 'Admin tüm makinelere erişebilir' : 'Makine seçin...'}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              variant="outlined"
                              label={`${option.name} (${option.serialNumber})`}
                              {...getTagProps({ index })}
                              key={option.id}
                            />
                          ))
                        }
                      />

                      <Autocomplete
                        multiple
                        options={machineGroups}
                        getOptionLabel={(option) => option.name}
                        value={machineGroups.filter(group => formData.assignedGroupIds?.includes(group.id))}
                        onChange={(_, newValue) => {
                          setFormData({
                            ...formData,
                            assignedGroupIds: newValue.map(group => group.id)
                          });
                        }}
                        disabled={editingUser?.role === 'admin'}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Atanmış Makine Grupları"
                            placeholder={editingUser?.role === 'admin' ? 'Admin tüm gruplara erişebilir' : 'Grup seçin...'}
                          />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              variant="outlined"
                              label={option.name}
                              {...getTagProps({ index })}
                              key={option.id}
                            />
                          ))
                        }
                      />
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                  setEditingUser(null);
                  resetForm();
                }}
              >
                İptal
              </Button>
              <Button
                variant="contained"
                onClick={editingUser ? handleEditUser : handleCreateUser}
              >
                {editingUser ? 'Güncelle' : t('users.createAccount')}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Notification Snackbar */}
          <Snackbar
            open={notification.open}
            autoHideDuration={6000}
            onClose={() => setNotification({ ...notification, open: false })}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <Alert
              onClose={() => setNotification({ ...notification, open: false })}
              severity={notification.severity}
              sx={{ width: '100%' }}
            >
              {notification.message}
            </Alert>
          </Snackbar>
        </Box>
      </Fade>
    </Container>
  );
};

export default Users;