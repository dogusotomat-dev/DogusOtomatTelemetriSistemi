import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Fade, Slide } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { useAuth } from './hooks/useAuth';
import { useDarkMode } from './hooks/useDarkMode';
import Layout from './components/Layout/Layout';
import Login from './pages/Auth/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Machines from './pages/Machines/Machines';
import Reports from './pages/Reports/Reports';
import Alarms from './pages/Alarms/Alarms';
import Operations from './pages/Operations/Operations';
import Users from './pages/Users/Users';
import CommodityLists from './pages/CommodityLists/CommodityLists';
import EmulatorAPI from './pages/EmulatorAPI/EmulatorAPI';
import LoadingSpinner from './components/UI/LoadingSpinner';
import RealTimeTelemetryService from './services/realTimeTelemetryService';
import RealIoTMonitoringService from './services/realIoTMonitoringService';
import RealIoTDeviceSimulator from './services/realIoTDeviceSimulator';
import './styles/darkMode.css';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Component (for login)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Page transition wrapper component
const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <Fade in timeout={300} key={location.pathname}>
      <Box 
        sx={{ 
          minHeight: '100%',
          animation: 'simpleSlideIn 0.3s ease-out forwards',
          '@keyframes simpleSlideIn': {
            '0%': {
              opacity: 0,
              transform: 'translateY(20px)',
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)',
            },
          },
        }}
      >
        {children}
      </Box>
    </Fade>
  );
};

const App: React.FC = () => {
      // Global telemetry and IoT monitoring services
      useEffect(() => {
        // Start real-time telemetry service (development only) - DISABLED FOR PRODUCTION
        // RealTimeTelemetryService.startTelemetryCollection();
        
        // Start real IoT monitoring service (production ready)
        RealIoTMonitoringService.startMonitoring();
        
        // IoT device simulator disabled - using real IoT devices only
        // RealIoTDeviceSimulator.startSimulation();
        
        // Cleanup on unmount
        return () => {
          RealTimeTelemetryService.stopTelemetryCollection();
          RealIoTMonitoringService.stopMonitoring();
          RealIoTDeviceSimulator.stopSimulation();
        };
      }, []);

  // Dark mode hook
  const { darkMode, toggleDarkMode } = useDarkMode();

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    return () => {
      document.body.classList.remove('dark-mode');
    };
  }, [darkMode]);

  return (
    <AuthProvider>
      <LanguageProvider>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100vh',
            backgroundColor: darkMode ? '#121212' : '#ffffff',
            transition: 'background-color 0.3s ease'
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              
              {/* Emulator API Route (Public) */}
              <Route path="/emulator-api" element={<EmulatorAPI />} />
              
              {/* Protected Routes */}
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Layout toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<PageTransition><Dashboard /></PageTransition>} />
                <Route path="machines" element={<PageTransition><Machines /></PageTransition>} />
                <Route path="products" element={<PageTransition><CommodityLists /></PageTransition>} />
                <Route path="reports" element={<PageTransition><Reports /></PageTransition>} />
                <Route path="alarms" element={<PageTransition><Alarms /></PageTransition>} />
                <Route path="operations" element={<PageTransition><Operations /></PageTransition>} />
                <Route path="users" element={<PageTransition><Users /></PageTransition>} />
              </Route>
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Box>
        </Box>
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;