import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useTheme, useMediaQuery, IconButton, Slide, Fade } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  toggleDarkMode?: () => void;
  darkMode?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ toggleDarkMode, darkMode }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width: 960px)'); // Tablet ve mobil için
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Box>
        <Sidebar 
          isMobile={isMobile}
          mobileOpen={mobileOpen}
          onDrawerToggle={handleDrawerToggle}
        />
      </Box>
      <Box sx={{ 
        flexGrow: 1, 
        display: 'flex', 
        flexDirection: 'column',
        width: { lg: `calc(100% - 320px)` }
      }}>
        <Box>
          <Header 
            onMenuClick={handleDrawerToggle} 
            toggleDarkMode={toggleDarkMode}
            darkMode={darkMode}
          />
        </Box>
        <Box 
          component="main" 
          sx={{ 
            flexGrow: 1, 
            backgroundColor: darkMode ? '#121212' : '#ffffff',
            minHeight: 'calc(100vh - 64px)',
            p: { xs: 1, sm: 2, md: 3 },
            transition: 'background-color 0.3s ease'
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;