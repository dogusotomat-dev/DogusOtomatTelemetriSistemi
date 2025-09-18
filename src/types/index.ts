// Types for Machine Management
export interface Machine {
  id: string;
  serialNumber: string;
  type: 'snack' | 'ice_cream' | 'coffee' | 'perfume';
  model: string; // DGS model code
  name: string;
  iotNumber: string;
  location: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  connectionInfo: {
    lastHeartbeat: string;
    status: 'online' | 'offline';
    version: string;
  };
  deviceInfo?: {
    deviceType: string;
    firmwareVersion: string;
    hardwareVersion: string;
    capabilities: string[];
    location?: string;
    registeredAt: string;
    lastSeen: string;
    deviceKey?: string; // For authentication
  };
  deviceStatus?: {
    batteryLevel?: number;
    signalStrength?: number;
    temperature?: number;
    lastError?: string;
    lastUpdated: string;
  };
  configuration: {
    slots: Record<string, Slot>;
    settings: {
      modes: string[];
      currentMode: string;
      temperature?: number;
      features: Record<string, any>;
      // Model-specific capabilities
      capabilities: MachineCapabilities;
    };
    notifications: {
      emailAddresses: string[];
      enableOfflineAlerts: boolean;
      enableErrorAlerts: boolean;
      alertThresholdMinutes: number;
    };
  };
  groupId?: string;
  createdAt: string;
  updatedAt: string;
  // Monitoring counters
  daysSinceCleaning?: number;
  hoursWithoutPower?: number;
  powerOutageStart?: string | null;
  lastOperationalMode?: string | null;
  lastCleaningCheck?: string | null;
  lastPowerCheck?: string | null;
}

// Machine capabilities based on actual models
export interface MachineCapabilities {
  hasTemperatureControl: boolean;
  hasAutoCleaning: boolean;
  hasIceMaking?: boolean;
  maxIngredientTanks?: number;
  maxSlots?: number;
  hasSterilization?: boolean;
  hasGrinder?: boolean;
  supportedPayments: string[];
  screenSize?: string;
  maxCupCapacity?: number;
  hasRemoteRecipeUpdate?: boolean;
  hasRealTimeMonitoring?: boolean;
  hasPressureControl?: boolean;
  hasUVSterilization?: boolean;
}

