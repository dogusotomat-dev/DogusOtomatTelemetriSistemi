import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Fade,
  Slide,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Tabs,
  Tab,
  AppBar,
  Divider,
  Collapse,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Assessment as ReportsIcon,
  PictureAsPdf as PdfIcon,
  BarChart as ChartIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import { Machine } from '../../types';

// Sample machine data
const sampleMachines: Machine[] = [
  { 
    id: '1', 
    serialNumber: 'SN-001', 
    type: 'snack', 
    model: 'DGS-D900-9C(55SP)', 
    name: 'Atıştırmalık Otomatı 1',
    iotNumber: 'IOT-001',
    location: { address: 'İstanbul Şubesi - Giriş Katı' },
    connectionInfo: { lastHeartbeat: '', status: 'online', version: '1.0' },
    configuration: {
      slots: {},
      settings: { modes: [], currentMode: 'normal', features: {}, capabilities: { hasTemperatureControl: false, hasAutoCleaning: false, supportedPayments: [] } },
      notifications: { emailAddresses: [], enableOfflineAlerts: true, enableErrorAlerts: true, alertThresholdMinutes: 2 }
    },
    createdAt: '',
    updatedAt: ''
  },
  { 
    id: '2', 
    serialNumber: 'SN-002', 
    type: 'ice_cream', 
    model: 'DGS-DSIVM', 
    name: 'Dondurma Otomatı 1',
    iotNumber: 'IOT-002',
    location: { address: 'Ankara Şubesi - Kafe Alanı' },
    connectionInfo: { lastHeartbeat: '', status: 'online', version: '1.0' },
    configuration: {
      slots: {},
      settings: { modes: [], currentMode: 'normal', features: {}, capabilities: { hasTemperatureControl: false, hasAutoCleaning: false, supportedPayments: [] } },
      notifications: { emailAddresses: [], enableOfflineAlerts: true, enableErrorAlerts: true, alertThresholdMinutes: 2 }
    },
    createdAt: '',
    updatedAt: ''
  },
  { 
    id: '3', 
    serialNumber: 'SN-003', 
    type: 'coffee', 
    model: 'DGS-JK86', 
    name: 'Kahve Otomatı 1',
    iotNumber: 'IOT-003',
    location: { address: 'İzmir Şubesi - Personel Girişi' },
    connectionInfo: { lastHeartbeat: '', status: 'online', version: '1.0' },
    configuration: {
      slots: {},
      settings: { modes: [], currentMode: 'normal', features: {}, capabilities: { hasTemperatureControl: false, hasAutoCleaning: false, supportedPayments: [] } },
      notifications: { emailAddresses: [], enableOfflineAlerts: true, enableErrorAlerts: true, alertThresholdMinutes: 2 }
    },
    createdAt: '',
    updatedAt: ''
  },
];

// Sample sales data
const sampleSalesData = [
  { id: 1, machineId: '1', machineName: 'Atıştırmalık Otomatı 1', date: '2023-05-15', totalSales: 1250.50, transactions: 85, profit: 720.25, topProduct: 'Çikolata' },
  { id: 2, machineId: '1', machineName: 'Atıştırmalık Otomatı 1', date: '2023-05-14', totalSales: 980.75, transactions: 68, profit: 560.30, topProduct: 'Gazlı İçecek' },
  { id: 3, machineId: '1', machineName: 'Atıştırmalık Otomatı 1', date: '2023-05-13', totalSales: 1100.25, transactions: 75, profit: 630.15, topProduct: 'Cips' },
  { id: 4, machineId: '2', machineName: 'Dondurma Otomatı 1', date: '2023-05-15', totalSales: 2100.00, transactions: 120, profit: 1450.00, topProduct: 'Çilekli Dondurma' },
  { id: 5, machineId: '2', machineName: 'Dondurma Otomatı 1', date: '2023-05-14', totalSales: 1850.50, transactions: 105, profit: 1280.75, topProduct: 'Vanilyalı Dondurma' },
  { id: 6, machineId: '3', machineName: 'Kahve Otomatı 1', date: '2023-05-15', totalSales: 1650.75, transactions: 95, profit: 1120.50, topProduct: 'Espresso' },
  { id: 7, machineId: '3', machineName: 'Kahve Otomatı 1', date: '2023-05-14', totalSales: 1420.25, transactions: 82, profit: 980.25, topProduct: 'Latte' },
];

