import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Stack,
  Card,
  CardContent,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  Fade,
  Slide
} from '@mui/material';
import {
  CheckCircle as ResolveIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Cancel as CriticalIcon,
  Delete as DeleteIcon,
  DeleteSweep as DeleteSweepIcon,
  DeleteForever as DeleteForeverIcon
} from '@mui/icons-material';
import { Alarm, Machine } from '../../types';
import { ref, get, onValue, update, off } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../contexts/LanguageContext';
import { AlarmService } from '../../services/alarmService';

const Alarms: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  
  // Admin kontrolü
  const isAdmin = user?.role === 'admin';
  const [machines, setMachines] = useState<{ [key: string]: Machine }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    loadData();
    
    // Real-time alarm monitoring
    const alarmsRef = ref(database, 'alarms');
    const unsubscribe = onValue(alarmsRef, (snapshot) => {
      if (snapshot.exists()) {
        const alarmData = snapshot.val();
        const alarmList = Object.values(alarmData) as Alarm[];
        setAlarms(alarmList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    });
    
    return () => off(alarmsRef, 'value', unsubscribe);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load machines
      const machinesRef = ref(database, 'machines');
      const machinesSnapshot = await get(machinesRef);
      if (machinesSnapshot.exists()) {
        setMachines(machinesSnapshot.val());
      }
      
      // Load alarms
      const alarmsRef = ref(database, 'alarms');
      const alarmsSnapshot = await get(alarmsRef);
      if (alarmsSnapshot.exists()) {
        const alarmData = alarmsSnapshot.val();
        const alarmList = Object.values(alarmData) as Alarm[];
        setAlarms(alarmList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load alarms');
      console.error('Error loading alarms:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledgeAlarm = async (alarmId: string) => {
    try {
      const alarmRef = ref(database, `alarms/${alarmId}`);
      await update(alarmRef, {
        status: 'acknowledged',
        acknowledgedBy: user?.id,
        acknowledgedAt: new Date().toISOString()
      });
      
      alert('Alarm acknowledged successfully!');
    } catch (err: any) {
      alert(`Error acknowledging alarm: ${err.message}`);
    }
  };

  const handleResolveAlarm = async (alarmId: string) => {
    try {
      const alarmRef = ref(database, `alarms/${alarmId}`);
      await update(alarmRef, {
        status: 'resolved',
        resolvedAt: new Date().toISOString()
      });
      
      alert('Alarm resolved successfully!');
    } catch (err: any) {
      alert(`Error resolving alarm: ${err.message}`);
    }
  };

  const handleDeleteAlarm = async (alarmId: string) => {
    if (!window.confirm('Bu alarmı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }
    
    try {
      console.log(`🗑️ User attempting to delete alarm: ${alarmId}`);
      await AlarmService.deleteAlarm(alarmId);
      
      // Remove from local state immediately for better UX
      setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.id !== alarmId));
      
      alert('Alarm başarıyla silindi!');
    } catch (err: any) {
      console.error('❌ Error in handleDeleteAlarm:', err);
      alert(`Alarm silinirken hata oluştu: ${err.message}`);
    }
  };

  const handleDeleteResolvedAlarms = async () => {
    const resolvedCount = alarms.filter(alarm => alarm.status === 'resolved').length;
    
    if (resolvedCount === 0) {
      alert('Silinecek çözülmüş alarm bulunamadı.');
      return;
    }
    
    if (!window.confirm(`${resolvedCount} adet çözülmüş alarmı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }
    
    try {
      console.log(`🗑️ User attempting to delete ${resolvedCount} resolved alarms`);
      await AlarmService.deleteResolvedAlarms();
      
      // Remove resolved alarms from local state
      setAlarms(prevAlarms => prevAlarms.filter(alarm => alarm.status !== 'resolved'));
      
      alert(`${resolvedCount} adet çözülmüş alarm başarıyla silindi!`);
    } catch (err: any) {
      console.error('❌ Error in handleDeleteResolvedAlarms:', err);
      alert(`Çözülmüş alarmlar silinirken hata oluştu: ${err.message}`);
    }
  };

  const handleDeleteOldAlarms = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldAlarmsCount = alarms.filter(alarm => new Date(alarm.timestamp) < thirtyDaysAgo).length;
    
    if (oldAlarmsCount === 0) {
      alert('30 günden eski alarm bulunamadı.');
      return;
    }
    
    if (!window.confirm(`${oldAlarmsCount} adet eski alarmı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
      return;
    }
    
    try {
      console.log(`🗑️ User attempting to delete ${oldAlarmsCount} old alarms`);
      await AlarmService.deleteOldAlarms(30);
      
      // Remove old alarms from local state
      setAlarms(prevAlarms => prevAlarms.filter(alarm => new Date(alarm.timestamp) >= thirtyDaysAgo));
      
      alert(`${oldAlarmsCount} adet eski alarm başarıyla silindi!`);
    } catch (err: any) {
      console.error('❌ Error in handleDeleteOldAlarms:', err);
      alert(`Eski alarmlar silinirken hata oluştu: ${err.message}`);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <CriticalIcon color="error" />;
      case 'high':
        return <ErrorIcon color="error" />;
      case 'medium':
        return <WarningIcon color="warning" />;
      case 'low':
        return <InfoIcon color="info" />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (severity: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'active':
        return 'error';
      case 'acknowledged':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'default';
    }
  };

  const getAlarmTypeLabel = (type: string): string => {
    switch (type) {
      case 'offline':
        return 'Çevrimdışı';
      case 'error':
        return 'Hata';
      case 'warning':
        return 'Uyarı';
      case 'maintenance':
        return 'Bakım';
      case 'cleaning':
        return 'Temizlik';
      default:
        return type.toUpperCase();
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getFilteredAlarms = () => {
    return alarms.filter(alarm => {
      const statusMatch = filterStatus === 'all' || alarm.status === filterStatus;
      const severityMatch = filterSeverity === 'all' || alarm.severity === filterSeverity;
      return statusMatch && severityMatch;
    });
  };

  // Pagination calculations
  const filteredAlarms = getFilteredAlarms();
  const totalPages = Math.ceil(filteredAlarms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAlarms = filteredAlarms.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getAlarmStats = () => {
    const activeAlarms = alarms.filter(a => a.status === 'active').length;
    const criticalAlarms = alarms.filter(a => a.severity === 'critical' && a.status === 'active').length;
    const resolvedToday = alarms.filter(a => {
      const today = new Date().toDateString();
      return a.status === 'resolved' && new Date(a.timestamp).toDateString() === today;
    }).length;
    
    return { activeAlarms, criticalAlarms, resolvedToday };
  };

  const stats = getAlarmStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>{t('common.loading')}</Typography>
      </Box>
    );
  }

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
              {t('alarms.title')}
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadData}
                size="medium"
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  alignSelf: { xs: 'stretch', sm: 'auto' },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.2)'
                  }
                }}
              >
                {t('alarms.refresh')}
              </Button>
              
              {isAdmin && (
                <>
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<DeleteSweepIcon />}
                    onClick={handleDeleteResolvedAlarms}
                    size="medium"
                    sx={{
                      borderRadius: 3,
                      fontWeight: 600,
                      alignSelf: { xs: 'stretch', sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(255, 152, 0, 0.2)'
                      }
                    }}
                  >
                    Çözülmüşleri Sil
                  </Button>
                  
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteForeverIcon />}
                    onClick={handleDeleteOldAlarms}
                    size="medium"
                    sx={{
                      borderRadius: 3,
                      fontWeight: 600,
                      alignSelf: { xs: 'stretch', sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)'
                      }
                    }}
                  >
                    Eski Alarmları Sil
                  </Button>
                </>
              )}
            </Stack>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>
              {error}
            </Alert>
          )}

          {/* Alarm Statistics */}
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
                          {t('alarms.activeAlarms')}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                          {stats.activeAlarms}
                        </Typography>
                      </Box>
                      <ErrorIcon sx={{ fontSize: 48, color: '#d32f2f', opacity: 0.8 }} />
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
                          {t('alarms.criticalAlarms')}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                          {stats.criticalAlarms}
                        </Typography>
                      </Box>
                      <CriticalIcon sx={{ fontSize: 48, color: '#d32f2f', opacity: 0.8 }} />
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
                          {t('alarms.resolvedToday')}
                        </Typography>
                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#2e7d32' }}>
                          {stats.resolvedToday}
                        </Typography>
                      </Box>
                      <ResolveIcon sx={{ fontSize: 48, color: '#2e7d32', opacity: 0.8 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Slide>
          </Stack>

          {/* Filters */}
          <Box 
            display="flex" 
            gap={{ xs: 1, sm: 2 }} 
            mb={4}
            flexDirection={{ xs: 'column', sm: 'row' }}
          >
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
              <InputLabel>{t('alarms.status')}</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">{t('status.all')}</MenuItem>
                <MenuItem value="active">{t('status.active')}</MenuItem>
                <MenuItem value="acknowledged">{t('status.acknowledged')}</MenuItem>
                <MenuItem value="resolved">{t('status.resolved')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 120 } }}>
              <InputLabel>{t('alarms.severity')}</InputLabel>
              <Select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                sx={{ borderRadius: 2 }}
              >
                <MenuItem value="all">{t('severity.all')}</MenuItem>
                <MenuItem value="critical">{t('severity.critical')}</MenuItem>
                <MenuItem value="high">{t('severity.high')}</MenuItem>
                <MenuItem value="medium">{t('severity.medium')}</MenuItem>
                <MenuItem value="low">{t('severity.low')}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Alarms Table */}
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
                  minWidth: { xs: 900, sm: 'auto' }
                }
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 80, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('alarms.severity')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 120, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('alarms.machine')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 80, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', sm: 'table-cell' }
                    }}>{t('alarms.type')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 60, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', md: 'table-cell' }
                    }}>{t('alarms.code')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 150, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('alarms.message')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 80, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('alarms.status')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 100, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', lg: 'table-cell' }
                    }}>{t('alarms.timestamp')}</TableCell>
                    <TableCell sx={{ 
                      fontWeight: 600,
                      minWidth: { xs: 120, sm: 'auto' },
                      fontSize: { xs: '0.75rem', sm: '0.875rem' }
                    }}>{t('alarms.actions')}</TableCell>
                    {isAdmin && (
                      <TableCell sx={{ 
                        fontWeight: 600,
                        minWidth: { xs: 80, sm: 'auto' },
                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                      }}>Sil</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentAlarms.map((alarm) => {
                    const machine = machines[alarm.machineId];
                    return (
                      <TableRow 
                        key={alarm.id}
                        sx={{ 
                          backgroundColor: alarm.status === 'active' && alarm.severity === 'critical' 
                            ? 'rgba(244, 67, 54, 0.05)' 
                            : 'inherit',
                          '&:hover': {
                            backgroundColor: 'rgba(102, 126, 234, 0.02)'
                          }
                        }}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            {getSeverityIcon(alarm.severity)}
                            <Chip
                              label={t(`severity.${alarm.severity}`)}
                              color={getSeverityColor(alarm.severity)}
                              size="small"
                              sx={{ ml: 1, fontWeight: 600, borderRadius: 2 }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {machine ? `${machine.name} (${machine.serialNumber})` : alarm.machineId}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getAlarmTypeLabel(alarm.type)} 
                            size="small" 
                            sx={{
                              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                              color: '#667eea',
                              fontWeight: 600,
                              borderRadius: 2
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: '#333' }}>
                            {alarm.code}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 500 }}>{alarm.message}</TableCell>
                        <TableCell>
                          <Chip
                            label={t(`status.${alarm.status}`)}
                            color={getStatusColor(alarm.status)}
                            size="small"
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatDateTime(alarm.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <Tooltip title={t('alarms.viewDetails')} placement="top">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedAlarm(alarm);
                                  setDialogOpen(true);
                                }}
                                sx={{
                                  color: '#667eea',
                                  '&:hover': {
                                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <ViewIcon />
                              </IconButton>
                            </Tooltip>
                            {alarm.status === 'active' && (
                              <Tooltip title={t('alarms.acknowledge')} placement="top">
                                <IconButton
                                  size="small"
                                  onClick={() => handleAcknowledgeAlarm(alarm.id)}
                                  sx={{
                                    color: '#ed6c02',
                                    '&:hover': {
                                      backgroundColor: 'rgba(237, 108, 2, 0.1)',
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <WarningIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                            {(alarm.status === 'active' || alarm.status === 'acknowledged') && (
                              <Tooltip title={t('alarms.resolve')} placement="top">
                                <IconButton
                                  size="small"
                                  onClick={() => handleResolveAlarm(alarm.id)}
                                  sx={{
                                    color: '#2e7d32',
                                    '&:hover': {
                                      backgroundColor: 'rgba(46, 125, 50, 0.1)',
                                      transform: 'scale(1.1)'
                                    }
                                  }}
                                >
                                  <ResolveIcon />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <Tooltip title="Alarmı Sil" placement="top">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteAlarm(alarm.id)}
                                sx={{
                                  color: '#d32f2f',
                                  '&:hover': {
                                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                    transform: 'scale(1.1)'
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {filteredAlarms.length === 0 && (
                <Box p={3} textAlign="center">
                  <Typography color="textSecondary">
                    {t('alarms.noAlarms')}
                  </Typography>
                </Box>
              )}
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
                alarm
              </Typography>
            </Box>

            {/* Page info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                {filteredAlarms.length > 0 ? (
                  <>
                    {startIndex + 1}-{Math.min(endIndex, filteredAlarms.length)} / {filteredAlarms.length} alarm
                  </>
                ) : (
                  'Alarm bulunamadı'
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

          {/* Alarm Details Dialog */}
          <Dialog 
            open={dialogOpen} 
            onClose={() => setDialogOpen(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              Alarm Detayları
            </DialogTitle>
            {selectedAlarm && (
              <DialogContent>
                <Stack spacing={2}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Alarm ID</Typography>
                      <Typography variant="body2" gutterBottom>{selectedAlarm.id}</Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Makine</Typography>
                      <Typography variant="body2" gutterBottom>
                        {machines[selectedAlarm.machineId]?.name || selectedAlarm.machineId}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Hata Kodu</Typography>
                      <Typography variant="body2" gutterBottom sx={{ fontFamily: 'monospace' }}>
                        {selectedAlarm.code}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Önem Derecesi</Typography>
                      <Chip
                        label={t(`severity.${selectedAlarm.severity}`)}
                        color={getSeverityColor(selectedAlarm.severity)}
                        size="small"
                      />
                    </Box>
                  </Stack>
                  
                  <Box>
                    <Typography variant="subtitle2">Mesaj</Typography>
                    <Typography variant="body2" gutterBottom>
                      {selectedAlarm.message}
                    </Typography>
                  </Box>
                  
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Zaman Damgası</Typography>
                      <Typography variant="body2" gutterBottom>
                        {formatDateTime(selectedAlarm.timestamp)}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2">Durum</Typography>
                      <Chip
                        label={t(`status.${selectedAlarm.status}`)}
                        color={getStatusColor(selectedAlarm.status)}
                        size="small"
                      />
                    </Box>
                  </Stack>
                  
                  {selectedAlarm.acknowledgedBy && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">Onaylayan</Typography>
                        <Typography variant="body2" gutterBottom>
                          {selectedAlarm.acknowledgedBy}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2">Onaylanma Zamanı</Typography>
                        <Typography variant="body2" gutterBottom>
                          {selectedAlarm.acknowledgedAt ? formatDateTime(selectedAlarm.acknowledgedAt) : '-'}
                        </Typography>
                      </Box>
                    </Stack>
                  )}
                  
                  {selectedAlarm.resolvedAt && (
                    <Box>
                      <Typography variant="subtitle2">Çözülme Zamanı</Typography>
                      <Typography variant="body2" gutterBottom>
                        {formatDateTime(selectedAlarm.resolvedAt)}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedAlarm.metadata && (
                    <Box>
                      <Typography variant="subtitle2">Ek Bilgiler</Typography>
                      <Paper sx={{ p: 2, backgroundColor: 'grey.100' }}>
                        <pre style={{ fontSize: '0.75rem', margin: 0, whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(selectedAlarm.metadata, null, 2)}
                        </pre>
                      </Paper>
                    </Box>
                  )}
                </Stack>
              </DialogContent>
            )}
            <DialogActions>
              <Button onClick={() => setDialogOpen(false)}>Kapat</Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Fade>
    </Container>
  );
};

export default Alarms;