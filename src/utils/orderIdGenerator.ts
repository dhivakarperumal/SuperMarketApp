import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase/config';

export const generateOrderId = async (): Promise<string> => {
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    let maxNumber = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const orderId = data.orderId || "";
      // Match orders like ORD001, ORD002
      const match = orderId.match(/^ORD(\d{1,4})$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) {
          maxNumber = num;
        }
      }
    });

    const nextNumber = maxNumber + 1;
    return `ORD${nextNumber.toString().padStart(3, "0")}`;
  } catch (error) {
    console.error("Error generating order ID:", error);
    return `ORD001`;
  }
};