// DGS Model configurations
export const DGS_MACHINE_MODELS = {
  'DGS-DSIVM': {
    name: 'DGS-DSIVM Dondurma Otomatı',
    type: 'ice_cream' as const,
    baseModel: 'TCN-ICE-D2-133(22SP)',
    capabilities: {
      hasTemperatureControl: false, // Read-only temperature monitoring
      hasAutoCleaning: false, // Manual cleaning only (operator)
      hasIceMaking: false,
      supportedPayments: ['cash', 'card', 'qr'],
      screenSize: '21.5"',
      maxCupCapacity: 100,
      hasRemoteRecipeUpdate: true,
      hasRealTimeMonitoring: true,
      hasPressureControl: false,
      hasUVSterilization: false
    } as MachineCapabilities,
    availableModes: ['auto', 'preservation', 'stand-by'] as string[], // Only remotely controllable modes
    temperatureRange: { min: -25, max: 5 }, // Read-only monitoring range
    defaultSlots: 0, // Ice cream machines don't use traditional slots
    features: {
      vanillaIceCreamTank: 1,    // Single vanilla ice cream tank only
      sauceJamTanks: 3,          // 3 sauce/jam tanks (various flavors)
      decorationTanks: 3,        // 3 decoration tanks (toppings)
      flavorCombinations: 16,    // 3×3 sauce×decoration combinations + plain options
      autoLockSystem: true,      // Auto-locks: 7 days no cleaning OR 3 hours no power
      temperatureMonitoring: true, // Read-only temperature monitoring (no remote control)
      realTimeStats: true,
      transparentWindow: true,
      operatorCleaningRequired: true, // Cleaning and defrost require physical operator
      memoryTracking: true       // Machine tracks cleaning and power loss durations internally
    }
  },
  'DGS-D900-9C(55SP)': {
    name: 'DGS-D900-9C(55SP) Atıştırmalık/İçecek Otomatı',
    type: 'snack' as const,
    baseModel: 'TCN-CSC-8C(V49)',
    capabilities: {
      hasTemperatureControl: true,
      hasAutoCleaning: false,
      maxSlots: 48,
      supportedPayments: ['cash', 'card', 'qr', 'mobile'],
      screenSize: '49"',
      hasRemoteRecipeUpdate: true,
      hasRealTimeMonitoring: true,
      hasPressureControl: false,
      hasUVSterilization: false
    } as MachineCapabilities,
    availableModes: ['normal', 'energy-save', 'maintenance'] as string[],
    temperatureRange: { min: 4, max: 25 },
    defaultSlots: 58, // Standard 58-slot configuration (factory default)
    features: {
      advertising: true,
      touchScreen: true,
      remoteControl: true,
      refrigerated: true
    }
  },
  'DGS-CCH-10N(V10)': {
    name: 'DGS-CCH-10N(V10) Atıştırmalık/İçecek Otomatı',
    type: 'snack' as const,
    baseModel: 'TCN-CSC-10C(V22)',
    capabilities: {
      hasTemperatureControl: true,
      hasAutoCleaning: false,
      maxSlots: 60,
      supportedPayments: ['cash', 'card', 'qr'],
      screenSize: '22"',
      hasRemoteRecipeUpdate: true,
      hasRealTimeMonitoring: true,
      hasPressureControl: false,
      hasUVSterilization: false
    } as MachineCapabilities,
    availableModes: ['normal', 'energy-save', 'maintenance'] as string[],
    temperatureRange: { min: 4, max: 25 },
    defaultSlots: 60, // High-capacity 60-slot configuration
    features: {
      hookConveyor: true,
      adjustableHeight: true,
      highCapacity: true
    }
  },
  'DGS-F-10': {
    name: 'DGS-F-10 Parfüm Otomatı',
    type: 'perfume' as const,
    baseModel: 'DKM MBT-5S50P',
    capabilities: {
      hasTemperatureControl: false,
      hasAutoCleaning: false,
      maxSlots: 5,
      supportedPayments: ['card'],
      screenSize: '10.1"',
      hasRemoteRecipeUpdate: true,
      hasRealTimeMonitoring: true,
      hasPressureControl: true,
      hasUVSterilization: false
    } as MachineCapabilities,
    availableModes: ['normal', 'maintenance'] as string[],
    temperatureRange: { min: 20, max: 25 }, // Add temperature range for consistency
    defaultSlots: 5, // 5 fragrance slots
    features: {
      wallMounted: true,
      electronicLock: true,
      infraredDetection: true,
      contactlessPickup: true
    }
  },
  'DGS-JK86': {
    name: 'DGS-JK86 Buzlu Kahve Otomatı',
    type: 'coffee' as const,
    baseModel: 'GS JK86',
    capabilities: {
      hasTemperatureControl: true,
      hasAutoCleaning: true,
      hasIceMaking: true,
      maxIngredientTanks: 4,
      supportedPayments: ['cash', 'card', 'qr'],
      screenSize: '27"',
      maxCupCapacity: 300,
      hasRemoteRecipeUpdate: true,
      hasRealTimeMonitoring: true,
      hasGrinder: true,
      hasPressureControl: true,
      hasUVSterilization: false
    } as MachineCapabilities,
    availableModes: ['bean-to-cup', 'iced-drinks', 'cleaning', 'maintenance'] as string[],
    temperatureRange: { min: 0, max: 95 },
    defaultSlots: 0, // Coffee machines don't use traditional slots
    features: {
      iceStorage: '3.5kg',
      iceProduction: '3.3kg/h',
      beanHopper: '1.8kg',
      dualPumps: true,
      transparentWindow: true,
      autoCapping: true,
      lidCapacity: 85,
      beverageOptions: 20
    }
  },
  'DGS-JK88': {
    name: 'DGS-JK88 Sıcak Kahve Otomatı',
    type: 'coffee' as const,
    baseModel: 'GS JK88',
    capabilities: {
      hasTemperatureControl: true,
      hasAutoCleaning: true,
      hasIceMaking: false,
      maxIngredientTanks: 5,
      supportedPayments: ['cash', 'card', 'qr'],
      screenSize: '21.5"',
      maxCupCapacity: 300,
      hasRemoteRecipeUpdate: true,
      hasRealTimeMonitoring: true,
      hasGrinder: true,
      hasPressureControl: true,
      hasUVSterilization: false
    } as MachineCapabilities,
    availableModes: ['bean-to-cup', 'hot-drinks', 'cleaning', 'maintenance'] as string[],
    temperatureRange: { min: 65, max: 95 },
    defaultSlots: 0, // Coffee machines don't use traditional slots
    features: {
      beanHopper: '1.8kg',
      extendedTanks: true,
      strawDispenser: true,
      energyEfficient: true,
      customPanels: true,
      beverageOptions: 15
    }
  }
} as const;

