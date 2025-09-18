import React, { useState, useEffect } from 'react';
import {
  Box,
  Stack,
  Card,
  CardContent,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Container,
  Avatar,
  Fade,
  Slide,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  DeviceHub as MachinesIcon,
  Warning as WarningIcon,
  AttachMoney as MoneyIcon,
  Thermostat as TemperatureIcon,
  CleaningServices as CleaningIcon,
  DeviceHub,
} from '@mui/icons-material';
import { ref, onValue, off, query, orderByChild, limitToLast, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { Machine, Alarm, Sale, TelemetryData } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// Generate demo sales data for demonstration
const generateDemoSalesData = (): Sale[] => {
  const demoData: Sale[] = [];
  const now = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    // Generate 3-8 sales per day
    const salesCount = Math.floor(Math.random() * 6) + 3;
    
    for (let j = 0; j < salesCount; j++) {
      const saleTime = new Date(date);
      saleTime.setHours(Math.floor(Math.random() * 12) + 8); // 8-20 hours
      saleTime.setMinutes(Math.floor(Math.random() * 60));
      
      const amount = Math.floor(Math.random() * 50) + 5; // 5-55 TL
      const costPrice = amount * 0.6; // 60% cost ratio
      
      demoData.push({
        id: `demo-${i}-${j}`,
        machineId: `demo-machine-${Math.floor(Math.random() * 3) + 1}`,
        productId: `demo-product-${Math.floor(Math.random() * 10) + 1}`,
        slotNumber: Math.floor(Math.random() * 20) + 1,
        quantity: 1,
        totalAmount: amount,
        costPrice: costPrice,
        profit: amount - costPrice,
        timestamp: saleTime.toISOString(),
        paymentMethod: ['cash', 'card', 'mobile'][Math.floor(Math.random() * 3)] as 'cash' | 'card' | 'mobile',
        transactionId: `demo-txn-${i}-${j}`
      });
    }
  }
  
  return demoData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

// Recent Sales Chart Component
const RecentSalesChart: React.FC = () => {
  const [salesData, setSalesData] = useState<Sale[]>([]);
  const [machines, setMachines] = useState<Record<string, Machine>>({});
  const [loading, setLoading] = useState(true);
  const { t, formatCurrency } = useLanguage();

  useEffect(() => {
    const salesRef = query(ref(database, 'sales'), orderByChild('timestamp'), limitToLast(30));
    const machinesRef = ref(database, 'machines');
    
    const unsubscribeSales = onValue(salesRef, (snapshot) => {
      const sales: Record<string, Sale> = snapshot.val() || {};
      const salesList = Object.values(sales).reverse(); // Most recent first
      setSalesData(salesList);
    });

    const unsubscribeMachines = onValue(machinesRef, (snapshot) => {
      const machinesData: Record<string, Machine> = snapshot.val() || {};
      setMachines(machinesData);
      setLoading(false);
    });

    return () => {
      off(salesRef, 'value', unsubscribeSales);
      off(machinesRef, 'value', unsubscribeMachines);
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Generate demo data if no real sales data
  const displayData = salesData.length === 0 ? generateDemoSalesData() : salesData;
  
  // Generate demo machines if no real machines
  const displayMachines = Object.keys(machines).length === 0 ? {
    'demo-machine-1': { id: 'demo-machine-1', type: 'snack' as const, name: 'Demo Atıştırmalık Makinesi', serialNumber: 'DEMO001' },
    'demo-machine-2': { id: 'demo-machine-2', type: 'ice_cream' as const, name: 'Demo Dondurma Makinesi', serialNumber: 'DEMO002' },
    'demo-machine-3': { id: 'demo-machine-3', type: 'coffee' as const, name: 'Demo Kahve Makinesi', serialNumber: 'DEMO003' }
  } : machines;

  // Calculate daily sales for the last 7 days
  const dailySales = displayData.reduce((acc, sale) => {
    const date = new Date(sale.timestamp).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += sale.totalAmount;
    return acc;
  }, {} as Record<string, number>);

  // Calculate sales by machine type
  const salesByType = displayData.reduce((acc, sale) => {
    const machine = displayMachines[sale.machineId];
    if (machine) {
      const type = machine.type;
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type] += sale.totalAmount;
    }
    return acc;
  }, {} as Record<string, number>);

  // Prepare chart data for Recharts
  const lineChartData = Object.entries(dailySales)
    .slice(-7)
    .map(([date, amount]) => ({
      date: date,
      sales: amount,
      formattedSales: formatCurrency(amount)
    }));

  const pieChartData = Object.entries(salesByType).map(([type, amount]) => ({
    name: type === 'snack' ? 'Atıştırmalık' :
          type === 'ice_cream' ? 'Dondurma' :
          type === 'coffee' ? 'Kahve' :
          type === 'perfume' ? 'Parfüm' : type,
    value: amount,
    formattedValue: formatCurrency(amount)
  }));

  const COLORS = ['#667eea', '#764ba2', '#2e7d32', '#ff9800'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #667eea',
            fontSize: '12px'
          }}
        >
          <Typography variant="body2" sx={{ color: 'white' }}>
            {label}: {payload[0].payload.formattedSales}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const total = pieChartData.reduce((sum, item) => sum + item.value, 0);
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <Box
          sx={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            border: '1px solid #667eea',
            fontSize: '12px'
          }}
        >
          <Typography variant="body2" sx={{ color: 'white' }}>
            {data.name}: {data.formattedValue} ({percentage}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Box sx={{ height: 320 }}>
      <Typography 
        variant="subtitle1" 
        gutterBottom
        sx={{ 
          fontWeight: 600,
          color: 'primary.main',
          mb: 3
        }}
      >
        {t('dashboard.dailySales')}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 2, height: 280 }}>
        {/* Daily Sales Line Chart */}
        <Box sx={{ flex: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Son 7 Gün Satış Trendi
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(102, 126, 234, 0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#666"
                  fontSize={12}
                />
                <YAxis 
                  stroke="#666"
                  fontSize={12}
                  tickFormatter={(value) => formatCurrency(value)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#667eea', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>
        
        {/* Sales by Machine Type Pie Chart */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            Makine Türü Dağılımı
          </Typography>
          <Box sx={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '12px', color: '#666' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

// Recent Alarms List Component
const RecentAlarmsList: React.FC = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [machines, setMachines] = useState<Record<string, Machine>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    // Load machines data first
    const machinesRef = ref(database, 'machines');
    const unsubscribeMachines = onValue(machinesRef, (snapshot) => {
      const machinesData: Record<string, Machine> = snapshot.val() || {};
      setMachines(machinesData);
    });

    // Load alarms data
    const alarmsRef = query(ref(database, 'alarms'), orderByChild('timestamp'), limitToLast(10));
    const unsubscribeAlarms = onValue(alarmsRef, (snapshot) => {
      const alarmsData: Record<string, Alarm> = snapshot.val() || {};
      const alarmsList = Object.values(alarmsData)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAlarms(alarmsList);
      setLoading(false);
    });

    return () => {
      off(machinesRef, 'value', unsubscribeMachines);
      off(alarmsRef, 'value', unsubscribeAlarms);
    };
  }, []); // Only run once on mount

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  // Get machine name with serial number, fallback to machine ID
  const getMachineName = (machineId: string): string => {
    const machine = machines[machineId];
    return machine ? `${machine.name} (${machine.serialNumber})` : machineId;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (alarms.length === 0) {
    return (
      <Box
        sx={{
          height: 320,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(102, 187, 106, 0.1) 100%)',
          border: '2px dashed rgba(46, 125, 50, 0.3)',
        }}
      >
        <WarningIcon sx={{ fontSize: 48, color: 'rgba(46, 125, 50, 0.5)', mb: 2 }} />
        <Typography color="textSecondary" variant="h6">
          {t('dashboard.noRecentAlarms')}
        </Typography>
        <Typography color="textSecondary" variant="body2">
          {t('dashboard.systemsRunning')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: 320 }}>
      <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
        {alarms.map((alarm, index) => (
          <Fade in timeout={300 + index * 100} key={alarm.id}>
            <Card
              elevation={0}
              sx={{
                mb: 2,
                p: 2.5,
                background: getSeverityColor(alarm.severity) === 'error' 
                  ? 'linear-gradient(135deg, rgba(211, 47, 47, 0.05) 0%, rgba(244, 67, 54, 0.05) 100%)'
                  : getSeverityColor(alarm.severity) === 'warning'
                  ? 'linear-gradient(135deg, rgba(237, 108, 2, 0.05) 0%, rgba(255, 152, 0, 0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(33, 150, 243, 0.05) 100%)',
                border: `1px solid ${
                  getSeverityColor(alarm.severity) === 'error' 
                    ? 'rgba(211, 47, 47, 0.2)'
                    : getSeverityColor(alarm.severity) === 'warning'
                    ? 'rgba(237, 108, 2, 0.2)'
                    : 'rgba(25, 118, 210, 0.2)'
                }`,
                borderRadius: 2,
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateX(4px)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    flex: 1,
                    mr: 2
                  }}
                >
                  {alarm.message}
                </Typography>
                <Chip
                  label={alarm.severity.toUpperCase()}
                  size="small"
                  color={getSeverityColor(alarm.severity) as any}
                  sx={{
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    fontSize: '0.7rem'
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography 
                  variant="caption" 
                  sx={{
                    color: 'text.secondary',
                    backgroundColor: 'rgba(0,0,0,0.04)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontWeight: 500
                  }}
                >
                  Machine: {getMachineName(alarm.machineId)}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{
                    color: 'text.secondary',
                    fontWeight: 500
                  }}
                >
                  {new Date(alarm.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </Card>
          </Fade>
        ))}
      </Box>
    </Box>
  );
};

// Machine Status Component - Shows temperature and cleaning status
const MachineStatusComponent: React.FC = () => {
  const [machines, setMachines] = useState<Record<string, Machine>>({});
  const [telemetryData, setTelemetryData] = useState<Record<string, TelemetryData>>({});
  const [loading, setLoading] = useState(true);
  const [machinesLoaded, setMachinesLoaded] = useState(false);

  useEffect(() => {
    const machinesRef = ref(database, 'machines');
    const unsubscribeMachines = onValue(machinesRef, (snapshot) => {
      const machinesData: Record<string, Machine> = snapshot.val() || {};
      setMachines(machinesData);
      setMachinesLoaded(true); // Mark that we've loaded machines
    });

    return () => {
      off(machinesRef, 'value', unsubscribeMachines);
    };
  }, []); // Only run once on mount

  // Real-time telemetry listener
  useEffect(() => {
    if (!machinesLoaded) return; // Don't run until machines are loaded
    
    const machineIds = Object.keys(machines);
    if (machineIds.length === 0) {
      setLoading(false);
      return;
    }
    
    // Real-time telemetry listeners
    const telemetryUnsubscribers: (() => void)[] = [];
    
    machineIds.forEach(machineId => {
      const telemetryRef = ref(database, `machines/${machineId}/telemetry`);
      const unsubscribe = onValue(telemetryRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const latestTelemetry = Object.values(data)[0] as TelemetryData;
          setTelemetryData(prev => ({
            ...prev,
            [machineId]: latestTelemetry
          }));
        }
        setLoading(false);
      });
      telemetryUnsubscribers.push(unsubscribe);
    });
    
    return () => {
      telemetryUnsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [machines, machinesLoaded]); // Depend on machines and machinesLoaded

  const getTemperatureColor = (temperature: number, machineType: string): string => {
    switch (machineType) {
      case 'ice_cream':
        return temperature <= -20 ? '#2e7d32' : temperature <= -10 ? '#ff9800' : '#d32f2f';
      case 'snack':
        return temperature >= 4 && temperature <= 25 ? '#2e7d32' : '#ff9800';
      case 'coffee':
        return temperature >= 65 && temperature <= 95 ? '#2e7d32' : '#ff9800';
      default:
        return '#666';
    }
  };

  const getCleaningStatusColor = (daysSinceLastCleaning: number, machineType: string): string => {
    const maxDays = machineType === 'ice_cream' ? 7 : machineType === 'coffee' ? 2 : 30;
    
    if (daysSinceLastCleaning >= maxDays) return '#d32f2f';
    if (daysSinceLastCleaning >= maxDays * 0.7) return '#ff9800';
    return '#2e7d32';
  };

  if (loading && machinesLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  const machinesList = Object.values(machines);
  const iceCreamMachines = machinesList.filter(m => m.type === 'ice_cream');
  const coffeeMachines = machinesList.filter(m => m.type === 'coffee');
  const snackMachines = machinesList.filter(m => m.type === 'snack');

  return (
    <Box sx={{ height: 320 }}>
      <Typography 
        variant="subtitle1" 
        gutterBottom
        sx={{ 
          fontWeight: 600,
          color: 'primary.main',
          mb: 3
        }}
      >
        Makine Durumu ve Temizlik
      </Typography>
      
      <Box sx={{ maxHeight: 320, overflowY: 'auto', pr: 1 }}>
        {/* Ice Cream Machines */}
        {iceCreamMachines.map((machine, index) => {
          const telemetry = telemetryData[machine.id];
          const temperature = telemetry?.temperatureReadings?.internalTemperature;
          const cleaningStatus = telemetry?.cleaningStatus;
          const daysSinceCleaning = cleaningStatus?.daysSinceLastCleaning || 999;
          
          return (
            <Fade in timeout={300 + index * 100} key={machine.id}>
              <Card
                elevation={0}
                sx={{
                  mb: 2,
                  p: 2.5,
                  background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.05) 0%, rgba(30, 136, 229, 0.05) 100%)',
                  border: '1px solid rgba(33, 150, 243, 0.2)',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      flex: 1,
                      mr: 2
                    }}
                  >
                    🍦 {machine.name}
                  </Typography>
                  <Chip
                    label="Dondurma"
                    size="small"
                    color="info"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TemperatureIcon sx={{ fontSize: 16, color: getTemperatureColor(temperature || 0, 'ice_cream') }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Sıcaklık: {temperature ? `${temperature}°C` : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CleaningIcon sx={{ fontSize: 16, color: getCleaningStatusColor(daysSinceCleaning, 'ice_cream') }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Temizlik: {daysSinceCleaning === 999 ? 'Hiç' : `${daysSinceCleaning} gün önce`}
                    </Typography>
                  </Box>
                </Box>
                
                {telemetry?.salesData && (
                  <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(33, 150, 243, 0.1)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                      💰 Bugün: {telemetry.salesData.todaySales}₺ ({telemetry.salesData.todayTransactions} işlem)
                    </Typography>
                  </Box>
                )}
                
              </Card>
            </Fade>
          );
        })}

        {/* Coffee Machines */}
        {coffeeMachines.map((machine, index) => {
          const telemetry = telemetryData[machine.id];
          const temperature = telemetry?.temperatureReadings?.internalTemperature;
          const cleaningStatus = telemetry?.cleaningStatus;
          const daysSinceCleaning = cleaningStatus?.daysSinceLastCleaning || 999;
          
          return (
            <Fade in timeout={300 + (iceCreamMachines.length + index) * 100} key={machine.id}>
              <Card
                elevation={0}
                sx={{
                  mb: 2,
                  p: 2.5,
                  background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.05) 0%, rgba(160, 82, 45, 0.05) 100%)',
                  border: '1px solid rgba(139, 69, 19, 0.2)',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      flex: 1,
                      mr: 2
                    }}
                  >
                    ☕ {machine.name}
                  </Typography>
                  <Chip
                    label="Kahve"
                    size="small"
                    sx={{ 
                      backgroundColor: '#8B4513', 
                      color: 'white',
                      fontWeight: 600, 
                      fontSize: '0.7rem' 
                    }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TemperatureIcon sx={{ fontSize: 16, color: getTemperatureColor(temperature || 0, 'coffee') }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Sıcaklık: {temperature ? `${temperature}°C` : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CleaningIcon sx={{ fontSize: 16, color: getCleaningStatusColor(daysSinceCleaning, 'coffee') }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Temizlik: {daysSinceCleaning === 999 ? 'Hiç' : `${daysSinceCleaning} gün önce`}
                    </Typography>
                  </Box>
                </Box>
                
                {telemetry?.salesData && (
                  <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(139, 69, 19, 0.1)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: '#8B4513', fontWeight: 600 }}>
                      💰 Bugün: {telemetry.salesData.todaySales}₺ ({telemetry.salesData.todayTransactions} işlem)
                    </Typography>
                  </Box>
                )}
                
              </Card>
            </Fade>
          );
        })}

        {/* Snack Machines */}
        {snackMachines.slice(0, 3).map((machine, index) => {
          const telemetry = telemetryData[machine.id];
          const temperature = telemetry?.temperatureReadings?.internalTemperature;
          const cleaningStatus = telemetry?.cleaningStatus;
          const daysSinceCleaning = cleaningStatus?.daysSinceLastCleaning || 999;
          
          return (
            <Fade in timeout={300 + (iceCreamMachines.length + coffeeMachines.length + index) * 100} key={machine.id}>
              <Card
                elevation={0}
                sx={{
                  mb: 2,
                  p: 2.5,
                  background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(56, 142, 60, 0.05) 100%)',
                  border: '1px solid rgba(46, 125, 50, 0.2)',
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateX(4px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      flex: 1,
                      mr: 2
                    }}
                  >
                    🥤 {machine.name}
                  </Typography>
                  <Chip
                    label="Atıştırmalık"
                    size="small"
                    color="success"
                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                  />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TemperatureIcon sx={{ fontSize: 16, color: getTemperatureColor(temperature || 0, 'snack') }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Sıcaklık: {temperature ? `${temperature}°C` : 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CleaningIcon sx={{ fontSize: 16, color: getCleaningStatusColor(daysSinceCleaning, 'snack') }} />
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Temizlik: {daysSinceCleaning === 999 ? 'Hiç' : `${daysSinceCleaning} gün önce`}
                    </Typography>
                  </Box>
                </Box>
                
                {telemetry?.salesData && (
                  <Box sx={{ mt: 1, p: 1, backgroundColor: 'rgba(46, 125, 50, 0.1)', borderRadius: 1 }}>
                    <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 600 }}>
                      💰 Bugün: {telemetry.salesData.todaySales}₺ ({telemetry.salesData.todayTransactions} işlem)
                    </Typography>
                  </Box>
                )}
                
              </Card>
            </Fade>
          );
        })}

        {machinesList.length === 0 && (
          <Box
            sx={{
              height: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 2,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
              border: '2px dashed rgba(102, 126, 234, 0.3)',
            }}
          >
            <DeviceHub sx={{ fontSize: 48, color: 'rgba(102, 126, 234, 0.5)', mb: 2 }} />
            <Typography color="textSecondary" variant="h6">
              Henüz makine bulunmuyor
            </Typography>
            <Typography color="textSecondary" variant="body2">
              Makine ekledikten sonra durum bilgileri burada görünecek
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// StatCard Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, onClick }) => (
  <Card 
    elevation={0}
    onClick={onClick}
    sx={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: onClick ? 'pointer' : 'default',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 20px rgba(0,0,0,0.15)',
      },
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `linear-gradient(135deg, ${color}22 0%, ${color}44 100%)`,
        zIndex: 1,
      }
    }}
  >
    <CardContent sx={{ position: 'relative', zIndex: 2, p: { xs: 2, sm: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexDirection: { xs: 'column', sm: 'row' },
        textAlign: { xs: 'center', sm: 'left' },
        gap: { xs: 1, sm: 0 }
      }}>
        <Box sx={{ order: { xs: 2, sm: 1 } }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: 'rgba(255,255,255,0.8)', 
              mb: 1,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: 1,
              fontSize: { xs: '0.7rem', sm: '0.75rem' }
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h3"
            component="div" 
            sx={{ 
              fontWeight: 700, 
              color: 'white',
              lineHeight: 1.2,
              fontSize: { xs: '1.5rem', sm: '2.125rem' }
            }}
          >
            {value}
          </Typography>
        </Box>
        <Avatar
          sx={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            width: { xs: 48, sm: 64 },
            height: { xs: 48, sm: 64 },
            order: { xs: 1, sm: 2 },
            '& .MuiSvgIcon-root': {
              fontSize: { xs: '1.5rem', sm: '2rem' },
              color: 'white'
            }
          }}
        >
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const { t, formatCurrency } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMachines: 0,
    onlineMachines: 0,
    activeAlarms: 0,
    todaySales: 0,
    todayProfit: 0,
    todayCost: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const machinesRef = ref(database, 'machines');
    const alarmsRef = ref(database, 'alarms');
    const salesRef = ref(database, 'sales');

    const unsubscribeMachines = onValue(machinesRef, (snapshot) => {
      const machines: Record<string, Machine> = snapshot.val() || {};
      const allMachines = Object.values(machines);
      
      // Filter out invalid machines (undefined name, serialNumber, or id)
      const machinesList = allMachines.filter(machine => 
        machine && 
        machine.id && 
        machine.name && 
        machine.serialNumber &&
        machine.name !== 'undefined' &&
        machine.serialNumber !== 'undefined'
      );
      
      const totalMachines = machinesList.length;
      
      // Use the same logic as the heartbeat system - check actual heartbeat data
      const heartbeatRef = ref(database, 'heartbeat');
      get(heartbeatRef).then((heartbeatSnapshot) => {
        let onlineMachines = 0;
        
        if (heartbeatSnapshot.exists()) {
          const heartbeatData = heartbeatSnapshot.val();
          const now = Date.now();
          const offlineThreshold = 5 * 60 * 1000; // 5 minutes (consistent with RealIoTMonitoringService)
          
          // Check each machine in the machines list against heartbeat data
          for (const machine of machinesList) {
            const machineHeartbeat = heartbeatData[machine.id];
            
            if (machineHeartbeat && machineHeartbeat.lastSeen && typeof machineHeartbeat.lastSeen === 'number') {
              const timeDiff = now - machineHeartbeat.lastSeen;
              // Machine is online if heartbeat is recent (regardless of stored status)
              if (timeDiff <= offlineThreshold) {
                onlineMachines++;
                console.log(`✅ Makine ${machine.name} (${machine.serialNumber}) ÇEVRİMİÇİ - son görülme ${Math.floor(timeDiff / 1000)}s önce`);
              } else {
                console.log(`❌ Makine ${machine.name} (${machine.serialNumber}) ÇEVRİMDIŞI - son görülme ${Math.floor(timeDiff / 1000)}s önce`);
              }
            } else {
              console.log(`❌ Makine ${machine.name} (${machine.serialNumber}) HEARTBEAT VERİSİ YOK`);
            }
          }
        } else {
          console.log('❌ No heartbeat data found in Firebase');
        }
        
        console.log(`📊 Dashboard: ${onlineMachines}/${totalMachines} makine çevrimiçi`);
        
        setStats(prev => ({
          ...prev,
          totalMachines,
          onlineMachines
        }));
      }).catch(error => {
        console.error('Error getting heartbeat data for dashboard:', error);
        // Fallback to old method if heartbeat fails
        const onlineMachines = machinesList.filter(machine => {
          if (!machine.connectionInfo.lastHeartbeat) return false;
          const lastHeartbeat = new Date(machine.connectionInfo.lastHeartbeat);
          const now = new Date();
          const diffMinutes = (now.getTime() - lastHeartbeat.getTime()) / (1000 * 60);
          return diffMinutes <= 5; // 5 minutes (consistent with RealIoTMonitoringService)
        }).length;
        
        setStats(prev => ({
          ...prev,
          totalMachines,
          onlineMachines
        }));
      });
    });

    const unsubscribeAlarms = onValue(alarmsRef, (snapshot) => {
      const alarms: Record<string, Alarm> = snapshot.val() || {};
      const alarmsList = Object.values(alarms);
      const activeAlarms = alarmsList.filter(alarm => 
        alarm.status === 'active'
      ).length;

      setStats(prev => ({
        ...prev,
        activeAlarms
      }));
    });

    const unsubscribeSales = onValue(salesRef, (snapshot) => {
      const sales: Record<string, Sale> = snapshot.val() || {};
      const salesList = Object.values(sales);
      
      // Calculate today's sales
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const todaySalesData = salesList.filter(sale => {
        const saleDate = new Date(sale.timestamp);
        return saleDate >= todayStart;
      });

      const todaySales = todaySalesData.reduce((total, sale) => total + sale.totalAmount, 0);
      const todayCost = todaySalesData.reduce((total, sale) => total + sale.costPrice, 0);
      const todayProfit = todaySales - todayCost;

      setStats(prev => ({
        ...prev,
        todaySales,
        todayCost,
        todayProfit
      }));
      
      setLoading(false);
    });

    // Error handling for sales - in case there are no sales today
    const timer = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      off(machinesRef, 'value', unsubscribeMachines);
      off(alarmsRef, 'value', unsubscribeAlarms);
      off(salesRef, 'value', unsubscribeSales);
      clearTimeout(timer);
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
      <Fade in timeout={600}>
        <Box className="page-fade-up">
          <Typography 
            variant="h3"
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: { xs: 3, sm: 4 },
              textAlign: { xs: 'center', sm: 'left' },
              fontSize: { xs: '2rem', sm: '3rem' }
            }}
          >
            {t('dashboard.title')}
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={{ xs: 2, sm: 3 }} 
            sx={{ mb: { xs: 3, sm: 5 } }}
            className="stagger-animation"
          >
            <Slide direction="up" in timeout={800}>
              <Box sx={{ flex: 1 }} className="hover-lift">
                <StatCard
                  title={t('dashboard.totalMachines')}
                  value={stats.totalMachines}
                  icon={<MachinesIcon />}
                  color="#1976d2"
                  onClick={() => navigate('/machines')}
                />
              </Box>
            </Slide>
            <Slide direction="up" in timeout={1000}>
              <Box sx={{ flex: 1 }} className="hover-lift">
                <StatCard
                  title={t('dashboard.onlineMachines')}
                  value={stats.onlineMachines}
                  icon={<TrendingUpIcon />}
                  color="#2e7d32"
                  onClick={() => navigate('/machines')}
                />
              </Box>
            </Slide>
            <Slide direction="up" in timeout={1200}>
              <Box sx={{ flex: 1 }} className="hover-lift">
                <StatCard
                  title={t('dashboard.activeAlarms')}
                  value={stats.activeAlarms}
                  icon={<WarningIcon />}
                  color="#d32f2f"
                  onClick={() => navigate('/alarms')}
                />
              </Box>
            </Slide>
            <Slide direction="up" in timeout={1400}>
              <Box sx={{ flex: 1 }} className="hover-lift">
                <StatCard
                  title={t('dashboard.todaySales')}
                  value={formatCurrency(stats.todaySales)}
                  icon={<MoneyIcon />}
                  color="#ed6c02"
                  onClick={() => navigate('/reports')}
                />
              </Box>
            </Slide>
          </Stack>
          
          {/* Second row - Profit/Cost cards */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 4 }}>
            <Slide direction="up" in timeout={1600}>
              <Box sx={{ flex: 1 }} className="hover-lift">
                <StatCard
                  title="Bugünkü Kar"
                  value={formatCurrency(stats.todayProfit)}
                  icon={<TrendingUpIcon />}
                  color={stats.todayProfit >= 0 ? "#2e7d32" : "#d32f2f"}
                  onClick={() => navigate('/reports')}
                />
              </Box>
            </Slide>
            <Slide direction="up" in timeout={1800}>
              <Box sx={{ flex: 1 }} className="hover-lift">
                <StatCard
                  title="Bugünkü Maliyet"
                  value={formatCurrency(stats.todayCost)}
                  icon={<MoneyIcon />}
                  color="#9c27b0"
                  onClick={() => navigate('/reports')}
                />
              </Box>
            </Slide>
            <Slide direction="up" in timeout={2000}>
              <Box sx={{ flex: 1 }} className="hover-lift">
                <StatCard
                  title="Kar Marjı"
                  value={`${stats.todaySales > 0 ? ((stats.todayProfit / stats.todaySales) * 100).toFixed(1) : 0}%`}
                  icon={<TrendingUpIcon />}
                  color={stats.todayProfit >= 0 ? "#2e7d32" : "#d32f2f"}
                  onClick={() => navigate('/reports')}
                />
              </Box>
            </Slide>
          </Stack>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4}>
            <Slide direction="left" in timeout={1600}>
              <Box sx={{ flex: 2 }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 4, 
                    borderRadius: 3,
                    background: '#ffffff',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                    minHeight: 450
                  }}
                >
                  <Typography 
                    variant="h5" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: 3
                    }}
                  >
                    {t('dashboard.salesTrend')}
                  </Typography>
                  <RecentSalesChart />
                </Paper>
              </Box>
            </Slide>
            <Slide direction="right" in timeout={1800}>
              <Box sx={{ flex: 1 }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 2, sm: 4 }, 
                    borderRadius: 3,
                    background: '#ffffff',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                    minHeight: { xs: 300, sm: 450 }
                  }}
                >
                  <Typography 
                    variant="h5"
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: { xs: 2, sm: 3 },
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    {t('dashboard.recentAlarms')}
                  </Typography>
                  <RecentAlarmsList />
                </Paper>
              </Box>
            </Slide>
          </Stack>

          {/* Third row - Machine Status and Cleaning */}
          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={4} sx={{ mt: 4 }}>
            <Slide direction="left" in timeout={2000}>
              <Box sx={{ flex: 1 }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 2, sm: 4 }, 
                    borderRadius: 3,
                    background: '#ffffff',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                    minHeight: { xs: 300, sm: 450 }
                  }}
                >
                  <Typography 
                    variant="h5"
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: { xs: 2, sm: 3 },
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    Makine Durumu ve Temizlik
                  </Typography>
                  <MachineStatusComponent />
                </Paper>
              </Box>
            </Slide>
            <Slide direction="right" in timeout={2200}>
              <Box sx={{ flex: 1 }}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 2, sm: 4 }, 
                    borderRadius: 3,
                    background: '#ffffff',
                    border: '1px solid rgba(102, 126, 234, 0.1)',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                    minHeight: { xs: 300, sm: 450 }
                  }}
                >
                  <Typography 
                    variant="h5"
                    gutterBottom
                    sx={{ 
                      fontWeight: 600,
                      color: 'text.primary',
                      mb: { xs: 2, sm: 3 },
                      fontSize: { xs: '1.25rem', sm: '1.5rem' }
                    }}
                  >
                    Temizlik Gereksinimleri
                  </Typography>
                  <Box sx={{ 
                    height: 320, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.05) 0%, rgba(56, 142, 60, 0.05) 100%)',
                    borderRadius: 2,
                    border: '2px dashed rgba(46, 125, 50, 0.3)'
                  }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <CleaningIcon sx={{ fontSize: 48, color: 'rgba(46, 125, 50, 0.5)', mb: 2 }} />
                      <Typography color="textSecondary" variant="h6">
                        Temizlik Takibi
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        Dondurma otomatları: 7 günde bir<br/>
                        Kahve otomatları: 2 günde bir (max 1 hafta)
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Slide>
          </Stack>
        </Box>
      </Fade>
    </Container>
  );
};

export default Dashboard;