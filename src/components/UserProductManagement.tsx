import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Alert, Snackbar, Card, CardContent, FormControl, InputLabel, Select, MenuItem,
  Avatar, Fade, Slide, Grow, Collapse
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
  Save as SaveIcon, Cancel as CancelIcon, FileUpload as UploadIcon,
  PhotoCamera as PhotoIcon
} from '@mui/icons-material';
import { Product, ProductCategory, Supplier } from '../types';
import { ProductService, ProductSubscriptionService } from '../services/productService';
import { CommodityMigrationService, CommodityListItem } from '../services/commodityMigrationService';
import { DirectCommodityMigration } from '../services/directCommodityMigration';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import ImageUpload from './ImageUpload';

interface Props {
  open?: boolean;
  onClose?: () => void;
  machineTypeFilter?: 'snack' | 'ice_cream' | 'coffee' | 'perfume' | 'all'; // Add machine type filter
}

const UserProductManagement: React.FC<Props> = ({ open = true, onClose = () => {}, machineTypeFilter = 'all' }) => {
  const { t, formatCurrency } = useLanguage();
  const { user } = useAuth();
  
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
  const [imageUploadOpen, setImageUploadOpen] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
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
    tags: [],
    image: ''
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
    if (open && user?.id) {
      // Load user-specific products
      loadUserProducts();
      loadCategories();
      loadSuppliers();
    }
  }, [open, user]);

  // Filter products based on search, filters, and machine type
  useEffect(() => {
    let filtered = products;
    
    // Apply search term filter
    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }
    
    // Apply supplier filter
    if (selectedSupplier) {
      filtered = filtered.filter(product => product.supplierId === selectedSupplier);
    }
    
    // Apply machine type filter
    if (machineTypeFilter !== 'all') {
      filtered = filtered.filter(product => {
        // Get category name from categories array
        const category = categories.find(cat => cat.id === product.categoryId);
        const categoryName = category ? category.name : '';
        
        switch (machineTypeFilter) {
          case 'snack':
            return categoryName.toLowerCase().includes('snack') || 
                   categoryName.toLowerCase().includes('beverage') ||
                   categoryName.toLowerCase().includes('atıştırmalık') ||
                   categoryName.toLowerCase().includes('içecek');
          case 'ice_cream':
            return categoryName.toLowerCase().includes('ice cream') ||
                   categoryName.toLowerCase().includes('dondurma') ||
                   product.name?.toLowerCase().includes('dondurma') ||
                   product.name?.toLowerCase().includes('ice cream');
          case 'coffee':
            return categoryName.toLowerCase().includes('coffee') ||
                   categoryName.toLowerCase().includes('kahve') ||
                   product.name?.toLowerCase().includes('coffee') ||
                   product.name?.toLowerCase().includes('kahve');
          case 'perfume':
            return categoryName.toLowerCase().includes('perfume') ||
                   categoryName.toLowerCase().includes('parfüm') ||
                   product.name?.toLowerCase().includes('perfume') ||
                   product.name?.toLowerCase().includes('parfüm');
          default:
            return true;
        }
      });
    }
    
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [products, searchTerm, selectedCategory, selectedSupplier, machineTypeFilter, categories]);

  // Load user-specific products
  const loadUserProducts = async () => {
    try {
      if (user?.id) {
        const userProducts = await ProductService.getUserProducts(user.id);
        setProducts(userProducts);
      }
    } catch (error) {
      showNotification(`${t('common.error')}: ${error}`, 'error');
    }
  };

  // Load categories
  const loadCategories = async () => {
    try {
      if (user?.id) {
        const userCategories = await ProductService.getUserCategories(user.id);
        setCategories(userCategories);
      }
    } catch (error) {
      showNotification(`${t('common.error')}: ${error}`, 'error');
    }
  };

  // Load suppliers
  const loadSuppliers = async () => {
    try {
      if (user?.id) {
        const userSuppliers = await ProductService.getUserSuppliers(user.id);
        setSuppliers(userSuppliers);
      }
    } catch (error) {
      showNotification(`${t('common.error')}: ${error}`, 'error');
    }
  };

  // Helper functions
  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleImageSelected = (imageUrl: string) => {
    setProductForm({ ...productForm, image: imageUrl });
    showNotification('Ürün görseli başarıyla yüklendi', 'success');
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
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
      if (!user?.id) {
        showNotification(t('common.userRequired'), 'warning');
        return;
      }

      if (isNewProduct) {
        await ProductService.addUserProduct(user.id, productForm as Omit<Product, 'id' | 'createdAt' | 'updatedAt'>);
        showNotification(t('products.addSuccess'), 'success');
      } else if (editingProduct) {
        await ProductService.updateUserProduct(user.id, editingProduct.id, productForm);
        showNotification(t('products.updateSuccess'), 'success');
      }
      
      setEditDialogOpen(false);
      loadUserProducts();
    } catch (error) {
      showNotification(`${t('common.error')}: ${error}`, 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm(t('products.deleteConfirm'))) {
      try {
        if (user?.id) {
          await ProductService.deleteUserProduct(user.id, productId);
          showNotification(t('products.deleteSuccess'), 'success');
          loadUserProducts();
        }
      } catch (error) {
        showNotification(`${t('common.error')}: ${error}`, 'error');
      }
    }
  };

  // Import from file
  const handleImportFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.id) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const jsonData = JSON.parse(content);
          
          await ProductService.importUserProducts(user.id, jsonData);
          showNotification(t('products.importSuccess'), 'success');
          loadUserProducts();
        } catch (error) {
          showNotification(`${t('common.error')}: ${error}`, 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  // Migrate commodity list data
  const handleMigrateCommodityList = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user?.id) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const commodityData = JSON.parse(content) as CommodityListItem[];
          
          showNotification('Commodity list migration started...', 'info');
          
          const result = await CommodityMigrationService.migrateCommodityListToUser(user.id, commodityData);
          
          if (result.success) {
            showNotification(
              `Migration completed! Imported ${result.imported} products. ${result.errors.length > 0 ? `${result.errors.length} errors occurred.` : ''}`,
              result.errors.length > 0 ? 'warning' : 'success'
            );
            
            // Refresh data
            loadUserProducts();
            loadCategories();
            loadSuppliers();
          }
        } catch (error) {
          showNotification(`Migration failed: ${error}`, 'error');
        }
      };
      reader.readAsText(file);
    }
  };

  // Direct migration from existing commodity data
  const handleDirectMigration = async () => {
    if (!user?.id) return;
    
    try {
      showNotification('Starting direct commodity migration...', 'info');
      
      const result = await DirectCommodityMigration.migrateToUser(user.id);
      
      if (result.success) {
        showNotification(
          `Direct migration completed! Imported ${result.imported} products. ${result.errors.length > 0 ? `${result.errors.length} errors occurred.` : ''}`,
          result.errors.length > 0 ? 'warning' : 'success'
        );
        
        // Refresh data
        loadUserProducts();
        loadCategories();
        loadSuppliers();
      }
    } catch (error) {
      showNotification(`Direct migration failed: ${error}`, 'error');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'N/A';
  };

  const getSupplierName = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    return supplier?.name || 'N/A';
  };

  if (!open) return null;

  return (
    <Fade in timeout={600}>
      <Box sx={{ width: '100%' }}>
        <Slide direction="down" in timeout={800}>
          <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h6">Ürün Yönetimi</Typography>
              <Typography variant="body2" color="textSecondary">
                {filteredProducts.length} ürün {searchTerm || selectedCategory || selectedSupplier ? '(filtrelenmiş)' : '(toplam)'}
              </Typography>
            </Box>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
              variant="contained"
            >
              {t('products.addProduct')}
            </Button>
          </Box>
        </Slide>
      
        <Slide direction="up" in timeout={1000}>
          <Box>
            <Box sx={{ mb: 3 }}>
            {/* Search and Filters */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <TextField
                    fullWidth
                    label={t('products.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('products.category')}</InputLabel>
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
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '200px' }}>
                  <FormControl fullWidth>
                    <InputLabel>{t('products.supplier')}</InputLabel>
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
                </Box>
              </Box>
            </CardContent>
          </Card>

            {/* Import Section */}
            <Card sx={{ mb: 2 }}>
              <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {t('products.dataImportOptions')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                <Button
                  startIcon={<UploadIcon />}
                  component="label"
                  variant="outlined"
                >
                  Import Products (JSON)
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={handleImportFromFile}
                  />
                </Button>
                <Button
                  startIcon={<UploadIcon />}
                  component="label"
                  variant="contained"
                  color="primary"
                >
                  Migrate Commodity List
                  <input
                    type="file"
                    accept=".json"
                    hidden
                    onChange={handleMigrateCommodityList}
                  />
                </Button>
                <Button
                  onClick={handleDirectMigration}
                  variant="contained"
                  color="secondary"
                >
                  Direct Migration (Sample Data)
                </Button>
                <Typography variant="body2" sx={{ color: 'text.secondary', flex: 1 }}>
                  {t('products.importDescription')}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
            <Box sx={{ flex: '1 1 250px' }}>
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
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
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
            </Box>
            <Box sx={{ flex: '1 1 250px' }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="info.main">
                    {categories.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('products.totalCategories')}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Box>

            {/* Products Table */}
            <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Görsel</TableCell>
                  <TableCell>{t('products.name')}</TableCell>
                  <TableCell>{t('products.barcode')}</TableCell>
                  <TableCell>{t('products.category')}</TableCell>
                  <TableCell>{t('products.supplier')}</TableCell>
                  <TableCell>{t('products.costPrice')}</TableCell>
                  <TableCell>{t('products.sellPrice')}</TableCell>
                  <TableCell>{t('products.status')}</TableCell>
                  <TableCell>{t('products.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Avatar
                        src={product.image}
                        alt={product.name}
                        sx={{ width: 40, height: 40 }}
                      >
                        {!product.image && product.name?.charAt(0)}
                      </Avatar>
                    </TableCell>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.barcode}</TableCell>
                    <TableCell>{getCategoryName(product.categoryId)}</TableCell>
                    <TableCell>{getSupplierName(product.supplierId)}</TableCell>
                    <TableCell>{formatCurrency(product.costPrice)}</TableCell>
                    <TableCell>{formatCurrency(product.sellPrice)}</TableCell>
                    <TableCell>
                      <Typography 
                        color={product.isActive ? 'success.main' : 'error.main'}
                        variant="body2"
                      >
                        {product.isActive ? t('products.active') : t('products.inactive')}
                      </Typography>
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
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                  <MenuItem value={100}>100</MenuItem>
                  <MenuItem value={500}>500</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" color="textSecondary">
                ürün
              </Typography>
            </Box>

            {/* Page info */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                {filteredProducts.length > 0 ? (
                  <>
                    {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} / {filteredProducts.length} ürün
                  </>
                ) : (
                  'Ürün bulunamadı'
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
                          pages.push(<Typography key="start-ellipsis" sx={{ px: 1 }}>...</Typography>);
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
                          pages.push(<Typography key="end-ellipsis" sx={{ px: 1 }}>...</Typography>);
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

      {/* Add/Edit Product Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {isNewProduct ? t('products.addProduct') : t('products.editProduct')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Product Image Section */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  src={productForm.image}
                  alt={productForm.name}
                  sx={{ width: 80, height: 80 }}
                >
                  {!productForm.image && <PhotoIcon />}
                </Avatar>
                <Box>
                  <Button
                    startIcon={<PhotoIcon />}
                    onClick={() => setImageUploadOpen(true)}
                    variant="outlined"
                  >
                    Görsel Yükle
                  </Button>
                  {productForm.image && (
                    <Button
                      onClick={() => setProductForm({ ...productForm, image: '' })}
                      color="error"
                      size="small"
                      sx={{ ml: 1 }}
                    >
                      Kaldır
                    </Button>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 250px' }}>
                  <TextField
                    fullWidth
                    label={t('products.name')}
                    value={productForm.name || ''}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </Box>
                <Box sx={{ flex: '1 1 250px' }}>
                  <TextField
                    fullWidth
                    label={t('products.barcode')}
                    value={productForm.barcode || ''}
                    onChange={(e) => setProductForm({ ...productForm, barcode: e.target.value })}
                    required
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 250px' }}>
                  <FormControl fullWidth>
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
                </Box>
                <Box sx={{ flex: '1 1 250px' }}>
                  <FormControl fullWidth>
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
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 250px' }}>
                  <TextField
                    fullWidth
                    label={`${t('products.costPrice')} (₺)`}
                    type="number"
                    value={productForm.costPrice || 0}
                    onChange={(e) => setProductForm({ ...productForm, costPrice: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 250px' }}>
                  <TextField
                    fullWidth
                    label={`${t('products.sellPrice')} (₺)`}
                    type="number"
                    value={productForm.sellPrice || 0}
                    onChange={(e) => setProductForm({ ...productForm, sellPrice: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 250px' }}>
                  <TextField
                    fullWidth
                    label={`${t('products.weight')} (g)`}
                    type="number"
                    value={productForm.weight || 0}
                    onChange={(e) => setProductForm({ ...productForm, weight: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Box>
                <Box sx={{ flex: '1 1 250px' }}>
                  <TextField
                    fullWidth
                    label={`${t('products.volume')} (ml)`}
                    type="number"
                    value={productForm.volume || 0}
                    onChange={(e) => setProductForm({ ...productForm, volume: parseFloat(e.target.value) || 0 })}
                    inputProps={{ min: 0, step: 0.1 }}
                  />
                </Box>
              </Box>
              
              <TextField
                fullWidth
                label={t('products.description')}
                multiline
                rows={3}
                value={productForm.description || ''}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSaveProduct} variant="contained" startIcon={<SaveIcon />}>
            {t('common.save')}
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

      {/* Image Upload Dialog */}
      <ImageUpload
        open={imageUploadOpen}
        onClose={() => setImageUploadOpen(false)}
        onImageSelected={handleImageSelected}
        title="Ürün Görseli Yükle"
        aspectRatio={1}
        cropSize={{ width: 250, height: 250 }}
      />
          </Box>
        </Slide>
      </Box>
    </Fade>
  );
};

export default UserProductManagement;
