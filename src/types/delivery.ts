export type DiscountType = "flat" | "percentage" | "free";

export interface DeliveryZone {
    id: string;
    name: string;
    pincodes: string[];
    baseCharge: number;
    minOrderAmount?: number;
    freeDeliveryThreshold?: number;
    priority?: number;
    isActive?: boolean;
}

export interface OrderValueRule {
    id: string;
    name: string;
    minOrderValue: number;
    maxOrderValue?: number;
    discountType: DiscountType;
    discountValue?: number;
    isActive?: boolean;
}

export interface DeliveryTimeSlot {
    id: string;
    label: string;
    startTime: string;
    endTime: string;
    isActive?: boolean;
}

export interface DeliveryConfig {
    isEnabled?: boolean;
    defaultCharge?: number;
    freeDeliveryMessage?: string;
    showBreakdown?: boolean;
    zones?: DeliveryZone[];
    orderValueRules?: OrderValueRule[];
    timeSlots?: DeliveryTimeSlot[];
}
