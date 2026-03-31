import {
  DeliveryConfig,
  DeliveryCalculationInput,
  DeliveryChargeResult,
  AppliedDeliveryRule,
  DeliveryZone,
} from "../../types/delivery";

/**
 * Pure function for calculating delivery charges based on configuration
 * This is the single source of truth for all delivery charge calculations
 */
export function calculateDeliveryCharge(
  input: DeliveryCalculationInput,
  config: DeliveryConfig | null
): DeliveryChargeResult {
  const appliedRules: AppliedDeliveryRule[] = [];

  // Default result for disabled or missing config
  const disabledResult: DeliveryChargeResult = {
    baseCharge: 0,
    discount: 0,
    additionalCharges: 0,
    finalCharge: 0,
    isFree: true,
    appliedRules: [],
    message: "Free Delivery",
    minOrderMet: true,
  };

  // 1. Check if delivery is enabled globally
  if (!config || !config.isEnabled) {
    return {
      ...disabledResult,
      message: "Delivery charges not applicable",
    };
  }

  let baseCharge = config.defaultCharge;
  let discount = 0;
  let additionalCharges = 0;
  let matchedZone: DeliveryZone | undefined;
  let minOrderMet = true;
  let minOrderRequired: number | undefined;

  // 2. Find matching zone by pincode (highest priority first)
  if (input.pincode) {
    const sortedZones = [...config.zones]
      .filter((z) => z.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const zone of sortedZones) {
      const normalizedPincodes = zone.pincodes.map((p) => p.trim());
      if (normalizedPincodes.includes(input.pincode.trim())) {
        matchedZone = zone;
        baseCharge = zone.baseCharge;

        appliedRules.push({
          ruleType: "zone",
          ruleId: zone.id,
          ruleName: zone.name,
          impact: zone.baseCharge,
          reason: `Zone: ${zone.name}`,
        });

        // Check minimum order requirement for this zone
        if (zone.minOrderAmount > 0 && input.orderValue < zone.minOrderAmount) {
          minOrderMet = false;
          minOrderRequired = zone.minOrderAmount;
        }

        // Check zone-specific free delivery threshold
        if (
          zone.freeDeliveryThreshold &&
          zone.freeDeliveryThreshold > 0 &&
          input.orderValue >= zone.freeDeliveryThreshold
        ) {
          discount = baseCharge;
          appliedRules.push({
            ruleType: "order_value",
            ruleId: `zone_free_${zone.id}`,
            ruleName: "Zone Free Delivery",
            impact: -baseCharge,
            reason: `Free delivery for orders above Rs. ${zone.freeDeliveryThreshold}`,
          });
        }
        break;
      }
    }
  }

  // 3. Apply global order value rules if no zone-specific discount was applied
  if (discount === 0 && config.orderValueRules.length > 0) {
    const activeValueRules = config.orderValueRules
      .filter((r) => r.isActive)
      .sort((a, b) => b.minOrderValue - a.minOrderValue);

    for (const rule of activeValueRules) {
      if (input.orderValue >= rule.minOrderValue) {
        // Check max order value if specified
        if (rule.maxOrderValue && input.orderValue > rule.maxOrderValue) {
          continue;
        }

        switch (rule.discountType) {
          case "free":
            discount = baseCharge + additionalCharges;
            appliedRules.push({
              ruleType: "order_value",
              ruleId: rule.id,
              ruleName: rule.name,
              impact: -(baseCharge + additionalCharges),
              reason: `Free delivery for orders above Rs. ${rule.minOrderValue}`,
            });
            break;

          case "flat":
            discount = Math.min(rule.discountValue, baseCharge);
            appliedRules.push({
              ruleType: "order_value",
              ruleId: rule.id,
              ruleName: rule.name,
              impact: -discount,
              reason: `Rs. ${rule.discountValue} off on delivery`,
            });
            break;

          case "percentage":
            discount = Math.min(
              (baseCharge * rule.discountValue) / 100,
              baseCharge
            );
            appliedRules.push({
              ruleType: "order_value",
              ruleId: rule.id,
              ruleName: rule.name,
              impact: -discount,
              reason: `${rule.discountValue}% off on delivery`,
            });
            break;
        }
        break; // Take the first matching rule (highest minOrderValue that matches)
      }
    }
  }

  // 4. Apply time slot charges
  if (input.timeSlot && input.timeSlot !== "standard") {
    const slot = config.timeSlots.find(
      (s) => s.type === input.timeSlot && s.isActive
    );
    if (slot && slot.additionalCharge > 0) {
      additionalCharges += slot.additionalCharge;
      appliedRules.push({
        ruleType: "time_slot",
        ruleId: slot.id,
        ruleName: slot.name,
        impact: slot.additionalCharge,
        reason: `${slot.name} (+Rs. ${slot.additionalCharge})`,
      });
    }
  }

  // 5. Calculate final charge
  const finalCharge = Math.max(0, baseCharge + additionalCharges - discount);
  const isFree = finalCharge === 0;

  // 6. Generate user-friendly message
  let message = isFree ? "Free Delivery" : `Delivery: Rs. ${finalCharge}`;

  // Add "Add X for free delivery" message if applicable
  if (!isFree) {
    const freeThreshold = getFreeDeliveryThreshold(config, matchedZone);
    if (freeThreshold && input.orderValue < freeThreshold) {
      const remaining = freeThreshold - input.orderValue;
      message = `Rs. ${finalCharge} (Add Rs. ${remaining.toFixed(0)} for free delivery)`;
    }
  }

  // Add min order warning
  if (!minOrderMet && minOrderRequired) {
    message = `Min order Rs. ${minOrderRequired} required for delivery`;
  }

  return {
    baseCharge,
    discount,
    additionalCharges,
    finalCharge,
    isFree,
    appliedRules,
    message,
    estimatedDeliveryHours: matchedZone?.estimatedDeliveryHours,
    zone: matchedZone,
    minOrderMet,
    minOrderRequired,
  };
}

