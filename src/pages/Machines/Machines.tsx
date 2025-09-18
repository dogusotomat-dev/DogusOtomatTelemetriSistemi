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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Container,
  Fade,
  Slide,
  Switch,
  FormControlLabel,
  Divider,
  InputAdornment
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Circle as CircleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  NotificationsActive as NotificationsIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  WifiOff as OfflineIcon,
  BugReport as ErrorIcon,
  MarkEmailRead as TestEmailIcon,
  SettingsRemote as RemoteControlIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { Machine, TelemetryData } from '../../types';
import { MachineService } from '../../services/machineService';
import MachineHeartbeatSimulator from '../../services/machineHeartbeatSimulator';
import { IntegratedEmailService } from '../../services/productionEmailService';
import { useLanguage } from '../../contexts/LanguageContext';
import { ref, get, query, orderByChild, limitToLast, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import MachineControl, { IoTMachineControl } from '../../components/MachineControl';
import { DGS_MACHINE_MODELS } from '../../types';

const Machines: React.FC = () => {
  const { t } = useLanguage();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [telemetryData, setTelemetryData] = useState<Record<string, TelemetryData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [machineStatuses, setMachineStatuses] = useState<{ [key: string]: { status: string; lastSeen: number } }>({});
  const [remoteControlMachine, setRemoteControlMachine] = useState<Machine | null>(null);
  const [iotControlOpen, setIotControlOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Filter state
  const [filters, setFilters] = useState({
    searchTerm: '',
    machineType: 'all',
    status: 'all',
    model: 'all'
  });

  // Form state
  const [formData, setFormData] = useState({
    serialNumber: '',
    type: 'snack' as 'snack' | 'ice_cream' | 'coffee' | 'perfume',
    model: '',
    name: '',
    iotNumber: '',
    location: {
      address: '',
      latitude: 0,
      longitude: 0
    },
    connectionInfo: {
      version: '1.0.0',
      status: 'offline' as 'online' | 'offline',
      lastHeartbeat: new Date().toISOString()
    },
    configuration: {
      slots: {} as Record<string, any>,
      settings: {
        modes: ['normal'],
        currentMode: 'normal',
        temperature: 20 as number,
        features: {} as Record<string, any>,
        capabilities: {
          hasTemperatureControl: false,
          hasAutoCleaning: false,
          supportedPayments: ['cash']
        }
      },
      notifications: {
        emailAddresses: [] as string[],
        enableOfflineAlerts: true,
        enableErrorAlerts: true,
        alertThresholdMinutes: 2
      }
    },
    groupId: ''
  });

  // Load telemetry data for machines
  const loadTelemetryData = async () => {
    try {
      const telemetryPromises = machines.map(async (machine) => {
        const telemetryRef = query(
          ref(database, `machines/${machine.id}/telemetry`),
          orderByChild('timestamp'),
          limitToLast(1)
        );
        const snapshot = await get(telemetryRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const latestTelemetry = Object.values(data)[0] as TelemetryData;
          return { machineId: machine.id, telemetry: latestTelemetry };
        }
        return { machineId: machine.id, telemetry: null };
      });

      const telemetryResults = await Promise.all(telemetryPromises);
      const telemetryMap: Record<string, TelemetryData> = {};
      
      telemetryResults.forEach(({ machineId, telemetry }) => {
        if (telemetry) {
          telemetryMap[machineId] = telemetry;
        }
      });
      
      setTelemetryData(telemetryMap);
    } catch (error) {
      console.error('Error loading telemetry data:', error);
    }
  };

  // Component mount - load machines
  useEffect(() => {
    loadMachines();
    
    // Real-time status monitoring
    const unsubscribe = MachineService.subscribeToMachineStatus(setMachineStatuses);
    
    return () => {
      unsubscribe();
    };
  }, []);

  // Load telemetry data when machines change
  useEffect(() => {
    if (machines.length > 0) {
      loadTelemetryData();
      
      // Real-time telemetry listener
      const telemetryUnsubscribers: (() => void)[] = [];
      
      machines.forEach(machine => {
        const telemetryRef = ref(database, `machines/${machine.id}/telemetry`);
        const unsubscribe = onValue(telemetryRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            const latestTelemetry = Object.values(data)[0] as TelemetryData;
            setTelemetryData(prev => ({
              ...prev,
              [machine.id]: latestTelemetry
            }));
          }
        });
        telemetryUnsubscribers.push(unsubscribe);
      });
      
      return () => {
        telemetryUnsubscribers.forEach(unsubscribe => unsubscribe());
      };
    }
  }, [machines]);

  const loadMachines = async () => {
    try {
      setLoading(true);
      setError(null);
      const machineList = await MachineService.getAllMachines();
      setMachines(machineList);
    } catch (err: any) {
      setError(err.message || 'Failed to load machines');
      console.error('Error loading machines:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMachine = () => {
    setEditingMachine(null);
    setFormData({
      serialNumber: '',
      type: 'snack',
      model: '',
      name: '',
      iotNumber: '',
      location: {
        address: '',
        latitude: 0,
        longitude: 0
      },
      connectionInfo: {
        version: '1.0.0',
        status: 'offline',
        lastHeartbeat: new Date().toISOString()
      },
      configuration: {
        slots: {},
        settings: {
          modes: ['normal'],
          currentMode: 'normal',
          temperature: 20,
          features: {},
          capabilities: {
            hasTemperatureControl: false,
            hasAutoCleaning: false,
            supportedPayments: ['cash']
          }
        },
        notifications: {
          emailAddresses: [],
          enableOfflineAlerts: true,
          enableErrorAlerts: true,
          alertThresholdMinutes: 2
        }
      },
      groupId: ''
    });
    setOpenDialog(true);
  };

  const handleEditMachine = (machine: Machine) => {
    setEditingMachine(machine);
    setFormData({
      serialNumber: machine.serialNumber,
      type: machine.type,
      model: machine.model || '',
      name: machine.name,
      iotNumber: machine.iotNumber,
      location: {
        address: machine.location.address,
        latitude: machine.location.latitude || 0,
        longitude: machine.location.longitude || 0
      },
      connectionInfo: {
        version: machine.connectionInfo.version,
        status: machine.connectionInfo.status,
        lastHeartbeat: machine.connectionInfo.lastHeartbeat
      },
      configuration: {
        slots: machine.configuration.slots || {},
        settings: {
          modes: machine.configuration.settings.modes,
          currentMode: machine.configuration.settings.currentMode,
          temperature: machine.configuration.settings.temperature || 20,
          features: machine.configuration.settings.features || {},
          capabilities: machine.configuration.settings.capabilities || {
            hasTemperatureControl: false,
            hasAutoCleaning: false,
            supportedPayments: ['cash']
          }
        },
        notifications: {
          emailAddresses: machine.configuration.notifications?.emailAddresses || [],
          enableOfflineAlerts: machine.configuration.notifications?.enableOfflineAlerts ?? true,
          enableErrorAlerts: machine.configuration.notifications?.enableErrorAlerts ?? true,
          alertThresholdMinutes: machine.configuration.notifications?.alertThresholdMinutes || 2
        }
      },
      groupId: machine.groupId || ''
    });
    setOpenDialog(true);
  };

  const handleDeleteMachine = async (machineId: string) => {
    if (!window.confirm('Are you sure you want to delete this machine? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Stop simulation if running
      MachineHeartbeatSimulator.stopSimulation(machineId);
      
      await MachineService.deleteMachine(machineId);
      await loadMachines();
      alert('Machine deleted successfully!');
    } catch (err: any) {
      alert(`Error deleting machine: ${err.message}`);
    }
  };

  // Test functions for development
  const handleStartSimulation = async (machineId: string) => {
    const machine = await MachineService.getMachine(machineId);
    const machineName = machine ? `${machine.name} (${machine.serialNumber})` : 'Unknown Machine';
    MachineHeartbeatSimulator.startSimulation(machineId, true);
    alert(`Heartbeat simulation started for machine: ${machineName}`);
  };

  const handleStopSimulation = async (machineId: string) => {
    const machine = await MachineService.getMachine(machineId);
    const machineName = machine ? `${machine.name} (${machine.serialNumber})` : 'Unknown Machine';
    MachineHeartbeatSimulator.stopSimulation(machineId);
    alert(`Heartbeat simulation stopped for machine: ${machineName}`);
  };

  const handleTestOffline = (machineId: string) => {
    MachineHeartbeatSimulator.simulateTemporaryOffline(machineId, 300000); // 5 minutes offline
    alert('Machine will go offline for 5 minutes to test notifications');
  };

  const handleTestError = async (machineId: string) => {
    try {
      await MachineHeartbeatSimulator.simulateError(machineId, 'COIN_JAM', 'Coin mechanism jammed - Test Alert', 'high');
      alert('Test error created - check alarms and notifications');
    } catch (err: any) {
      alert(`Error creating test alarm: ${err.message}`);
    }
  };

  const handleTestEmailNotification = async (machineId: string) => {
    try {
      // Test with new integrated email service
      const success = await IntegratedEmailService.sendMachineAlert(machineId, 'offline', 'Test offline notification - system is working correctly');
      if (success) {
        alert('✅ Test email notification sent successfully! Check console for details.');
      } else {
        alert('⚠️ Email notification processed but no email addresses configured for this machine.');
      }
    } catch (err: any) {
      alert(`❌ Error sending test notification: ${err.message}`);
    }
  }

  // Test error notification
  const handleTestErrorNotification = async (machineId: string) => {
    try {
      const success = await IntegratedEmailService.sendMachineAlert(machineId, 'error', 'Test error: COIN_JAM - Coin mechanism jammed during testing');
      if (success) {
        alert('✅ Test error notification sent successfully! Check console for details.');
      } else {
        alert('⚠️ Email notification processed but no email addresses configured for this machine.');
      }
    } catch (err: any) {
      alert(`❌ Error sending test error notification: ${err.message}`);
    }
  };

  // Handle model selection
  const handleModelChange = (modelCode: string) => {
    const modelConfig = DGS_MACHINE_MODELS[modelCode as keyof typeof DGS_MACHINE_MODELS];
    if (modelConfig) {
      setFormData(prev => ({
        ...prev,
        model: modelCode,
        type: modelConfig.type,
        name: modelConfig.name,
        configuration: {
          ...prev.configuration,
          settings: {
            ...prev.configuration.settings,
            modes: [...(modelConfig.availableModes || ['normal'])],
            currentMode: modelConfig.availableModes?.[0] || 'normal',
            temperature: modelConfig.temperatureRange?.min || 20,
            features: modelConfig.features || {},
            capabilities: modelConfig.capabilities
          }
        }
      }));
    }
  };

  // Get available models for selected type
  const getAvailableModels = () => {
    return Object.entries(DGS_MACHINE_MODELS).filter(([_, config]) => 
      !formData.type || config.type === formData.type
    );
  };

  const handleSaveMachine = async () => {
    try {
      // Validation
      if (!formData.serialNumber || !formData.name || !formData.iotNumber || !formData.model) {
        alert('Please fill in all required fields including DGS Model');
        return;
      }

      // Clean the form data to remove undefined values completely
      const cleanedFormData = {
        serialNumber: formData.serialNumber || '',
        type: formData.type || 'snack',
        model: formData.model || '',
        name: formData.name || '',
        iotNumber: formData.iotNumber || '',
        location: {
          address: formData.location.address || '',
          latitude: Number(formData.location.latitude) || 0,
          longitude: Number(formData.location.longitude) || 0
        },
        connectionInfo: {
          version: formData.connectionInfo.version || '1.0.0',
          status: formData.connectionInfo.status || 'offline',
          lastHeartbeat: formData.connectionInfo.lastHeartbeat || new Date().toISOString()
        },
        configuration: {
          slots: formData.configuration.slots || {},
          settings: {
            modes: formData.configuration.settings.modes || ['normal'],
            currentMode: formData.configuration.settings.currentMode || 'normal',
            temperature: Number(formData.configuration.settings.temperature) || 20,
            features: formData.configuration.settings.features || {},
            capabilities: formData.configuration.settings.capabilities || {
              hasTemperatureControl: false,
              hasAutoCleaning: false,
              supportedPayments: ['cash']
            }
          },
          notifications: {
            emailAddresses: formData.configuration.notifications.emailAddresses || [],
            enableOfflineAlerts: formData.configuration.notifications.enableOfflineAlerts ?? true,
            enableErrorAlerts: formData.configuration.notifications.enableErrorAlerts ?? true,
            alertThresholdMinutes: Number(formData.configuration.notifications.alertThresholdMinutes) || 2
          }
        },
        groupId: formData.groupId || ''
      };

      if (editingMachine) {
        // Update existing machine
        await MachineService.updateMachine(editingMachine.id, cleanedFormData);
        alert('Machine updated successfully!');
      } else {
        // Add new machine
        await MachineService.addMachine(cleanedFormData);
        alert('Machine added successfully!');
      }
      
      setOpenDialog(false);
      await loadMachines();
    } catch (err: any) {
      alert(`Error saving machine: ${err.message}`);
    }
  };

  const getMachineStatus = (machineId: string) => {
    const status = machineStatuses[machineId];
    if (!status) return { status: 'Bilinmiyor', color: 'default' as const };
    
    // Check if machine is actually offline based on heartbeat timing
    const now = Date.now();
    const timeSinceLastHeartbeat = now - status.lastSeen;
    const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    
    const isActuallyOffline = timeSinceLastHeartbeat > OFFLINE_THRESHOLD;
    
    if (isActuallyOffline) {
      return { status: 'Çevrimdışı', color: 'error' as const };
    }
    
    // Check telemetry data for real status
    const telemetry = telemetryData[machineId];
    if (telemetry) {
      if (telemetry.powerStatus === false) {
        return { status: 'Kapalı', color: 'warning' as const };
      }
      if (telemetry.errors && telemetry.errors.length > 0) {
        return { status: 'Hata', color: 'error' as const };
      }
      if (telemetry.operationalMode === 'cleaning') {
        return { status: 'Temizlik', color: 'info' as const };
      }
      if (telemetry.operationalMode === 'maintenance') {
        return { status: 'Bakım', color: 'warning' as const };
      }
      if (telemetry.operationalMode === 'error') {
        return { status: 'Hata', color: 'error' as const };
      }
      return { status: 'Çevrimiçi', color: 'success' as const };
    }
    
    // If we have recent heartbeat but no telemetry, show as online
    if (status.status === 'online' && !isActuallyOffline) {
      return { status: 'Çevrimiçi', color: 'success' as const };
    }
    
    return { status: 'Çevrimdışı', color: 'error' as const };
  };

  const getLastSeenTime = (machineId: string) => {
    const status = machineStatuses[machineId];
    if (!status || !status.lastSeen) return 'Never';
    
    const lastSeen = new Date(status.lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeen.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getTemperatureColor = (machineType: string, temperature: number): string => {
    switch (machineType) {
      case 'ice_cream':
        return temperature <= -20 ? '#2e7d32' : temperature <= -10 ? '#ff9800' : '#d32f2f';
      case 'snack':
        return temperature >= 4 && temperature <= 25 ? '#2e7d32' : '#ff9800';
      case 'coffee':
        return temperature >= 65 && temperature <= 95 ? '#2e7d32' : '#ff9800';
      case 'perfume':
        return temperature >= 20 && temperature <= 25 ? '#2e7d32' : '#ff9800';
      default:
        return '#666';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading machines...</Typography>
      </Box>
    );
  }

  // Filter machines based on current filters
  const filteredMachines = machines.filter(machine => {
    // Search term filter
    if (filters.searchTerm && !machine.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
        !machine.serialNumber.toLowerCase().includes(filters.searchTerm.toLowerCase()) &&
        !machine.location.address.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }

    // Machine type filter
    if (filters.machineType !== 'all' && machine.type !== filters.machineType) {
      return false;
    }

    // Status filter
    if (filters.status !== 'all') {
      const machineStatus = getMachineStatus(machine.id);
      if (machineStatus.status.toLowerCase() !== filters.status) {
        return false;
      }
    }

    // Model filter
    if (filters.model !== 'all' && machine.model !== filters.model) {
      return false;
    }

    return true;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredMachines.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMachines = filteredMachines.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Get unique models for filter dropdown
  const uniqueModels = Array.from(new Set(machines.map(machine => machine.model).filter(Boolean)));

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
      <Fade in timeout={600}>
        <Box className="page-bounce-enter">
          <Box 
            display="flex" 
            justifyContent="space-between" 
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            flexDirection={{ xs: 'column', sm: 'row' }}
            gap={{ xs: 2, sm: 0 }}
            mb={4}
          >
            <Typography 
              variant="h3"
              component="h1" 
              sx={{ 
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', sm: '3rem' }
              }}
            >
              {t('machines.title')}
            </Typography>
            <Box 
              display="flex" 
              gap={1}
              width={{ xs: '100%', sm: 'auto' }}
              justifyContent={{ xs: 'space-between', sm: 'flex-end' }}
            >
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadMachines}
                size="medium"
                sx={{ 
                  borderRadius: 3,
                  fontWeight: 600,
                  flex: { xs: 1, sm: 'none' },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }
                }}
              >
                {t('machines.refresh')}
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddMachine}
                size="medium"
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  flex: { xs: 1, sm: 'none' },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #654192 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  }
                }}
              >
                {t('machines.addMachine')}
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          {/* Development Testing Notice */}
          {process.env.NODE_ENV === 'development' && (
            <Alert 
              severity="info" 
              sx={{ 
                mb: 3, 
                borderRadius: 3,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}
            >
              <strong>{t('machines.developmentMode')}</strong> {t('machines.developmentModeDesc')}
            </Alert>
          )}

          {/* Filters */}
          <Slide direction="up" in timeout={1000}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: 3,
                background: '#ffffff',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
              }}
            >
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 2, 
                  fontWeight: 600,
                  color: 'primary.main'
                }}
              >
                Filtreler
              </Typography>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
                gap: 2, 
                alignItems: 'center' 
              }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Makine ara (ad, seri no, konum)..."
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ fontSize: 18 }} />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl fullWidth size="small">
                  <InputLabel>Makine Türü</InputLabel>
                  <Select
                    value={filters.machineType}
                    onChange={(e) => handleFilterChange('machineType', e.target.value)}
                    label="Makine Türü"
                  >
                    <MenuItem value="all">Tüm Türler</MenuItem>
                    <MenuItem value="snack">Atıştırmalık</MenuItem>
                    <MenuItem value="ice_cream">Dondurma</MenuItem>
                    <MenuItem value="coffee">Kahve</MenuItem>
                    <MenuItem value="perfume">Parfüm</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Durum</InputLabel>
                  <Select
                    value={filters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    label="Durum"
                  >
                    <MenuItem value="all">Tüm Durumlar</MenuItem>
                    <MenuItem value="online">Çevrimiçi</MenuItem>
                    <MenuItem value="offline">Çevrimdışı</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth size="small">
                  <InputLabel>Model</InputLabel>
                  <Select
                    value={filters.model}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                    label="Model"
                  >
                    <MenuItem value="all">Tüm Modeller</MenuItem>
                    {uniqueModels.map(model => (
                      <MenuItem key={model} value={model}>{model}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Paper>
          </Slide>

          {/* Machine Statistics */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
            <Slide direction="up" in timeout={800}>
              <Box sx={{ flex: 1 }}>
                <Card 
                  elevation={0}
                  sx={{
                    background: '#ffffff',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography 
                          color="textSecondary" 
                          gutterBottom
                          sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}
                        >
                          {t('machines.onlineMachines')}
                        </Typography>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 700, 
                          color: '#2e7d32',
                          fontSize: { xs: '1.5rem', sm: '2.125rem' }
                        }}>
                          {Object.values(machineStatuses).filter(s => {
                            const now = Date.now();
                            const timeSinceLastHeartbeat = now - s.lastSeen;
                            const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
                            return timeSinceLastHeartbeat <= OFFLINE_THRESHOLD;
                          }).length}
                        </Typography>
                      </Box>
                      <CheckCircleIcon sx={{ fontSize: { xs: 40, sm: 48 }, color: '#2e7d32', opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Slide>
            <Slide direction="up" in timeout={1000}>
              <Box sx={{ flex: 1 }}>
                <Card 
                  elevation={0}
                  sx={{
                    background: '#ffffff',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography 
                          color="textSecondary" 
                          gutterBottom
                          sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}
                        >
                          {t('machines.offlineMachines')}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                          {Object.values(machineStatuses).filter(s => {
                            const now = Date.now();
                            const timeSinceLastHeartbeat = now - s.lastSeen;
                            const OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
                            return s.status === 'offline' || timeSinceLastHeartbeat > OFFLINE_THRESHOLD;
                          }).length}
                        </Typography>
                      </Box>
                      <WarningIcon sx={{ fontSize: 48, color: '#d32f2f', opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Slide>
            <Slide direction="up" in timeout={1200}>
              <Box sx={{ flex: 1 }}>
                <Card 
                  elevation={0}
                  sx={{
                    background: '#ffffff',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 30px rgba(102, 126, 234, 0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography 
                          color="textSecondary" 
                          gutterBottom
                          sx={{ fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}
                        >
                          {t('machines.totalMachines')}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2' }}>
                          {machines.length}
                        </Typography>
                      </Box>
                      <CircleIcon sx={{ fontSize: 48, color: '#1976d2', opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Slide>
          </Stack>

          {/* Machines Table */}
          <Slide direction="up" in timeout={1400}>
            <TableContainer 
              component={Paper}
              sx={{
                background: '#ffffff',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                borderRadius: 3,
                overflow: 'auto',
                '& .MuiTable-root': {
                  minWidth: { xs: 800, sm: 'auto' }
                }
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 100, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('machines.serialNumber')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 120, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('machines.name')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 100, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>DGS Model</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 80, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('machines.type')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 150, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', md: 'table-cell' }
                    }}>{t('machines.location')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 80, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('machines.status')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 100, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', sm: 'table-cell' }
                    }}>{t('machines.lastSeen')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 80, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', md: 'table-cell' }
                    }}>Sıcaklık</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 100, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', md: 'table-cell' }
                    }}>Çalışma Modu</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 100, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', lg: 'table-cell' }
                    }}>Bugünkü Satış</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 100, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('machines.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentMachines.map((machine) => {
                    const status = getMachineStatus(machine.id);
                    return (
                      <TableRow 
                        key={machine.id}
                        sx={{
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.02)'
                          }
                        }}
                      >
                        <TableCell sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>{machine.serialNumber}</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>{machine.name}</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}>
                          {machine.model ? (
                            <Chip 
                              label={machine.model}
                              size="small" 
                              sx={{
                                background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(139, 195, 74, 0.1) 100%)',
                                color: '#4caf50',
                                fontWeight: 600,
                                borderRadius: 2,
                                fontSize: { xs: '0.6rem', sm: '0.75rem' }
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={(machine.type || 'unknown').replace('_', ' ').toUpperCase()} 
                            size="small" 
                            sx={{
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                              color: '#667eea',
                              fontWeight: 600,
                              borderRadius: 2,
                              fontSize: { xs: '0.6rem', sm: '0.75rem' }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', md: 'table-cell' }
                        }}>{machine.location.address}</TableCell>
                        <TableCell>
                          <Chip
                            label={status.status}
                            color={status.color}
                            size="small"
                            sx={{ 
                              fontWeight: 600, 
                              borderRadius: 2,
                              fontSize: { xs: '0.6rem', sm: '0.75rem' }
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', sm: 'table-cell' }
                        }}>{getLastSeenTime(machine.id)}</TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', md: 'table-cell' }
                        }}>
                          {telemetryData[machine.id]?.temperatureReadings?.internalTemperature ? (
                            <Chip 
                              label={`${telemetryData[machine.id].temperatureReadings!.internalTemperature}°C`}
                              size="small" 
                              sx={{
                                background: getTemperatureColor(machine.type, telemetryData[machine.id].temperatureReadings!.internalTemperature),
                                color: 'white',
                                fontWeight: 600,
                                borderRadius: 2,
                                fontSize: { xs: '0.6rem', sm: '0.75rem' }
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', md: 'table-cell' }
                        }}>
                          {telemetryData[machine.id]?.operationalMode ? (
                            <Chip 
                              label={telemetryData[machine.id].operationalMode === 'normal' ? 'Normal' : 
                                    telemetryData[machine.id].operationalMode === 'maintenance' ? 'Bakım' :
                                    telemetryData[machine.id].operationalMode === 'cleaning' ? 'Temizlik' :
                                    telemetryData[machine.id].operationalMode === 'error' ? 'Hata' : 'Bilinmiyor'}
                              size="small" 
                              sx={{
                                background: telemetryData[machine.id].operationalMode === 'normal' ? '#2e7d32' :
                                           telemetryData[machine.id].operationalMode === 'maintenance' ? '#ff9800' :
                                           telemetryData[machine.id].operationalMode === 'cleaning' ? '#2196f3' :
                                           telemetryData[machine.id].operationalMode === 'error' ? '#f44336' : '#9e9e9e',
                                color: 'white',
                                fontWeight: 600,
                                borderRadius: 2,
                                fontSize: { xs: '0.6rem', sm: '0.75rem' }
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ 
                          fontWeight: 500,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          display: { xs: 'none', lg: 'table-cell' }
                        }}>
                          {telemetryData[machine.id]?.salesData ? (
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                                {telemetryData[machine.id].salesData!.todaySales}₺
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {telemetryData[machine.id].salesData!.todayTransactions} işlem
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5} flexWrap="wrap">
                            <Tooltip title={t('machines.editTooltip')} placement="bottom">
                              <IconButton
                                size="small"
                                onClick={() => handleEditMachine(machine)}
                                sx={{
                                  color: '#667eea',
                                  '&:hover': {
                                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title={t('machines.deleteTooltip')} placement="bottom">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteMachine(machine.id)}
                                sx={{
                                  color: '#d32f2f',
                                  '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Uzaktan Kontrol / Remote Control" placement="bottom">
                              <IconButton
                                size="small"
                                onClick={() => setRemoteControlMachine(machine)}
                                sx={{
                                  color: '#9c27b0',
                                  '&:hover': {
                                    backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <RemoteControlIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            
                            {/* Development Testing Buttons */}
                            {process.env.NODE_ENV === 'development' && (
                              <>
                                <Tooltip title="Start Heartbeat Simulation">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleStartSimulation(machine.id)}
                                    sx={{
                                      color: '#2e7d32',
                                      '&:hover': {
                                        backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                  >
                                    <StartIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Stop Simulation">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleStopSimulation(machine.id)}
                                    sx={{
                                      color: '#f57c00',
                                      '&:hover': {
                                        backgroundColor: 'rgba(245, 124, 0, 0.1)',
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                  >
                                    <StopIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Test Offline (5 min)">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTestOffline(machine.id)}
                                    sx={{
                                      color: '#9c27b0',
                                      '&:hover': {
                                        backgroundColor: 'rgba(156, 39, 176, 0.1)',
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                  >
                                    <OfflineIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Test Error Alert">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTestError(machine.id)}
                                    sx={{
                                      color: '#e91e63',
                                      '&:hover': {
                                        backgroundColor: 'rgba(233, 30, 99, 0.1)',
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                  >
                                    <ErrorIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Test Email Notification">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTestEmailNotification(machine.id)}
                                    sx={{
                                      color: '#00bcd4',
                                      '&:hover': {
                                        backgroundColor: 'rgba(0, 188, 212, 0.1)',
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                  >
                                    <EmailIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Test Error Email">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleTestErrorNotification(machine.id)}
                                    sx={{
                                      color: '#ff9800',
                                      '&:hover': {
                                        backgroundColor: 'rgba(255, 152, 0, 0.1)',
                                        transform: 'scale(1.1)'
                                      }
                                    }}
                                  >
                                    <TestEmailIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Slide>

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
                makine
              </Typography>
            </Box>

            {/* Page info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                {filteredMachines.length > 0 ? (
                  <>
                    {startIndex + 1}-{Math.min(endIndex, filteredMachines.length)} / {filteredMachines.length} makine
                    {filteredMachines.length !== machines.length && (
                      <span style={{ color: '#667eea', fontWeight: 600 }}>
                        {' '}({machines.length} toplam)
                      </span>
                    )}
                  </>
                ) : (
                  'Makine bulunamadı'
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
        </Box>
      </Fade>

      {/* Add/Edit Machine Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingMachine ? 'Edit Machine' : 'Add New Machine'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Serial Number *"
                fullWidth
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              />
              <TextField
                label="Machine Name *"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <FormControl fullWidth>
                <InputLabel>Machine Type</InputLabel>
                <Select
                  value={formData.type}
                  onChange={(e) => {
                    const newType = e.target.value as 'snack' | 'ice_cream' | 'coffee' | 'perfume';
                    setFormData({ 
                      ...formData, 
                      type: newType,
                      model: '' // Reset model when type changes
                    });
                  }}
                >
                  <MenuItem value="snack">Snack Machine</MenuItem>
                  <MenuItem value="ice_cream">Ice Cream Machine</MenuItem>
                  <MenuItem value="coffee">Coffee Machine</MenuItem>
                  <MenuItem value="perfume">Perfume Machine</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>DGS Model</InputLabel>
                <Select
                  value={formData.model}
                  onChange={(e) => handleModelChange(e.target.value as string)}
                  disabled={!formData.type}
                >
                  {getAvailableModels().map(([modelCode, config]) => (
                    <MenuItem key={modelCode} value={modelCode}>
                      {config.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Machine Name *"
                fullWidth
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!!formData.model} // Auto-filled when model is selected
              />
              <TextField
                label="IoT Number *"
                fullWidth
                value={formData.iotNumber}
                onChange={(e) => setFormData({ ...formData, iotNumber: e.target.value })}
              />
            </Stack>
            
            <TextField
              label="Location Address *"
              fullWidth
              value={formData.location.address}
              onChange={(e) => setFormData({ 
                ...formData, 
                location: { ...formData.location, address: e.target.value }
              })}
            />
            
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="Latitude"
                type="number"
                fullWidth
                value={formData.location.latitude}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, latitude: parseFloat(e.target.value) || 0 }
                })}
                inputProps={{ step: "any" }}
              />
              <TextField
                label="Longitude"
                type="number"
                fullWidth
                value={formData.location.longitude}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  location: { ...formData.location, longitude: parseFloat(e.target.value) || 0 }
                })}
                inputProps={{ step: "any" }}
              />
            </Stack>
            
            {/* Email Notification Settings */}
            <Divider sx={{ my: 3 }}>
              <Chip 
                icon={<EmailIcon />} 
                label="Email Notification Settings" 
                sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  fontWeight: 600
                }}
              />
            </Divider>
            
            <Stack spacing={3}>
              <TextField
                label="Email Addresses for Alerts"
                fullWidth
                multiline
                rows={2}
                placeholder="Enter email addresses separated by commas (e.g., admin@company.com, tech@company.com)"
                value={formData.configuration.notifications.emailAddresses.join(', ')}
                onChange={(e) => {
                  const emails = e.target.value
                    .split(',')
                    .map(email => email.trim())
                    .filter(email => email.length > 0);
                  setFormData({ 
                    ...formData, 
                    configuration: {
                      ...formData.configuration,
                      notifications: {
                        ...formData.configuration.notifications,
                        emailAddresses: emails
                      }
                    }
                  });
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  )
                }}
                helperText="Email addresses that will receive alerts when this machine goes offline or encounters errors"
              />
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.configuration.notifications.enableOfflineAlerts}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        configuration: {
                          ...formData.configuration,
                          notifications: {
                            ...formData.configuration.notifications,
                            enableOfflineAlerts: e.target.checked
                          }
                        }
                      })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#667eea'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#667eea'
                        }
                      }}
                    />
                  }
                  label="Enable Offline Alerts"
                  sx={{ flex: 1 }}
                />
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.configuration.notifications.enableErrorAlerts}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        configuration: {
                          ...formData.configuration,
                          notifications: {
                            ...formData.configuration.notifications,
                            enableErrorAlerts: e.target.checked
                          }
                        }
                      })}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#667eea'
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#667eea'
                        }
                      }}
                    />
                  }
                  label="Enable Error Alerts"
                  sx={{ flex: 1 }}
                />
              </Stack>
              
              <TextField
                label="Alert Threshold (Minutes)"
                type="number"
                fullWidth
                value={formData.configuration.notifications.alertThresholdMinutes}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  configuration: {
                    ...formData.configuration,
                    notifications: {
                      ...formData.configuration.notifications,
                      alertThresholdMinutes: parseInt(e.target.value) || 2
                    }
                  }
                })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <NotificationsIcon sx={{ color: '#667eea' }} />
                    </InputAdornment>
                  )
                }}
                helperText="How many minutes the machine should be offline before sending an alert"
                inputProps={{ min: 1, max: 60 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveMachine}
            variant="contained"
          >
            {editingMachine ? 'Update' : 'Add'} Machine
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remote Control Dialog */}
      {remoteControlMachine && (
        <MachineControl
          machine={remoteControlMachine}
          open={!!remoteControlMachine}
          onClose={() => setRemoteControlMachine(null)}
        />
      )}
    </Container>
  );
};

export default Machines;