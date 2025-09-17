import { Product, ProductCategory, Supplier } from '../types';
import { realProductData, categoryMapping, getUniqueSuppliers, getUniqueCategories } from '../data/realProductData';

// URGENT FIX: Use complete product data from attached CommodityList.json
const COMPLETE_PRODUCT_DATA = realProductData;

// Real product data import service
export class RealProductImportService {
  
  // Convert real product data to system format
  static convertRealDataToProducts(): Product[] {
    return COMPLETE_PRODUCT_DATA.map((item, index) => {
      const productId = `real_product_${item.commodityCode}`;
      const categoryId = this.getCategoryId(item.type);
      const supplierId = this.getSupplierId(item.supplier);
      
      return {
        id: productId,
        productCode: item.commodityCode,
        name: item.productName,
        description: item.description || `${item.productName} - ${item.specs}`,
        barcode: item.commodityCode, // Using commodity code as barcode
        categoryId: categoryId,
        supplierId: supplierId,
        costPrice: parseFloat(item.costPrice) || 0,
        sellPrice: parseFloat(item.unitPrice) || 0,
        weight: this.extractWeight(item.specs),
        volume: this.extractVolume(item.specs),
        isActive: true,
        minStockLevel: 5, // Default minimum stock level
        tags: this.generateTags(item),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }
  
  // Generate categories from real data
  static generateCategories(): ProductCategory[] {
    const uniqueTypes = getUniqueCategories();
    
    return uniqueTypes.map((type, index) => {
      const categoryMapping = this.getCategoryMapping(type);
      return {
        id: `category_${index + 1}`,
        name: type,
        nameEn: categoryMapping.en,
        nameTr: categoryMapping.tr,
        description: `${type} kategori ürünleri`,
        descriptionEn: `${categoryMapping.en} category products`,
        descriptionTr: `${categoryMapping.tr} kategori ürünleri`,
        sortOrder: index + 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });
  }
  
  // Generate suppliers from real data
  static generateSuppliers(): Supplier[] {
    const uniqueSuppliers = getUniqueSuppliers().filter(supplier => supplier && supplier.trim() !== '');
    
    return uniqueSuppliers.map((supplier, index) => ({
      id: `supplier_${index + 1}`,
      name: supplier,
      contactEmail: `info@${supplier.toLowerCase().replace(/\s+/g, '')}.com`,
      contactPhone: `+90 5xx xxx xx xx`,
      address: {
        street: `${supplier} Merkez Ofis`,
        city: 'İstanbul',
        state: 'İstanbul',
        zipCode: '34000',
        country: 'Türkiye'
      },
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
  }
  
  // Helper methods
  private static getCategoryId(type: string): string {
    const categories = this.generateCategories();
    const category = categories.find(c => c.name === type);
    return category ? category.id : 'category_1';
  }
  
  private static getSupplierId(supplier: string): string {
    const suppliers = this.generateSuppliers();
    const supplierRecord = suppliers.find(s => s.name === supplier);
    return supplierRecord ? supplierRecord.id : 'supplier_1';
  }
  
  private static getCategoryMapping(type: string): { tr: string; en: string } {
    // Use the category mapping from realProductData
    return categoryMapping[type] || { tr: type, en: type };
  }
  
  private static extractWeight(specs: string): number | undefined {
    if (!specs) return undefined;
    const weightMatch = specs.match(/(\d+(?:\.\d+)?)\s*gr?\b/i);
    return weightMatch ? parseFloat(weightMatch[1]) : undefined;
  }
  
  private static extractVolume(specs: string): number | undefined {
    if (!specs) return undefined;
    const volumeMatch = specs.match(/(\d+(?:\.\d+)?)\s*ml\b/i);
    return volumeMatch ? parseFloat(volumeMatch[1]) : undefined;
  }
  
  private static generateTags(item: any): string[] {
    const tags: string[] = [];
    
    // Add category as tag
    tags.push(item.type);
    
    // Add supplier as tag
    if (item.supplier && item.supplier.trim()) {
      tags.push(item.supplier);
    }
    
    // Add price range tags
    const price = parseFloat(item.unitPrice);
    if (price <= 50) tags.push('Ekonomik');
    else if (price <= 150) tags.push('Orta Segment');
    else tags.push('Premium');
    
    // Add size tags based on specs
    if (item.specs && item.specs.includes('gr')) {
      const weight = this.extractWeight(item.specs);
      if (weight && weight < 100) tags.push('Küçük Boy');
      else if (weight && weight < 300) tags.push('Orta Boy');
      else if (weight) tags.push('Büyük Boy');
    }
    
    return tags;
  }
}

// Sample data generation with Turkish support
export const generateRealProductSampleData = (): string => {
  const products = RealProductImportService.convertRealDataToProducts().slice(0, 5);
  const categories = RealProductImportService.generateCategories().slice(0, 3);
  const suppliers = RealProductImportService.generateSuppliers().slice(0, 3);
  
  return JSON.stringify({
    products,
    categories,
    suppliers,
    importInfo: {
      source: 'Doğuş Otomat Mevcut Ürün Listesi',
      importDate: new Date().toISOString(),
      totalProducts: COMPLETE_PRODUCT_DATA.length,
      categories: Array.from(new Set(COMPLETE_PRODUCT_DATA.map(item => item.type))),
      suppliers: Array.from(new Set(COMPLETE_PRODUCT_DATA.map(item => item.supplier))).filter(s => s)
    }
  }, null, 2);
};