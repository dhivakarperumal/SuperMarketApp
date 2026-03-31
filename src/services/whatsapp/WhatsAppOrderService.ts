import {
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  collection,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  WhatsAppOrder,
  WhatsAppOrderStatus,
  WhatsAppOrderItem,
  Order,
  OrderItem,
  Address,
  AppliedOfferInfo,
} from "../../types";
import { generateOrderId } from "../../utils/orderIdGenerator";
import { reduceStockAfterOrder } from "../../utils/stockManager";

/**
 * Generates a sequential WhatsApp order ID in format: WA001, WA002, etc.
 * Uses Firestore transaction to ensure unique IDs even with concurrent orders
 */
export async function generateWhatsAppOrderId(): Promise<string> {
  const counterRef = doc(db, "counters", "whatsappOrderCounter");

  try {
    const newOrderNumber = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);

      let currentNumber = 0;
      if (counterDoc.exists()) {
        currentNumber = counterDoc.data().lastOrderNumber || 0;
      }

      const nextNumber = currentNumber + 1;

      transaction.set(counterRef, {
        lastOrderNumber: nextNumber,
        updatedAt: serverTimestamp(),
      });

      return nextNumber;
    });

    // Format as WA001, WA002, etc. (3 digits with leading zeros)
    const orderId = `WA${String(newOrderNumber).padStart(3, "0")}`;
    return orderId;
  } catch (error) {
    console.error("Error generating WhatsApp order ID:", error);
    // Fallback to timestamp-based ID if transaction fails
    const timestamp = Date.now();
    return `WA${timestamp.toString().slice(-6)}`;
  }
}

/**
 * Initialize the WhatsApp order counter if it doesn't exist
 */
