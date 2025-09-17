import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  DeviceHub as MachinesIcon,
  Inventory as ProductsIcon,
  Assessment as ReportsIcon,
  Warning as AlarmsIcon,
  Build as OperationsIcon,
  People as UsersIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

const drawerWidth = 320; // Daha geniş sidebar

interface SidebarProps {
  isMobile?: boolean;
  mobileOpen?: boolean;
  onDrawerToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isMobile = false, 
  mobileOpen = false, 
  onDrawerToggle 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();

  // Define all possible menu items with their permission requirements
  const allMenuItems = [
    { 
      text: t('nav.dashboard'), 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      permission: 'canViewDashboard'
    },
    { 
      text: t('nav.machines'), 
      icon: <MachinesIcon />, 
      path: '/machines',
      permission: 'canViewMachines'
    },
    { 
      text: t('nav.products'), 
      icon: <ProductsIcon />, 
      path: '/products',
      permission: 'canViewProducts'
    },
    { 
      text: t('nav.reports'), 
      icon: <ReportsIcon />, 
      path: '/reports',
      permission: 'canViewReports'
    },
    { 
      text: t('nav.alarms'), 
      icon: <AlarmsIcon />, 
      path: '/alarms',
      permission: 'canViewAlarms'
    },
    { 
      text: t('nav.operations'), 
      icon: <OperationsIcon />, 
      path: '/operations',
      permission: 'canViewOperations'
    },
    { 
      text: t('nav.users'), 
      icon: <UsersIcon />, 
      path: '/users',
      permission: 'canViewUsers'
    },
  ];

  // Filter menu items based on user permissions - admin sees everything
  const menuItems = allMenuItems.filter(item => {
    if (!user) {
      return false;
    }
    
    // Admin users can see everything
    if (user.role === 'admin') {
      return true;
    }
    
    // For non-admin users, check permissions
    if (!user.permissions) {
      return false;
    }
    
    const permissionKey = item.permission as keyof typeof user.permissions;
    return user.permissions[permissionKey] === true;
  });

  const drawerContent = (
    <>
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            fontWeight: 800,
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.8) 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5
          }}
        >
          Doğuş Otomat
        </Typography>
        <Typography 
          variant="subtitle2" 
          sx={{ 
            opacity: 0.8,
            fontWeight: 500,
            letterSpacing: 1
          }}
        >
          {t('app.telemetrySystem')}
        </Typography>
      </Box>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }} />
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              if (isMobile && onDrawerToggle) {
                onDrawerToggle();
              }
            }}
            sx={{
              mx: 1.5,
              mb: 1.5,
              borderRadius: 3,
              background: location.pathname === item.path 
                ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.1) 100%)'
                : 'transparent',
              backdropFilter: location.pathname === item.path ? 'blur(10px)' : 'none',
              border: location.pathname === item.path ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid transparent',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                transform: 'translateX(4px)',
              },
            }}
          >
            <ListItemIcon sx={{ color: 'white', minWidth: 45 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              primaryTypographyProps={{
                sx: {
                  fontSize: '0.95rem',
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  letterSpacing: 0.5
                }
              }}
            />
          </ListItem>
        ))}
      </List>
    </>
  );

  return (
    <>
      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backdropFilter: 'blur(20px)',
            border: 'none',
            boxShadow: '4px 0 20px rgba(102, 126, 234, 0.2)',
            color: 'white',
          },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', lg: 'none' },
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backdropFilter: 'blur(20px)',
            border: 'none',
            boxShadow: '4px 0 20px rgba(102, 126, 234, 0.2)',
            color: 'white',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;