// Sample report data
const sampleReports = [
  { id: 1, name: 'Günlük Satış Raporu', date: '2023-05-15', type: 'Günlük', status: 'Hazır', generatedBy: 'Sistem', machineId: '1' },
  { id: 2, name: 'Haftalık Makine Performansı', date: '2023-05-14', type: 'Haftalık', status: 'Hazır', generatedBy: 'Ahmet Yılmaz', machineId: '2' },
  { id: 3, name: 'Aylık Gelir-Gider Analizi', date: '2023-04-30', type: 'Aylık', status: 'Hazır', generatedBy: 'Sistem', machineId: '3' },
  { id: 4, name: 'Ürün Satış İstatistikleri', date: '2023-05-10', type: 'Özel', status: 'Hazır', generatedBy: 'Mehmet Kaya', machineId: '1' },
  { id: 5, name: 'Makine Arıza Raporu', date: '2023-05-05', type: 'Özel', status: 'Hazır', generatedBy: 'Sistem', machineId: '2' },
];

// Sample detailed transaction data
const sampleTransactionData = [
  { id: 1, machineId: '1', machineName: 'Atıştırmalık Otomatı 1', slot: 1, product: 'Çikolata', amount: 5.50, status: 'Başarılı', timestamp: '2023-05-15 14:30:22' },
  { id: 2, machineId: '1', machineName: 'Atıştırmalık Otomatı 1', slot: 2, product: 'Gazlı İçecek', amount: 7.00, status: 'Başarılı', timestamp: '2023-05-15 14:32:15' },
  { id: 3, machineId: '1', machineName: 'Atıştırmalık Otomatı 1', slot: 1, product: 'Çikolata', amount: 5.50, status: 'Başarısız', timestamp: '2023-05-15 14:35:41' },
  { id: 4, machineId: '2', machineName: 'Dondurma Otomatı 1', slot: 1, product: 'Vanilyalı Dondurma', amount: 12.00, status: 'Başarılı', timestamp: '2023-05-15 14:40:10' },
  { id: 5, machineId: '2', machineName: 'Dondurma Otomatı 1', slot: 2, product: 'Çilekli Dondurma', amount: 12.00, status: 'Başarılı', timestamp: '2023-05-15 14:42:33' },
  { id: 6, machineId: '3', machineName: 'Kahve Otomatı 1', slot: 1, product: 'Espresso', amount: 8.50, status: 'Başarılı', timestamp: '2023-05-15 14:45:27' },
  { id: 7, machineId: '3', machineName: 'Kahve Otomatı 1', slot: 2, product: 'Latte', amount: 10.00, status: 'Başarılı', timestamp: '2023-05-15 14:47:55' },
  { id: 8, machineId: '1', machineName: 'Atıştırmalık Otomatı 1', slot: 3, product: 'Cips', amount: 6.00, status: 'Başarılı', timestamp: '2023-05-15 14:50:12' },
];

