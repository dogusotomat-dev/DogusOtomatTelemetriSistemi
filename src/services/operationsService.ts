import { database } from '../config/firebase';
import { ref, push, set, get, query, orderByChild, equalTo, remove } from 'firebase/database';

export interface WasteDetails {
  expired: number;
  damaged: number;
  other: number;
  totalCost: number;
}

export interface VendingDetail {
  slot: number;
  product: string;
  productId?: string;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
  wasteReason?: string;
}

export interface RefillDetail {
  slot: number;
  product: string;
  productId?: string;
  quantity: number;
  batchNumber: string;
  expiryDate: string;
}

export interface IceCreamDetail {
  baseRefillAmount: number; // litre
  baseWasteAmount: number; // litre
  sauces: { name: string; refillAmount: number; wasteAmount: number }[]; // adet
  decorations: { name: string; refillAmount: number; wasteAmount: number }[]; // gram
  cupRefillAmount: number; // adet
  cupWasteAmount: number; // adet
}

export interface Operation {
  id?: string;
  type: string;
  machineId: string;
  machineModel: string;
  machineSerial: string;
  machineLocation: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: string;
  performedBy: string;
  status: string;
  waste: WasteDetails;
  vendingDetails: VendingDetail[] | null;
  refillDetails: RefillDetail[] | null;
  iceCreamDetails: IceCreamDetail | null;
  beforePhotos: string[];
  afterPhotos: string[];
  notes: string;
  reportNumber: string;
  isFaultReport?: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export class OperationsService {
  private static readonly COLLECTION_NAME = 'operations';

  // Create a new operation
  static async createOperation(operationData: Omit<Operation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Operation> {
    try {
      const now = new Date().toISOString();
      const operationRef = ref(database, `${this.COLLECTION_NAME}`);
      const newOperationRef = push(operationRef);
      
      const operation: Operation = {
        ...operationData,
        id: newOperationRef.key!,
        createdAt: now,
        updatedAt: now,
      };

      await set(newOperationRef, operation);
      return operation;
    } catch (error) {
      console.error('Error creating operation:', error);
      throw new Error('Operasyon oluşturulurken hata oluştu');
    }
  }

  // Get all operations
  static async getAllOperations(): Promise<Operation[]> {
    try {
      const operationsRef = ref(database, `${this.COLLECTION_NAME}`);
      const snapshot = await get(operationsRef);
      
      if (snapshot.exists()) {
        const operations: Operation[] = [];
        snapshot.forEach((childSnapshot) => {
          operations.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return operations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return [];
    } catch (error) {
      console.error('Error fetching operations:', error);
      throw new Error('Operasyonlar yüklenirken hata oluştu');
    }
  }

  // Get operations by user
  static async getOperationsByUser(userId: string): Promise<Operation[]> {
    try {
      const operationsRef = ref(database, `${this.COLLECTION_NAME}`);
      const userOperationsQuery = query(operationsRef, orderByChild('createdBy'), equalTo(userId));
      const snapshot = await get(userOperationsQuery);
      
      if (snapshot.exists()) {
        const operations: Operation[] = [];
        snapshot.forEach((childSnapshot) => {
          operations.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return operations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return [];
    } catch (error) {
      console.error('Error fetching user operations:', error);
      throw new Error('Kullanıcı operasyonları yüklenirken hata oluştu');
    }
  }

  // Get operations by machine
  static async getOperationsByMachine(machineId: string): Promise<Operation[]> {
    try {
      const operationsRef = ref(database, `${this.COLLECTION_NAME}`);
      const machineOperationsQuery = query(operationsRef, orderByChild('machineId'), equalTo(machineId));
      const snapshot = await get(machineOperationsQuery);
      
      if (snapshot.exists()) {
        const operations: Operation[] = [];
        snapshot.forEach((childSnapshot) => {
          operations.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        return operations.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
      return [];
    } catch (error) {
      console.error('Error fetching machine operations:', error);
      throw new Error('Makine operasyonları yüklenirken hata oluştu');
    }
  }

  // Get operation by ID
  static async getOperationById(operationId: string): Promise<Operation | null> {
    try {
      const operationRef = ref(database, `${this.COLLECTION_NAME}/${operationId}`);
      const snapshot = await get(operationRef);
      
      if (snapshot.exists()) {
        return {
          id: operationId,
          ...snapshot.val()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching operation:', error);
      throw new Error('Operasyon yüklenirken hata oluştu');
    }
  }

  // Update operation
  static async updateOperation(operationId: string, updates: Partial<Operation>): Promise<void> {
    try {
      const operationRef = ref(database, `${this.COLLECTION_NAME}/${operationId}`);
      const updateData = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      await set(operationRef, updateData);
    } catch (error) {
      console.error('Error updating operation:', error);
      throw new Error('Operasyon güncellenirken hata oluştu');
    }
  }

  // Delete operation
  static async deleteOperation(operationId: string): Promise<void> {
    try {
      const operationRef = ref(database, `${this.COLLECTION_NAME}/${operationId}`);
      await remove(operationRef);
    } catch (error) {
      console.error('Error deleting operation:', error);
      throw new Error('Operasyon silinirken hata oluştu');
    }
  }

  // Generate report number
  static generateReportNumber(machineModel: string, operationCount: number): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${machineModel}-${operationCount.toString().padStart(3, '0')}-${year}-${month}-${day}`;
  }

  // Calculate duration
  static calculateDuration(startTime: string, endTime: string): string {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    let durationHours = endHours - startHours;
    let durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes < 0) {
      durationHours--;
      durationMinutes += 60;
    }
    
    if (durationHours < 0) {
      durationHours += 24;
    }
    
    if (durationHours === 0) {
      return `${durationMinutes} dakika`;
    } else if (durationMinutes === 0) {
      return `${durationHours} saat`;
    } else {
      return `${durationHours} saat ${durationMinutes} dakika`;
    }
  }
}