export interface Slot {
  slotNumber: number;       // Slot position (1-58 for standard vending machines)
  productId?: string;       // Assigned product ID (optional - slot can be empty)
  quantity: number;         // Current product quantity in slot
  price: number;            // Sale price for this slot
  maxCapacity: number;      // Maximum products this slot can hold
  isEnabled: boolean;       // Whether slot is active/enabled
  isJammed: boolean;        // Mechanical jam status
  sensorStatus: 'working' | 'faulty' | 'disconnected'; // Sensor health
  lastRefill?: string;      // Last refill timestamp
  totalDispensed: number;   // Total products dispensed from this slot
  motorStatus: 'working' | 'faulty' | 'stuck'; // Motor mechanism status
}

export interface MachineGroup {
  id: string;
  name: string;
  description: string;
  machineIds: string[];
  alarmEmails: string[];
  createdAt: string;
}

// Types for Product Management
export interface Product {
  id: string;
  name: string;
  description?: string;     // Product description/contents
  barcode: string;          // Product barcode/SKU
  productCode?: string;     // Internal product code (auto-generated)
  categoryId: string;       // Product category reference
  supplierId: string;       // Supplier reference
  costPrice: number;        // Purchase/cost price
  sellPrice: number;        // Default selling price
  weight?: number;          // Product weight in grams
  volume?: number;          // Product volume in ml
  image?: string;           // Product image URL
  dimensions?: {            // Product dimensions
    width: number;          // Width in mm
    height: number;         // Height in mm
    depth: number;          // Depth in mm
  };
  nutritionalInfo?: {       // Nutritional information
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    ingredients?: string[];
  };
  images?: string[];        // Multiple product images
  isActive: boolean;        // Product availability status
  expiryDate?: string;      // Product expiry date
  minStockLevel: number;    // Minimum stock alert level
  tags?: string[];          // Product tags for filtering
  createdAt: string;
  updatedAt: string;
}

// Product Category Management
export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  parentCategoryId?: string; // For nested categories
  color?: string;           // Category color for UI
  icon?: string;            // Category icon
  isActive: boolean;
  sortOrder: number;        // Display order
  createdAt: string;
  updatedAt: string;
}

// Supplier Management
export interface Supplier {
  id: string;
  name: string;
  companyName?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state?: string;
    zipCode?: string;
    country: string;
  };
  taxNumber?: string;       // Tax identification number
  paymentTerms?: string;    // Payment terms and conditions
  notes?: string;
  isActive: boolean;
  rating?: number;          // Supplier rating (1-5)
  createdAt: string;
  updatedAt: string;
}

// Types for Sales and Reporting
export interface Sale {
  id: string;
  machineId: string;
  productId: string;
  slotNumber: number;
  quantity: number;
  totalAmount: number;
  costPrice: number;
  profit: number;
  timestamp: string;
  paymentMethod: 'cash' | 'card' | 'mobile';
  transactionId: string;
}

export interface SalesReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalSales: number;
    totalTransactions: number;
    totalProfit: number;
    averageTransaction: number;
  };
  data: Array<{
    date: string;
    sales: number;
    transactions: number;
    profit: number;
  }>;
}

// Types for Alarm System
export interface Alarm {
  id: string;
  machineId: string;
  type: 'offline' | 'error' | 'warning' | 'maintenance' | 'cleaning';
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'resolved';
  timestamp: string;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  metadata?: Record<string, any>;
}

