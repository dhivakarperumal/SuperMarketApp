import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "../firebase/config";

// Storage keys
const KEYS = {
  PRODUCTS: "@offline_products",
  CATEGORIES: "@offline_categories",
  CART: "@offline_cart",
  PENDING_ORDERS: "@offline_pending_orders",
  PENDING_SYNC: "@offline_pending_sync",
  LAST_SYNC: "@offline_last_sync",
  USER_PROFILE: "@offline_user_profile",
};

export interface PendingOperation {
  id: string;
  type: "order" | "cart_add" | "cart_update" | "cart_remove" | "stock_update";
  data: any;
  timestamp: number;
  retryCount: number;
}

export interface OfflineOrder {
  id: string;
  orderId: string;
  items: any[];
  address: any;
  paymentMethod: string;
  totalAmount: number;
  userId: string;
  userEmail: string;
  status: "pending_sync";
  createdAt: number;
}

class OfflineManager {
  private isOnline: boolean = true;
  private syncInProgress: boolean = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    this.initNetworkListener();
  }

  // Initialize network state listener
  private initNetworkListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      // Notify listeners
      this.listeners.forEach((listener) => listener(this.isOnline));

      // If came back online, trigger sync
      if (wasOffline && this.isOnline) {
        console.log("Network restored - starting sync...");
        this.syncPendingOperations();
      }
    });
  }

  // Subscribe to network changes
  addNetworkListener(callback: (isOnline: boolean) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  // Check current network status
  async checkNetworkStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  getIsOnline(): boolean {
    return this.isOnline;
  }

  // ================== PRODUCTS CACHE ==================

  async cacheProducts(products: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
      await AsyncStorage.setItem(KEYS.LAST_SYNC, Date.now().toString());
    } catch (error) {
      console.error("Error caching products:", error);
    }
  }

  async getCachedProducts(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PRODUCTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting cached products:", error);
      return [];
    }
  }

  // ================== CATEGORIES CACHE ==================

  async cacheCategories(categories: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (error) {
      console.error("Error caching categories:", error);
    }
  }

  async getCachedCategories(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.CATEGORIES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting cached categories:", error);
      return [];
    }
  }

  // ================== CART OFFLINE ==================

  async saveCartOffline(userId: string, cart: any[]): Promise<void> {
    try {
      const key = `${KEYS.CART}_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart offline:", error);
    }
  }

  async getOfflineCart(userId: string): Promise<any[]> {
    try {
      const key = `${KEYS.CART}_${userId}`;
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting offline cart:", error);
      return [];
    }
  }

  // ================== PENDING ORDERS ==================

  async saveOfflineOrder(order: OfflineOrder): Promise<void> {
    try {
      const existing = await this.getPendingOrders();
      existing.push(order);
      await AsyncStorage.setItem(KEYS.PENDING_ORDERS, JSON.stringify(existing));
    } catch (error) {
      console.error("Error saving offline order:", error);
      throw error;
    }
  }

  async getPendingOrders(): Promise<OfflineOrder[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_ORDERS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting pending orders:", error);
      return [];
    }
  }

  async removePendingOrder(orderId: string): Promise<void> {
    try {
      const orders = await this.getPendingOrders();
      const filtered = orders.filter((o) => o.id !== orderId);
      await AsyncStorage.setItem(KEYS.PENDING_ORDERS, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error removing pending order:", error);
    }
  }

  // ================== PENDING OPERATIONS QUEUE ==================

  async addPendingOperation(operation: Omit<PendingOperation, "id" | "timestamp" | "retryCount">): Promise<void> {
    try {
      const pending = await this.getPendingOperations();
      const newOp: PendingOperation = {
        ...operation,
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        retryCount: 0,
      };
      pending.push(newOp);
      await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(pending));
    } catch (error) {
      console.error("Error adding pending operation:", error);
    }
  }

  async getPendingOperations(): Promise<PendingOperation[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PENDING_SYNC);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error("Error getting pending operations:", error);
      return [];
    }
  }

  async removePendingOperation(operationId: string): Promise<void> {
    try {
      const operations = await this.getPendingOperations();
      const filtered = operations.filter((op) => op.id !== operationId);
      await AsyncStorage.setItem(KEYS.PENDING_SYNC, JSON.stringify(filtered));
    } catch (error) {
      console.error("Error removing pending operation:", error);
    }
  }

  // ================== SYNC OPERATIONS ==================

  async syncPendingOperations(): Promise<{ success: boolean; synced: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: false, synced: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let synced = 0;
    let failed = 0;

    try {
      // Sync pending orders first
      const pendingOrders = await this.getPendingOrders();
      for (const order of pendingOrders) {
        try {
          await this.syncOrder(order);
          await this.removePendingOrder(order.id);
          synced++;
        } catch (error) {
          console.error("Failed to sync order:", order.id, error);
          failed++;
        }
      }

      // Sync other pending operations
      const operations = await this.getPendingOperations();
      for (const op of operations) {
        try {
          await this.executeOperation(op);
          await this.removePendingOperation(op.id);
          synced++;
        } catch (error) {
          console.error("Failed to sync operation:", op.id, error);
          // Increment retry count
          op.retryCount++;
          if (op.retryCount >= 3) {
            await this.removePendingOperation(op.id);
            failed++;
          }
        }
      }

      return { success: true, synced, failed };
    } catch (error) {
      console.error("Sync error:", error);
      return { success: false, synced, failed };
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncOrder(order: OfflineOrder): Promise<void> {
    // Create order in Firestore
    const orderData = {
      orderId: order.orderId,
      userId: order.userId,
      userEmail: order.userEmail,
      items: order.items,
      address: order.address,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      status: "OrderPlaced",
      paymentStatus: order.paymentMethod === "cod" ? "cod" : "pending",
      createdAt: new Date(order.createdAt),
      syncedAt: new Date(),
      wasOffline: true,
    };

    const docRef = await addDoc(collection(db, "orders"), orderData);

    // Reduce stock
    for (const item of order.items) {
      try {
        const productRef = doc(db, "products", item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock || 0;
          const newStock = Math.max(0, currentStock - item.quantity);
          await updateDoc(productRef, { stock: newStock, updatedAt: new Date() });
        }
      } catch (error) {
        console.error("Failed to update stock for:", item.productId, error);
      }
    }
  }

  private async executeOperation(operation: PendingOperation): Promise<void> {
    switch (operation.type) {
      case "stock_update":
        const { productId, quantity } = operation.data;
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const currentStock = productSnap.data().stock || 0;
          await updateDoc(productRef, {
            stock: currentStock + quantity,
            updatedAt: new Date(),
          });
        }
        break;

      default:
        console.log("Unknown operation type:", operation.type);
    }
  }

  // ================== USER PROFILE CACHE ==================

  async cacheUserProfile(profile: any): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch (error) {
      console.error("Error caching user profile:", error);
    }
  }

  async getCachedUserProfile(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting cached user profile:", error);
      return null;
    }
  }

  // ================== CACHE MANAGEMENT ==================

  async getLastSyncTime(): Promise<number | null> {
    try {
      const data = await AsyncStorage.getItem(KEYS.LAST_SYNC);
      return data ? parseInt(data, 10) : null;
    } catch (error) {
      return null;
    }
  }

  async clearAllCache(): Promise<void> {
    try {
      const keys = Object.values(KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  }

  async getPendingCount(): Promise<number> {
    const orders = await this.getPendingOrders();
    const operations = await this.getPendingOperations();
    return orders.length + operations.length;
  }
}

export const offlineManager = new OfflineManager();
export default offlineManager;
