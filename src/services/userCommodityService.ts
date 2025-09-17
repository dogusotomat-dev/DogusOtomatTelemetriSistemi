import { database } from '../config/firebase';
import { ref, push, set, get, update, remove, query, orderByChild, equalTo } from 'firebase/database';
import { UserCommodityList, UserCommodityListItem } from '../types';

export class UserCommodityService {
  
  /**
   * Create a new commodity list for a user
   */
  static async createUserCommodityList(userId: string, listName: string, items: Omit<UserCommodityListItem, 'id'>[]): Promise<string> {
    try {
      const listsRef = ref(database, 'userCommodityLists');
      const newListRef = push(listsRef);
      const listId = newListRef.key!;
      
      // Add IDs to items
      const itemsWithIds = items.map((item, index) => ({
        ...item,
        id: `item_${Date.now()}_${index}`,
        unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
        costPrice: typeof item.costPrice === 'string' ? parseFloat(item.costPrice) : item.costPrice
      }));
      
      const newList: UserCommodityList = {
        id: listId,
        userId,
        name: listName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        items: itemsWithIds
      };
      
      await set(newListRef, newList);
      
      console.log(`User commodity list created successfully: ${listName} for user ${userId}`);
      return listId;
    } catch (error) {
      console.error('Error creating user commodity list:', error);
      throw new Error(`Failed to create user commodity list: ${error}`);
    }
  }

  /**
   * Get all commodity lists for a specific user
   */
  static async getUserCommodityLists(userId: string): Promise<UserCommodityList[]> {
    try {
      const listsRef = ref(database, 'userCommodityLists');
      const queryRef = query(listsRef, orderByChild('userId'), equalTo(userId));
      const snapshot = await get(queryRef);
      
      if (!snapshot.exists()) {
        return [];
      }
      
      const listsData = snapshot.val();
      return Object.values(listsData) as UserCommodityList[];
    } catch (error) {
      console.error('Error fetching user commodity lists:', error);
      throw new Error(`Failed to fetch user commodity lists: ${error}`);
    }
  }

  /**
   * Get a specific commodity list by ID
   */
  static async getUserCommodityList(listId: string): Promise<UserCommodityList | null> {
    try {
      const listRef = ref(database, `userCommodityLists/${listId}`);
      const snapshot = await get(listRef);
      
      return snapshot.exists() ? snapshot.val() as UserCommodityList : null;
    } catch (error) {
      console.error('Error fetching user commodity list:', error);
      throw new Error(`Failed to fetch user commodity list: ${error}`);
    }
  }

  /**
   * Update a commodity list
   */
  static async updateUserCommodityList(listId: string, updates: Partial<UserCommodityList>): Promise<void> {
    try {
      const listRef = ref(database, `userCommodityLists/${listId}`);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await update(listRef, updateData);
      
      console.log(`User commodity list updated successfully: ${listId}`);
    } catch (error) {
      console.error('Error updating user commodity list:', error);
      throw new Error(`Failed to update user commodity list: ${error}`);
    }
  }

  /**
   * Delete a commodity list
   */
  static async deleteUserCommodityList(listId: string): Promise<void> {
    try {
      const listRef = ref(database, `userCommodityLists/${listId}`);
      await remove(listRef);
      
      console.log(`User commodity list deleted successfully: ${listId}`);
    } catch (error) {
      console.error('Error deleting user commodity list:', error);
      throw new Error(`Failed to delete user commodity list: ${error}`);
    }
  }

  /**
   * Add an item to a commodity list
   */
  static async addItemToCommodityList(listId: string, item: Omit<UserCommodityListItem, 'id'>): Promise<string> {
    try {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const itemWithId: UserCommodityListItem = {
        ...item,
        id: itemId,
        unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
        costPrice: typeof item.costPrice === 'string' ? parseFloat(item.costPrice) : item.costPrice
      };
      
      const itemRef = ref(database, `userCommodityLists/${listId}/items/${itemId}`);
      await set(itemRef, itemWithId);
      
      // Update the list's updatedAt timestamp
      const listRef = ref(database, `userCommodityLists/${listId}`);
      await update(listRef, { updatedAt: new Date().toISOString() });
      
      console.log(`Item added to commodity list: ${itemId}`);
      return itemId;
    } catch (error) {
      console.error('Error adding item to commodity list:', error);
      throw new Error(`Failed to add item to commodity list: ${error}`);
    }
  }

  /**
   * Update an item in a commodity list
   */
  static async updateItemInCommodityList(listId: string, itemId: string, updates: Partial<UserCommodityListItem>): Promise<void> {
    try {
      const itemRef = ref(database, `userCommodityLists/${listId}/items/${itemId}`);
      await update(itemRef, updates);
      
      // Update the list's updatedAt timestamp
      const listRef = ref(database, `userCommodityLists/${listId}`);
      await update(listRef, { updatedAt: new Date().toISOString() });
      
      console.log(`Item updated in commodity list: ${itemId}`);
    } catch (error) {
      console.error('Error updating item in commodity list:', error);
      throw new Error(`Failed to update item in commodity list: ${error}`);
    }
  }

  /**
   * Remove an item from a commodity list
   */
  static async removeItemFromCommodityList(listId: string, itemId: string): Promise<void> {
    try {
      const itemRef = ref(database, `userCommodityLists/${listId}/items/${itemId}`);
      await remove(itemRef);
      
      // Update the list's updatedAt timestamp
      const listRef = ref(database, `userCommodityLists/${listId}`);
      await update(listRef, { updatedAt: new Date().toISOString() });
      
      console.log(`Item removed from commodity list: ${itemId}`);
    } catch (error) {
      console.error('Error removing item from commodity list:', error);
      throw new Error(`Failed to remove item from commodity list: ${error}`);
    }
  }

  /**
   * Convert existing commodity data to user commodity list format
   */
  static convertCommodityDataToUserList(commodityData: any[]): Omit<UserCommodityListItem, 'id'>[] {
    return commodityData.map(item => ({
      commodityCode: item['Commodity code'] || item.commodityCode || '',
      productName: item['Product name'] || item.productName || '',
      unitPrice: typeof item['Unit price'] === 'string' ? parseFloat(item['Unit price']) : item['Unit price'] || 0,
      costPrice: typeof item['Cost price'] === 'string' ? parseFloat(item['Cost price']) : item['Cost price'] || 0,
      supplier: item.Supplier || item.supplier || '',
      specs: item.Specs || item.specs || '',
      type: item.Type || item.type || '',
      description: item.Description || item.description || ''
    }));
  }
}