// Types for Operations
export interface Operation {
  id: string;
  machineId: string;
  type: 'refill' | 'cleaning' | 'maintenance';
  performedBy: string;
  timestamp: string;
  details: {
    slotsRefilled?: number[];
    productsAdded?: Record<string, number>;
    notes?: string;
    images?: string[];
  };
}

export interface Waste {
  id: string;
  machineId: string;
  productId: string;
  slotNumber: number;
  quantity: number;
  reason: 'expired' | 'damaged' | 'other';
  costImpact: number;
  reportedBy: string;
  timestamp: string;
  notes?: string;
}

// Types for User Management
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  permissions: UserPermissions;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  
  // Account hierarchy
  accountType: 'main' | 'sub';
  parentAccountId?: string; // For sub-accounts
  subAccountIds?: string[]; // For main accounts
  
  // Access control
  assignedMachineIds: string[]; // Specific machines assigned to this user
  assignedGroupIds: string[]; // Machine groups assigned to this user
  
  // Additional profile information
  phone?: string;
  department?: string;
  notes?: string;
}

export type UserRole = 'admin' | 'user' | 'operator' | 'viewer';

export interface UserPermissions {
  // Dashboard permissions
  canViewDashboard: boolean;
  canViewAnalytics: boolean;
  
  // Machine permissions
  canViewMachines: boolean;
  canControlMachines: boolean;
  canAddMachines: boolean;
  canEditMachines: boolean;
  canDeleteMachines: boolean;
  
  // Product permissions
  canViewProducts: boolean;
  canManageProducts: boolean;
  canImportProducts: boolean;
  canExportProducts: boolean;
  
  // User management permissions
  canViewUsers: boolean;
  canCreateUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canCreateSubAccounts: boolean;
  canAssignMachines: boolean;
  canAssignGroups: boolean;
  
  // Reports permissions
  canViewReports: boolean;
  canExportReports: boolean;
  canViewDetailedReports: boolean;
  
  // Operations permissions
  canViewOperations: boolean;
  canManageOperations: boolean;
  canViewAlarms: boolean;
  canManageAlarms: boolean;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  password: string;
  role: UserRole;
  accountType: 'main' | 'sub';
  parentAccountId?: string;
  assignedMachineIds?: string[];
  assignedGroupIds?: string[];
  phone?: string;
  department?: string;
  notes?: string;
}

export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  accountType?: 'main' | 'sub';
  assignedMachineIds?: string[];
  assignedGroupIds?: string[];
  phone?: string;
  department?: string;
  notes?: string;
}

// Add new interface for User Commodity List
export interface UserCommodityList {
  id: string; // List ID
  userId: string; // User ID who owns this list
  name: string; // Name of the list
  createdAt: string;
  updatedAt: string;
  items: UserCommodityListItem[];
}

export interface UserCommodityListItem {
  id: string; // Item ID
  commodityCode: string;
  productName: string;
  unitPrice: number;
  costPrice: number;
  supplier: string;
  specs: string;
  type: string;
  description: string;
}

