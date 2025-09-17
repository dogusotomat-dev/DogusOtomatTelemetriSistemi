import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, FormControl, InputLabel, Select, MenuItem, 
  TextField, Chip, Card, CardContent, IconButton, Alert, Snackbar,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Switch, FormControlLabel, Tooltip, Badge, LinearProgress
} from '@mui/material';
import {
  Settings as SettingsIcon, Refresh as RefreshIcon, Save as SaveIcon,
  Warning as WarningIcon, CheckCircle as CheckCircleIcon, Error as ErrorIcon,
  Assignment as AssignIcon, Remove as RemoveIcon, ShoppingCart as ProductIcon,
  Sync as SyncIcon, Lock as LockIcon, LockOpen as UnlockIcon
} from '@mui/icons-material';
import { Machine, Slot, Product, MachineCommandType } from '../types';
import { MachineCommandService } from '../services/machineCommandService';
import { ProductService } from '../services/productService';
import { MachineService } from '../services/machineService';
import { useAuth } from '../hooks/useAuth';

interface Props {
  machine: Machine;
  open: boolean;
  onClose: () => void;
}

interface SlotChangeRequest {
  slotNumber: number;
  productId?: string;
  price?: number;
  maxCapacity?: number;
  enabled?: boolean;
  quantity?: number;
}