const Reports: React.FC = () => {
  const { t } = useLanguage();
  const [machines] = useState<Machine[]>(sampleMachines);
  const [salesData] = useState(sampleSalesData);
  const [reports] = useState(sampleReports);
  const [transactionData] = useState(sampleTransactionData); // Add transaction data
  const [selectedMachine, setSelectedMachine] = useState<string>('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  
  // Additional filters
  const [machineTypeFilter, setMachineTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Filter sales data based on selections
  const filteredSalesData = salesData.filter(sale => {
    if (selectedMachine !== 'all' && sale.machineId !== selectedMachine) return false;
    if (dateRange.start && sale.date < dateRange.start) return false;
    if (dateRange.end && sale.date > dateRange.end) return false;
    if (searchTerm && !sale.machineName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Machine type filter
    if (machineTypeFilter !== 'all') {
      const machine = machines.find(m => m.id === sale.machineId);
      if (!machine || machine.type !== machineTypeFilter) return false;
    }
    
    return true;
  });

  // Filter transaction data based on selections
  const filteredTransactionData = transactionData.filter(transaction => {
    if (selectedMachine !== 'all' && transaction.machineId !== selectedMachine) return false;
    if (dateRange.start && transaction.timestamp.split(' ')[0] < dateRange.start) return false;
    if (dateRange.end && transaction.timestamp.split(' ')[0] > dateRange.end) return false;
    if (searchTerm && !transaction.machineName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    // Machine type filter
    if (machineTypeFilter !== 'all') {
      const machine = machines.find(m => m.id === transaction.machineId);
      if (!machine || machine.type !== machineTypeFilter) return false;
    }
    
    // Status filter
    if (statusFilter !== 'all' && transaction.status !== statusFilter) return false;
    
    return true;
  });

  // Pagination calculations for sales data
  const totalPagesSales = Math.ceil(filteredSalesData.length / itemsPerPage);
  const startIndexSales = (currentPage - 1) * itemsPerPage;
  const endIndexSales = startIndexSales + itemsPerPage;
  const currentSalesData = filteredSalesData.slice(startIndexSales, endIndexSales);

  // Pagination calculations for transaction data
  const totalPagesTransactions = Math.ceil(filteredTransactionData.length / itemsPerPage);
  const startIndexTransactions = (currentPage - 1) * itemsPerPage;
  const endIndexTransactions = startIndexTransactions + itemsPerPage;
  const currentTransactionData = filteredTransactionData.slice(startIndexTransactions, endIndexTransactions);

  // Pagination calculations for reports (fix the issue here)
  const totalPagesReports = Math.ceil(reports.length / itemsPerPage);
  const startIndexReports = (currentPage - 1) * itemsPerPage;
  const endIndexReports = startIndexReports + itemsPerPage;
  const currentReports = reports.slice(startIndexReports, endIndexReports);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hazır': return 'success';
      case 'Oluşturuluyor': return 'warning';
      case 'Başarılı': return 'success'; // Add for transaction status
      case 'Başarısız': return 'error'; // Add for transaction status
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Günlük': return 'primary';
      case 'Haftalık': return 'secondary';
      case 'Aylık': return 'info';
      case 'Özel': return 'warning';
      default: return 'default';
    }
  };

  const toggleReportExpansion = (reportId: number) => {
    setExpandedReport(expandedReport === reportId ? null : reportId);
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const totalSales = filteredSalesData.reduce((sum, sale) => sum + sale.totalSales, 0);
    const totalTransactions = filteredSalesData.reduce((sum, sale) => sum + sale.transactions, 0);
    const totalProfit = filteredSalesData.reduce((sum, sale) => sum + sale.profit, 0);
    
    return {
      totalSales,
      totalTransactions,
      totalProfit,
      averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0
    };
  };

  const summary = calculateSummary();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box className="page-fade-up">
          <Slide direction="down" in timeout={800}>
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
                {t('reports.title')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                sx={{
                  borderRadius: 3,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #654192 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                  },
                  transition: 'all 0.3s ease'
                }}
              >
                {t('reports.exportReport')}
              </Button>
            </Box>
          </Slide>

          {/* Summary Cards */}
          <Slide direction="up" in timeout={1000}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
              <Box>
                <Card 
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography color="rgba(255, 255, 255, 0.8)" variant="body2">
                          Toplam Satış
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                          {summary.totalSales.toFixed(2)} ₺
                        </Typography>
                      </Box>
                      <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card 
                  sx={{ 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)'
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography color="rgba(255, 255, 255, 0.8)" variant="body2">
                          Toplam İşlem
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                          {summary.totalTransactions}
                        </Typography>
                      </Box>
                      <InventoryIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card 
                  sx={{ 
                    background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(67, 233, 123, 0.3)'
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography color="rgba(255, 255, 255, 0.8)" variant="body2">
                          Toplam Kâr
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                          {summary.totalProfit.toFixed(2)} ₺
                        </Typography>
                      </Box>
                      <ChartIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card 
                  sx={{ 
                    background: 'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
                    color: 'white',
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(255, 154, 158, 0.3)'
                  }}
                >
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography color="rgba(255, 255, 255, 0.8)" variant="body2">
                          Ort. İşlem
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 700, mt: 1 }}>
                          {summary.averageTransaction.toFixed(2)} ₺
                        </Typography>
                      </Box>
                      <CalendarIcon sx={{ fontSize: 40, opacity: 0.7 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Slide>

          {/* Filters and Tabs */}
          <Slide direction="up" in timeout={1200}>
            <AppBar position="static" color="default" sx={{ mb: 3, borderRadius: 1 }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Satış Raporları" />
                <Tab label="İşlem Detayları" />
                <Tab label="Oluşturulan Raporlar" />
              </Tabs>
            </AppBar>
          </Slide>

          {activeTab === 0 && (
            <>
              {/* Filters */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
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
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, alignItems: 'center' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Makine Seç</InputLabel>
                    <Select
                      value={selectedMachine}
                      onChange={(e) => setSelectedMachine(e.target.value)}
                      label="Makine Seç"
                    >
                      <MenuItem value="all">Tüm Makineler</MenuItem>
                      {machines.map(machine => (
                        <MenuItem key={machine.id} value={machine.id}>
                          {machine.name} ({machine.serialNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Makine Türü</InputLabel>
                    <Select
                      value={machineTypeFilter}
                      onChange={(e) => setMachineTypeFilter(e.target.value)}
                      label="Makine Türü"
                    >
                      <MenuItem value="all">Tüm Türler</MenuItem>
                      <MenuItem value="snack">Atıştırmalık</MenuItem>
                      <MenuItem value="ice_cream">Dondurma</MenuItem>
                      <MenuItem value="coffee">Kahve</MenuItem>
                      <MenuItem value="perfume">Parfüm</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Makine ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Başlangıç Tarihi"
                    InputLabelProps={{ shrink: true }}
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Bitiş Tarihi"
                    InputLabelProps={{ shrink: true }}
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  />
                </Box>
              </Paper>

              {/* Sales Data Table */}
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
                      <TableRow sx={{ backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Makine</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tarih</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Toplam Satış (₺)</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>İşlem Sayısı</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Kâr (₺)</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>En Çok Satan</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentSalesData.map((sale) => (
                        <TableRow key={sale.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {sale.machineName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {machines.find(m => m.id === sale.machineId)?.serialNumber}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{sale.date}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                              {sale.totalSales.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>{sale.transactions}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1976d2' }}>
                              {sale.profit.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={sale.topProduct} 
                              size="small" 
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<PdfIcon />}
                              variant="outlined"
                              sx={{ mr: 1 }}
                            >
                              PDF
                            </Button>
                            <Button
                              size="small"
                              startIcon={<DownloadIcon />}
                              variant="outlined"
                            >
                              Excel
                            </Button>
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
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="textSecondary">
                    satış
                  </Typography>
                </Box>

                {/* Page info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    {filteredSalesData.length > 0 ? (
                      <>
                        {startIndexSales + 1}-{Math.min(endIndexSales, filteredSalesData.length)} / {filteredSalesData.length} satış
                      </>
                    ) : (
                      'Satış bulunamadı'
                    )}
                  </Typography>
                  
                  {/* Page navigation */}
                  {totalPagesSales > 1 && (
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
                          const endPage = Math.min(totalPagesSales, currentPage + 2);
                          
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
                              pages.push(<span key="start-ellipsis" style={{ padding: '0 8px' }}>...</span>);
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
                          
                          if (endPage < totalPagesSales) {
                            if (endPage < totalPagesSales - 1) {
                              pages.push(<span key="end-ellipsis" style={{ padding: '0 8px' }}>...</span>);
                            }
                            pages.push(
                              <Button
                                key={totalPagesSales}
                                size="small"
                                variant={totalPagesSales === currentPage ? "contained" : "text"}
                                onClick={() => handlePageChange(totalPagesSales)}
                                sx={{ minWidth: 32, height: 32 }}
                              >
                                {totalPagesSales}
                              </Button>
                            );
                          }
                          
                          return pages;
                        })()}
                      </Box>
                      
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={currentPage === totalPagesSales}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Sonraki
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={currentPage === totalPagesSales}
                        onClick={() => handlePageChange(totalPagesSales)}
                      >
                        Son
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </>
          )}

          {activeTab === 1 && (
            <>
              {/* Filters */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
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
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, alignItems: 'center' }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Makine Seç</InputLabel>
                    <Select
                      value={selectedMachine}
                      onChange={(e) => setSelectedMachine(e.target.value)}
                      label="Makine Seç"
                    >
                      <MenuItem value="all">Tüm Makineler</MenuItem>
                      {machines.map(machine => (
                        <MenuItem key={machine.id} value={machine.id}>
                          {machine.name} ({machine.serialNumber})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Makine Türü</InputLabel>
                    <Select
                      value={machineTypeFilter}
                      onChange={(e) => setMachineTypeFilter(e.target.value)}
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
                    <InputLabel>İşlem Durumu</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      label="İşlem Durumu"
                    >
                      <MenuItem value="all">Tüm Durumlar</MenuItem>
                      <MenuItem value="Başarılı">Başarılı</MenuItem>
                      <MenuItem value="Başarısız">Başarısız</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Makine ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Başlangıç Tarihi"
                    InputLabelProps={{ shrink: true }}
                    value={dateRange.start}
                    onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  />
                  <TextField
                    fullWidth
                    size="small"
                    type="date"
                    label="Bitiş Tarihi"
                    InputLabelProps={{ shrink: true }}
                    value={dateRange.end}
                    onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  />
                </Box>
              </Paper>

              {/* Transaction Data Table */}
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
                      <TableRow sx={{ backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Makine</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Slot</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Ürün</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tutar (₺)</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tarih/Saat</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentTransactionData.map((transaction) => (
                        <TableRow key={transaction.id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {transaction.machineName}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {machines.find(m => m.id === transaction.machineId)?.serialNumber}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{transaction.slot}</TableCell>
                          <TableCell>{transaction.product}</TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                              {transaction.amount.toFixed(2)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={transaction.status}
                              color={getStatusColor(transaction.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{transaction.timestamp}</TableCell>
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
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="textSecondary">
                    işlem
                  </Typography>
                </Box>

                {/* Page info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    {filteredTransactionData.length > 0 ? (
                      <>
                        {startIndexTransactions + 1}-{Math.min(endIndexTransactions, filteredTransactionData.length)} / {filteredTransactionData.length} işlem
                      </>
                    ) : (
                      'İşlem bulunamadı'
                    )}
                  </Typography>
                  
                  {/* Page navigation */}
                  {totalPagesTransactions > 1 && (
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
                          const endPage = Math.min(totalPagesTransactions, currentPage + 2);
                          
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
                              pages.push(<span key="start-ellipsis" style={{ padding: '0 8px' }}>...</span>);
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
                          
                          if (endPage < totalPagesTransactions) {
                            if (endPage < totalPagesTransactions - 1) {
                              pages.push(<span key="end-ellipsis" style={{ padding: '0 8px' }}>...</span>);
                            }
                            pages.push(
                              <Button
                                key={totalPagesTransactions}
                                size="small"
                                variant={totalPagesTransactions === currentPage ? "contained" : "text"}
                                onClick={() => handlePageChange(totalPagesTransactions)}
                                sx={{ minWidth: 32, height: 32 }}
                              >
                                {totalPagesTransactions}
                              </Button>
                            );
                          }
                          
                          return pages;
                        })()}
                      </Box>
                      
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={currentPage === totalPagesTransactions}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Sonraki
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={currentPage === totalPagesTransactions}
                        onClick={() => handlePageChange(totalPagesTransactions)}
                      >
                        Son
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </>
          )}

          {activeTab === 2 && (
            <>
              {/* Generated Reports Table */}
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
                      <TableRow sx={{ backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
                        <TableCell sx={{ fontWeight: 600 }}>Rapor Adı</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tarih</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Tür</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Oluşturan</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {currentReports.map((report) => (
                        <>
                          <TableRow key={report.id} hover>
                            <TableCell>
                              <Box display="flex" alignItems="center">
                                <ChartIcon sx={{ mr: 1, color: '#667eea' }} />
                                {report.name}
                              </Box>
                            </TableCell>
                            <TableCell>{report.date}</TableCell>
                            <TableCell>
                              <Chip 
                                label={report.type} 
                                color={getTypeColor(report.type)} 
                                size="small" 
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={report.status} 
                                color={getStatusColor(report.status)} 
                                size="small" 
                              />
                            </TableCell>
                            <TableCell>{report.generatedBy}</TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => toggleReportExpansion(report.id)}
                                sx={{ mr: 1 }}
                              >
                                {expandedReport === report.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                              <Button
                                size="small"
                                startIcon={<PdfIcon />}
                                variant="outlined"
                                sx={{ mr: 1 }}
                              >
                                PDF
                              </Button>
                              <Button
                                size="small"
                                startIcon={<DownloadIcon />}
                                variant="outlined"
                              >
                                Excel
                              </Button>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={6} sx={{ padding: 0, border: 0 }}>
                              <Collapse in={expandedReport === report.id} timeout="auto" unmountOnExit>
                                <Box sx={{ p: 2, backgroundColor: 'rgba(102, 126, 234, 0.05)' }}>
                                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Rapor Detayları</Typography>
                                      <Typography variant="body2">
                                        Bu rapor {report.date} tarihinde oluşturulmuştur. 
                                        {report.machineId && ` İlgili makine: ${machines.find(m => m.id === report.machineId)?.name}`}
                                      </Typography>
                                    </Box>
                                    <Box>
                                      <Typography variant="subtitle2" sx={{ mb: 1 }}>İşlem Geçmişi</Typography>
                                      <Typography variant="body2">
                                        Rapor oluşturulma tarihi: {report.date} | 
                                        Oluşturan: {report.generatedBy}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </>
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
                      <MenuItem value={5}>5</MenuItem>
                      <MenuItem value={10}>10</MenuItem>
                      <MenuItem value={20}>20</MenuItem>
                      <MenuItem value={50}>50</MenuItem>
                    </Select>
                  </FormControl>
                  <Typography variant="body2" color="textSecondary">
                    rapor
                  </Typography>
                </Box>

                {/* Page info */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    {reports.length > 0 ? (
                      <>
                        {startIndexReports + 1}-{Math.min(endIndexReports, reports.length)} / {reports.length} rapor
                      </>
                    ) : (
                      'Rapor bulunamadı'
                    )}
                  </Typography>
                  
                  {/* Page navigation */}
                  {totalPagesReports > 1 && (
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
                          const endPage = Math.min(totalPagesReports, currentPage + 2);
                          
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
                              pages.push(<span key="start-ellipsis" style={{ padding: '0 8px' }}>...</span>);
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
                          
                          if (endPage < totalPagesReports) {
                            if (endPage < totalPagesReports - 1) {
                              pages.push(<span key="end-ellipsis" style={{ padding: '0 8px' }}>...</span>);
                            }
                            pages.push(
                              <Button
                                key={totalPagesReports}
                                size="small"
                                variant={totalPagesReports === currentPage ? "contained" : "text"}
                                onClick={() => handlePageChange(totalPagesReports)}
                                sx={{ minWidth: 32, height: 32 }}
                              >
                                {totalPagesReports}
                              </Button>
                            );
                          }
                          
                          return pages;
                        })()}
                      </Box>
                      
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={currentPage === totalPagesReports}
                        onClick={() => handlePageChange(currentPage + 1)}
                      >
                        Sonraki
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={currentPage === totalPagesReports}
                        onClick={() => handlePageChange(totalPagesReports)}
                      >
                        Son
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </>
          )}
        </Box>
      </Fade>
    </Container>
  );
};

export default Reports;