import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Fade,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  Snackbar,
  Alert,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Card,
  CardContent,
  Tabs,
  Tab,
  AppBar,
  Avatar,
  InputLabel,
  Autocomplete,
  Tooltip,
  FormControlLabel,
  Checkbox,
  FormHelperText,
} from '@mui/material';
import {
  Add as AddIcon,
  Build as OperationsIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CameraAlt as CameraIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Inventory as InventoryIcon,
  Note as NoteIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useLanguage } from '../../contexts/LanguageContext';
import { Machine } from '../../types';
import { ProductService } from '../../services/productService';
import { OperationsService, Operation as ServiceOperation } from '../../services/operationsService';
import { useAuth } from '../../hooks/useAuth';

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

// Empty sample operations - removed predefined placeholder operations
const sampleOperations: any[] = [];

// Define types for our operation data
interface WasteDetails {
  expired: number;
  damaged: number;
  other: number;
  totalCost: number; // Satış fiyatından toplam zarar
  totalCostPriceLoss: number; // Maliyet fiyatından toplam zarar
  totalProfitLoss: number; // Toplam kar kaybı
  totalItems: number; // Toplam zayi ürün sayısı
}

interface VendingDetail {
  slot: number;
  product: string;
  productId?: string; // Add productId for linking to commodity list
  quantity: number; // Waste quantity
  batchNumber: string; // Slot capacity
  expiryDate: string; // Current quantity in slot
  wasteReason?: string; // Add waste reason field
}

interface RefillDetail {
  slot: number;
  product: string;
  productId?: string;
  quantity: number; // Quantity to add
  batchNumber: string; // Slot capacity
  expiryDate: string; // Current quantity in slot
}

interface SauceItem {
  name: string;
  quantity: number;
  unit: string; // 'adet', 'ml', 'gr' etc.
}

interface DecorationItem {
  name: string;
  quantity: string; // flexible for different units like "500g", "2 cups", etc.
}

interface IceCreamDetail {
  cups: number;
  iceCreamAmount: string;
  decorationAmount: string;
  sauceCount: number; // kept for backward compatibility
  // Dynamic sauce and decoration lists
  sauces: SauceItem[];
  decorations: DecorationItem[];
  reserveProducts: {
    iceCreamReserve: string;
    sauceReserve: string;
    decorationReserve: string;
    otherReserve: string;
  };
}

// Using ServiceOperation from operationsService instead of local interface

