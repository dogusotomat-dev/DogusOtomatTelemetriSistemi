import { CommodityMigrationService, CommodityListItem } from './commodityMigrationService';

// Function to load commodity data from public folder
const loadCommodityData = async (): Promise<CommodityListItem[]> => {
  try {
    const response = await fetch('/CommodityList.json');
    if (!response.ok) {
      throw new Error(`Failed to load commodity data: ${response.statusText}`);
    }
    
    const commodityListJson = await response.json();
    
    // Filter out null values and ensure proper structure
    return (Array.isArray(commodityListJson) ? commodityListJson : [])
      .filter((item: any) => item !== null && item !== undefined)
      .filter((item: any) => item['Product name'] && item['Commodity code']);
  } catch (error) {
    console.error('Error loading commodity data:', error);
    return [];
  }
};

export class DirectCommodityMigration {
  /**
   * Migrate the predefined commodity data to a user
   */
  static async migrateToUser(userId: string): Promise<{
    success: boolean;
    imported: number;
    errors: string[];
  }> {
    try {
      console.log(`Starting direct commodity migration for user: ${userId}`);
      
      const commodityData = await loadCommodityData();
      console.log(`Total items to migrate: ${commodityData.length}`);
      
      if (commodityData.length === 0) {
        throw new Error('No commodity data found to migrate');
      }
      
      const result = await CommodityMigrationService.migrateCommodityListToUser(userId, commodityData);
      
      console.log('Direct migration completed:', result);
      return result;
    } catch (error) {
      console.error('Direct migration failed:', error);
      throw error;
    }
  }

  /**
   * Get a preview of what will be migrated
   */
  static async getPreview() {
    const commodityData = await loadCommodityData();
    const { products, categories, suppliers } = CommodityMigrationService.convertCommodityToUserProducts(commodityData);
    
    return {
      totalItems: commodityData.length,
      productsCount: products.length,
      categoriesCount: categories.length,
      suppliersCount: suppliers.length,
      categories: categories.map(c => c.name),
      suppliers: suppliers.map(s => s.name),
      sampleProducts: products.slice(0, 5).map(p => ({
        name: p.name,
        category: p.categoryId,
        supplier: p.supplierId,
        costPrice: p.costPrice,
        sellPrice: p.sellPrice
      }))
    };
  }
}
