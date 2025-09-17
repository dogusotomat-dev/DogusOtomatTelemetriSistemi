import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert, Container } from '@mui/material';
import { DirectFirebaseService } from '../../services/directFirebaseService';
import { DebugService } from '../../services/debugService';

/**
 * Emulator API Handler
 * This page handles API calls from emulator devices
 * Bypasses Netlify Functions and works directly with Firebase
 */
const EmulatorAPI: React.FC = () => {
  const [status, setStatus] = useState<string>('Ready');
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    // Handle URL parameters for API calls
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    const machineId = urlParams.get('machineId');
    const iotNumber = urlParams.get('iotNumber');

    if (action === 'heartbeat' && machineId && iotNumber) {
      handleHeartbeat(machineId, iotNumber);
    } else if (action === 'telemetry' && machineId && iotNumber) {
      handleTelemetry(machineId, iotNumber);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev.slice(-9), `${timestamp}: ${message}`]);
  };

  const handleHeartbeat = async (machineId: string, iotNumber: string) => {
    setStatus('Processing heartbeat...');
    addLog(`Heartbeat request: Machine ${machineId}, IoT ${iotNumber}`);

    try {
      const result = await DirectFirebaseService.processEmulatorHeartbeat(
        machineId,
        iotNumber,
        {
          batteryLevel: 85,
          signalStrength: 90,
          temperature: -15
        }
      );

      if (result.success) {
        setStatus('Heartbeat processed successfully');
        addLog(`✅ ${result.message}`);
      } else {
        setStatus('Heartbeat failed');
        addLog(`❌ ${result.message}`);
      }
    } catch (error) {
      setStatus('Heartbeat error');
      addLog(`❌ Error: ${error}`);
    }
  };

  const handleTelemetry = async (machineId: string, iotNumber: string) => {
    setStatus('Processing telemetry...');
    addLog(`Telemetry request: Machine ${machineId}, IoT ${iotNumber}`);

    try {
      const telemetryData = {
        powerStatus: true,
        doorStatus: false,
        temperatureReadings: {
          internalTemperature: -15,
          ambientTemperature: 20,
          refrigerationTemperature: -18,
          compressorStatus: 'on',
          temperatureZone: 'main'
        },
        errors: [],
        slotStatus: {},
        systemInfo: {
          uptime: 3600000,
          memoryUsage: 75,
          diskSpace: 85
        },
        salesData: {
          todaySales: 150,
          todayTransactions: 5,
          weeklySales: 800,
          monthlySales: 3200
        },
        cleaningStatus: {
          isInCleaningMode: false,
          lastCleaningTimestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          daysSinceLastCleaning: 2
        }
      };

      const result = await DirectFirebaseService.processEmulatorTelemetry(
        machineId,
        iotNumber,
        telemetryData
      );

      if (result.success) {
        setStatus('Telemetry processed successfully');
        addLog(`✅ ${result.message}`);
      } else {
        setStatus('Telemetry failed');
        addLog(`❌ ${result.message}`);
      }
    } catch (error) {
      setStatus('Telemetry error');
      addLog(`❌ Error: ${error}`);
    }
  };

  const testHeartbeat = () => {
    handleHeartbeat('2506211449', '8990010873499834749');
  };

  const testTelemetry = () => {
    handleTelemetry('2506211449', '8990010873499834749');
  };

  const debugMachineStatus = async () => {
    addLog('🔍 Debugging machine status...');
    await DebugService.checkMachineStatus();
    addLog('✅ Debug completed - check console for details');
  };

  const forceHeartbeatUpdate = async () => {
    addLog('🔄 Force updating heartbeat...');
    await DebugService.forceHeartbeatUpdate('2506211449');
    addLog('✅ Heartbeat force updated');
  };

  const recreateTestMachine = async () => {
    addLog('🧹 Recreating test machine...');
    await DebugService.recreateTestMachine('2506211449');
    addLog('✅ Test machine recreated');
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Emulator API Handler
        </Typography>
        
        <Alert severity="info" sx={{ mb: 3 }}>
          Bu sayfa emülatörden gelen API isteklerini işler. Netlify Functions'ı bypass eder.
        </Alert>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Status: {status}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Test Buttons
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={testHeartbeat}
            >
              Test Heartbeat
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={testTelemetry}
            >
              Test Telemetry
            </Button>
            <Button 
              variant="outlined" 
              color="info" 
              onClick={debugMachineStatus}
            >
              Debug Status
            </Button>
            <Button 
              variant="outlined" 
              color="warning" 
              onClick={forceHeartbeatUpdate}
            >
              Force Update
            </Button>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={recreateTestMachine}
            >
              Recreate Machine
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            API URLs
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', mb: 1 }}>
            Heartbeat: {window.location.origin}/emulator-api?action=heartbeat&machineId=2506211449&iotNumber=8990010873499834749
          </Typography>
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            Telemetry: {window.location.origin}/emulator-api?action=telemetry&machineId=2506211449&iotNumber=8990010873499834749
          </Typography>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Logs
          </Typography>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5', maxHeight: 300, overflow: 'auto' }}>
            {logs.map((log, index) => (
              <Typography key={index} variant="body2" sx={{ fontFamily: 'monospace', mb: 0.5 }}>
                {log}
              </Typography>
            ))}
          </Paper>
        </Box>
      </Paper>
    </Container>
  );
};

export default EmulatorAPI;