const Operations: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [machines] = useState<Machine[]>(sampleMachines);
  const [operations, setOperations] = useState<ServiceOperation[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editingOperation, setEditingOperation] = useState<ServiceOperation | null>(null);
  const [viewingOperation, setViewingOperation] = useState<ServiceOperation | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [commodityProducts, setCommodityProducts] = useState<any[]>([]); // For storing commodity list products

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      if (user?.id) {
        try {
          // Load commodity products
          const products = await ProductService.getUserProducts(user.id);
          setCommodityProducts(products);
          
          // Load operations
          const operationsData = await OperationsService.getAllOperations();
          setOperations(operationsData);
        } catch (error) {
          console.error('Error loading data:', error);
        }
      }
    };
    
    loadData();
  }, [user]);

  const [formData, setFormData] = useState({
    type: 'Dolum',
    machineId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    performedBy: '',
    status: 'Beklemede',
    waste: {
      expired: 0,
      damaged: 0,
      other: 0,
      totalCost: 0,
      totalCostPriceLoss: 0,
      totalProfitLoss: 0,
      totalItems: 0
    },
    vendingDetails: [] as VendingDetail[], // For waste products
    refillDetails: [] as RefillDetail[], // For refill products
    iceCreamDetails: {
      baseRefillAmount: 0, // litre
      baseWasteAmount: 0, // litre
      sauces: [] as { name: string; refillAmount: number; wasteAmount: number }[], // adet
      decorations: [] as { name: string; refillAmount: number; wasteAmount: number }[], // gram
      cupRefillAmount: 0, // adet
      cupWasteAmount: 0 // adet
    },
    beforePhotos: [] as string[],
    afterPhotos: [] as string[],
    notes: '',
    isFaultReport: false
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });

  // Pagination calculations
  const totalPages = Math.ceil(operations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOperations = operations.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleAddOperation = () => {
    setEditingOperation(null);
    setFormData({
      type: 'Dolum',
      machineId: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      performedBy: '',
      status: 'Beklemede',
      waste: {
        expired: 0,
        damaged: 0,
        other: 0,
        totalCost: 0,
        totalCostPriceLoss: 0,
        totalProfitLoss: 0,
        totalItems: 0
      },
      vendingDetails: [],
      refillDetails: [],
      iceCreamDetails: {
        baseRefillAmount: 0,
        baseWasteAmount: 0,
        sauces: [],
        decorations: [],
        cupRefillAmount: 0,
        cupWasteAmount: 0
      },
      beforePhotos: [],
      afterPhotos: [],
      notes: '',
      isFaultReport: false
    });
    setOpenDialog(true);
  };

  const handleViewOperation = (operation: ServiceOperation) => {
    setViewingOperation(operation);
    setViewDialog(true);
  };

  const handleEditOperation = (operation: ServiceOperation) => {
    setEditingOperation(operation);
    setFormData({
      type: operation.type,
      machineId: operation.machineId,
      date: operation.date,
      startTime: operation.startTime,
      endTime: operation.endTime,
      performedBy: operation.performedBy,
      status: operation.status,
      waste: {
        ...operation.waste,
        totalCostPriceLoss: (operation.waste as any).totalCostPriceLoss || 0,
        totalProfitLoss: (operation.waste as any).totalProfitLoss || 0,
        totalItems: (operation.waste as any).totalItems || 0
      },
      vendingDetails: operation.vendingDetails || [],
      refillDetails: operation.refillDetails || [],
      iceCreamDetails: operation.iceCreamDetails || {
        baseRefillAmount: 0,
        baseWasteAmount: 0,
        sauces: [],
        decorations: [],
        cupRefillAmount: 0,
        cupWasteAmount: 0
      },
      beforePhotos: operation.beforePhotos || [],
      afterPhotos: operation.afterPhotos || [],
      notes: operation.notes || '',
      isFaultReport: operation.isFaultReport || false
    });
    setOpenDialog(true);
  };

  const handleSaveOperation = async () => {
    try {
      const selectedMachine = machines.find(m => m.id === formData.machineId);
      
      if (editingOperation) {
        // Update existing operation
        const updateData: Partial<ServiceOperation> = {
          type: formData.type,
          machineId: formData.machineId,
          machineModel: selectedMachine?.model || '',
          machineSerial: selectedMachine?.serialNumber || '',
          machineLocation: selectedMachine?.location.address || '',
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: OperationsService.calculateDuration(formData.startTime, formData.endTime),
          performedBy: formData.performedBy,
          status: formData.status,
          waste: formData.waste,
          vendingDetails: formData.vendingDetails,
          refillDetails: formData.refillDetails,
          iceCreamDetails: formData.iceCreamDetails,
          beforePhotos: formData.beforePhotos,
          afterPhotos: formData.afterPhotos,
          notes: formData.notes,
          isFaultReport: formData.isFaultReport
        };
        
        await OperationsService.updateOperation(editingOperation.id!, updateData);
        
        // Update local state
        setOperations(operations.map(op => 
          op.id === editingOperation.id ? { ...op, ...updateData } : op
        ));
      } else {
        // Create new operation
        const newOperationData: Omit<ServiceOperation, 'id' | 'createdAt' | 'updatedAt'> = {
          type: formData.type,
          machineId: formData.machineId,
          machineModel: selectedMachine?.model || '',
          machineSerial: selectedMachine?.serialNumber || '',
          machineLocation: selectedMachine?.location.address || '',
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          duration: OperationsService.calculateDuration(formData.startTime, formData.endTime),
          performedBy: formData.performedBy,
          status: formData.status,
          waste: formData.waste,
          vendingDetails: formData.vendingDetails,
          refillDetails: formData.refillDetails,
          iceCreamDetails: formData.iceCreamDetails,
          beforePhotos: formData.beforePhotos,
          afterPhotos: formData.afterPhotos,
          notes: formData.notes,
          reportNumber: OperationsService.generateReportNumber(selectedMachine?.model || '', operations.length + 1),
          isFaultReport: formData.isFaultReport,
          createdBy: user?.id || ''
        };
        
        const newOperation = await OperationsService.createOperation(newOperationData);
        setOperations([newOperation, ...operations]);
      }
      
      setOpenDialog(false);
    } catch (error) {
      console.error('Error saving operation:', error);
      // You could add a notification here
    }
  };

  const handleDeleteOperation = async (operationId: string) => {
    try {
      await OperationsService.deleteOperation(operationId);
      setOperations(operations.filter(op => op.id !== operationId));
      setSnackbar({ open: true, message: 'Rapor başarıyla silindi', severity: 'success' });
    } catch (error) {
      console.error('Error deleting operation:', error);
      setSnackbar({ open: true, message: 'Rapor silinirken hata oluştu', severity: 'error' });
    }
  };

  const calculateDuration = (startTime: string, endTime: string): string => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let durationHours = endHours - startHours;
    let durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes < 0) {
      durationHours--;
      durationMinutes += 60;
    }
    
    if (durationHours < 0) {
      durationHours += 24;
    }
    
    if (durationHours === 0) {
      return `${durationMinutes} dakika`;
    } else if (durationMinutes === 0) {
      return `${durationHours} saat`;
    } else {
      return `${durationHours} saat ${durationMinutes} dakika`;
    }
  };

  const generateReportNumber = (machineId: string, operationId: number) => {
    const machine = machines.find(m => m.id === machineId);
    if (!machine) return `Rapor-${operationId}`;
    
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${machine.model}-${operationId.toString().padStart(3, '0')}-${year}-${month}-${day}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı': return 'success';
      case 'Devam Ediyor': return 'warning';
      case 'Beklemede': return 'info';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Dolum': return 'primary';
      case 'Temizlik': return 'secondary';
      case 'Bakım': return 'warning';
      case 'Onarım': return 'error';
      case 'Arıza': return 'error';
      default: return 'default';
    }
  };

  const handleMachineChange = (machineId: string) => {
    setFormData({ ...formData, machineId });
  };

  const addVendingDetail = () => {
    setFormData({
      ...formData,
      vendingDetails: [...formData.vendingDetails, { slot: 1, product: '', productId: '', quantity: 0, batchNumber: '', expiryDate: '', wasteReason: '' }]
    });
  };

  const addRefillDetail = () => {
    setFormData({
      ...formData,
      refillDetails: [...formData.refillDetails, { slot: 1, product: '', productId: '', quantity: 0, batchNumber: '', expiryDate: '' }]
    });
  };

  const updateVendingDetail = (index: number, field: keyof VendingDetail, value: string | number) => {
    const updatedDetails = [...formData.vendingDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    
    // If product is selected from commodity list, auto-fill product name
    if (field === 'productId' && typeof value === 'string') {
      const selectedProduct = commodityProducts.find(p => p.id === value);
      if (selectedProduct) {
        updatedDetails[index].product = selectedProduct.name;
      }
    }
    
    // Calculate total waste cost based on all waste products
    const wasteCalculation = updatedDetails.reduce((acc, detail) => {
      if (detail.productId && detail.quantity) {
        const product = commodityProducts.find(p => p.id === detail.productId);
        if (product) {
          const sellPriceLoss = product.unitPrice * detail.quantity; // Satış fiyatından zarar (commodity listesinden)
          const costPriceLoss = product.costPrice * detail.quantity; // Maliyet fiyatından zarar (commodity listesinden)
          const profitLoss = sellPriceLoss - costPriceLoss; // Kar kaybı
          
          return {
            totalSellPriceLoss: acc.totalSellPriceLoss + sellPriceLoss,
            totalCostPriceLoss: acc.totalCostPriceLoss + costPriceLoss,
            totalProfitLoss: acc.totalProfitLoss + profitLoss,
            itemCount: acc.itemCount + detail.quantity
          };
        }
      }
      return acc;
    }, {
      totalSellPriceLoss: 0,
      totalCostPriceLoss: 0,
      totalProfitLoss: 0,
      itemCount: 0
    });
    
    setFormData({ 
      ...formData, 
      vendingDetails: updatedDetails,
      waste: { 
        ...formData.waste, 
        totalCost: parseFloat(wasteCalculation.totalSellPriceLoss.toFixed(2)),
        totalCostPriceLoss: parseFloat(wasteCalculation.totalCostPriceLoss.toFixed(2)),
        totalProfitLoss: parseFloat(wasteCalculation.totalProfitLoss.toFixed(2)),
        totalItems: wasteCalculation.itemCount
      }
    });
  };

  const updateRefillDetail = (index: number, field: keyof RefillDetail, value: string | number) => {
    const updatedDetails = [...formData.refillDetails];
    updatedDetails[index] = { ...updatedDetails[index], [field]: value };
    
    // If product is selected from commodity list, auto-fill product name
    if (field === 'productId' && typeof value === 'string') {
      const selectedProduct = commodityProducts.find(p => p.id === value);
      if (selectedProduct) {
        updatedDetails[index].product = selectedProduct.name;
      }
    }
    
    setFormData({ ...formData, refillDetails: updatedDetails });
  };

  const removeVendingDetail = (index: number) => {
    const updatedDetails = [...formData.vendingDetails];
    updatedDetails.splice(index, 1);
    
    // Recalculate total waste cost
    const wasteCalculation = updatedDetails.reduce((acc, detail) => {
      if (detail.productId && detail.quantity) {
        const product = commodityProducts.find(p => p.id === detail.productId);
        if (product) {
          const sellPriceLoss = product.unitPrice * detail.quantity; // Satış fiyatından zarar (commodity listesinden)
          const costPriceLoss = product.costPrice * detail.quantity; // Maliyet fiyatından zarar (commodity listesinden)
          const profitLoss = sellPriceLoss - costPriceLoss;
          
          return {
            totalSellPriceLoss: acc.totalSellPriceLoss + sellPriceLoss,
            totalCostPriceLoss: acc.totalCostPriceLoss + costPriceLoss,
            totalProfitLoss: acc.totalProfitLoss + profitLoss,
            itemCount: acc.itemCount + detail.quantity
          };
        }
      }
      return acc;
    }, {
      totalSellPriceLoss: 0,
      totalCostPriceLoss: 0,
      totalProfitLoss: 0,
      itemCount: 0
    });
    
    setFormData({ 
      ...formData, 
      vendingDetails: updatedDetails,
      waste: { 
        ...formData.waste, 
        totalCost: parseFloat(wasteCalculation.totalSellPriceLoss.toFixed(2)),
        totalCostPriceLoss: parseFloat(wasteCalculation.totalCostPriceLoss.toFixed(2)),
        totalProfitLoss: parseFloat(wasteCalculation.totalProfitLoss.toFixed(2)),
        totalItems: wasteCalculation.itemCount
      }
    });
  };

  const removeRefillDetail = (index: number) => {
    const updatedDetails = [...formData.refillDetails];
    updatedDetails.splice(index, 1);
    setFormData({ ...formData, refillDetails: updatedDetails });
  };

  // Add fault reporting functionality
  const toggleFaultReport = () => {
    const newFaultState = !formData.isFaultReport;
    // When toggling fault report, we might want to change the operation type
    if (newFaultState) {
      setFormData({ ...formData, type: 'Arıza', isFaultReport: true });
    } else {
      setFormData({ ...formData, type: 'Dolum', isFaultReport: false }); // Reset to default
    }
  };

  // Quick add product function
  const quickAddProduct = (type: 'refill' | 'waste') => {
    if (type === 'refill') {
      setFormData({
        ...formData,
        refillDetails: [...formData.refillDetails, { 
          slot: formData.refillDetails.length + 1, 
          product: '', 
          productId: '', 
          quantity: 0, 
          batchNumber: '', 
          expiryDate: '' 
        }]
      });
    } else {
      setFormData({
        ...formData,
        vendingDetails: [...formData.vendingDetails, { 
          slot: formData.vendingDetails.length + 1, 
          product: '', 
          productId: '', 
          quantity: 0, 
          batchNumber: '', 
          expiryDate: '', 
          wasteReason: '' 
        }]
      });
    }
  };

  // Dynamic sauce management functions
  const addSauce = () => {
    const newSauce = { name: '', refillAmount: 0, wasteAmount: 0 };
    setFormData({
      ...formData,
      iceCreamDetails: {
        ...formData.iceCreamDetails,
        sauces: [...formData.iceCreamDetails.sauces, newSauce]
      }
    });
  };

  const updateSauce = (index: number, field: string, value: string | number) => {
    const updatedSauces = [...formData.iceCreamDetails.sauces];
    updatedSauces[index] = { ...updatedSauces[index], [field]: value };
    setFormData({
      ...formData,
      iceCreamDetails: {
        ...formData.iceCreamDetails,
        sauces: updatedSauces
      }
    });
  };

  const removeSauce = (index: number) => {
    const updatedSauces = [...formData.iceCreamDetails.sauces];
    updatedSauces.splice(index, 1);
    setFormData({
      ...formData,
      iceCreamDetails: {
        ...formData.iceCreamDetails,
        sauces: updatedSauces
      }
    });
  };

  // Dynamic decoration management functions
  const addDecoration = () => {
    const newDecoration = { name: '', refillAmount: 0, wasteAmount: 0 };
    setFormData({
      ...formData,
      iceCreamDetails: {
        ...formData.iceCreamDetails,
        decorations: [...formData.iceCreamDetails.decorations, newDecoration]
      }
    });
  };

  const updateDecoration = (index: number, field: string, value: string | number) => {
    const updatedDecorations = [...formData.iceCreamDetails.decorations];
    updatedDecorations[index] = { ...updatedDecorations[index], [field]: value };
    setFormData({
      ...formData,
      iceCreamDetails: {
        ...formData.iceCreamDetails,
        decorations: updatedDecorations
      }
    });
  };

  const removeDecoration = (index: number) => {
    const updatedDecorations = [...formData.iceCreamDetails.decorations];
    updatedDecorations.splice(index, 1);
    setFormData({
      ...formData,
      iceCreamDetails: {
        ...formData.iceCreamDetails,
        decorations: updatedDecorations
      }
    });
  };

  // Waste reason options
  const wasteReasons = [
    { value: 'tarihi_gecmis', label: 'Tarihi Geçmiş' },
    { value: 'hasarli', label: 'Hasarlı' },
    { value: 'hirsizlik', label: 'Hırsızlık' },
    { value: 'musteri_sikayeti', label: 'Müşteri Şikayeti' },
    { value: 'teknik_sorun', label: 'Teknik Sorun' },
    { value: 'diger', label: 'Diğer' }
  ];

  // Ice cream form is simplified - no predefined categories

  // Create a ref to store the current input value
  const [autocompleteRefs, setAutocompleteRefs] = useState<Record<string, string>>({});

  // Memoized values for Autocomplete components to prevent re-rendering issues
  const getSelectedProduct = useMemo(() => {
    return (productId: string) => {
      return commodityProducts.find(p => p?.id === productId) || null;
    };
  }, [commodityProducts]);

  // Memoized option equality function
  const isOptionEqualToValue = useMemo(() => {
    return (option: any, value: any) => {
      if (!option || !value) return false;
      return option.id === value.id;
    };
  }, []);

  // Handle autocomplete input changes
  const handleAutocompleteInputChange = (type: 'refill' | 'waste', index: number, value: string) => {
    const key = `${type}-${index}`;
    setAutocompleteRefs(prev => ({ ...prev, [key]: value }));
  };

  // Memoized onChange handlers
  const handleRefillProductChange = useCallback((index: number) => {
    return (event: any, newValue: any) => {
      if (newValue && newValue.id) {
        updateRefillDetail(index, 'productId', newValue.id);
        updateRefillDetail(index, 'product', newValue.name);
        handleAutocompleteInputChange('refill', index, '');
      } else {
        updateRefillDetail(index, 'productId', '');
        updateRefillDetail(index, 'product', '');
      }
    };
  }, [updateRefillDetail, handleAutocompleteInputChange]);

  const handleWasteProductChange = useCallback((index: number) => {
    return (event: any, newValue: any) => {
      if (newValue && newValue.id) {
        updateVendingDetail(index, 'productId', newValue.id);
        updateVendingDetail(index, 'product', newValue.name);
        handleAutocompleteInputChange('waste', index, '');
      } else {
        updateVendingDetail(index, 'productId', '');
        updateVendingDetail(index, 'product', '');
      }
    };
  }, [updateVendingDetail, handleAutocompleteInputChange]);

  // Get autocomplete input value
  const getAutocompleteInputValue = (type: 'refill' | 'waste', index: number) => {
    const key = `${type}-${index}`;
    return autocompleteRefs[key] || '';
  };

  // Debug function to check product selection
  const debugProductSelection = (productId: string, productName: string) => {
    console.log('Product selected:', { productId, productName });
  };

  // Photo upload handlers
  const handleBeforePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, upload to server and get URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          beforePhotos: [...prev.beforePhotos, photoUrl]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAfterPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, upload to server and get URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoUrl = e.target?.result as string;
        setFormData(prev => ({
          ...prev,
          afterPhotos: [...prev.afterPhotos, photoUrl]
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Fade in timeout={600}>
        <Box className="page-enter">
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
                {t('operations.title')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddOperation}
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
                {t('operations.addOperation')}
              </Button>
            </Box>

          {/* Operations Table */}
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
                    <TableCell sx={{ fontWeight: 600 }}>Rapor No</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>İşlem Türü</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Makine</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Tarih/Saat</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>İşlemi Yapan</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Durum</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>İşlemler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {currentOperations.map((operation, index) => (
                    <TableRow 
                      key={operation.id} 
                      hover
                      sx={{ 
                        animation: 'fadeIn 0.3s ease-out',
                        animationDelay: `${index * 0.1}s`,
                        animationFillMode: 'both'
                      }}
                    >
                      <TableCell>
                        <Chip 
                          label={operation.reportNumber} 
                          size="small" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={operation.type} 
                          color={getTypeColor(operation.type)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {operation.machineModel}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {operation.machineSerial}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <CalendarIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {operation.date}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center">
                          <TimeIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="caption">
                            {operation.startTime} - {operation.endTime}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{operation.performedBy}</TableCell>
                      <TableCell>
                        <Chip
                          label={operation.status}
                          color={getStatusColor(operation.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<NoteIcon />}
                          onClick={() => handleViewOperation(operation)}
                          sx={{ mr: 1 }}
                        >
                          Detaylar
                        </Button>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditOperation(operation)}
                          sx={{ mr: 1 }}
                        >
                          Düzenle
                        </Button>
                        <Button
                          size="small"
                          startIcon={<DeleteIcon />}
                          color="error"
                          onClick={() => handleDeleteOperation(operation.id!)}
                        >
                          Sil
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
                  işlem
                </Typography>
              </Box>

              {/* Page info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  {operations.length > 0 ? (
                    <>
                      {startIndex + 1}-{Math.min(endIndex, operations.length)} / {operations.length} işlem
                    </>
                  ) : (
                    'İşlem bulunamadı'
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
                        
                        if (endPage < totalPages) {
                          if (endPage < totalPages - 1) {
                            pages.push(<span key="end-ellipsis" style={{ padding: '0 8px' }}>...</span>);
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

      {/* Add/Edit Operation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingOperation ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}
          {/* Add fault button */}
          <Button
            variant={formData.isFaultReport ? "contained" : "outlined"}
            color="error"
            size="small"
            startIcon={formData.isFaultReport ? <CheckCircleIcon /> : <WarningIcon />}
            onClick={toggleFaultReport}
            sx={{ float: 'right', mt: -1 }}
          >
            {formData.isFaultReport ? 'Arıza Aktif' : 'Arıza Bildir'}
          </Button>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <AppBar position="static" color="default" sx={{ mb: 2, borderRadius: 1 }}>
              <Tabs 
                value={activeTab} 
                onChange={(e, newValue) => setActiveTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Temel Bilgiler" />
                <Tab label="Zayi & Detaylar" />
                <Tab label="Fotoğraflar" />
                <Tab label="Notlar" />
              </Tabs>
            </AppBar>

            {activeTab === 0 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <FormControl fullWidth>
                    <TextField
                      select
                      label="İşlem Türü"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <MenuItem value="Dolum">Dolum</MenuItem>
                      <MenuItem value="Temizlik">Temizlik</MenuItem>
                      <MenuItem value="Bakım">Bakım</MenuItem>
                      <MenuItem value="Onarım">Onarım</MenuItem>
                      <MenuItem value="Arıza">Arıza</MenuItem>
                    </TextField>
                  </FormControl>
                  <FormControl fullWidth>
                    <TextField
                      select
                      label="Makine"
                      value={formData.machineId}
                      onChange={(e) => handleMachineChange(e.target.value)}
                      required
                    >
                      {machines.map((machine) => (
                        <MenuItem key={machine.id} value={machine.id}>
                          {machine.model} - {machine.name} ({machine.serialNumber})
                        </MenuItem>
                      ))}
                    </TextField>
                  </FormControl>
                  <TextField
                    label="Tarih"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <TextField
                      label="Başlangıç Saati"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Bitiş Saati"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                  </Box>
                  <TextField
                    label="İşlemi Yapan"
                    value={formData.performedBy}
                    onChange={(e) => setFormData({ ...formData, performedBy: e.target.value })}
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <TextField
                      select
                      label="Durum"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <MenuItem value="Beklemede">Beklemede</MenuItem>
                      <MenuItem value="Devam Ediyor">Devam Ediyor</MenuItem>
                      <MenuItem value="Tamamlandı">Tamamlandı</MenuItem>
                    </TextField>
                  </FormControl>
                </Box>
              </Box>
            )}

            {activeTab === 1 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Show different content based on machine type */}
                {machines.find(m => m.id === formData.machineId)?.type === 'ice_cream' ? (
                  // Ice cream machine - show only ice cream details
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Dondurma Otomatı Detayları
                      </Typography>
                      
                      {/* Dondurma Bazı */}
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Dondurma Bazı
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                        <TextField
                          label="Dolum Miktarı (Litre)"
                          type="number"
                          value={formData.iceCreamDetails.baseRefillAmount}
                          onChange={(e) => setFormData({
                            ...formData,
                            iceCreamDetails: {
                              ...formData.iceCreamDetails,
                              baseRefillAmount: Number(e.target.value)
                            }
                          })}
                          InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        />
                        <TextField
                          label="Zayi Miktarı (Litre)"
                          type="number"
                          value={formData.iceCreamDetails.baseWasteAmount}
                          onChange={(e) => setFormData({
                            ...formData,
                            iceCreamDetails: {
                              ...formData.iceCreamDetails,
                              baseWasteAmount: Number(e.target.value)
                            }
                          })}
                          InputProps={{ inputProps: { min: 0, step: 0.1 } }}
                        />
                      </Box>
                      
                      {/* Soslar */}
                      <Typography variant="subtitle1" gutterBottom>
                        Soslar (Adet)
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {formData.iceCreamDetails.sauces.map((sauce, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              display: 'grid', 
                              gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr' }, 
                              gap: 2, 
                              mb: 1 
                            }}
                          >
                            <TextField
                              label="Sos Adı"
                              value={sauce.name}
                              onChange={(e) => updateSauce(index, 'name', e.target.value)}
                            />
                            <TextField
                              label="Dolum Miktarı"
                              type="number"
                              value={sauce.refillAmount}
                              onChange={(e) => updateSauce(index, 'refillAmount', Number(e.target.value))}
                              InputProps={{ inputProps: { min: 0 } }}
                            />
                            <TextField
                              label="Zayi Miktarı"
                              type="number"
                              value={sauce.wasteAmount}
                              onChange={(e) => updateSauce(index, 'wasteAmount', Number(e.target.value))}
                              InputProps={{ inputProps: { min: 0 } }}
                            />
                            <Box display="flex" alignItems="center">
                              <IconButton 
                                color="error" 
                                onClick={() => removeSauce(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<AddIcon />}
                          onClick={addSauce}
                        >
                          Sos Ekle
                        </Button>
                      </Box>
                      
                      {/* Süslemeler */}
                      <Typography variant="subtitle1" gutterBottom>
                        Süslemeler (Gram)
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {formData.iceCreamDetails.decorations.map((decoration, index) => (
                          <Box 
                            key={index} 
                            sx={{ 
                              display: 'grid', 
                              gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr' }, 
                              gap: 2, 
                              mb: 1 
                            }}
                          >
                            <TextField
                              label="Süsleme Adı"
                              value={decoration.name}
                              onChange={(e) => updateDecoration(index, 'name', e.target.value)}
                            />
                            <TextField
                              label="Dolum Miktarı"
                              type="number"
                              value={decoration.refillAmount}
                              onChange={(e) => updateDecoration(index, 'refillAmount', Number(e.target.value))}
                              InputProps={{ inputProps: { min: 0 } }}
                            />
                            <TextField
                              label="Zayi Miktarı"
                              type="number"
                              value={decoration.wasteAmount}
                              onChange={(e) => updateDecoration(index, 'wasteAmount', Number(e.target.value))}
                              InputProps={{ inputProps: { min: 0 } }}
                            />
                            <Box display="flex" alignItems="center">
                              <IconButton 
                                color="error" 
                                onClick={() => removeDecoration(index)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          </Box>
                        ))}
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<AddIcon />}
                          onClick={addDecoration}
                        >
                          Süsleme Ekle
                        </Button>
                      </Box>
                      
                      {/* Bardaklar */}
                      <Typography variant="subtitle1" gutterBottom>
                        Bardaklar (Adet)
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 3 }}>
                        <TextField
                          label="Dolum Miktarı"
                          type="number"
                          value={formData.iceCreamDetails.cupRefillAmount}
                          onChange={(e) => setFormData({
                            ...formData,
                            iceCreamDetails: {
                              ...formData.iceCreamDetails,
                              cupRefillAmount: Number(e.target.value)
                            }
                          })}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                        <TextField
                          label="Zayi Miktarı"
                          type="number"
                          value={formData.iceCreamDetails.cupWasteAmount}
                          onChange={(e) => setFormData({
                            ...formData,
                            iceCreamDetails: {
                              ...formData.iceCreamDetails,
                              cupWasteAmount: Number(e.target.value)
                            }
                          })}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                      </Box>
                    </CardContent>
                  </Card>
                ) : (
                  // Regular vending machine - show refill details
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" gutterBottom>
                          Dolum Detayları
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          startIcon={<AddIcon />}
                          onClick={() => quickAddProduct('refill')}
                        >
                          Ürün Ekle
                        </Button>
                      </Box>
                    
                    {formData.refillDetails.map((detail, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr 1fr 1fr' }, 
                          gap: 2, 
                          mb: 2,
                          p: 2,
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          backgroundColor: '#fafafa'
                        }}
                      >
                        <Autocomplete
                          options={commodityProducts}
                          getOptionLabel={(option) => option?.name || ''}
                          value={getSelectedProduct(detail.productId)}
                          onChange={handleRefillProductChange(index)}
                          onInputChange={(event, newInputValue) => {
                            handleAutocompleteInputChange('refill', index, newInputValue);
                          }}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              label="Ürün" 
                              placeholder="Ürün seçin veya arayın"
                            />
                          )}
                          fullWidth
                          isOptionEqualToValue={isOptionEqualToValue}
                          noOptionsText="Ürün bulunamadı"
                          clearOnBlur={false}
                        />
                        <TextField
                          label="Slot"
                          type="number"
                          value={detail.slot}
                          onChange={(e) => updateRefillDetail(index, 'slot', Number(e.target.value))}
                          InputProps={{ inputProps: { min: 1 } }}
                        />
                        <TextField
                          label="Eklenecek Miktar"
                          type="number"
                          value={detail.quantity}
                          onChange={(e) => updateRefillDetail(index, 'quantity', Number(e.target.value))}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                        <TextField
                          label="Slot Kapasitesi"
                          type="number"
                          value={detail.batchNumber}
                          onChange={(e) => updateRefillDetail(index, 'batchNumber', e.target.value)}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                        <TextField
                          label="Mevcut Miktar"
                          type="number"
                          value={detail.expiryDate}
                          onChange={(e) => updateRefillDetail(index, 'expiryDate', e.target.value)}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                        <Box display="flex" alignItems="center">
                          <IconButton 
                            color="error" 
                            onClick={() => removeRefillDetail(index)}
                            sx={{ mt: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                    
                    {formData.refillDetails.length === 0 && (
                      <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                        Henüz dolum ürünü eklenmemiş. "Hızlı Ekle" butonuna tıklayarak hızlıca ürün ekleyebilirsiniz.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
                )}

                {/* Waste Products Section */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="h6" gutterBottom>
                        Zayi Ürünleri
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<AddIcon />}
                        onClick={() => quickAddProduct('waste')}
                      >
                        Ürün Ekle
                      </Button>
                    </Box>
                    
                    {formData.vendingDetails.map((detail, index) => (
                      <Box 
                        key={index} 
                        sx={{ 
                          display: 'grid', 
                          gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr 1fr 1fr 1fr 1fr' }, 
                          gap: 2, 
                          mb: 2,
                          p: 2,
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          backgroundColor: '#fafafa'
                        }}
                      >
                        <Autocomplete
                          options={commodityProducts}
                          getOptionLabel={(option) => option?.name || ''}
                          value={getSelectedProduct(detail.productId)}
                          onChange={handleWasteProductChange(index)}
                          onInputChange={(event, newInputValue) => {
                            handleAutocompleteInputChange('waste', index, newInputValue);
                          }}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              label="Ürün" 
                              placeholder="Ürün seçin veya arayın"
                            />
                          )}
                          fullWidth
                          isOptionEqualToValue={isOptionEqualToValue}
                          noOptionsText="Ürün bulunamadı"
                          clearOnBlur={false}
                        />
                        <TextField
                          label="Slot"
                          type="number"
                          value={detail.slot}
                          onChange={(e) => updateVendingDetail(index, 'slot', Number(e.target.value))}
                          InputProps={{ inputProps: { min: 1 } }}
                        />
                        <TextField
                          label="Zayi Miktarı"
                          type="number"
                          value={detail.quantity}
                          onChange={(e) => updateVendingDetail(index, 'quantity', Number(e.target.value))}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                        <TextField
                          label="Slot Kapasitesi"
                          type="number"
                          value={detail.batchNumber}
                          onChange={(e) => updateVendingDetail(index, 'batchNumber', e.target.value)}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                        <TextField
                          label="Mevcut Miktar"
                          type="number"
                          value={detail.expiryDate}
                          onChange={(e) => updateVendingDetail(index, 'expiryDate', e.target.value)}
                          InputProps={{ inputProps: { min: 0 } }}
                        />
                        <TextField
                          label="Zayi Nedeni"
                          select
                          value={detail.wasteReason || ''}
                          onChange={(e) => updateVendingDetail(index, 'wasteReason', e.target.value)}
                        >
                          {wasteReasons.map((reason) => (
                            <MenuItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </MenuItem>
                          ))}
                        </TextField>
                        <Box display="flex" alignItems="center">
                          <IconButton 
                            color="error" 
                            onClick={() => removeVendingDetail(index)}
                            sx={{ mt: 1 }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    ))}
                    
                    {formData.vendingDetails.length === 0 && (
                      <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                        Henüz zayi ürünü eklenmemiş. "Hızlı Ekle" butonuna tıklayarak hızlıca ürün ekleyebilirsiniz.
                      </Typography>
                    )}
                  </CardContent>
                </Card>

              </Box>
            )}

            {activeTab === 2 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Fotoğraflar
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Card variant="outlined" sx={{ borderRadius: 2, minHeight: 200 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        İşlem Öncesi Fotoğraflar
                      </Typography>
                      {formData.beforePhotos.length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1, mb: 2 }}>
                          {formData.beforePhotos.map((photo, index) => (
                            <Box key={index} sx={{ position: 'relative' }}>
                              <img 
                                src={photo} 
                                alt={`Öncesi ${index + 1}`}
                                style={{ 
                                  width: '100%', 
                                  height: '100px', 
                                  objectFit: 'cover', 
                                  borderRadius: '8px' 
                                }}
                              />
                              <IconButton
                                size="small"
                                sx={{ 
                                  position: 'absolute', 
                                  top: 4, 
                                  right: 4, 
                                  backgroundColor: 'rgba(0,0,0,0.5)',
                                  color: 'white',
                                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                                }}
                                onClick={() => {
                                  const newPhotos = [...formData.beforePhotos];
                                  newPhotos.splice(index, 1);
                                  setFormData({ ...formData, beforePhotos: newPhotos });
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <CameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Henüz fotoğraf eklenmedi
                          </Typography>
                        </Box>
                      )}
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<CameraIcon />}
                        component="label"
                        fullWidth
                      >
                        Fotoğraf Ekle
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleBeforePhotoUpload}
                        />
                      </Button>
                    </CardContent>
                  </Card>
                  <Card variant="outlined" sx={{ borderRadius: 2, minHeight: 200 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        İşlem Sonrası Fotoğraflar
                      </Typography>
                      {formData.afterPhotos.length > 0 ? (
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 1, mb: 2 }}>
                          {formData.afterPhotos.map((photo, index) => (
                            <Box key={index} sx={{ position: 'relative' }}>
                              <img 
                                src={photo} 
                                alt={`Sonrası ${index + 1}`}
                                style={{ 
                                  width: '100%', 
                                  height: '100px', 
                                  objectFit: 'cover', 
                                  borderRadius: '8px' 
                                }}
                              />
                              <IconButton
                                size="small"
                                sx={{ 
                                  position: 'absolute', 
                                  top: 4, 
                                  right: 4, 
                                  backgroundColor: 'rgba(0,0,0,0.5)',
                                  color: 'white',
                                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.7)' }
                                }}
                                onClick={() => {
                                  const newPhotos = [...formData.afterPhotos];
                                  newPhotos.splice(index, 1);
                                  setFormData({ ...formData, afterPhotos: newPhotos });
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      ) : (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <CameraIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                          <Typography variant="body2" color="textSecondary" gutterBottom>
                            Henüz fotoğraf eklenmedi
                          </Typography>
                        </Box>
                      )}
                      <Button 
                        variant="outlined" 
                        size="small" 
                        startIcon={<CameraIcon />}
                        component="label"
                        fullWidth
                      >
                        Fotoğraf Ekle
                        <input
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={handleAfterPhotoUpload}
                        />
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}

            {activeTab === 3 && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Notlar"
                  multiline
                  rows={6}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="İşlemle ilgili ek notlarınızı buraya yazabilirsiniz..."
                  fullWidth
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>İptal</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveOperation}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Operation Details Dialog */}
      <Dialog open={viewDialog} onClose={() => setViewDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Rapor Detayları - {viewingOperation?.reportNumber}
        </DialogTitle>
        <DialogContent>
          {viewingOperation && (
            <Box sx={{ pt: 2 }}>
              {/* Basic Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Genel Bilgiler</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Rapor No:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{viewingOperation.reportNumber}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">İşlem Türü:</Typography>
                    <Chip label={viewingOperation.type} color={getTypeColor(viewingOperation.type)} size="small" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Makine:</Typography>
                    <Typography variant="body1">{viewingOperation.machineModel}</Typography>
                    <Typography variant="caption" color="textSecondary">{viewingOperation.machineSerial}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Durum:</Typography>
                    <Chip label={viewingOperation.status} color={getStatusColor(viewingOperation.status)} size="small" />
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Tarih:</Typography>
                    <Typography variant="body1">{viewingOperation.date}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Saat:</Typography>
                    <Typography variant="body1">{viewingOperation.startTime} - {viewingOperation.endTime}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">İşlemi Yapan:</Typography>
                    <Typography variant="body1">{viewingOperation.performedBy}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Süre:</Typography>
                    <Typography variant="body1">{viewingOperation.duration}</Typography>
                  </Box>
                </Box>
              </Box>

              {/* Refill Details */}
              {viewingOperation.refillDetails && viewingOperation.refillDetails.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Dolum Detayları</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Slot</TableCell>
                          <TableCell>Ürün</TableCell>
                          <TableCell>Eklenecek Miktar</TableCell>
                          <TableCell>Slot Kapasitesi</TableCell>
                          <TableCell>Mevcut Miktar</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingOperation.refillDetails.map((detail, index) => (
                          <TableRow key={index}>
                            <TableCell>{detail.slot}</TableCell>
                            <TableCell>{detail.product}</TableCell>
                            <TableCell>{detail.quantity}</TableCell>
                            <TableCell>{detail.batchNumber}</TableCell>
                            <TableCell>{detail.expiryDate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Waste Details */}
              {viewingOperation.vendingDetails && viewingOperation.vendingDetails.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Zayi Ürünleri</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Slot</TableCell>
                          <TableCell>Ürün</TableCell>
                          <TableCell>Zayi Miktarı</TableCell>
                          <TableCell>Satış Fiyatı</TableCell>
                          <TableCell>Maliyet Fiyatı</TableCell>
                          <TableCell>Satış Zararı</TableCell>
                          <TableCell>Maliyet Zararı</TableCell>
                          <TableCell>Kar Kaybı</TableCell>
                          <TableCell>Zayi Nedeni</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {viewingOperation.vendingDetails.map((detail, index) => {
                          const product = commodityProducts.find(p => p.id === detail.productId);
                          const sellPrice = product?.unitPrice || 0;
                          const costPrice = product?.costPrice || 0;
                          const sellPriceLoss = sellPrice * detail.quantity;
                          const costPriceLoss = costPrice * detail.quantity;
                          const profitLoss = sellPriceLoss - costPriceLoss;
                          
                          return (
                            <TableRow key={index}>
                              <TableCell>{detail.slot}</TableCell>
                              <TableCell>{detail.product}</TableCell>
                              <TableCell>{detail.quantity}</TableCell>
                              <TableCell>₺{sellPrice.toFixed(2)}</TableCell>
                              <TableCell>₺{costPrice.toFixed(2)}</TableCell>
                              <TableCell color="error">₺{sellPriceLoss.toFixed(2)}</TableCell>
                              <TableCell color="warning">₺{costPriceLoss.toFixed(2)}</TableCell>
                              <TableCell color={profitLoss >= 0 ? "success" : "error"}>
                                ₺{profitLoss.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={detail.wasteReason || 'Belirtilmemiş'} 
                                  size="small" 
                                  color="error" 
                                  variant="outlined"
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* Waste Summary */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Zayi Özeti</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Tarihi Geçmiş:</Typography>
                    <Typography variant="h6">{viewingOperation.waste.expired}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Hasarlı:</Typography>
                    <Typography variant="h6">{viewingOperation.waste.damaged}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Diğer:</Typography>
                    <Typography variant="h6">{viewingOperation.waste.other}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">Toplam Ürün:</Typography>
                    <Typography variant="h6">{(viewingOperation.waste as any).totalItems || 0}</Typography>
                  </Box>
                </Box>
                
                {/* Detaylı Zarar Analizi */}
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom color="error">Zarar Analizi</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                    <Box sx={{ p: 2, border: '1px solid #ffcdd2', borderRadius: 1, backgroundColor: '#ffebee' }}>
                      <Typography variant="body2" color="textSecondary">Satış Fiyatından Zarar:</Typography>
                      <Typography variant="h6" color="error">₺{viewingOperation.waste.totalCost || 0}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Kaybedilen potansiyel gelir
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, border: '1px solid #ffcc02', borderRadius: 1, backgroundColor: '#fff8e1' }}>
                      <Typography variant="body2" color="textSecondary">Maliyet Fiyatından Zarar:</Typography>
                      <Typography variant="h6" color="warning.main">₺{(viewingOperation.waste as any).totalCostPriceLoss || 0}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Gerçek maliyet kaybı
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, border: '1px solid #4caf50', borderRadius: 1, backgroundColor: '#e8f5e8' }}>
                      <Typography variant="body2" color="textSecondary">Kar Kaybı:</Typography>
                      <Typography variant="h6" color={((viewingOperation.waste as any).totalProfitLoss || 0) >= 0 ? 'success.main' : 'error'}>
                        ₺{(viewingOperation.waste as any).totalProfitLoss || 0}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Kaybedilen kar marjı
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Notes */}
              {viewingOperation.notes && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Notlar</Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {viewingOperation.notes}
                  </Typography>
                </Box>
              )}

              {/* Photos */}
              {(viewingOperation.beforePhotos.length > 0 || viewingOperation.afterPhotos.length > 0) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Fotoğraflar</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {viewingOperation.beforePhotos.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>İşlem Öncesi</Typography>
                        {viewingOperation.beforePhotos.map((photo, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <img src={photo} alt={`Before ${index + 1}`} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
                          </Box>
                        ))}
                      </Box>
                    )}
                    {viewingOperation.afterPhotos.length > 0 && (
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>İşlem Sonrası</Typography>
                        {viewingOperation.afterPhotos.map((photo, index) => (
                          <Box key={index} sx={{ mb: 1 }}>
                            <img src={photo} alt={`After ${index + 1}`} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8 }} />
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialog(false)}>Kapat</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              setViewDialog(false);
              handleEditOperation(viewingOperation!);
            }}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Düzenle
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Operations;