export async function initializeWhatsAppOrderCounter(
  startNumber: number = 0
): Promise<void> {
  const counterRef = doc(db, "counters", "whatsappOrderCounter");

  try {
    const counterDoc = await getDoc(counterRef);
    if (!counterDoc.exists()) {
      await setDoc(counterRef, {
        lastOrderNumber: startNumber,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log("WhatsApp order counter initialized with:", startNumber);
    }
  } catch (error) {
    console.error("Error initializing WhatsApp order counter:", error);
  }
}

export interface CreateWhatsAppOrderInput {
  items: WhatsAppOrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  customerMessage?: string;
  deliveryAddress?: Address;
  deliveryNotes?: string;
  paymentMethod: "cod" | "online" | "pending";
  appliedOffers?: AppliedOfferInfo[];
  branchId?: string;
  businessId?: string;
}

/**
 * Creates a new WhatsApp order
 */
export async function createWhatsAppOrder(
  orderData: CreateWhatsAppOrderInput
): Promise<WhatsAppOrder> {
  const whatsappOrderId = await generateWhatsAppOrderId();

  // Build order object, excluding undefined values (Firebase doesn't accept undefined)
  const newOrder: Record<string, any> = {
    whatsappOrderId,
    customerPhone: orderData.customerPhone || "",
    customerName: orderData.customerName || "Customer",
    items: orderData.items,
    subtotal: orderData.subtotal,
    deliveryFee: orderData.deliveryFee,
    discount: orderData.discount,
    totalAmount: orderData.totalAmount,
    paymentMethod: orderData.paymentMethod,
    paymentStatus: "pending",
    status: "Pending",
    statusHistory: [
      {
        status: "Pending",
        timestamp: new Date(),
        note: "Order received via WhatsApp",
      },
    ],
    receivedAt: new Date(),
    createdAt: new Date(),
  };

  // Only add optional fields if they have values
  if (orderData.customerMessage) {
    newOrder.customerMessage = orderData.customerMessage;
  }
  if (orderData.deliveryAddress) {
    newOrder.deliveryAddress = orderData.deliveryAddress;
  }
  if (orderData.deliveryNotes) {
    newOrder.deliveryNotes = orderData.deliveryNotes;
  }
  if (orderData.appliedOffers && orderData.appliedOffers.length > 0) {
    newOrder.appliedOffers = orderData.appliedOffers;
  }
  if (orderData.branchId) {
    newOrder.branchId = orderData.branchId;
  }
  if (orderData.businessId) {
    newOrder.businessId = orderData.businessId;
  }

  const docRef = await addDoc(collection(db, "whatsappOrders"), newOrder);

  return {
    id: docRef.id,
    ...newOrder,
  } as WhatsAppOrder;
}

/**
 * Get a WhatsApp order by ID
 */
export async function getWhatsAppOrder(
  orderId: string
): Promise<WhatsAppOrder | null> {
  try {
    const orderRef = doc(db, "whatsappOrders", orderId);
    const orderDoc = await getDoc(orderRef);

    if (!orderDoc.exists()) {
      return null;
    }

    return {
      id: orderDoc.id,
      ...orderDoc.data(),
    } as WhatsAppOrder;
  } catch (error) {
    console.error("Error getting WhatsApp order:", error);
    throw error;
  }
}

/**
 * Confirms a WhatsApp order
 */
export async function confirmWhatsAppOrder(
  orderId: string,
  adminId: string,
  note?: string
): Promise<void> {
  const orderRef = doc(db, "whatsappOrders", orderId);
  const orderDoc = await getDoc(orderRef);

  if (!orderDoc.exists()) {
    throw new Error("Order not found");
  }

  const order = orderDoc.data() as WhatsAppOrder;

  if (order.status !== "Pending") {
    throw new Error(`Order is already ${order.status}`);
  }

  const newStatusEntry = {
    status: "Confirmed" as WhatsAppOrderStatus,
    timestamp: new Date(),
    note: note || "Order confirmed by admin",
    updatedBy: adminId,
  };

  await updateDoc(orderRef, {
    status: "Confirmed",
    confirmedAt: serverTimestamp(),
    statusHistory: [...order.statusHistory, newStatusEntry],
    updatedAt: serverTimestamp(),
  });
}

/**
 * Rejects a WhatsApp order
 */
export async function rejectWhatsAppOrder(
  orderId: string,
  adminId: string,
  reason: string
): Promise<void> {
  const orderRef = doc(db, "whatsappOrders", orderId);
  const orderDoc = await getDoc(orderRef);

  if (!orderDoc.exists()) {
    throw new Error("Order not found");
  }

  const order = orderDoc.data() as WhatsAppOrder;

  if (order.status === "Converted" || order.status === "Completed") {
    throw new Error(`Cannot reject order that is already ${order.status}`);
  }

  const newStatusEntry = {
    status: "Rejected" as WhatsAppOrderStatus,
    timestamp: new Date(),
    note: reason,
    updatedBy: adminId,
  };

  await updateDoc(orderRef, {
    status: "Rejected",
    adminNotes: reason,
    statusHistory: [...order.statusHistory, newStatusEntry],
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update WhatsApp order status
 */
export async function updateWhatsAppOrderStatus(
  orderId: string,
  newStatus: WhatsAppOrderStatus,
  adminId: string,
  note?: string
): Promise<void> {
  const orderRef = doc(db, "whatsappOrders", orderId);
  const orderDoc = await getDoc(orderRef);

  if (!orderDoc.exists()) {
    throw new Error("Order not found");
  }

  const order = orderDoc.data() as WhatsAppOrder;

  const newStatusEntry = {
    status: newStatus,
    timestamp: new Date(),
    note: note || `Status updated to ${newStatus}`,
    updatedBy: adminId,
  };

  const updates: Record<string, any> = {
    status: newStatus,
    statusHistory: [...order.statusHistory, newStatusEntry],
    updatedAt: serverTimestamp(),
  };

  if (newStatus === "Confirmed" && !order.confirmedAt) {
    updates.confirmedAt = serverTimestamp();
  }

  await updateDoc(orderRef, updates);
}

/**
 * Add admin note to WhatsApp order
 */
export async function addWhatsAppOrderNote(
  orderId: string,
  adminId: string,
  note: string
): Promise<void> {
  const orderRef = doc(db, "whatsappOrders", orderId);
  const orderDoc = await getDoc(orderRef);

  if (!orderDoc.exists()) {
    throw new Error("Order not found");
  }

  const order = orderDoc.data() as WhatsAppOrder;
  const existingNotes = order.adminNotes || "";
  const newNotes = existingNotes
    ? `${existingNotes}\n\n[${new Date().toLocaleString()}] ${note}`
    : `[${new Date().toLocaleString()}] ${note}`;

  await updateDoc(orderRef, {
    adminNotes: newNotes,
    updatedAt: serverTimestamp(),
  });
}

export interface ConvertOrderOptions {
  deductStock?: boolean;
  skipStockValidation?: boolean;
}

/**
 * Converts WhatsApp order to regular order
 * - Creates regular order record
 * - Optionally deducts stock
 * - Updates WhatsApp order with conversion info
 */
export async function convertToRegularOrder(
  whatsappOrderId: string,
  adminId: string,
  options: ConvertOrderOptions = { deductStock: true }
): Promise<{ orderId: string; regularOrderId: string }> {
  const waOrderRef = doc(db, "whatsappOrders", whatsappOrderId);
  const waOrderDoc = await getDoc(waOrderRef);

  if (!waOrderDoc.exists()) {
    throw new Error("WhatsApp order not found");
  }

  const waOrder = { id: waOrderDoc.id, ...waOrderDoc.data() } as WhatsAppOrder;

  // Validate status
  if (waOrder.status === "Converted") {
    throw new Error("Order has already been converted");
  }

  if (waOrder.status === "Rejected") {
    throw new Error("Cannot convert a rejected order");
  }

  // Generate regular order ID
  const orderId = await generateOrderId();

  // Create order items
  const orderItems: OrderItem[] = waOrder.items.map((item) => ({
    productId: item.productId,
    name: item.productName,
    quantity: item.quantity,
    price: item.price,
    selectedWeight: item.selectedWeight,
    image: item.image,
  }));

  // Create regular order
  const orderData: Omit<Order, "id"> = {
    orderId,
    userId: waOrder.customerPhone, // Use phone as userId for WhatsApp orders
    items: orderItems,
    status: "OrderPlaced",
    totalAmount: waOrder.totalAmount,
    subtotal: waOrder.subtotal,
    shipping: waOrder.deliveryFee,
    discount: waOrder.discount,
    address: waOrder.deliveryAddress,
    paymentMethod:
      waOrder.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment",
    deliveryMethod: "delivery",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Add to orders collection
  const newOrderRef = await addDoc(collection(db, "orders"), orderData);

  // Update WhatsApp order status
  const newStatusEntry = {
    status: "Converted" as WhatsAppOrderStatus,
    timestamp: new Date(),
    note: `Converted to order ${orderId}`,
    updatedBy: adminId,
  };

  await updateDoc(waOrderRef, {
    status: "Converted",
    convertedOrderId: newOrderRef.id,
    convertedAt: serverTimestamp(),
    statusHistory: [...waOrder.statusHistory, newStatusEntry],
    updatedAt: serverTimestamp(),
  });

  // Deduct stock if enabled
  if (options.deductStock) {
    const stockResult = await reduceStockAfterOrder(
      orderItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        name: item.name,
      })),
      newOrderRef.id,
      adminId
    );

    if (!stockResult.success) {
      console.warn("Stock deduction warning:", stockResult.error);
      // Note: We don't roll back the order, just log the warning
      // Admin should handle stock issues manually
    }
  }

  return {
    orderId: waOrder.whatsappOrderId,
    regularOrderId: orderId,
  };
}

/**
 * Update WhatsApp order items (for admin editing)
 */
export async function updateWhatsAppOrderItems(
  orderId: string,
  items: WhatsAppOrderItem[],
  adminId: string
): Promise<void> {
  const orderRef = doc(db, "whatsappOrders", orderId);
  const orderDoc = await getDoc(orderRef);

  if (!orderDoc.exists()) {
    throw new Error("Order not found");
  }

  const order = orderDoc.data() as WhatsAppOrder;

  if (order.status === "Converted" || order.status === "Completed") {
    throw new Error(`Cannot edit order that is ${order.status}`);
  }

  // Recalculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalAmount = subtotal - order.discount + order.deliveryFee;

  await updateDoc(orderRef, {
    items,
    subtotal,
    totalAmount,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update WhatsApp order delivery info
 */
export async function updateWhatsAppOrderDelivery(
  orderId: string,
  deliveryAddress: Address,
  deliveryFee: number,
  deliveryNotes?: string
): Promise<void> {
  const orderRef = doc(db, "whatsappOrders", orderId);
  const orderDoc = await getDoc(orderRef);

  if (!orderDoc.exists()) {
    throw new Error("Order not found");
  }

  const order = orderDoc.data() as WhatsAppOrder;

  if (order.status === "Converted" || order.status === "Completed") {
    throw new Error(`Cannot edit order that is ${order.status}`);
  }

  // Recalculate total
  const totalAmount = order.subtotal - order.discount + deliveryFee;

  await updateDoc(orderRef, {
    deliveryAddress,
    deliveryFee,
    deliveryNotes,
    totalAmount,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Update payment method for WhatsApp order
 */
export async function updateWhatsAppOrderPayment(
  orderId: string,
  paymentMethod: "cod" | "online" | "pending",
  paymentStatus?: "pending" | "paid" | "failed"
): Promise<void> {
  const orderRef = doc(db, "whatsappOrders", orderId);

  const updates: Record<string, any> = {
    paymentMethod,
    updatedAt: serverTimestamp(),
  };

  if (paymentStatus) {
    updates.paymentStatus = paymentStatus;
  }

  await updateDoc(orderRef, updates);
}