/**
 * Get the free delivery threshold based on zone or global rules
 */
export function getFreeDeliveryThreshold(
  config: DeliveryConfig,
  zone?: DeliveryZone
): number | null {
  // Check zone-specific threshold first
  if (zone?.freeDeliveryThreshold && zone.freeDeliveryThreshold > 0) {
    return zone.freeDeliveryThreshold;
  }

  // Check global order value rules for "free" type
  const freeRule = config.orderValueRules.find(
    (r) => r.isActive && r.discountType === "free"
  );
  if (freeRule) {
    return freeRule.minOrderValue;
  }

  return null;
}

/**
 * Get zone by pincode
 */
export function getZoneByPincode(
  pincode: string,
  config: DeliveryConfig | null
): DeliveryZone | null {
  if (!config || !pincode) return null;

  const sortedZones = [...config.zones]
    .filter((z) => z.isActive)
    .sort((a, b) => b.priority - a.priority);

  for (const zone of sortedZones) {
    const normalizedPincodes = zone.pincodes.map((p) => p.trim());
    if (normalizedPincodes.includes(pincode.trim())) {
      return zone;
    }
  }

  return null;
}

/**
 * Check if delivery is available for a pincode
 */
export function isDeliveryAvailable(
  pincode: string,
  config: DeliveryConfig | null
): boolean {
  if (!config || !config.isEnabled) return false;

  // If no zones configured, delivery is available everywhere
  if (config.zones.length === 0) return true;

  // Check if pincode matches any active zone
  const zone = getZoneByPincode(pincode, config);
  return zone !== null;
}

/**
 * Get estimated delivery time
 */
export function getEstimatedDeliveryHours(
  pincode: string,
  timeSlot: string | undefined,
  config: DeliveryConfig | null
): number | null {
  if (!config) return null;

  const zone = getZoneByPincode(pincode, config);

  // Check time slot first
  if (timeSlot) {
    const slot = config.timeSlots.find(
      (s) => s.type === timeSlot && s.isActive
    );
    if (slot) return slot.estimatedDeliveryHours;
  }

  // Fall back to zone estimate
  if (zone?.estimatedDeliveryHours) {
    return zone.estimatedDeliveryHours;
  }

  // Default to standard slot
  const standardSlot = config.timeSlots.find(
    (s) => s.type === "standard" && s.isActive
  );
  return standardSlot?.estimatedDeliveryHours ?? 24;
}

/**
 * Calculate how much more needed for free delivery
 */
export function getAmountForFreeDelivery(
  orderValue: number,
  config: DeliveryConfig | null,
  zone?: DeliveryZone
): number | null {
  if (!config) return null;

  const threshold = getFreeDeliveryThreshold(config, zone);
  if (!threshold) return null;

  if (orderValue >= threshold) return 0;

  return threshold - orderValue;
}
