import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import {
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Language as LanguageIcon,
  CurrencyExchange as CurrencyIcon,
  Menu as MenuIcon,
  Brightness4,
  Brightness7,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';

interface HeaderProps {
  onMenuClick?: () => void;
  toggleDarkMode?: () => void;
  darkMode?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, toggleDarkMode, darkMode }) => {
  const { user, logout } = useAuth();
  const { language, currency, setLanguage, setCurrency, t } = useLanguage();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = React.useState<null | HTMLElement>(null);
  const [currAnchorEl, setCurrAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageMenu = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLanguageClose = () => {
    setLangAnchorEl(null);
  };

  const handleCurrencyMenu = (event: React.MouseEvent<HTMLElement>) => {
    setCurrAnchorEl(event.currentTarget);
  };

  const handleCurrencyClose = () => {
    setCurrAnchorEl(null);
  };

  const handleLanguageChange = (lang: 'tr' | 'en') => {
    setLanguage(lang);
    handleLanguageClose();
  };

  const handleCurrencyChange = (curr: 'TRY' | 'USD' | 'EUR') => {
    setCurrency(curr);
    handleCurrencyClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        background: darkMode 
          ? 'linear-gradient(135deg, rgba(30, 30, 30, 0.95) 0%, rgba(20, 20, 20, 0.9) 100%)' 
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
        backdropFilter: 'blur(20px)',
        borderBottom: darkMode 
          ? '1px solid rgba(102, 126, 234, 0.3)' 
          : '1px solid rgba(102, 126, 234, 0.2)',
        boxShadow: darkMode 
          ? '0 4px 20px rgba(0, 0, 0, 0.3)' 
          : '0 4px 20px rgba(102, 126, 234, 0.1)',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between', py: 1, px: { xs: 1, sm: 3 } }}>
        {/* Mobile Menu Button */}
        <Box sx={{ display: { xs: 'flex', lg: 'none' }, alignItems: 'center', gap: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={onMenuClick}
            edge="start"
            sx={{
              color: '#667eea',
              '&:hover': {
                backgroundColor: darkMode 
                  ? 'rgba(102, 126, 234, 0.2)' 
                  : 'rgba(102, 126, 234, 0.1)',
              }
            }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
        
        <Typography 
          variant="h5"
          component="div" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: 0.5,
            fontSize: { xs: '1.1rem', sm: '1.5rem' },
            flex: { xs: 1, lg: 'unset' },
            textAlign: { xs: 'center', lg: 'left' }
          }}
        >
          {t('app.telemetryDashboard')}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
          {/* Welcome Box - Hidden on mobile */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)' 
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              borderRadius: 3,
              px: 2,
              py: 1,
              border: darkMode 
                ? '1px solid rgba(102, 126, 234, 0.3)' 
                : '1px solid rgba(102, 126, 234, 0.2)',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#667eea',
                fontWeight: 600,
                mr: 1
              }}
            >
              {t('common.welcome')},
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#764ba2',
                fontWeight: 700
              }}
            >
              {user?.name}
            </Typography>
          </Box>
          
          {/* Language Selector */}
          <IconButton
            onClick={handleLanguageMenu}
            sx={{
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)' 
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: darkMode 
                ? '1px solid rgba(102, 126, 234, 0.3)' 
                : '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: 2,
              px: { xs: 1, sm: 1.5 },
              minWidth: { xs: 'auto', sm: 'auto' },
              transition: 'all 0.3s ease',
              '&:hover': {
                background: darkMode 
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)' 
                  : 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                transform: 'scale(1.05)',
              },
            }}
          >
            <LanguageIcon sx={{ color: '#667eea', mr: { xs: 0, sm: 0.5 } }} />
            <Typography variant="body2" sx={{ 
              color: '#667eea', 
              fontWeight: 600,
              display: { xs: 'none', sm: 'block' }
            }}>
              {language.toUpperCase()}
            </Typography>
          </IconButton>

          {/* Currency Selector */}
          <IconButton
            onClick={handleCurrencyMenu}
            sx={{
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)' 
                : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: darkMode 
                ? '1px solid rgba(102, 126, 234, 0.3)' 
                : '1px solid rgba(102, 126, 234, 0.3)',
              borderRadius: 2,
              px: { xs: 1, sm: 1.5 },
              minWidth: { xs: 'auto', sm: 'auto' },
              transition: 'all 0.3s ease',
              '&:hover': {
                background: darkMode 
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)' 
                  : 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                transform: 'scale(1.05)',
              },
            }}
          >
            <CurrencyIcon sx={{ color: '#667eea', mr: { xs: 0, sm: 0.5 } }} />
            <Typography variant="body2" sx={{ 
              color: '#667eea', 
              fontWeight: 600,
              display: { xs: 'none', sm: 'block' }
            }}>
              {currency}
            </Typography>
          </IconButton>
          
          {/* Dark Mode Toggle */}
          {toggleDarkMode && (
            <IconButton
              onClick={toggleDarkMode}
              sx={{
                background: darkMode 
                  ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)' 
                  : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: darkMode 
                  ? '1px solid rgba(102, 126, 234, 0.3)' 
                  : '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: 2,
                px: { xs: 1, sm: 1.5 },
                minWidth: { xs: 'auto', sm: 'auto' },
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: darkMode 
                    ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)' 
                    : 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
                  transform: 'scale(1.05)',
                },
              }}
            >
              {darkMode ? (
                <Brightness7 sx={{ color: '#667eea' }} />
              ) : (
                <Brightness4 sx={{ color: '#667eea' }} />
              )}
            </IconButton>
          )}
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #654192 100%)',
                transform: 'scale(1.05)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
              },
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'transparent' }}>
              <AccountIcon sx={{ color: 'white' }} />
            </Avatar>
          </IconButton>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
                minWidth: 180,
              },
            }}
          >
            <MenuItem 
              onClick={handleClose}
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 1,
                mx: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <SettingsIcon sx={{ mr: 2, color: '#667eea' }} />
              <Typography sx={{ color: '#333', fontWeight: 500 }}>
                {t('common.settings')}
              </Typography>
            </MenuItem>
            <Divider sx={{ mx: 1, borderColor: 'rgba(102, 126, 234, 0.2)' }} />
            <MenuItem 
              onClick={handleLogout}
              sx={{
                py: 1.5,
                px: 2,
                borderRadius: 1,
                mx: 1,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(211, 47, 47, 0.1) 0%, rgba(244, 67, 54, 0.1) 100%)',
                  transform: 'translateX(4px)',
                },
              }}
            >
              <LogoutIcon sx={{ mr: 2, color: '#d32f2f' }} />
              <Typography sx={{ color: '#333', fontWeight: 500 }}>
                {t('common.logout')}
              </Typography>
            </MenuItem>
          </Menu>

          {/* Language Menu */}
          <Menu
            anchorEl={langAnchorEl}
            open={Boolean(langAnchorEl)}
            onClose={handleLanguageClose}
            PaperProps={{
              sx: {
                mt: 1,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
                minWidth: 120,
              },
            }}
          >
            <MenuItem 
              onClick={() => handleLanguageChange('tr')}
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1,
                mx: 1,
                backgroundColor: language === 'tr' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                },
              }}
            >
              <Typography sx={{ color: '#333', fontWeight: language === 'tr' ? 600 : 400 }}>
                Türkçe
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleLanguageChange('en')}
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1,
                mx: 1,
                backgroundColor: language === 'en' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                },
              }}
            >
              <Typography sx={{ color: '#333', fontWeight: language === 'en' ? 600 : 400 }}>
                English
              </Typography>
            </MenuItem>
          </Menu>

          {/* Currency Menu */}
          <Menu
            anchorEl={currAnchorEl}
            open={Boolean(currAnchorEl)}
            onClose={handleCurrencyClose}
            PaperProps={{
              sx: {
                mt: 1,
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.9) 100%)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(102, 126, 234, 0.2)',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)',
                minWidth: 120,
              },
            }}
          >
            <MenuItem 
              onClick={() => handleCurrencyChange('TRY')}
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1,
                mx: 1,
                backgroundColor: currency === 'TRY' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                },
              }}
            >
              <Typography sx={{ color: '#333', fontWeight: currency === 'TRY' ? 600 : 400 }}>
                ₺ TRY
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleCurrencyChange('USD')}
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1,
                mx: 1,
                backgroundColor: currency === 'USD' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                },
              }}
            >
              <Typography sx={{ color: '#333', fontWeight: currency === 'USD' ? 600 : 400 }}>
                $ USD
              </Typography>
            </MenuItem>
            <MenuItem 
              onClick={() => handleCurrencyChange('EUR')}
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1,
                mx: 1,
                backgroundColor: currency === 'EUR' ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                '&:hover': {
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                },
              }}
            >
              <Typography sx={{ color: '#333', fontWeight: currency === 'EUR' ? 600 : 400 }}>
                € EUR
              </Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;