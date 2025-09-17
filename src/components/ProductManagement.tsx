import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Grid, FormControl, InputLabel, Select, 
  MenuItem, Switch, FormControlLabel, Chip, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Alert, Snackbar, Card, CardContent,
  InputAdornment, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Search as SearchIcon, FileDownload as DownloadIcon, FileUpload as UploadIcon,
  ExpandMore as ExpandMoreIcon, Save as SaveIcon, Cancel as CancelIcon,
  ImportExport as ImportIcon
} from '@mui/icons-material';
import { Product, ProductCategory, Supplier } from '../types';
import { ProductService, ProductSubscriptionService } from '../services/productService';
import { RealProductImportService, generateRealProductSampleData } from '../services/realProductImportService';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ProductManagement: React.FC<Props> = ({ open, onClose }) => {
  const { t, formatCurrency } = useLanguage();
  // State management
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  
  // Dialog states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isNewProduct, setIsNewProduct] = useState(false);
  
  // Form state
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '',
    description: '',
    barcode: '',
    categoryId: '',
    supplierId: '',
    costPrice: 0,
    sellPrice: 0,
    weight: 0,
    volume: 0,
    isActive: true,
    minStockLevel: 0,
    tags: []
  });
  
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
    const unsubscribeProducts = ProductSubscriptionService.subscribeToProducts(setProducts);
    const unsubscribeCategories = ProductSubscriptionService.subscribeToCategories(setCategories);
    const unsubscribeSuppliers = ProductSubscriptionService.subscribeToSuppliers(setSuppliers);

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeSuppliers();
    };
  }, []);

  // Filter products based on search and filters
  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(lowercaseSearch) ||
        product.barcode.toLowerCase().includes(lowercaseSearch) ||
        product.productCode?.toLowerCase().includes(lowercaseSearch) ||
        product.description?.toLowerCase().includes(lowercaseSearch)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    if (selectedSupplier) {
      filtered = filtered.filter(product => product.supplierId === selectedSupplier);
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedCategory, selectedSupplier]);

  // Helper functions
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier ? supplier.name : 'Unknown Supplier';
  };

  // Product operations
  const handleAddProduct = () => {
    setProductForm({
      name: '',
      description: '',
      barcode: '',
      categoryId: '',
      supplierId: '',
      costPrice: 0,
      sellPrice: 0,
      weight: 0,
      volume: 0,
      isActive: true,
      minStockLevel: 0,
      tags: []
    });
    setEditingProduct(null);
    setIsNewProduct(true);
    setEditDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setProductForm(product);
    setEditingProduct(product);
    setIsNewProduct(false);
    setEditDialogOpen(true);
  };

  const handleSaveProduct = async () => {
    try {
      if (isNewProduct) {
        await ProductService.addProduct(productForm as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        showNotification(t('products.addSuccess'), 'success');
      } else if (editingProduct) {
        await ProductService.updateProduct(editingProduct.id, productForm);
        showNotification(t('products.updateSuccess'), 'success');
      }
      setEditDialogOpen(false);
    } catch (error) {
      showNotification(`${t('common.error')}: ${error}`, 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm(t('products.deleteConfirm'))) {
      try {
        await ProductService.deleteProduct(productId);
        showNotification(t('products.deleteSuccess'), 'success');
      } catch (error) {
        showNotification(`${t('common.error')}: ${error}`, 'error');
      }
    }
  };

  // Import real product data
  const handleImportRealData = async () => {
    try {
      const realProducts = RealProductImportService.convertRealDataToProducts();
      const realCategories = RealProductImportService.generateCategories();
      const realSuppliers = RealProductImportService.generateSuppliers();
      
      // Import categories first
      for (const category of realCategories) {
        try {
          await ProductService.addCategory(category);
        } catch (error) {
          // Category might already exist, continue
        }
      }
      
      // Import suppliers
      for (const supplier of realSuppliers) {
        try {
          await ProductService.addSupplier(supplier);
        } catch (error) {
          // Supplier might already exist, continue
        }
      }
      
      // Import products
      let importedCount = 0;
      for (const product of realProducts) {
        try {
          await ProductService.addProduct(product);
          importedCount++;
        } catch (error) {
          // Product might already exist, continue
        }
      }
      
      showNotification(
        `${t('products.importRealData')} tamamlandı. ${importedCount} ürün, ${realCategories.length} kategori, ${realSuppliers.length} tedarikçi içe aktarıldı.`,
        'success'
      );
    } catch (error) {
      showNotification(`${t('common.error')}: ${error}`, 'error');
    }
  };
  const handleExportProducts = async () => {
    try {
      const jsonData = await ProductService.exportProducts();
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `products_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification(t('products.exportSuccess'), 'success');
    } catch (error) {
      showNotification(`${t('common.error')}: ${error}`, 'error');
    }
  };

  const handleImportProducts = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = e.target?.result as string;
          const result = await ProductService.importProducts(jsonData);
          if (result.success) {
            showNotification(t('products.importSuccess').replace('{count}', result.imported.toString()), 'success');
          } else {
            showNotification(`${t('products.importWarning')}: ${result.errors.join(', ')}`, 'warning');
          }
        } catch (error) {
          showNotification(`${t('common.error')}: ${error}`, 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  const downloadSampleData = () => {
    const sampleData = generateRealProductSampleData();
    const blob = new Blob([sampleData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dogus_otomat_sample_products.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{t('products.title')}</Typography>
          <Box>
            <Button
              startIcon={<ImportIcon />}
              onClick={handleImportRealData}
              sx={{ mr: 1 }}
              color="primary"
            >
              {t('products.importRealData')}
            </Button>
            <Button
              startIcon={<UploadIcon />}
              onClick={handleExportProducts}
              sx={{ mr: 1 }}
            >
              {t('products.exportData')}
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              component="label"
              sx={{ mr: 1 }}
            >
              {t('common.import')}
              <input
                type="file"
                accept=".json"
                hidden
                onChange={handleImportProducts}
              />
            </Button>
            <Button
              onClick={downloadSampleData}
              variant="outlined"
              size="small"
            >
              {t('common.sampleData')}
            </Button>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {/* Search and Filter Section */}
          <Card sx={{ mb: 2 }}>
            <CardContent>
              {/* @ts-ignore */}
              <Grid container spacing={2}>
                {/* @ts-ignore */}
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    placeholder={t('products.searchProducts')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                {/* @ts-ignore */}
                {/* @ts-ignore */}
            <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>{t('products.categoryFilter')}</InputLabel>
                    <Select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      <MenuItem value="">{t('products.allCategories')}</MenuItem>
                      {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                          {category.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {/* @ts-ignore */}
                {/* @ts-ignore */}
            <Grid item xs={12} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>{t('products.supplierFilter')}</InputLabel>
                    <Select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                    >
                      <MenuItem value="">{t('products.allSuppliers')}</MenuItem>
                      {suppliers.map((supplier) => (
                        <MenuItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {/* @ts-ignore */}
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleAddProduct}
                  >
                    {t('products.addProduct')}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          {/* @ts-ignore */}
          {/* @ts-ignore */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {/* @ts-ignore */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="primary">
                    {products.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.totalProducts')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* @ts-ignore */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    {products.filter(p => p.isActive).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.activeProducts')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* @ts-ignore */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {categories.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.categories')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            {/* @ts-ignore */}
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    {suppliers.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.suppliers')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Products Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('products.productCode')}</TableCell>
                  <TableCell>{t('products.productName')}</TableCell>
                  <TableCell>{t('products.barcode')}</TableCell>
                  <TableCell>{t('products.category')}</TableCell>
                  <TableCell>{t('products.supplier')}</TableCell>
                  <TableCell>{t('products.costPrice')}</TableCell>
                  <TableCell>{t('products.sellPrice')}</TableCell>
                  <TableCell>{t('products.weight')}/{t('products.volume')}</TableCell>
                  <TableCell>{t('products.status')}</TableCell>
                  <TableCell>{t('products.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.productCode}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {product.name}
                        </Typography>
                        {product.description && (
                          <Typography variant="caption" color="text.secondary">
                            {product.description.substring(0, 50)}...
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>{product.barcode}</TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{getSupplierName(product.supplierId)}</TableCell>
                    <TableCell>{formatCurrency(product.costPrice)}</TableCell>
                    <TableCell>{formatCurrency(product.sellPrice)}</TableCell>
                    <TableCell>
                      {product.weight ? `${product.weight}g` : ''}
                      {product.weight && product.volume ? ' / ' : ''}
                      {product.volume ? `${product.volume}ml` : ''}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product.isActive ? t('products.active') : t('products.inactive')}
                        color={product.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleEditProduct(product)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteProduct(product.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>

      {/* Edit Product Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isNewProduct ? t('products.addProduct') : t('products.edit')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{t('products.basicInfo')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* @ts-ignore */}
                <Grid container spacing={2}>
                  {/* @ts-ignore */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('products.productName')}
                      value={productForm.name || ''}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      required
                    />
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={t('products.barcode')}
                      value={productForm.barcode || ''}
                      onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                      required
                    />
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t('products.fieldDescription')}
                      multiline
                      rows={3}
                      value={productForm.description || ''}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>{t('products.category')}</InputLabel>
                      <Select
                        value={productForm.categoryId || ''}
                        onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                      >
                        {categories.map((category) => (
                          <MenuItem key={category.id} value={category.id}>
                            {category.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>{t('products.supplier')}</InputLabel>
                      <Select
                        value={productForm.supplierId || ''}
                        onChange={(e) => setProductForm({ ...productForm, supplierId: e.target.value })}
                      >
                        {suppliers.map((supplier) => (
                          <MenuItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{t('products.pricingInventory')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* @ts-ignore */}
                <Grid container spacing={2}>
                  {/* @ts-ignore */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label={`${t('products.costPrice')} (₺)`}
                      type="number"
                      value={productForm.costPrice || 0}
                      onChange={(e) => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label={`${t('products.sellPrice')} (₺)`}
                      type="number"
                      value={productForm.sellPrice || 0}
                      onChange={(e) => setProductForm({ ...productForm, sellPrice: parseFloat(e.target.value) || 0 })}
                      inputProps={{ min: 0, step: 0.01 }}
                    />
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label={t('products.minStockLevel')}
                      type="number"
                      value={productForm.minStockLevel || 0}
                      onChange={(e) => setProductForm({ ...productForm, minStockLevel: parseInt(e.target.value) || 0 })}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">{t('products.physicalProperties')}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {/* @ts-ignore */}
                <Grid container spacing={2}>
                  {/* @ts-ignore */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={`${t('products.weight')} (gram)`}
                      type="number"
                      value={productForm.weight || ''}
                      onChange={(e) => setProductForm({ ...productForm, weight: parseFloat(e.target.value) || undefined })}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                  {/* @ts-ignore */}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label={`${t('products.volume')} (ml)`}
                      type="number"
                      value={productForm.volume || ''}
                      onChange={(e) => setProductForm({ ...productForm, volume: parseFloat(e.target.value) || undefined })}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={productForm.isActive ?? true}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                  />
                }
                label={t('products.activeProduct')}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSaveProduct} variant="contained" startIcon={<SaveIcon />}>
            {t('common.save')} {t('products.title').slice(0, -9)}
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

export default ProductManagement;