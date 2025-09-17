import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, Box, Alert, LinearProgress, Stepper, Step, StepLabel
} from '@mui/material';
import { Upload as UploadIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { CommodityMigrationService, CommodityListItem } from '../services/commodityMigrationService';
import { useAuth } from '../hooks/useAuth';

interface Props {
  open: boolean;
  onClose: () => void;
  onMigrationComplete: () => void;
}

const CommodityMigrationHelper: React.FC<Props> = ({ open, onClose, onMigrationComplete }) => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [migrationResult, setMigrationResult] = useState<{
    success: boolean;
    imported: number;
    errors: string[];
  } | null>(null);

  const steps = [
    'Upload Commodity List File',
    'Process Data',
    'Migration Complete'
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.id) {
      setIsLoading(true);
      setStep(1);
      
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const commodityData = JSON.parse(content) as CommodityListItem[];
          
          console.log('Starting commodity migration...');
          const result = await CommodityMigrationService.migrateCommodityListToUser(user.id, commodityData);
          
          setMigrationResult(result);
          setStep(2);
          setIsLoading(false);
        } catch (error) {
          console.error('Migration failed:', error);
          setMigrationResult({
            success: false,
            imported: 0,
            errors: [`Migration failed: ${error}`]
          });
          setStep(2);
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleClose = () => {
    setStep(0);
    setMigrationResult(null);
    setIsLoading(false);
    onClose();
  };

  const handleComplete = () => {
    onMigrationComplete();
    handleClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Commodity List Migration
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Stepper activeStep={step}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>

        {step === 0 && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Upload Your Commodity List JSON File
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select the JSON file exported from your commodity list system. 
              The system will automatically convert it to user-specific products.
            </Typography>
            <Button
              variant="contained"
              component="label"
              startIcon={<UploadIcon />}
              size="large"
            >
              Choose File
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleFileUpload}
              />
            </Button>
          </Box>
        )}

        {step === 1 && isLoading && (
          <Box sx={{ py: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Processing Commodity List Data...
            </Typography>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Converting commodity items to products, categories, and suppliers...
            </Typography>
          </Box>
        )}

        {step === 2 && migrationResult && (
          <Box sx={{ py: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckIcon color={migrationResult.success ? 'success' : 'error'} sx={{ mr: 1 }} />
              <Typography variant="h6">
                Migration {migrationResult.success ? 'Completed' : 'Failed'}
              </Typography>
            </Box>

            {migrationResult.success ? (
              <Alert severity="success" sx={{ mb: 2 }}>
                Successfully imported {migrationResult.imported} products!
              </Alert>
            ) : (
              <Alert severity="error" sx={{ mb: 2 }}>
                Migration failed. Please check the file format and try again.
              </Alert>
            )}

            {migrationResult.errors.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {migrationResult.errors.length} errors occurred during migration:
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  {migrationResult.errors.slice(0, 5).map((error, index) => (
                    <li key={index}>
                      <Typography variant="body2">{error}</Typography>
                    </li>
                  ))}
                  {migrationResult.errors.length > 5 && (
                    <li>
                      <Typography variant="body2">
                        ... and {migrationResult.errors.length - 5} more errors
                      </Typography>
                    </li>
                  )}
                </Box>
              </Alert>
            )}

            <Typography variant="body2" color="text.secondary">
              Your commodity list has been converted to user-specific products. 
              You can now manage them in the product management interface.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        {step < 2 && (
          <Button onClick={handleClose}>
            Cancel
          </Button>
        )}
        {step === 2 && (
          <>
            <Button onClick={handleClose}>
              Close
            </Button>
            {migrationResult?.success && (
              <Button variant="contained" onClick={handleComplete}>
                View Products
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CommodityMigrationHelper;