// Types for Telemetry Data
export interface TelemetryData {
  timestamp: string;
  temperature?: number;
  humidity?: number;
  powerStatus: boolean;
  doorStatus: boolean;
  coinMechanism?: boolean;
  errors: ErrorInfo[];
  slotStatus: Record<string, Slot>; // Complete slot information from machine
  systemInfo: {
    uptime: number;
    memoryUsage: number;
    diskSpace: number;
  };
  // Machine operational mode
  operationalMode?: 'Automatic' | 'Auto' | 'Keep Fresh' | 'Preservation' | 'Standby';
  // Real-time temperature monitoring for ice cream and snack machines
  temperatureReadings?: {
    internalTemperature: number;    // Internal temperature (°C)
    ambientTemperature?: number;   // Ambient temperature (°C)
    refrigerationTemperature?: number; // Refrigeration unit temperature (°C)
    compressorStatus?: 'on' | 'off' | 'error';
    temperatureZone?: string;       // Which temperature zone this reading is from
  };
  // Cleaning status and logging
  cleaningStatus?: {
    isInCleaningMode: boolean;
    lastCleaningTimestamp?: string;
    daysSinceLastCleaning?: number;
  };
  // Sales data
  salesData?: {
    todaySales: number;
    todayTransactions: number;
    weeklySales: number;
    monthlySales: number;
    lastSaleTimestamp?: string;
    popularProducts?: Array<{
      productId: string;
      productName: string;
      salesCount: number;
    }>;
  };
  // Vending machine specific data
  vendingData?: {
    totalSlots: number;           // Total available slots (e.g., 58 for standard machines)
    activeSlots: number;          // Currently active/enabled slots
    slotConfiguration: Slot[];    // Complete slot configuration
    temperatureZones?: {          // Multi-zone temperature control
      zone1: { temperature: number; slots: number[]; };
      zone2?: { temperature: number; slots: number[]; };
      zone3?: { temperature: number; slots: number[]; };
    };
    dispensingStats: {
      totalDispenses: number;
      successfulDispenses: number;
      failedDispenses: number;
      jammedSlots: number[];
    };
    inventoryAlerts: {
      lowStockSlots: number[];     // Slots below minimum threshold
      emptySlots: number[];        // Completely empty slots
      expiredProducts: number[];   // Slots with expired products
    };
    paymentMethods: {
      cash: boolean;
      card: boolean;
      contactless: boolean;
      mobile: boolean;
    };
    salesSummary: {
      todayTotal: number;
      todayTransactions: number;
      weeklyTotal: number;
      monthlyTotal: number;
    };
  };

  // Ice cream machine specific data
  iceCreamData?: {
    currentMode: 'auto' | 'preservation' | 'stand-by' | 'defrost' | 'cleaning' | 'lock';
    temperatures: {
      iceCreamTank: number;    // Read-only monitoring
      freezingChamber: number; // Read-only monitoring
      ambient: number;         // Read-only monitoring
    };
    tankLevels: {
      vanillaIceCream: number; // 0-100% - Single vanilla ice cream tank
      sauce1: number;          // 0-100% - Sauce/jam tank 1
      sauce2: number;          // 0-100% - Sauce/jam tank 2
      sauce3: number;          // 0-100% - Sauce/jam tank 3
      decoration1: number;     // 0-100% - Decoration tank 1
      decoration2: number;     // 0-100% - Decoration tank 2
      decoration3: number;     // 0-100% - Decoration tank 3
    };
    flavorCombinations: {
      available: number[];     // Available combination IDs (1-16)
      currentSelection: number; // Currently selected combination
    };
    productionStats: {
      totalDispensed: number;
      lastCleaning: string;           // Last cleaning timestamp
      daysSinceLastCleaning: number;  // Days since last cleaning (machine tracks this)
      lastPowerLoss: string;          // Last power loss timestamp
      hoursSincePowerLoss: number;    // Hours since power restored (machine tracks this)
      totalOperatingHours: number;
    };
    lockStatus: {
      isLocked: boolean;
      lockReason?: 'cleaning_timeout' | 'power_loss' | 'manual';
      lockSettings: {
        cleaningTimeoutDays: number;   // Configurable (default 7 days)
        powerLossTimeoutHours: number; // Configurable (default 3 hours)
      };
      timeUntilLock?: {
        cleaningHours?: number;  // Hours until cleaning timeout
        powerLossMinutes?: number; // Minutes until power loss timeout
      };
    };
  };
}

export interface ErrorInfo {
  code: string;
  message: string;
  timestamp: string;
  severity: string;
}

