import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  useMediaQuery, 
  Container, 
  Fade, 
  Slide,
  Tabs,
  Tab,
  Card,
  CardContent
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Add as AddIcon, Icecream, LocalCafe, Fastfood, Spa as PerfumeIcon } from '@mui/icons-material';
import UserProductManagement from '../../components/UserProductManagement';
import { useLanguage } from '../../contexts/LanguageContext';

const CommodityListsPage: React.FC = () => {
  const { t } = useLanguage();
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Snack/Beverage, 2: Ice Cream, 3: Coffee, 4: Perfume

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // Filter products based on machine type
  const getMachineTypeFilter = () => {
    switch (activeTab) {
      case 1: return 'snack'; // Snack/Beverage
      case 2: return 'ice_cream'; // Ice Cream
      case 3: return 'coffee'; // Coffee
      case 4: return 'perfume'; // Perfume
      default: return 'all'; // All products
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 4 }, px: { xs: 1, sm: 3 } }}>
      <Fade in timeout={600}>
        <Box className="page-enter">
          <Box sx={{ mb: { xs: 3, sm: 4 } }}>
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
                fontSize: { xs: '2rem', sm: '3rem' },
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              {t('nav.products')}
            </Typography>
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.9rem', sm: '1rem' },
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              Kişiye özel ürün kataloğu - Kullanıcıya atanmış commodity list görüntülenir
            </Typography>
          </Box>

          {/* Machine Type Tabs */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ minHeight: 48 }}
              >
                <Tab 
                  label="Tüm Ürünler" 
                  icon={<AddIcon />} 
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
                <Tab 
                  label="Atıştırmalık/Içecek" 
                  icon={<Fastfood />} 
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
                <Tab 
                  label="Dondurma" 
                  icon={<Icecream />} 
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
                <Tab 
                  label="Kahve" 
                  icon={<LocalCafe />} 
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
                <Tab 
                  label="Parfüm" 
                  icon={<PerfumeIcon />} 
                  iconPosition="start"
                  sx={{ minHeight: 48 }}
                />
              </Tabs>
            </CardContent>
          </Card>

          <Slide 
            direction="up" 
            in 
            timeout={800}
            key={activeTab}
            style={{ transformOrigin: '0 0 0' }}
          >
            <Paper 
              elevation={0}
              sx={{ 
                p: { xs: 2, sm: 4 },
                borderRadius: 3,
                background: theme.palette.mode === 'dark' ? 'rgba(30, 30, 30, 0.9)' : '#ffffff',
                border: '1px solid rgba(102, 126, 234, 0.1)',
                boxShadow: '0 4px 20px rgba(102, 126, 234, 0.08)',
                transition: 'all 0.3s ease-in-out'
              }}
            >
              <UserProductManagement 
                open={true} 
                onClose={() => {}} 
                machineTypeFilter={getMachineTypeFilter()}
              />
            </Paper>
          </Slide>
        </Box>
      </Fade>
    </Container>
  );
};

export default CommodityListsPage;