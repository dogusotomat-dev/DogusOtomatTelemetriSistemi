import { database } from '../config/firebase';
import { ref, push, set, get, onValue, off, update, query, orderByChild, equalTo } from 'firebase/database';
import { Product, ProductCategory, Supplier, ApiResponse } from '../types';

export class ProductService {
  
  // ==================== PRODUCT MANAGEMENT ====================
  
  /**
   * Add a new product
   */
  static async addProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const productsRef = ref(database, 'products');
      const newProductRef = push(productsRef);
      const productId = newProductRef.key!;
      
      // Generate product code if not provided
      const productCode = productData.productCode || await this.generateProductCode();
      
      const product: Product = {
        ...productData,
        id: productId,
        productCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newProductRef, product);
      
      console.log(`Product added successfully: ${product.name} (${product.productCode})`);
      return productId;
    } catch (error) {
      console.error('Error adding product:', error);
      throw new Error(`Failed to add product: ${error}`);
    }
  }

  /**
   * Update an existing product
   */
  static async updateProduct(productId: string, updates: Partial<Product>): Promise<void> {
    try {
      const productRef = ref(database, `products/${productId}`);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(productRef, updateData);
      
      console.log(`Product updated successfully: ${productId}`);
    } catch (error) {
      console.error('Error updating product:', error);
      throw new Error(`Failed to update product: ${error}`);
    }
  }

  /**
   * Get all products
   */
  static async getAllProducts(): Promise<Product[]> {
    try {
      const productsRef = ref(database, 'products');
      const snapshot = await get(productsRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const productsData = snapshot.val();
      return Object.values(productsData) as Product[];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw new Error(`Failed to fetch products: ${error}`);
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(categoryId: string): Promise<Product[]> {
    try {
      const productsRef = ref(database, 'products');
      const queryRef = query(productsRef, orderByChild('categoryId'), equalTo(categoryId));
      const snapshot = await get(queryRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      return Object.values(snapshot.val()) as Product[];
    } catch (error) {
      console.error('Error fetching products by category:', error);
      throw new Error(`Failed to fetch products by category: ${error}`);
    }
  }

  /**
   * Get products by supplier
   */
  static async getProductsBySupplier(supplierId: string): Promise<Product[]> {
    try {
      const productsRef = ref(database, 'products');
      const queryRef = query(productsRef, orderByChild('supplierId'), equalTo(supplierId));
      const snapshot = await get(queryRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      return Object.values(snapshot.val()) as Product[];
    } catch (error) {
      console.error('Error fetching products by supplier:', error);
      throw new Error(`Failed to fetch products by supplier: ${error}`);
    }
  }

  /**
   * Get single product
   */
  static async getProduct(productId: string): Promise<Product | null> {
    try {
      const productRef = ref(database, `products/${productId}`);
      const snapshot = await get(productRef);
      
      return snapshot.exists() ? snapshot.val() as Product : null;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw new Error(`Failed to fetch product: ${error}`);
    }
  }

  /**
   * Search products by name or barcode
   */
  static async searchProducts(searchTerm: string): Promise<Product[]> {
    try {
      const products = await this.getAllProducts();
      const lowercaseSearch = searchTerm.toLowerCase();
      
      return products.filter(product => 
        product.name.toLowerCase().includes(lowercaseSearch) ||
        product.barcode.toLowerCase().includes(lowercaseSearch) ||
        product.productCode?.toLowerCase().includes(lowercaseSearch) ||
        product.description?.toLowerCase().includes(lowercaseSearch)
      );
    } catch (error) {
      console.error('Error searching products:', error);
      throw new Error(`Failed to search products: ${error}`);
    }
  }

  /**
   * Delete a product
   */
  static async deleteProduct(productId: string): Promise<void> {
    try {
      // Check if product is assigned to any slots
      const isAssigned = await this.isProductAssignedToSlots(productId);
      if (isAssigned) {
        throw new Error('Cannot delete product that is assigned to machine slots');
      }

      const productRef = ref(database, `products/${productId}`);
      await set(productRef, null);
      
      console.log(`Product deleted successfully: ${productId}`);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  /**
   * Check if product is assigned to any machine slots
   */
  private static async isProductAssignedToSlots(productId: string): Promise<boolean> {
    try {
      const machinesRef = ref(database, 'machines');
      const snapshot = await get(machinesRef);
      
      if (!snapshot.exists()) {
        return false;
      }
      
      const machines = Object.values(snapshot.val()) as any[];
      
      for (const machine of machines) {
        if (machine.configuration?.slots) {
          const slots = Object.values(machine.configuration.slots) as any[];
          if (slots.some(slot => slot.productId === productId)) {
            return true;
          }
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error checking product assignment:', error);
      return false;
    }
  }

  /**
   * Generate unique product code
   */
  private static async generateProductCode(): Promise<string> {
    try {
      const products = await this.getAllProducts();
      const existingCodes = products.map(p => p.productCode).filter(Boolean);
      
      let code: string;
      let counter = 1;
      
      do {
        code = `PRD${String(counter).padStart(6, '0')}`;
        counter++;
      } while (existingCodes.includes(code));
      
      return code;
    } catch (error) {
      console.error('Error generating product code:', error);
      return `PRD${Date.now()}`;
    }
  }

  // ==================== CATEGORY MANAGEMENT ====================
  
  /**
   * Add a new category
   */
  static async addCategory(categoryData: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const categoriesRef = ref(database, 'productCategories');
      const newCategoryRef = push(categoriesRef);
      const categoryId = newCategoryRef.key!;
      
      const category: ProductCategory = {
        ...categoryData,
        id: categoryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newCategoryRef, category);
      
      console.log(`Category added successfully: ${category.name}`);
      return categoryId;
    } catch (error) {
      console.error('Error adding category:', error);
      throw new Error(`Failed to add category: ${error}`);
    }
  }

  /**
   * Get all categories
   */
  static async getAllCategories(): Promise<ProductCategory[]> {
    try {
      const categoriesRef = ref(database, 'productCategories');
      const snapshot = await get(categoriesRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const categoriesData = snapshot.val();
      return Object.values(categoriesData) as ProductCategory[];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw new Error(`Failed to fetch categories: ${error}`);
    }
  }

  /**
   * Update category
   */
  static async updateCategory(categoryId: string, updates: Partial<ProductCategory>): Promise<void> {
    try {
      const categoryRef = ref(database, `productCategories/${categoryId}`);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(categoryRef, updateData);
      
      console.log(`Category updated successfully: ${categoryId}`);
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error(`Failed to update category: ${error}`);
    }
  }

  /**
   * Delete category
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      // Check if category has products
      const products = await this.getProductsByCategory(categoryId);
      if (products.length > 0) {
        throw new Error('Cannot delete category that contains products');
      }

      const categoryRef = ref(database, `productCategories/${categoryId}`);
      await set(categoryRef, null);
      
      console.log(`Category deleted successfully: ${categoryId}`);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // ==================== SUPPLIER MANAGEMENT ====================
  
  /**
   * Add a new supplier
   */
  static async addSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const suppliersRef = ref(database, 'suppliers');
      const newSupplierRef = push(suppliersRef);
      const supplierId = newSupplierRef.key!;
      
      const supplier: Supplier = {
        ...supplierData,
        id: supplierId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newSupplierRef, supplier);
      
      console.log(`Supplier added successfully: ${supplier.name}`);
      return supplierId;
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw new Error(`Failed to add supplier: ${error}`);
    }
  }

  /**
   * Get all suppliers
   */
  static async getAllSuppliers(): Promise<Supplier[]> {
    try {
      const suppliersRef = ref(database, 'suppliers');
      const snapshot = await get(suppliersRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const suppliersData = snapshot.val();
      return Object.values(suppliersData) as Supplier[];
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      throw new Error(`Failed to fetch suppliers: ${error}`);
    }
  }

  /**
   * Update supplier
   */
  static async updateSupplier(supplierId: string, updates: Partial<Supplier>): Promise<void> {
    try {
      const supplierRef = ref(database, `suppliers/${supplierId}`);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(supplierRef, updateData);
      
      console.log(`Supplier updated successfully: ${supplierId}`);
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw new Error(`Failed to update supplier: ${error}`);
    }
  }

  /**
   * Delete supplier
   */
  static async deleteSupplier(supplierId: string): Promise<void> {
    try {
      // Check if supplier has products
      const products = await this.getProductsBySupplier(supplierId);
      if (products.length > 0) {
        throw new Error('Cannot delete supplier that has associated products');
      }

      const supplierRef = ref(database, `suppliers/${supplierId}`);
      await set(supplierRef, null);
      
      console.log(`Supplier deleted successfully: ${supplierId}`);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  // ==================== IMPORT/EXPORT FUNCTIONALITY ====================
  
  /**
   * Export products to JSON
   */
  static async exportProducts(): Promise<string> {
    try {
      const products = await this.getAllProducts();
      const categories = await this.getAllCategories();
      const suppliers = await this.getAllSuppliers();
      
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
          products,
          categories,
          suppliers
        }
      };
      
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting products:', error);
      throw new Error(`Failed to export products: ${error}`);
    }
  }

  /**
   * Import products from JSON
   */
  static async importProducts(jsonData: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const importData = JSON.parse(jsonData);
      const errors: string[] = [];
      let imported = 0;
      
      // Validate import data structure
      if (!importData.data || !importData.data.products) {
        throw new Error('Invalid import data format');
      }
      
      const { products, categories, suppliers } = importData.data;
      
      // Import categories first
      if (categories && Array.isArray(categories)) {
        for (const category of categories) {
          try {
            await this.addCategory({
              name: category.name,
              description: category.description,
              parentCategoryId: category.parentCategoryId,
              color: category.color,
              icon: category.icon,
              isActive: category.isActive ?? true,
              sortOrder: category.sortOrder ?? 0
            });
          } catch (error) {
            errors.push(`Category "${category.name}": ${error}`);
          }
        }
      }
      
      // Import suppliers
      if (suppliers && Array.isArray(suppliers)) {
        for (const supplier of suppliers) {
          try {
            await this.addSupplier({
              name: supplier.name,
              companyName: supplier.companyName,
              contactPerson: supplier.contactPerson,
              email: supplier.email,
              phone: supplier.phone,
              address: supplier.address,
              taxNumber: supplier.taxNumber,
              paymentTerms: supplier.paymentTerms,
              notes: supplier.notes,
              isActive: supplier.isActive ?? true,
              rating: supplier.rating
            });
          } catch (error) {
            errors.push(`Supplier "${supplier.name}": ${error}`);
          }
        }
      }
      
      // Import products
      if (products && Array.isArray(products)) {
        for (const product of products) {
          try {
            await this.addProduct({
              name: product.name,
              description: product.description,
              barcode: product.barcode,
              productCode: product.productCode,
              categoryId: product.categoryId,
              supplierId: product.supplierId,
              costPrice: product.costPrice,
              sellPrice: product.sellPrice,
              weight: product.weight,
              volume: product.volume,
              dimensions: product.dimensions,
              nutritionalInfo: product.nutritionalInfo,
              image: product.image,
              images: product.images,
              isActive: product.isActive ?? true,
              expiryDate: product.expiryDate,
              minStockLevel: product.minStockLevel ?? 0,
              tags: product.tags
            });
            imported++;
          } catch (error) {
            errors.push(`Product "${product.name}": ${error}`);
          }
        }
      }
      
      return { success: errors.length === 0, imported, errors };
    } catch (error) {
      console.error('Error importing products:', error);
      throw new Error(`Failed to import products: ${error}`);
    }
  }

  /**
   * Generate sample product data for testing
   */
  static generateSampleData(): string {
    const sampleData = {
      exportDate: new Date().toISOString(),
      version: '1.0',
      data: {
        categories: [
          {
            name: 'Beverages',
            description: 'Cold and hot drinks',
            color: '#2196F3',
            icon: 'local_drink',
            isActive: true,
            sortOrder: 1
          },
          {
            name: 'Snacks',
            description: 'Chips, crackers, and light snacks',
            color: '#FF9800',
            icon: 'fastfood',
            isActive: true,
            sortOrder: 2
          }
        ],
        suppliers: [
          {
            name: 'Coca-Cola Turkey',
            companyName: 'Coca-Cola İçecek A.Ş.',
            contactPerson: 'Ahmet Demir',
            email: 'info@coca-cola.com.tr',
            phone: '+90 212 334 6060',
            address: {
              street: 'Eski Büyükdere Cad. No: 9',
              city: 'Istanbul',
              zipCode: '34398',
              country: 'Turkey'
            },
            isActive: true,
            rating: 5
          }
        ],
        products: [
          {
            name: 'Coca-Cola 330ml',
            description: 'Classic Coca-Cola carbonated soft drink',
            barcode: '8690504001416',
            categoryId: 'beverages-id',
            supplierId: 'coca-cola-id',
            costPrice: 2.50,
            sellPrice: 4.00,
            volume: 330,
            isActive: true,
            minStockLevel: 10,
            tags: ['cola', 'carbonated', 'caffeine']
          }
        ]
      }
    };
    
    return JSON.stringify(sampleData, null, 2);
  }

  // ==================== USER-SPECIFIC PRODUCT MANAGEMENT ====================
  
  /**
   * Get user-specific products
   */
  static async getUserProducts(userId: string): Promise<Product[]> {
    try {
      const userProductsRef = ref(database, `userProducts/${userId}`);
      const snapshot = await get(userProductsRef);
      
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        return Object.values(productsData) as Product[];
      }
      return [];
    } catch (error) {
      console.error('Error getting user products:', error);
      throw new Error(`Failed to get user products: ${error}`);
    }
  }

  /**
   * Add user-specific product
   */
  static async addUserProduct(userId: string, productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const userProductsRef = ref(database, `userProducts/${userId}`);
      const newProductRef = push(userProductsRef);
      const productId = newProductRef.key!;
      
      // Generate product code if not provided
      const productCode = productData.productCode || await this.generateProductCode();
      
      const product: Product = {
        ...productData,
        id: productId,
        productCode,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newProductRef, product);
      
      console.log(`User product added successfully: ${product.name} (${product.productCode})`);
      return productId;
    } catch (error) {
      console.error('Error adding user product:', error);
      throw new Error(`Failed to add user product: ${error}`);
    }
  }

  /**
   * Update user-specific product
   */
  static async updateUserProduct(userId: string, productId: string, updates: Partial<Product>): Promise<void> {
    try {
      const productRef = ref(database, `userProducts/${userId}/${productId}`);
      const updatedProduct = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(productRef, updatedProduct);
      console.log(`User product updated successfully: ${productId}`);
    } catch (error) {
      console.error('Error updating user product:', error);
      throw new Error(`Failed to update user product: ${error}`);
    }
  }

  /**
   * Delete user-specific product
   */
  static async deleteUserProduct(userId: string, productId: string): Promise<void> {
    try {
      const productRef = ref(database, `userProducts/${userId}/${productId}`);
      await set(productRef, null);
      console.log(`User product deleted successfully: ${productId}`);
    } catch (error) {
      console.error('Error deleting user product:', error);
      throw new Error(`Failed to delete user product: ${error}`);
    }
  }

  /**
   * Get user-specific categories
   */
  static async getUserCategories(userId: string): Promise<ProductCategory[]> {
    try {
      const userCategoriesRef = ref(database, `userCategories/${userId}`);
      const snapshot = await get(userCategoriesRef);
      
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        return Object.values(categoriesData) as ProductCategory[];
      }
      return [];
    } catch (error) {
      console.error('Error getting user categories:', error);
      throw new Error(`Failed to get user categories: ${error}`);
    }
  }

  /**
   * Add user-specific category
   */
  static async addUserCategory(userId: string, categoryData: Omit<ProductCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const userCategoriesRef = ref(database, `userCategories/${userId}`);
      const newCategoryRef = push(userCategoriesRef);
      const categoryId = newCategoryRef.key!;
      
      const category: ProductCategory = {
        ...categoryData,
        id: categoryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newCategoryRef, category);
      
      console.log(`User category added successfully: ${category.name}`);
      return categoryId;
    } catch (error) {
      console.error('Error adding user category:', error);
      throw new Error(`Failed to add user category: ${error}`);
    }
  }

  /**
   * Get user-specific suppliers
   */
  static async getUserSuppliers(userId: string): Promise<Supplier[]> {
    try {
      const userSuppliersRef = ref(database, `userSuppliers/${userId}`);
      const snapshot = await get(userSuppliersRef);
      
      if (snapshot.exists()) {
        const suppliersData = snapshot.val();
        return Object.values(suppliersData) as Supplier[];
      }
      return [];
    } catch (error) {
      console.error('Error getting user suppliers:', error);
      throw new Error(`Failed to get user suppliers: ${error}`);
    }
  }

  /**
   * Add user-specific supplier
   */
  static async addUserSupplier(userId: string, supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const userSuppliersRef = ref(database, `userSuppliers/${userId}`);
      const newSupplierRef = push(userSuppliersRef);
      const supplierId = newSupplierRef.key!;
      
      const supplier: Supplier = {
        ...supplierData,
        id: supplierId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await set(newSupplierRef, supplier);
      
      console.log(`User supplier added successfully: ${supplier.name}`);
      return supplierId;
    } catch (error) {
      console.error('Error adding user supplier:', error);
      throw new Error(`Failed to add user supplier: ${error}`);
    }
  }

  /**
   * Import products for a specific user
   */
  static async importUserProducts(userId: string, jsonData: any): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const errors: string[] = [];
      let imported = 0;
      
      // Validate import data structure
      if (!jsonData.data || !jsonData.data.products) {
        throw new Error('Invalid import data format');
      }
      
      const { products, categories, suppliers } = jsonData.data;
      
      // Import categories first
      if (categories && Array.isArray(categories)) {
        for (const category of categories) {
          try {
            await this.addUserCategory(userId, {
              name: category.name,
              description: category.description,
              parentCategoryId: category.parentCategoryId,
              color: category.color,
              icon: category.icon,
              isActive: category.isActive ?? true,
              sortOrder: category.sortOrder ?? 0
            });
          } catch (error) {
            errors.push(`Category "${category.name}": ${error}`);
          }
        }
      }
      
      // Import suppliers
      if (suppliers && Array.isArray(suppliers)) {
        for (const supplier of suppliers) {
          try {
            await this.addUserSupplier(userId, {
              name: supplier.name,
              companyName: supplier.companyName,
              contactPerson: supplier.contactPerson,
              email: supplier.email,
              phone: supplier.phone,
              address: supplier.address,
              taxNumber: supplier.taxNumber,
              paymentTerms: supplier.paymentTerms,
              notes: supplier.notes,
              isActive: supplier.isActive ?? true,
              rating: supplier.rating
            });
          } catch (error) {
            errors.push(`Supplier "${supplier.name}": ${error}`);
          }
        }
      }
      
      // Import products
      if (products && Array.isArray(products)) {
        for (const product of products) {
          try {
            await this.addUserProduct(userId, {
              name: product.name,
              description: product.description,
              barcode: product.barcode,
              categoryId: product.categoryId,
              supplierId: product.supplierId,
              costPrice: product.costPrice,
              sellPrice: product.sellPrice,
              weight: product.weight,
              volume: product.volume,
              dimensions: product.dimensions,
              nutritionalInfo: product.nutritionalInfo,
              image: product.image,
              images: product.images,
              isActive: product.isActive ?? true,
              expiryDate: product.expiryDate,
              minStockLevel: product.minStockLevel ?? 0,
              tags: product.tags || []
            });
            imported++;
          } catch (error) {
            errors.push(`Product "${product.name}": ${error}`);
          }
        }
      }
      
      return { success: true, imported, errors };
    } catch (error) {
      console.error('Error importing user products:', error);
      throw new Error(`Failed to import user products: ${error}`);
    }
  }
}

