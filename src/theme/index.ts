import { createTheme, ThemeOptions } from '@mui/material/styles';

// Define theme configurations
const lightTheme: ThemeOptions = {
  palette: {
    mode: 'light' as const,
    primary: {
      main: '#667eea',
      light: '#7986f0',
      dark: '#5a6fd8',
    },
    secondary: {
      main: '#764ba2',
      light: '#8e6bb8',
      dark: '#654192',
    },
    background: {
      default: '#ffffff',
      paper: 'rgba(255, 255, 255, 0.9)',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.6)',
    },
  },
};

const darkTheme: ThemeOptions = {
  palette: {
    mode: 'dark' as const,
    primary: {
      main: '#9fa8da',
      light: '#c1c9f5',
      dark: '#6d7bc1',
    },
    secondary: {
      main: '#ce93d8',
      light: '#ffc4ff',
      dark: '#9c64a6',
    },
    background: {
      default: '#121212',
      paper: 'rgba(30, 30, 30, 0.9)',
    },
    text: {
      primary: 'rgba(255, 255, 255, 0.95)',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
};

const commonComponents: ThemeOptions = {
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontWeight: 700,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none' as const,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
          transition: 'background-color 0.3s ease, color 0.3s ease',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(102, 126, 234, 0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'rgba(102, 126, 234, 0.3)',
            borderRadius: '4px',
            '&:hover': {
              background: 'rgba(102, 126, 234, 0.5)',
            },
          },
        },
        '*': {
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(102, 126, 234, 0.3) rgba(102, 126, 234, 0.1)',
          transition: 'all 0.3s ease',
        },
        '@keyframes fadeIn': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        '@keyframes slideInUp': {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        '@keyframes slideInDown': {
          '0%': { transform: 'translateY(-20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        '@keyframes slideInLeft': {
          '0%': { transform: 'translateX(-20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        '@keyframes slideInRight': {
          '0%': { transform: 'translateX(20px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        '@keyframes scaleIn': {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          animation: 'fadeIn 0.3s ease-out',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          animation: 'fadeIn 0.3s ease-out',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.3s ease',
          animation: 'scaleIn 0.3s ease-out',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-2px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5a6fd8 0%, #654192 100%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 600,
          transition: 'all 0.3s ease',
          animation: 'scaleIn 0.3s ease-out',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s ease',
          animation: 'fadeIn 0.3s ease-out',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.3s ease, border-color 0.3s ease',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.3s ease',
          '&:hover': {
            transition: 'background-color 0.3s ease',
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        root: {
          animation: 'fadeIn 0.3s ease-out',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          animation: 'slideInDown 0.3s ease-out',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          animation: 'slideInUp 0.3s ease-out',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          animation: 'slideInDown 0.5s ease-out',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: '0.75rem',
          fontWeight: 500,
          padding: '6px 12px',
          borderRadius: '6px',
          maxWidth: '300px',
          wordWrap: 'break-word',
          zIndex: 9999,
        },
        popper: {
          zIndex: 9999,
        },
      },
      defaultProps: {
        placement: 'bottom' as const,
        arrow: true,
        enterDelay: 300,
        leaveDelay: 200,
        disableInteractive: true,
      },
    },
  },
};

export const modernTheme = createTheme({
  ...lightTheme,
  ...commonComponents,
});

export const darkModernTheme = createTheme({
  ...darkTheme,
  ...commonComponents,
});