// Cleaning Log Types
export interface CleaningLog {
  id: string;
  machineId: string;
  timestamp: string; // When cleaning mode was activated
  machineType: 'ice_cream' | 'coffee' | 'snack' | 'perfume';
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Auth Types - Using the main User interface for authentication

export interface LoginCredentials {
  email: string;
  password: string;
}

// Dashboard Types
export interface DashboardStats {
  totalMachines: number;
  onlineMachines: number;
  offlineMachines: number;
  activeAlarms: number;
  todaySales: number;
  todayProfit: number;
  todayTransactions: number;
}

// Remote Control Types
export interface MachineCommand {
  id: string;
  machineId: string;
  type: MachineCommandType;
  parameters: Record<string, any>;
  priority: 'low' | 'normal' | 'high' | 'critical';
  status: 'pending' | 'sent' | 'acknowledged' | 'executed' | 'failed' | 'timeout';
  createdAt: string;
  sentAt?: string;
  acknowledgedAt?: string;
  executedAt?: string;
  response?: any;
  error?: string;
  timeout?: number; // seconds
  retryCount: number;
  maxRetries: number;
  createdBy: string;
}

export type MachineCommandType = 
  // Ice Cream Machine Commands (Based on TCN-ICE-D2-133 Real Capabilities)
  | 'ICE_CREAM_SET_MODE'          // auto, preservation, stand-by (remote controllable only)
  | 'ICE_CREAM_SET_FLAVOR_COMBINATION' // Configure sauce (1-3) + topping (1-3) combinations
  | 'ICE_CREAM_SET_LOCK_SETTINGS' // Configure auto-lock: cleaning timeout, power loss timeout
  | 'ICE_CREAM_CHECK_STATUS'      // Monitor temperatures, tank levels (read-only)
  | 'ICE_CREAM_VIEW_PRODUCTION_STATS' // Production statistics and usage data
  | 'ICE_CREAM_GET_TEMPERATURE_READINGS' // Read-only temperature monitoring
  
  // Snack/Drink Vending Machine Commands (TCN-CSC series)
  | 'VENDING_CONFIGURE_SLOT'      // Configure price, product, enable/disable
  | 'VENDING_DISPENSE_PRODUCT'    // Test product dispensing
  | 'VENDING_SET_PRICES'          // Bulk price updates
  | 'VENDING_DISABLE_SLOT'        // Disable specific slots
  | 'VENDING_ENABLE_SLOT'         // Enable specific slots
  | 'VENDING_UPDATE_INVENTORY'    // Update inventory counts
  | 'VENDING_SET_TEMPERATURE'     // Refrigeration control (4-25°C)
  | 'VENDING_SET_PAYMENT_MODES'   // Enable/disable payment methods
  | 'VENDING_UPDATE_ADVERTISING'  // Update display advertisements
  | 'VENDING_SET_ENERGY_MODE'     // Energy saving mode
  | 'VENDING_CONFIGURE_MULTIPLE_SLOTS' // Bulk slot configuration
  | 'VENDING_RESET_SLOT'          // Reset specific slot to default
  | 'VENDING_GET_SLOT_STATUS'     // Get detailed slot information
  | 'VENDING_SET_SLOT_CAPACITY'   // Set maximum capacity for slot
  | 'VENDING_ASSIGN_PRODUCT_TO_SLOT' // Assign product to specific slot
  
  // Coffee Machine Commands (GS JK86/JK88)
  | 'COFFEE_SET_RECIPE'           // Bean-to-cup recipe settings
  | 'COFFEE_SET_GRIND_SIZE'       // Coffee grind adjustment
  | 'COFFEE_SET_WATER_TEMP'       // Water temperature (65-95°C)
  | 'COFFEE_SET_PRESSURE'         // Brewing pressure control
  | 'COFFEE_START_CLEANING'       // Automatic cleaning cycle
  | 'COFFEE_CALIBRATE_PORTIONS'   // Portion size calibration
  | 'COFFEE_SET_ICE_MODE'         // Ice making control (JK86 only)
  | 'COFFEE_UPDATE_MENU'          // Remote menu updates
  | 'COFFEE_SET_STRENGTH'         // Coffee strength adjustment
  | 'COFFEE_MANAGE_BEANS'         // Bean hopper management
  
  // Perfume Machine Commands (DKM MBT-5S50P)
  | 'PERFUME_SET_SPRAY_AMOUNT'    // Control spray quantity
  | 'PERFUME_SELECT_SCENT'        // Select from 5 available scents
  | 'PERFUME_LOCK_CONTROL'        // Electronic lock management
  | 'PERFUME_TEST_DISPENSE'       // Test spray functionality
  | 'PERFUME_SET_PRESSURE'        // Spray pressure adjustment
  