const SlotManagement: React.FC<Props> = ({ machine, open, onClose }) => {
  const { user } = useAuth();
  
  // State management
  const [slots, setSlots] = useState<Slot[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<SlotChangeRequest[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  
  // Bulk operations state
  const [bulkOperationDialogOpen, setBulkOperationDialogOpen] = useState(false);
  const [bulkOperation, setBulkOperation] = useState<{
    type: 'assign_product' | 'set_price' | 'set_capacity' | 'enable_disable';
    productId?: string;
    price?: number;
    maxCapacity?: number;
    enabled?: boolean;
  }>({ type: 'assign_product' });
  
  // Individual slot edit
  const [editSlotDialogOpen, setEditSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<Slot | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load data on component mount
  useEffect(() => {
    if (open && machine) {
      loadSlotData();
      loadProducts();
    }
  }, [open, machine]);

  const loadSlotData = async () => {
    try {
      setLoading(true);
      
      // Extract slot data from machine configuration or telemetry
      if (machine.configuration?.slots) {
        const slotData = Object.entries(machine.configuration.slots).map(([slotNumber, slotInfo]) => ({
          slotNumber: parseInt(slotNumber),
          productId: slotInfo.productId,
          quantity: slotInfo.quantity,
          price: slotInfo.price,
          maxCapacity: slotInfo.maxCapacity,
          isEnabled: true,
          isJammed: false,
          sensorStatus: 'working' as const,
          totalDispensed: 0,
          motorStatus: 'working' as const
        }));
        setSlots(slotData);
      } else {
        // If no slot data, create empty slots based on machine model
        const defaultSlotCount = getDefaultSlotCount(machine.model);
        const emptySlots = Array.from({ length: defaultSlotCount }, (_, index) => ({
          slotNumber: index + 1,
          quantity: 0,
          price: 0,
          maxCapacity: 20,
          isEnabled: true,
          isJammed: false,
          sensorStatus: 'working' as const,
          totalDispensed: 0,
          motorStatus: 'working' as const
        }));
        setSlots(emptySlots);
      }
    } catch (error) {
      showNotification(`Error loading slot data: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const allProducts = await ProductService.getAllProducts();
      setProducts(allProducts.filter(p => p.isActive));
    } catch (error) {
      showNotification(`Error loading products: ${error}`, 'error');
    }
  };

  const getDefaultSlotCount = (model: string): number => {
    // Return default slot count based on machine model
    switch (model) {
      case 'DGS-D900-9C(55SP)': return 58;
      case 'DGS-CCH-10N(V10)': return 60;
      case 'DGS-F-10': return 5;
      default: return 58;
    }
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const getProductName = (productId?: string): string => {
    if (!productId) return 'Empty';
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const getSlotStatusColor = (slot: Slot): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    if (slot.isJammed) return 'error';
    if (!slot.isEnabled) return 'default';
    if (slot.quantity === 0) return 'warning';
    if (slot.quantity < slot.maxCapacity * 0.2) return 'info';
    return 'success';
  };

  const getSlotStatusText = (slot: Slot): string => {
    if (slot.isJammed) return 'Jammed';
    if (!slot.isEnabled) return 'Disabled';
    if (slot.quantity === 0) return 'Empty';
    if (slot.quantity < slot.maxCapacity * 0.2) return 'Low Stock';
    return 'Normal';
  };

  // Slot operations
  const handleEditSlot = (slot: Slot) => {
    setEditingSlot(slot);
    setEditSlotDialogOpen(true);
  };

  const handleSaveSlotEdit = async () => {
    if (!editingSlot || !user) return;

    try {
      // Send slot configuration command to machine
      await MachineCommandService.sendCommand(
        machine.id,
        'VENDING_CONFIGURE_SLOT',
        {
          slot: editingSlot.slotNumber,
          productId: editingSlot.productId,
          price: editingSlot.price,
          enabled: editingSlot.isEnabled,
          maxQuantity: editingSlot.maxCapacity
        },
        'normal',
        user.email!
      );

      // Update local state
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.slotNumber === editingSlot.slotNumber ? editingSlot : slot
        )
      );

      setEditSlotDialogOpen(false);
      showNotification(`Slot ${editingSlot.slotNumber} updated successfully`, 'success');
    } catch (error) {
      showNotification(`Error updating slot: ${error}`, 'error');
    }
  };

  const handleBulkOperation = async () => {
    if (!user || selectedSlots.length === 0) return;

    try {
      setLoading(true);

      switch (bulkOperation.type) {
        case 'assign_product':
          if (bulkOperation.productId) {
            for (const slotNumber of selectedSlots) {
              await MachineCommandService.sendCommand(
                machine.id,
                'VENDING_ASSIGN_PRODUCT_TO_SLOT',
                {
                  slot: slotNumber,
                  productId: bulkOperation.productId,
                  price: bulkOperation.price
                },
                'normal',
                user.email!
              );
            }
          }
          break;

        case 'set_price':
          if (bulkOperation.price !== undefined) {
            const priceUpdates = selectedSlots.map(slot => ({
              slot,
              price: bulkOperation.price!
            }));
            
            await MachineCommandService.sendCommand(
              machine.id,
              'VENDING_SET_PRICES',
              { priceUpdates },
              'normal',
              user.email!
            );
          }
          break;

        case 'enable_disable':
          const command: MachineCommandType = bulkOperation.enabled ? 'VENDING_ENABLE_SLOT' : 'VENDING_DISABLE_SLOT';
          await MachineCommandService.sendCommand(
            machine.id,
            command,
            { slots: selectedSlots },
            'normal',
            user.email!
          );
          break;

        case 'set_capacity':
          for (const slotNumber of selectedSlots) {
            if (bulkOperation.maxCapacity !== undefined) {
              await MachineCommandService.sendCommand(
                machine.id,
                'VENDING_SET_SLOT_CAPACITY',
                {
                  slot: slotNumber,
                  maxCapacity: bulkOperation.maxCapacity
                },
                'normal',
                user.email!
              );
            }
          }
          break;
      }

      setBulkOperationDialogOpen(false);
      setSelectedSlots([]);
      showNotification(`Bulk operation applied to ${selectedSlots.length} slots`, 'success');
    } catch (error) {
      showNotification(`Error in bulk operation: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshSlotData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Send command to get current slot status from machine
      await MachineCommandService.sendCommand(
        machine.id,
        'VENDING_GET_SLOT_STATUS',
        { includeDetailed: true },
        'high',
        user.email!
      );

      showNotification('Slot status refresh requested', 'info');
    } catch (error) {
      showNotification(`Error refreshing slot data: ${error}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelection = (slotNumber: number) => {
    setSelectedSlots(prev => 
      prev.includes(slotNumber)
        ? prev.filter(s => s !== slotNumber)
        : [...prev, slotNumber]
    );
  };

  const handleSelectAllSlots = () => {
    if (selectedSlots.length === slots.length) {
      setSelectedSlots([]);
    } else {
      setSelectedSlots(slots.map(s => s.slotNumber));
    }
  };

  const totalSlots = slots.length;
  const emptySlots = slots.filter(s => s.quantity === 0).length;
  const lowStockSlots = slots.filter(s => s.quantity > 0 && s.quantity < s.maxCapacity * 0.2).length;
  const jammedSlots = slots.filter(s => s.isJammed).length;
  const disabledSlots = slots.filter(s => !s.isEnabled).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            Slot Management - {machine.name}
          </Typography>
          <Box>
            <Button
              startIcon={<RefreshIcon />}
              onClick={handleRefreshSlotData}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              Refresh
            </Button>
            <Button
              startIcon={<SettingsIcon />}
              variant="contained"
              onClick={() => setBulkOperationDialogOpen(true)}
              disabled={selectedSlots.length === 0}
            >
              Bulk Operations ({selectedSlots.length})
            </Button>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent>
        {loading && <LinearProgress />}
        
        {/* Statistics Cards */}
        {/* @ts-ignore */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* @ts-ignore */}
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="primary">
                  {totalSlots}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Slots
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="warning.main">
                  {emptySlots}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Empty Slots
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="info.main">
                  {lowStockSlots}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Low Stock
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="error.main">
                  {jammedSlots}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Jammed
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <Typography variant="h6" color="text.secondary">
                  {disabledSlots}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Disabled
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          {/* @ts-ignore */}
          <Grid item xs={12} md={2}>
            <Card>
              <CardContent>
                <FormControlLabel
                  control={
                    <Switch
                      checked={selectedSlots.length === slots.length}
                      color={selectedSlots.length > 0 && selectedSlots.length < slots.length ? 'default' : 'primary'}
                      onChange={handleSelectAllSlots}
                    />
                  }
                  label="Select All"
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Slot Grid */}
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Select</TableCell>
                <TableCell>Slot</TableCell>
                <TableCell>Product</TableCell>
                <TableCell>Quantity</TableCell>
                <TableCell>Capacity</TableCell>
                <TableCell>Price (₺)</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Sensor</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slots.map((slot) => (
                <TableRow 
                  key={slot.slotNumber}
                  selected={selectedSlots.includes(slot.slotNumber)}
                >
                  <TableCell>
                    <Switch
                      checked={selectedSlots.includes(slot.slotNumber)}
                      onChange={() => handleSlotSelection(slot.slotNumber)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {slot.slotNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        {getProductName(slot.productId)}
                      </Typography>
                      {slot.productId && (
                        <Typography variant="caption" color="text.secondary">
                          ID: {slot.productId.substring(0, 8)}...
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {slot.quantity}
                      </Typography>
                      {slot.quantity > 0 && (
                        <LinearProgress
                          variant="determinate"
                          value={(slot.quantity / slot.maxCapacity) * 100}
                          sx={{ width: 40, height: 4 }}
                          color={slot.quantity < slot.maxCapacity * 0.2 ? 'warning' : 'primary'}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{slot.maxCapacity}</TableCell>
                  <TableCell>₺{slot.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Chip
                      label={getSlotStatusText(slot)}
                      color={getSlotStatusColor(slot)}
                      size="small"
                      icon={
                        slot.isJammed ? <ErrorIcon /> :
                        !slot.isEnabled ? <LockIcon /> :
                        slot.quantity === 0 ? <WarningIcon /> :
                        <CheckCircleIcon />
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={slot.sensorStatus}
                      color={slot.sensorStatus === 'working' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Slot">
                      <IconButton
                        size="small"
                        onClick={() => handleEditSlot(slot)}
                      >
                        <SettingsIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* Edit Slot Dialog */}
      <Dialog
        open={editSlotDialogOpen}
        onClose={() => setEditSlotDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit Slot {editingSlot?.slotNumber}
        </DialogTitle>
        <DialogContent>
          {editingSlot && (
            <Box sx={{ mt: 2 }}>
              {/* @ts-ignore */}
              <Grid container spacing={2}>
                {/* @ts-ignore */}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Product</InputLabel>
                    <Select
                      value={editingSlot.productId || ''}
                      onChange={(e) => setEditingSlot({
                        ...editingSlot,
                        productId: e.target.value || undefined
                      })}
                    >
                      <MenuItem value="">
                        <em>Empty Slot</em>
                      </MenuItem>
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name} - ₺{product.sellPrice}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {/* @ts-ignore */}
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Price (₺)"
                    type="number"
                    value={editingSlot.price}
                    onChange={(e) => setEditingSlot({
                      ...editingSlot,
                      price: parseFloat(e.target.value) || 0
                    })}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                {/* @ts-ignore */}
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Max Capacity"
                    type="number"
                    value={editingSlot.maxCapacity}
                    onChange={(e) => setEditingSlot({
                      ...editingSlot,
                      maxCapacity: parseInt(e.target.value) || 0
                    })}
                    inputProps={{ min: 1, max: 100 }}
                  />
                </Grid>
                {/* @ts-ignore */}
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={editingSlot.isEnabled}
                        onChange={(e) => setEditingSlot({
                          ...editingSlot,
                          isEnabled: e.target.checked
                        })}
                      />
                    }
                    label="Slot Enabled"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditSlotDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveSlotEdit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Operations Dialog */}
      <Dialog
        open={bulkOperationDialogOpen}
        onClose={() => setBulkOperationDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Bulk Operations ({selectedSlots.length} slots selected)
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Operation Type</InputLabel>
              <Select
                value={bulkOperation.type}
                onChange={(e) => setBulkOperation({
                  ...bulkOperation,
                  type: e.target.value as any
                })}
              >
                <MenuItem value="assign_product">Assign Product</MenuItem>
                <MenuItem value="set_price">Set Price</MenuItem>
                <MenuItem value="set_capacity">Set Capacity</MenuItem>
                <MenuItem value="enable_disable">Enable/Disable</MenuItem>
              </Select>
            </FormControl>

            {bulkOperation.type === 'assign_product' && (
              <>
                {/* @ts-ignore */}
                <Grid container spacing={2}>
                {/* @ts-ignore */}
                <Grid item xs={8}>
                  <FormControl fullWidth>
                    <InputLabel>Product</InputLabel>
                    <Select
                      value={bulkOperation.productId || ''}
                      onChange={(e) => setBulkOperation({
                        ...bulkOperation,
                        productId: e.target.value
                      })}
                    >
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {/* @ts-ignore */}
                <Grid item xs={4}>
                  <TextField
                    fullWidth
                    label="Price (₺)"
                    type="number"
                    value={bulkOperation.price || ''}
                    onChange={(e) => setBulkOperation({
                      ...bulkOperation,
                      price: parseFloat(e.target.value) || undefined
                    })}
                  />
                </Grid>
              </Grid>
              </>
            )}

            {bulkOperation.type === 'set_price' && (
              <TextField
                fullWidth
                label="Price (₺)"
                type="number"
                value={bulkOperation.price || ''}
                onChange={(e) => setBulkOperation({
                  ...bulkOperation,
                  price: parseFloat(e.target.value) || undefined
                })}
                inputProps={{ min: 0, step: 0.01 }}
              />
            )}

            {bulkOperation.type === 'set_capacity' && (
              <TextField
                fullWidth
                label="Max Capacity"
                type="number"
                value={bulkOperation.maxCapacity || ''}
                onChange={(e) => setBulkOperation({
                  ...bulkOperation,
                  maxCapacity: parseInt(e.target.value) || undefined
                })}
                inputProps={{ min: 1, max: 100 }}
              />
            )}

            {bulkOperation.type === 'enable_disable' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={bulkOperation.enabled ?? true}
                    onChange={(e) => setBulkOperation({
                      ...bulkOperation,
                      enabled: e.target.checked
                    })}
                  />
                }
                label={bulkOperation.enabled ? 'Enable Slots' : 'Disable Slots'}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkOperationDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleBulkOperation} variant="contained">
            Apply to {selectedSlots.length} Slots
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default SlotManagement;