// Real-time subscriptions
export class ProductSubscriptionService {
  
  /**
   * Subscribe to product changes
   */
  static subscribeToProducts(callback: (products: Product[]) => void): () => void {
    const productsRef = ref(database, 'products');
    
    const unsubscribe = onValue(productsRef, (snapshot) => {
      if (snapshot.exists()) {
        const productsData = snapshot.val();
        const products = Object.values(productsData) as Product[];
        callback(products);
      } else {
        callback([]);
      }
    });
    
    return () => off(productsRef, 'value', unsubscribe);
  }

  /**
   * Subscribe to category changes
   */
  static subscribeToCategories(callback: (categories: ProductCategory[]) => void): () => void {
    const categoriesRef = ref(database, 'productCategories');
    
    const unsubscribe = onValue(categoriesRef, (snapshot) => {
      if (snapshot.exists()) {
        const categoriesData = snapshot.val();
        const categories = Object.values(categoriesData) as ProductCategory[];
        callback(categories);
      } else {
        callback([]);
      }
    });
    
    return () => off(categoriesRef, 'value', unsubscribe);
  }

  /**
   * Subscribe to supplier changes
   */
  static subscribeToSuppliers(callback: (suppliers: Supplier[]) => void): () => void {
    const suppliersRef = ref(database, 'suppliers');
    
    const unsubscribe = onValue(suppliersRef, (snapshot) => {
      if (snapshot.exists()) {
        const suppliersData = snapshot.val();
        const suppliers = Object.values(suppliersData) as Supplier[];
        callback(suppliers);
      } else {
        callback([]);
      }
    });
    
    return () => off(suppliersRef, 'value', unsubscribe);
  }
}