  // Universal Commands (All Machine Types)
  | 'UNIVERSAL_REBOOT'            // System reboot
  | 'UNIVERSAL_UPDATE_FIRMWARE'   // Firmware updates
  | 'UNIVERSAL_SYNC_TIME'         // Time synchronization
  | 'UNIVERSAL_GET_STATUS'        // Complete status report
  | 'UNIVERSAL_SET_DISPLAY_MESSAGE' // Custom display message
  | 'UNIVERSAL_ENABLE_MAINTENANCE_MODE' // Maintenance mode
  | 'UNIVERSAL_DISABLE_MAINTENANCE_MODE' // Exit maintenance
  | 'UNIVERSAL_EMERGENCY_STOP'    // Emergency stop
  | 'UNIVERSAL_RESET_ALARMS'      // Clear alarms
  | 'UNIVERSAL_SET_OPERATION_HOURS' // Operating hours
  | 'UNIVERSAL_REMOTE_MONITORING' // Enable/disable monitoring
  
  // Diagnostic Commands
  | 'DIAGNOSTIC_RUN_SELF_TEST'    // Complete self-diagnostics
  | 'DIAGNOSTIC_TEST_SENSORS'     // Sensor functionality
  | 'DIAGNOSTIC_TEST_ACTUATORS'   // Motor/actuator testing
  | 'DIAGNOSTIC_COLLECT_LOGS'     // System log collection
  | 'DIAGNOSTIC_NETWORK_TEST'     // Network connectivity
  | 'DIAGNOSTIC_PAYMENT_TEST'     // Payment system testing
  | 'DIAGNOSTIC_TEMPERATURE_TEST' // Temperature system check
  | 'DIAGNOSTIC_PRESSURE_TEST';   // Pressure system check

// Command Parameters for Different Machine Types
export interface IceCreamCommandParams {
  ICE_CREAM_SET_MODE: { mode: 'auto' | 'preservation' | 'stand-by' }; // Only remotely controllable modes
  ICE_CREAM_SET_FLAVOR_COMBINATION: { 
    sauceId: number;      // 1-3 for sauce/jam selection
    decorationId: number; // 1-3 for decoration selection
    combinationId: number; // 1-16 final combination ID
  };
  ICE_CREAM_SET_LOCK_SETTINGS: { 
    cleaningTimeoutDays: number;    // Days before auto-lock (default: 7)
    powerLossTimeoutHours: number;  // Hours before auto-lock after power restored (default: 3)
  };
  ICE_CREAM_CHECK_STATUS: { 
    includeTemperatures: boolean;   // Read-only temperature data
    includeTankLevels: boolean;     // Vanilla + 3 sauce + 3 decoration levels
    includeTimers: boolean;         // Days since cleaning, hours since power loss
  };
  ICE_CREAM_VIEW_PRODUCTION_STATS: { period: 'today' | 'week' | 'month' };
  ICE_CREAM_GET_TEMPERATURE_READINGS: { detailed: boolean }; // Read-only monitoring
}

export interface VendingCommandParams {
  VENDING_CONFIGURE_SLOT: { slot: number; productId?: string; price?: number; enabled?: boolean; maxQuantity?: number };
  VENDING_DISPENSE_PRODUCT: { slot: number; quantity?: number; testMode: boolean };
  VENDING_SET_PRICES: { priceUpdates: Array<{ slot: number; price: number }> };
  VENDING_DISABLE_SLOT: { slots: number[] };
  VENDING_ENABLE_SLOT: { slots: number[] };
  VENDING_UPDATE_INVENTORY: { inventory: Array<{ slot: number; quantity: number }> };
  VENDING_SET_TEMPERATURE: { temperature: number; zone?: string }; // 4-25°C
  VENDING_SET_PAYMENT_MODES: { cash: boolean; card: boolean; qr: boolean; mobile: boolean };
  VENDING_UPDATE_ADVERTISING: { content: string; duration?: number };
  VENDING_SET_ENERGY_MODE: { enabled: boolean; schedule?: string };
  VENDING_CONFIGURE_MULTIPLE_SLOTS: { 
    slots: Array<{
      slotNumber: number;
      productId?: string;
      price?: number;
      maxCapacity?: number;
      enabled?: boolean;
    }>;
  };
  VENDING_RESET_SLOT: { slot: number; keepProduct?: boolean };
  VENDING_GET_SLOT_STATUS: { slots?: number[]; includeDetailed?: boolean };
  VENDING_SET_SLOT_CAPACITY: { slot: number; maxCapacity: number };
  VENDING_ASSIGN_PRODUCT_TO_SLOT: { slot: number; productId: string; price?: number; quantity?: number };
}

export interface CoffeeCommandParams {
  COFFEE_SET_RECIPE: { beverage: string; strength: number; size: 'small' | 'medium' | 'large'; temperature: number };
  COFFEE_SET_GRIND_SIZE: { size: number; beverage?: string };
  COFFEE_SET_WATER_TEMP: { temperature: number; beverage?: string }; // 65-95°C
  COFFEE_SET_PRESSURE: { pressure: number; beverage?: string };
  COFFEE_START_CLEANING: { type: 'rinse' | 'deep' | 'descale'; duration?: number };
  COFFEE_CALIBRATE_PORTIONS: { beverages: string[] };
  COFFEE_SET_ICE_MODE: { enabled: boolean; iceAmount?: number }; // JK86 only
  COFFEE_UPDATE_MENU: { menuData: any };
  COFFEE_SET_STRENGTH: { beverage: string; strength: number };
  COFFEE_MANAGE_BEANS: { action: 'check' | 'refill' | 'calibrate' };
}

export interface PerfumeCommandParams {
  PERFUME_SET_SPRAY_AMOUNT: { amount: number; scent?: number }; // ml
  PERFUME_SELECT_SCENT: { scentId: number }; // 1-5
  PERFUME_LOCK_CONTROL: { action: 'lock' | 'unlock'; duration?: number };
  PERFUME_TEST_DISPENSE: { scentId: number; amount: number };
  PERFUME_SET_PRESSURE: { pressure: number };
}

export interface UniversalCommandParams {
  UNIVERSAL_REBOOT: { force: boolean; delay?: number };
  UNIVERSAL_UPDATE_FIRMWARE: { version: string; url: string; checksum: string };
  UNIVERSAL_SYNC_TIME: { timestamp: string; timezone: string };
  UNIVERSAL_GET_STATUS: { includeDetailed: boolean; sections?: string[] };
  UNIVERSAL_SET_DISPLAY_MESSAGE: { message: string; duration?: number; priority: 'low' | 'normal' | 'high' };
  UNIVERSAL_ENABLE_MAINTENANCE_MODE: { duration?: number; message?: string };
  UNIVERSAL_DISABLE_MAINTENANCE_MODE: { force?: boolean };
  UNIVERSAL_EMERGENCY_STOP: { reason: string };
  UNIVERSAL_RESET_ALARMS: { alarmCodes?: string[] };
  UNIVERSAL_SET_OPERATION_HOURS: { startTime: string; endTime: string; days: string[] };
}

export interface DiagnosticCommandParams {
  DIAGNOSTIC_RUN_SELF_TEST: { components?: string[]; generateReport: boolean };
  DIAGNOSTIC_TEST_SENSORS: { sensors?: string[]; duration?: number };
  DIAGNOSTIC_TEST_ACTUATORS: { actuators?: string[]; testSequence?: string };
  DIAGNOSTIC_COLLECT_LOGS: { startTime?: string; endTime?: string; logLevel?: string };
  DIAGNOSTIC_NETWORK_TEST: { endpoints?: string[]; timeout?: number };
}

// Combined command parameters type
export type MachineCommandParams = 
  | IceCreamCommandParams[keyof IceCreamCommandParams]
  | VendingCommandParams[keyof VendingCommandParams] 
  | CoffeeCommandParams[keyof CoffeeCommandParams]
  | UniversalCommandParams[keyof UniversalCommandParams]
  | DiagnosticCommandParams[keyof DiagnosticCommandParams];

// Command Response Types
export interface CommandResponse {
  commandId: string;
  success: boolean;
  message: string;
  data?: any;
  executionTime: number;
  timestamp: string;
}

// Command Queue Management
export interface CommandQueue {
  machineId: string;
  commands: MachineCommand[];
  lastProcessed: string;
  isProcessing: boolean;
}