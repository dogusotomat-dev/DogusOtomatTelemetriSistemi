import { ProductService } from './productService';

export interface CommodityListItem {
  "Commodity code": string;
  "Cost price": string;
  "Description": string;
  "Product name": string;
  "Specs": string;
  "Supplier": string;
  "Type": string;
  "Unit price": string;
}

export class CommodityMigrationService {
  /**
   * Convert commodity list data to user-specific products
   */
  static convertCommodityToUserProducts(commodityData: CommodityListItem[]): {
    products: any[];
    categories: any[];
    suppliers: any[];
  } {
    const products: any[] = [];
    const categoriesSet = new Set<string>();
    const suppliersSet = new Set<string>();

    commodityData.forEach((item, index) => {
      if (!item || !item["Product name"]) return; // Skip null/empty entries

      // Extract unique categories and suppliers
      if (item.Type) categoriesSet.add(item.Type);
      if (item.Supplier) suppliersSet.add(item.Supplier);

      // Convert to product format
      const product = {
        name: item["Product name"],
        description: item.Description || '',
        barcode: item["Commodity code"] || `MIGRATED_${index}`,
        categoryId: item.Type || 'Uncategorized',
        supplierId: item.Supplier || 'Unknown',
        costPrice: parseFloat(item["Cost price"]) || 0,
        sellPrice: parseFloat(item["Unit price"]) || 0,
        weight: this.extractWeight(item.Specs),
        volume: this.extractVolume(item.Specs),
        isActive: true,
        minStockLevel: 5,
        tags: [item.Type].filter(Boolean)
      };

      products.push(product);
    });

    // Create categories
    const categories = Array.from(categoriesSet).map((categoryName, index) => ({
      name: categoryName,
      description: `${categoryName} kategori ürünleri`,
      isActive: true,
      sortOrder: index + 1
    }));

    // Create suppliers
    const suppliers = Array.from(suppliersSet).map((supplierName) => ({
      name: supplierName,
      email: `info@${supplierName.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')}.com`,
      phone: '+90 5xx xxx xx xx',
      address: {
        street: `${supplierName} Merkez Ofis`,
        city: 'İstanbul',
        state: 'İstanbul',
        zipCode: '34000',
        country: 'Türkiye'
      },
      isActive: true
    }));

    return { products, categories, suppliers };
  }

  /**
   * Extract weight from specs string
   */
  private static extractWeight(specs: string): number {
    if (!specs) return 0;
    
    const weightMatch = specs.match(/(\d+)\s*g/i);
    if (weightMatch) {
      return parseInt(weightMatch[1]);
    }
    
    return 0;
  }

  /**
   * Extract volume from specs string
   */
  private static extractVolume(specs: string): number {
    if (!specs) return 0;
    
    const volumeMatch = specs.match(/(\d+)\s*ml/i);
    if (volumeMatch) {
      return parseInt(volumeMatch[1]);
    }
    
    return 0;
  }

  /**
   * Migrate commodity list data to user-specific products
   */
  static async migrateCommodityListToUser(userId: string, commodityData: CommodityListItem[]): Promise<{
    success: boolean;
    imported: number;
    errors: string[];
  }> {
    try {
      const { products, categories, suppliers } = this.convertCommodityToUserProducts(commodityData);
      const errors: string[] = [];
      let imported = 0;

      console.log(`Starting migration for user ${userId}`);
      console.log(`Found ${categories.length} categories, ${suppliers.length} suppliers, ${products.length} products`);

      // Create category mapping
      const categoryMap: Record<string, string> = {};
      for (const category of categories) {
        try {
          const categoryId = await ProductService.addUserCategory(userId, category);
          categoryMap[category.name] = categoryId;
          console.log(`Created category: ${category.name} -> ${categoryId}`);
        } catch (error) {
          errors.push(`Category "${category.name}": ${error}`);
          console.error(`Error creating category ${category.name}:`, error);
        }
      }

      // Create supplier mapping
      const supplierMap: Record<string, string> = {};
      for (const supplier of suppliers) {
        try {
          const supplierId = await ProductService.addUserSupplier(userId, supplier);
          supplierMap[supplier.name] = supplierId;
          console.log(`Created supplier: ${supplier.name} -> ${supplierId}`);
        } catch (error) {
          errors.push(`Supplier "${supplier.name}": ${error}`);
          console.error(`Error creating supplier ${supplier.name}:`, error);
        }
      }

      // Create products with proper category and supplier IDs
      for (const product of products) {
        try {
          const productData = {
            ...product,
            categoryId: categoryMap[product.categoryId] || '',
            supplierId: supplierMap[product.supplierId] || ''
          };

          await ProductService.addUserProduct(userId, productData);
          imported++;
          
          if (imported % 10 === 0) {
            console.log(`Imported ${imported}/${products.length} products...`);
          }
        } catch (error) {
          errors.push(`Product "${product.name}": ${error}`);
          console.error(`Error creating product ${product.name}:`, error);
        }
      }

      console.log(`Migration completed. Imported: ${imported}, Errors: ${errors.length}`);
      return { success: true, imported, errors };

    } catch (error) {
      console.error('Migration failed:', error);
      throw new Error(`Migration failed: ${error}`);
    }
  }

  /**
   * Create a sample migration from the provided commodity data
   */
  static createSampleMigrationData(): CommodityListItem[] {
    return [
      {
        "Commodity code": "3333",
        "Cost price": "8",
        "Description": "",
        "Product name": "Kruvasan",
        "Specs": "no",
        "Supplier": "UNO",
        "Type": "Pastane Ürünü",
        "Unit price": "25"
      },
      {
        "Commodity code": "7013",
        "Cost price": "70",
        "Description": "",
        "Product name": "Damla Cikolatalı Pancake",
        "Specs": "",
        "Supplier": "BBM FOOD",
        "Type": "Pastane Ürünü",
        "Unit price": "105"
      }
      // Add more sample data as needed
    ];
  }
}
