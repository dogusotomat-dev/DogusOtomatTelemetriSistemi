import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, Button, 
  FormControl, InputLabel, Select, MenuItem, TextField, Stack, 
  Typography, FormControlLabel, Switch, Box, CircularProgress,
  Alert, Divider
} from '@mui/material';
import { Machine, MachineCommandType } from '../types';
import { MachineCommandService } from '../services/machineCommandService';
import { MachineService } from '../services/machineService';
import { useAuth } from '../hooks/useAuth';

interface Props {
  machine?: Machine;
  open: boolean;
  onClose: () => void;
}

interface IoTControlProps {
  open: boolean;
  onClose: () => void;
}

// IoT Numarası ile Makine Kontrolü
const IoTMachineControl: React.FC<IoTControlProps> = ({ open, onClose }) => {
  const { user } = useAuth();
  const [iotNumber, setIotNumber] = useState('');
  const [foundMachine, setFoundMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [command, setCommand] = useState<MachineCommandType | ''>('');
  const [params, setParams] = useState('{}');
  const [commandLoading, setCommandLoading] = useState(false);

  const handleFindMachine = async () => {
    if (!iotNumber.trim()) {
      setError('IoT numarası gerekli');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const machine = await MachineService.getMachineByIoTNumber(iotNumber.trim());
      if (machine) {
        setFoundMachine(machine);
        setError('');
      } else {
        setError('Bu IoT numarasına sahip makine bulunamadı');
        setFoundMachine(null);
      }
    } catch (err) {
      setError('Makine aranırken hata oluştu');
      setFoundMachine(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCommand = async () => {
    if (!foundMachine || !command || !user) return;

    setCommandLoading(true);
    try {
      const parameters = JSON.parse(params);
      const commandId = await MachineCommandService.sendCommand(
        foundMachine.id,
        command as MachineCommandType,
        parameters,
        'normal',
        user.id
      );
      
      alert(`Komut başarıyla gönderildi! Komut ID: ${commandId}`);
      setCommand('');
      setParams('{}');
    } catch (error) {
      alert(`Komut gönderilirken hata oluştu: ${error}`);
    } finally {
      setCommandLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>IoT Numarası ile Makine Kontrolü</DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Makine Bulma
            </Typography>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <TextField
                label="IoT Numarası"
                value={iotNumber}
                onChange={(e) => setIotNumber(e.target.value)}
                placeholder="Örn: IOT001234"
                fullWidth
              />
              <Button 
                variant="contained" 
                onClick={handleFindMachine}
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                {loading ? <CircularProgress size={20} /> : 'Makine Bul'}
              </Button>
            </Stack>
            {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
          </Box>

          {foundMachine && (
            <>
              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Bulunan Makine
                </Typography>
                <Alert severity="success">
                  <Typography variant="subtitle2">
                    {foundMachine.name} ({foundMachine.serialNumber})
                  </Typography>
                  <Typography variant="body2">
                    Tür: {foundMachine.type} | Durum: {foundMachine.connectionInfo.status}
                  </Typography>
                </Alert>
              </Box>

              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Komut Gönder
                </Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Komut Türü</InputLabel>
                    <Select
                      value={command}
                      onChange={(e) => setCommand(e.target.value as MachineCommandType)}
                    >
                      <MenuItem value="UNIVERSAL_GET_STATUS">Durum Bilgisi Al</MenuItem>
                      <MenuItem value="UNIVERSAL_REBOOT">Sistemi Yeniden Başlat</MenuItem>
                      <MenuItem value="UNIVERSAL_EMERGENCY_STOP">Acil Durdur</MenuItem>
                      <MenuItem value="UNIVERSAL_RESET_ALARMS">Alarmları Sıfırla</MenuItem>
                      <MenuItem value="UNIVERSAL_SET_DISPLAY_MESSAGE">Ekran Mesajı Ayarla</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <TextField
                    label="Parametreler (JSON)"
                    value={params}
                    onChange={(e) => setParams(e.target.value)}
                    multiline
                    rows={3}
                    placeholder='{"message": "Test mesajı", "duration": 30}'
                  />
                  
                  <Button
                    variant="contained"
                    onClick={handleSendCommand}
                    disabled={!command || commandLoading}
                    color="primary"
                  >
                    {commandLoading ? <CircularProgress size={20} /> : 'Komut Gönder'}
                  </Button>
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
};

const MachineControl: React.FC<Props> = ({ machine, open, onClose }) => {
  const { user } = useAuth();
  const [command, setCommand] = useState<MachineCommandType | ''>('');
  const [params, setParams] = useState('{}');
  const [loading, setLoading] = useState(false);

  // Komut görüntüleme isimleri (Türkçe)
  const getCommandDisplayName = (cmd: MachineCommandType): string => {
    const commandNames: Record<MachineCommandType, string> = {
      // Evrensel Komutlar
      'UNIVERSAL_REBOOT': 'Sistemi Yeniden Başlat',
      'UNIVERSAL_GET_STATUS': 'Durum Bilgisi Al',
      'UNIVERSAL_EMERGENCY_STOP': 'Acil Durdur',
      'UNIVERSAL_UPDATE_FIRMWARE': 'Firmware Güncelle',
      'UNIVERSAL_SYNC_TIME': 'Zaman Senkronize Et',
      'UNIVERSAL_SET_DISPLAY_MESSAGE': 'Ekran Mesajı Ayarla',
      'UNIVERSAL_RESET_ALARMS': 'Alarmları Sıfırla',
      'UNIVERSAL_SET_OPERATION_HOURS': 'Çalışma Saatleri Ayarla',
      'UNIVERSAL_REMOTE_MONITORING': 'Uzaktan İzleme',
      'UNIVERSAL_ENABLE_MAINTENANCE_MODE': 'Bakım Modunu Etkinleştir',
      'UNIVERSAL_DISABLE_MAINTENANCE_MODE': 'Bakım Modunu Devre Dışı Bırak',
      
      // Dondurma Makinesi Komutları
      'ICE_CREAM_SET_MODE': 'Dondurma Modu Ayarla',
      'ICE_CREAM_SET_FLAVOR_COMBINATION': 'Lezzet Karışımı Ayarla',
      'ICE_CREAM_SET_LOCK_SETTINGS': 'Kilit Ayarları',
      'ICE_CREAM_CHECK_STATUS': 'Dondurma Durumu Kontrol',
      'ICE_CREAM_VIEW_PRODUCTION_STATS': 'Üretim İstatistikleri',
      'ICE_CREAM_GET_TEMPERATURE_READINGS': 'Sıcaklık Ölçümü Al',
      
      // Kahve Makinesi Komutları
      'COFFEE_SET_RECIPE': 'Kahve Reçetesi Ayarla',
      'COFFEE_SET_WATER_TEMP': 'Su Sıcaklığı Ayarla',
      'COFFEE_SET_GRIND_SIZE': 'Öğütme Boyutu Ayarla',
      'COFFEE_SET_PRESSURE': 'Basınç Ayarla',
      'COFFEE_START_CLEANING': 'Temizlik Başlat',
      'COFFEE_CALIBRATE_PORTIONS': 'Porsiyon Kalibrasyonu',
      'COFFEE_SET_ICE_MODE': 'Buz Modu Ayarla',
      'COFFEE_UPDATE_MENU': 'Menü Güncelle',
      'COFFEE_SET_STRENGTH': 'Kahve Gücü Ayarla',
      'COFFEE_MANAGE_BEANS': 'Çekirdek Yönetimi',
      
      // Otomat Makinesi Komutları
      'VENDING_CONFIGURE_SLOT': 'Slot Ayarla',
      'VENDING_DISPENSE_PRODUCT': 'Ürün Çıkar',
      'VENDING_SET_TEMPERATURE': 'Sıcaklık Ayarla',
      'VENDING_SET_PRICES': 'Fiyat Ayarla',
      'VENDING_DISABLE_SLOT': 'Slot Devre Dışı Bırak',
      'VENDING_ENABLE_SLOT': 'Slot Etkinleştir',
      'VENDING_UPDATE_INVENTORY': 'Stok Güncelle',
      'VENDING_SET_PAYMENT_MODES': 'Ödeme Modları Ayarla',
      'VENDING_UPDATE_ADVERTISING': 'Reklam Güncelle',
      'VENDING_SET_ENERGY_MODE': 'Enerji Modu Ayarla',
      'VENDING_CONFIGURE_MULTIPLE_SLOTS': 'Çoklu Slot Ayarla',
      'VENDING_RESET_SLOT': 'Slot Sıfırla',
      'VENDING_GET_SLOT_STATUS': 'Slot Durumu Al',
      'VENDING_SET_SLOT_CAPACITY': 'Slot Kapasitesi Ayarla',
      'VENDING_ASSIGN_PRODUCT_TO_SLOT': 'Ürünü Slota Ata',
      
      // Parfüm Makinesi Komutları
      'PERFUME_SELECT_SCENT': 'Koku Seç',
      'PERFUME_SET_SPRAY_AMOUNT': 'Sprey Miktarı Ayarla',
      'PERFUME_LOCK_CONTROL': 'Kilit Kontrolü',
      'PERFUME_TEST_DISPENSE': 'Test Spreyi',
      'PERFUME_SET_PRESSURE': 'Sprey Basıncı Ayarla',
      
      // Tanı Komutları
      'DIAGNOSTIC_RUN_SELF_TEST': 'Kendi Kendine Test',
      'DIAGNOSTIC_TEST_SENSORS': 'Sensör Testi',
      'DIAGNOSTIC_TEST_ACTUATORS': 'Aktüatör Testi',
      'DIAGNOSTIC_COLLECT_LOGS': 'Log Toplama',
      'DIAGNOSTIC_NETWORK_TEST': 'Ağ Testi',
      'DIAGNOSTIC_PAYMENT_TEST': 'Ödeme Sistemi Testi',
      'DIAGNOSTIC_TEMPERATURE_TEST': 'Sıcaklık Sistemi Testi',
      'DIAGNOSTIC_PRESSURE_TEST': 'Basınç Sistemi Testi'
    };
    
    return commandNames[cmd] || cmd;
  };

  // Sadece gerçek makinelerde olan temel komutlar
  const commands: MachineCommandType[] = [
    'UNIVERSAL_GET_STATUS',
    ...(machine.type === 'ice_cream' ? [
      'ICE_CREAM_SET_MODE'
    ] as MachineCommandType[] : []),
    ...(machine.type === 'coffee' ? [] as MachineCommandType[] : []),
    ...(machine.type === 'snack' ? [] as MachineCommandType[] : []),
    ...(machine.type === 'perfume' ? [] as MachineCommandType[] : [])
  ];

  const sendCommand = async () => {
    if (!command || !user) return;
    setLoading(true);
    try {
      let parsedParams = {};
      try { parsedParams = JSON.parse(params); } catch {}
      await MachineCommandService.sendCommand(machine.id, command, parsedParams, 'normal', user.email!);
      setCommand('');
      setParams('{}');
    } finally {
      setLoading(false);
    }
  };

  const renderCommandParams = () => {
    if (!command) return null;

    // Helper to safely parse and update params
    const getParams = () => {
      try {
        return JSON.parse(params);
      } catch {
        return {};
      }
    };

    const updateParams = (newParams: any) => {
      setParams(JSON.stringify({ ...getParams(), ...newParams }));
    };

    switch (command) {
      case 'ICE_CREAM_SET_MODE':
        return (
          <FormControl fullWidth>
            <InputLabel>Çalışma Modu</InputLabel>
            <Select
              value={getParams().mode || ''}
              onChange={(e) => updateParams({ mode: e.target.value })}
            >
              <MenuItem value="normal">Normal Çalışma</MenuItem>
              <MenuItem value="maintenance">Bakım Modu</MenuItem>
              <MenuItem value="cleaning">Temizlik Modu</MenuItem>
            </Select>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Makineyi yeniden başlatmak için bakım modunu seçin
            </Typography>
          </FormControl>
        );
      
      case 'ICE_CREAM_SET_FLAVOR_COMBINATION':
        const currentParams = getParams();
        const sauceId = currentParams.sauceId || 1;
        const decorationId = currentParams.decorationId || 1;
        const combinationId = (sauceId - 1) * 3 + decorationId; // Calculate combination ID
        
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Configure Flavor Combination</Typography>
            <FormControl fullWidth>
              <InputLabel>Sauce/Jam (Tank 1-3)</InputLabel>
              <Select
                value={sauceId}
                onChange={(e) => {
                  const newSauceId = Number(e.target.value);
                  const newCombinationId = (newSauceId - 1) * 3 + decorationId;
                  updateParams({ 
                    sauceId: newSauceId, 
                    decorationId,
                    combinationId: newCombinationId
                  });
                }}
              >
                <MenuItem value={1}>Sauce Tank 1 (e.g., Chocolate)</MenuItem>
                <MenuItem value={2}>Sauce Tank 2 (e.g., Strawberry)</MenuItem>
                <MenuItem value={3}>Sauce Tank 3 (e.g., Caramel)</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Decoration (Tank 1-3)</InputLabel>
              <Select
                value={decorationId}
                onChange={(e) => {
                  const newDecorationId = Number(e.target.value);
                  const newCombinationId = (sauceId - 1) * 3 + newDecorationId;
                  updateParams({ 
                    sauceId, 
                    decorationId: newDecorationId,
                    combinationId: newCombinationId
                  });
                }}
              >
                <MenuItem value={1}>Decoration Tank 1 (e.g., Nuts)</MenuItem>
                <MenuItem value={2}>Decoration Tank 2 (e.g., Sprinkles)</MenuItem>
                <MenuItem value={3}>Decoration Tank 3 (e.g., Chocolate Chips)</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="primary">
              Selected Combination: #{combinationId} (Sauce {sauceId} + Decoration {decorationId})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Base: Vanilla Ice Cream • Total combinations available: 1-16
            </Typography>
          </Stack>
        );

      case 'ICE_CREAM_SET_LOCK_SETTINGS':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Auto-Lock Configuration</Typography>
            <TextField
              label="Cleaning Timeout (Days)"
              type="number"
              value={getParams().cleaningTimeoutDays || 7}
              onChange={(e) => updateParams({ cleaningTimeoutDays: parseInt(e.target.value) })}
              helperText="Machine auto-locks if not cleaned for X days (default: 7)"
              inputProps={{ min: 1, max: 30 }}
            />
            <TextField
              label="Power Loss Timeout (Hours)"
              type="number"
              value={getParams().powerLossTimeoutHours || 3}
              onChange={(e) => updateParams({ powerLossTimeoutHours: parseInt(e.target.value) })}
              helperText="Machine auto-locks if power restored after X hours (default: 3)"
              inputProps={{ min: 1, max: 48 }}
            />
            <Typography variant="caption" color="text.secondary">
              Machine tracks these durations internally in its memory
            </Typography>
          </Stack>
        );

      case 'ICE_CREAM_CHECK_STATUS':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Status Check Options</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={getParams().includeTemperatures ?? true}
                  onChange={(e) => updateParams({ includeTemperatures: e.target.checked })}
                />
              }
              label="Include Temperature Readings (Read-Only)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={getParams().includeTankLevels ?? true}
                  onChange={(e) => updateParams({ includeTankLevels: e.target.checked })}
                />
              }
              label="Include Tank Levels (Vanilla + 3 Sauce + 3 Decoration)"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={getParams().includeTimers ?? true}
                  onChange={(e) => updateParams({ includeTimers: e.target.checked })}
                />
              }
              label="Include Cleaning/Power Loss Timers"
            />
          </Stack>
        );

      case 'ICE_CREAM_GET_TEMPERATURE_READINGS':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Temperature Monitoring (Read-Only)</Typography>
            <FormControlLabel
              control={
                <Switch
                  checked={getParams().detailed ?? false}
                  onChange={(e) => updateParams({ detailed: e.target.checked })}
                />
              }
              label="Detailed Temperature Report"
            />
            <Typography variant="caption" color="warning.main">
              Note: Temperature control is not available remotely - monitoring only
            </Typography>
          </Stack>
        );

      case 'ICE_CREAM_VIEW_PRODUCTION_STATS':
        return (
          <FormControl fullWidth>
            <InputLabel>Report Period</InputLabel>
            <Select
              value={getParams().period || 'today'}
              onChange={(e) => updateParams({ period: e.target.value })}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        );

      // Vending machine parameter forms
      case 'VENDING_CONFIGURE_SLOT':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Configure Single Slot</Typography>
            <TextField
              label="Slot Number"
              type="number"
              value={getParams().slot || 1}
              onChange={(e) => updateParams({ slot: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 100 }}
            />
            <TextField
              label="Product ID (optional)"
              value={getParams().productId || ''}
              onChange={(e) => updateParams({ productId: e.target.value || undefined })}
              helperText="Leave empty to clear slot"
            />
            <TextField
              label="Price (₺)"
              type="number"
              value={getParams().price || 0}
              onChange={(e) => updateParams({ price: parseFloat(e.target.value) || 0 })}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Max Capacity"
              type="number"
              value={getParams().maxQuantity || 20}
              onChange={(e) => updateParams({ maxQuantity: parseInt(e.target.value) || 20 })}
              inputProps={{ min: 1, max: 100 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={getParams().enabled ?? true}
                  onChange={(e) => updateParams({ enabled: e.target.checked })}
                />
              }
              label="Slot Enabled"
            />
          </Stack>
        );

      case 'VENDING_ASSIGN_PRODUCT_TO_SLOT':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Assign Product to Slot</Typography>
            <TextField
              label="Slot Number"
              type="number"
              value={getParams().slot || 1}
              onChange={(e) => updateParams({ slot: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 100 }}
            />
            <TextField
              label="Product ID"
              value={getParams().productId || ''}
              onChange={(e) => updateParams({ productId: e.target.value })}
              required
            />
            <TextField
              label="Price (₺) - Optional"
              type="number"
              value={getParams().price || ''}
              onChange={(e) => updateParams({ price: parseFloat(e.target.value) || undefined })}
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              label="Initial Quantity - Optional"
              type="number"
              value={getParams().quantity || ''}
              onChange={(e) => updateParams({ quantity: parseInt(e.target.value) || undefined })}
              inputProps={{ min: 0 }}
            />
          </Stack>
        );

      case 'VENDING_SET_PRICES':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Bulk Price Update</Typography>
            <TextField
              label="Price Updates (JSON)"
              multiline
              rows={4}
              value={JSON.stringify(getParams().priceUpdates || [{ slot: 1, price: 5.0 }], null, 2)}
              onChange={(e) => {
                try {
                  const priceUpdates = JSON.parse(e.target.value);
                  updateParams({ priceUpdates });
                } catch {}
              }}
              helperText="Format: [{'slot': 1, 'price': 5.0}, {'slot': 2, 'price': 3.5}]"
            />
          </Stack>
        );

      case 'VENDING_UPDATE_INVENTORY':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Update Inventory Quantities</Typography>
            <TextField
              label="Inventory Updates (JSON)"
              multiline
              rows={4}
              value={JSON.stringify(getParams().inventory || [{ slot: 1, quantity: 20 }], null, 2)}
              onChange={(e) => {
                try {
                  const inventory = JSON.parse(e.target.value);
                  updateParams({ inventory });
                } catch {}
              }}
              helperText="Format: [{'slot': 1, 'quantity': 20}, {'slot': 2, 'quantity': 15}]"
            />
          </Stack>
        );

      case 'VENDING_GET_SLOT_STATUS':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Get Slot Status Information</Typography>
            <TextField
              label="Specific Slots (comma-separated, optional)"
              value={getParams().slots ? getParams().slots.join(',') : ''}
              onChange={(e) => {
                const slots = e.target.value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                updateParams({ slots: slots.length > 0 ? slots : undefined });
              }}
              helperText="Leave empty to get all slots. Example: 1,2,3,4"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={getParams().includeDetailed ?? true}
                  onChange={(e) => updateParams({ includeDetailed: e.target.checked })}
                />
              }
              label="Include Detailed Information"
            />
          </Stack>
        );

      case 'VENDING_CONFIGURE_MULTIPLE_SLOTS':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Configure Multiple Slots</Typography>
            <TextField
              label="Slot Configurations (JSON)"
              multiline
              rows={6}
              value={JSON.stringify(getParams().slots || [
                { slotNumber: 1, productId: 'prod123', price: 5.0, maxCapacity: 20, enabled: true }
              ], null, 2)}
              onChange={(e) => {
                try {
                  const slots = JSON.parse(e.target.value);
                  updateParams({ slots });
                } catch {}
              }}
              helperText="Configure multiple slots at once"
            />
          </Stack>
        );

      case 'VENDING_SET_TEMPERATURE':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Temperature Control</Typography>
            <TextField
              label="Temperature (°C)"
              type="number"
              value={getParams().temperature || 5}
              onChange={(e) => updateParams({ temperature: parseFloat(e.target.value) || 5 })}
              inputProps={{ min: 4, max: 25 }}
              helperText="Temperature range: 4-25°C"
            />
            <TextField
              label="Zone (optional)"
              value={getParams().zone || ''}
              onChange={(e) => updateParams({ zone: e.target.value || undefined })}
              helperText="Specify temperature zone if machine has multiple zones"
            />
          </Stack>
        );

      case 'VENDING_DISPENSE_PRODUCT':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">Test Product Dispensing</Typography>
            <TextField
              label="Slot Number"
              type="number"
              value={getParams().slot || 1}
              onChange={(e) => updateParams({ slot: parseInt(e.target.value) })}
              inputProps={{ min: 1, max: 100 }}
              required
            />
            <TextField
              label="Quantity"
              type="number"
              value={getParams().quantity || 1}
              onChange={(e) => updateParams({ quantity: parseInt(e.target.value) || 1 })}
              inputProps={{ min: 1, max: 5 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={getParams().testMode ?? true}
                  onChange={(e) => updateParams({ testMode: e.target.checked })}
                />
              }
              label="Test Mode (no payment required)"
            />
            <Typography variant="caption" color="warning.main">
              ⚠️ This will physically dispense products from the machine
            </Typography>
          </Stack>
        );

      // Add parameter forms for other machine types here...
      default:
        return (
          <TextField
            label="Parameters (JSON)"
            multiline
            rows={3}
            value={params}
            onChange={(e) => setParams(e.target.value)}
            placeholder='{"key": "value"}'
            helperText="Enter command parameters in JSON format"
          />
        );
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box>
          <Typography variant="h6" component="div">
            🎮 {machine.name} - Uzaktan Kontrol
          </Typography>
          {machine.model && (
            <Typography variant="body2" color="text.secondary">
              Model: {machine.model} • Seri No: {machine.serialNumber}
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={3}>
          <FormControl fullWidth>
            <InputLabel>Komut Seçin / Select Command</InputLabel>
            <Select value={command} onChange={(e) => setCommand(e.target.value as MachineCommandType)}>
              {commands.map(cmd => (
                <MenuItem key={cmd} value={cmd}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {getCommandDisplayName(cmd)}
                    </Typography>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                      {cmd}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          {renderCommandParams()}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Kapat</Button>
        <Button 
          variant="contained" 
          onClick={sendCommand} 
          disabled={!command || loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Gönderiliyor...' : 'Komutu Gönder'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MachineControl;
export { IoTMachineControl };