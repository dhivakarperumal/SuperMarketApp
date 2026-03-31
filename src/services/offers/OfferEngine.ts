import { Timestamp } from "firebase/firestore";
import {
  Offer,
  OfferType,
  AppliedOffer,
  FreeItem,
  CartItemWithOffer,
  CartTotalsWithOffers,
  ProductOfferInfo,
  AppliedOfferSummary,
  OFFER_PRIORITY,
  AppliedCoupon,
  CouponValidationResult,
} from "../../types/offers";
import { CartItem } from "../../types";

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert Firestore Timestamp or Date to JavaScript Date
 */
function toDate(date: Timestamp | Date | undefined): Date | null {
  if (!date) return null;
  if (date instanceof Date) return date;
  if (typeof date === "object" && "toDate" in date) {
    return date.toDate();
  }
  return null;
}

/**
 * Check if current time is within the offer's validity period
 */
export function isOfferValid(offer: Offer): boolean {
  const now = new Date();

  // Check date range
  const startDate = toDate(offer.startDate);
  const endDate = toDate(offer.endDate);

  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;

  // Check day of week if specified
  if (offer.daysOfWeek && offer.daysOfWeek.length > 0) {
    const currentDay = now.getDay();
    if (!offer.daysOfWeek.includes(currentDay)) return false;
  }

  // Check time window if specified
  if (offer.startTime && offer.endTime) {
    const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
    if (currentTime < offer.startTime || currentTime > offer.endTime) {
      return false;
    }
  }

  // Check usage limit
  if (offer.usageLimit && offer.usageCount >= offer.usageLimit) {
    return false;
  }

  return true;
}

/**
 * Check if a product is eligible for an offer
 */
export function isProductEligible(
  offer: Offer,
  productId: string,
  categoryId?: string
): boolean {
  // Check if product is excluded
  if (offer.excludedProducts?.includes(productId)) {
    return false;
  }

  // Check based on scope
  switch (offer.scope) {
    case "store_wide":
      return true;

    case "product":
      return offer.eligibleProducts?.includes(productId) ?? false;

    case "category":
      if (!categoryId) return false;
      return offer.eligibleCategories?.includes(categoryId) ?? false;

    default:
      return false;
  }
}

/**
 * Filter active and valid offers, sorted by priority
 */
export function getValidOffers(offers: Offer[]): Offer[] {
  return offers
    .filter((offer) => offer.isActive && isOfferValid(offer))
    .sort((a, b) => a.priority - b.priority);
}

// ============================================
// DISCOUNT CALCULATION
// ============================================

/**
 * Calculate discount for a single item
 */
function calculateDiscount(
  offer: Offer,
  unitPrice: number,
  quantity: number
): { discountedPrice: number; discountAmount: number } {
  if (offer.type !== "discount" || !offer.discountValue) {
    return { discountedPrice: unitPrice, discountAmount: 0 };
  }

  // Check minimum quantity
  if (quantity < offer.minQuantity) {
    return { discountedPrice: unitPrice, discountAmount: 0 };
  }

  // Apply to max quantity if specified
  const applicableQty = offer.maxQuantity
    ? Math.min(quantity, offer.maxQuantity)
    : quantity;

  let discountPerUnit = 0;

  if (offer.discountType === "percentage") {
    discountPerUnit = (unitPrice * offer.discountValue) / 100;
    // Apply max discount cap if specified
    if (offer.maxDiscountAmount) {
      const totalDiscount = discountPerUnit * applicableQty;
      if (totalDiscount > offer.maxDiscountAmount) {
        discountPerUnit = offer.maxDiscountAmount / applicableQty;
      }
    }
  } else {
    // Flat discount
    discountPerUnit = Math.min(offer.discountValue, unitPrice);
  }

  const discountedPrice = unitPrice - discountPerUnit;
  const discountAmount = discountPerUnit * applicableQty;

  return {
    discountedPrice: Math.max(0, discountedPrice),
    discountAmount,
  };
}

// ============================================
// BOGO CALCULATION
// ============================================

/**
 * Calculate BOGO (Buy X Get Y Free) offer
 */
function calculateBogo(
  offer: Offer,
  items: CartItem[],
  productId: string,
  unitPrice: number,
  quantity: number
): { discountAmount: number; freeItems: FreeItem[] } {
  if (offer.type !== "bogo" || !offer.buyQuantity || !offer.getQuantity) {
    return { discountAmount: 0, freeItems: [] };
  }

  // Check minimum quantity
  if (quantity < offer.buyQuantity) {
    return { discountAmount: 0, freeItems: [] };
  }

  // Calculate how many times the offer can be applied
  const buyQty = offer.buyQuantity;
  const getQty = offer.getQuantity;
  const totalNeeded = buyQty + getQty;

  // Number of complete offer cycles
  const cycles = Math.floor(quantity / totalNeeded);

  if (cycles === 0) {
    return { discountAmount: 0, freeItems: [] };
  }

  // Free items quantity
  const freeQuantity = cycles * getQty;

  // Get free product info
  let freeProductId = productId;
  let freeProductPrice = unitPrice;
  let freeProductName = "";

  // If a different product is specified as free
  if (offer.getProductId) {
    const freeProduct = items.find(
      (item) => item.productId === offer.getProductId
    );
    if (freeProduct) {
      freeProductId = freeProduct.productId;
      freeProductPrice = freeProduct.price;
      freeProductName = freeProduct.name;
    }
  }

  const discountAmount = freeProductPrice * freeQuantity;
  const freeItems: FreeItem[] =
    freeQuantity > 0
      ? [
          {
            productId: freeProductId,
            productName: freeProductName,
            quantity: freeQuantity,
            value: discountAmount,
          },
        ]
      : [];

  return { discountAmount, freeItems };
}

// ============================================
// COMBO CALCULATION
// ============================================

interface ComboMatch {
  offer: Offer;
  matchedItems: { productId: string; quantity: number; price: number }[];
  originalTotal: number;
  comboTotal: number;
  discountAmount: number;
}

/**
 * Check if cart contains all products needed for a combo
 */
function checkComboEligibility(
  offer: Offer,
  items: CartItem[]
): ComboMatch | null {
  if (offer.type !== "combo" || !offer.comboProducts?.length) {
    return null;
  }

  const matchedItems: { productId: string; quantity: number; price: number }[] =
    [];
  let originalTotal = 0;

  // Check if all combo products are in cart with required quantities
  for (const comboProduct of offer.comboProducts) {
    const cartItem = items.find(
      (item) => item.productId === comboProduct.productId
    );

    if (!cartItem || cartItem.quantity < comboProduct.quantity) {
      return null; // Combo not complete
    }

    matchedItems.push({
      productId: comboProduct.productId,
      quantity: comboProduct.quantity,
      price: cartItem.price,
    });

    originalTotal += cartItem.price * comboProduct.quantity;
  }

  // Calculate combo price
  let comboTotal = originalTotal;

  if (offer.comboPrice !== undefined && offer.comboPrice !== null) {
    comboTotal = offer.comboPrice;
  } else if (offer.comboDiscount) {
    comboTotal = originalTotal * (1 - offer.comboDiscount / 100);
  }

  const discountAmount = originalTotal - comboTotal;

  if (discountAmount <= 0) {
    return null;
  }

  return {
    offer,
    matchedItems,
    originalTotal,
    comboTotal,
    discountAmount,
  };
}

// ============================================
// MAIN CALCULATION ENGINE
// ============================================

/**
 * Apply all offers to cart items and calculate totals
 */
export function calculateCartWithOffers(
  items: CartItem[],
  offers: Offer[],
  getCategoryId?: (productId: string) => string | undefined
): { itemsWithOffers: CartItemWithOffer[]; totals: CartTotalsWithOffers } {
  // Get valid offers sorted by priority
  const validOffers = getValidOffers(offers);

  // Track which items have offers applied
  const itemOfferMap = new Map<string, AppliedOffer>();
  const appliedOffersSummary: AppliedOfferSummary[] = [];
  const allFreeItems: FreeItem[] = [];

  // Deep copy items to avoid mutations
  const itemsCopy = items.map((item) => ({ ...item }));

  // Track items that are part of combos (can't have other offers)
  const comboItemIds = new Set<string>();

  // ---- PHASE 1: Apply Combo Offers ----
  const comboOffers = validOffers.filter((o) => o.type === "combo");

  for (const offer of comboOffers) {
    const comboMatch = checkComboEligibility(offer, itemsCopy);

    if (comboMatch) {
      // Mark combo items
      for (const matched of comboMatch.matchedItems) {
        comboItemIds.add(matched.productId);

        // Create applied offer for each item in combo
        const itemShare =
          comboMatch.discountAmount / comboMatch.matchedItems.length;
        const cartItem = itemsCopy.find(
          (i) => i.productId === matched.productId
        );

        if (cartItem) {
          itemOfferMap.set(cartItem.id, {
            offerId: offer.id,
            offerName: offer.name,
            offerType: "combo",
            originalPrice: cartItem.price,
            discountedPrice: cartItem.price - itemShare / matched.quantity,
            discountAmount: itemShare,
            badgeText: offer.badgeText || "COMBO",
            badgeColor: offer.badgeColor || "#8B5CF6",
          });
        }
      }

      appliedOffersSummary.push({
        offerId: offer.id,
        offerName: offer.name,
        offerType: "combo",
        discountAmount: comboMatch.discountAmount,
        itemsAffected: comboMatch.matchedItems.length,
      });
    }
  }

  // ---- PHASE 2: Apply BOGO Offers ----
  const bogoOffers = validOffers.filter((o) => o.type === "bogo");

  for (const item of itemsCopy) {
    // Skip if already part of combo
    if (comboItemIds.has(item.productId)) continue;
    if (itemOfferMap.has(item.id)) continue;

    const categoryId = getCategoryId?.(item.productId);

    for (const offer of bogoOffers) {
      if (!isProductEligible(offer, item.productId, categoryId)) continue;

      const { discountAmount, freeItems } = calculateBogo(
        offer,
        itemsCopy,
        item.productId,
        item.price,
        item.quantity
      );

      if (discountAmount > 0) {
        itemOfferMap.set(item.id, {
          offerId: offer.id,
          offerName: offer.name,
          offerType: "bogo",
          originalPrice: item.price,
          discountedPrice:
            item.price - discountAmount / Math.max(item.quantity, 1),
          discountAmount,
          freeItems,
          badgeText:
            offer.badgeText ||
            `Buy ${offer.buyQuantity} Get ${offer.getQuantity} Free`,
          badgeColor: offer.badgeColor || "#F97316",
        });

        allFreeItems.push(...freeItems);

        // Update summary
        const existingSummary = appliedOffersSummary.find(
          (s) => s.offerId === offer.id
        );
        if (existingSummary) {
          existingSummary.discountAmount += discountAmount;
          existingSummary.itemsAffected += 1;
        } else {
          appliedOffersSummary.push({
            offerId: offer.id,
            offerName: offer.name,
            offerType: "bogo",
            discountAmount,
            itemsAffected: 1,
          });
        }

        break; // Only one offer per item
      }
    }
  }

  // ---- PHASE 3: Apply Discount Offers ----
  const discountOffers = validOffers.filter((o) => o.type === "discount");

  for (const item of itemsCopy) {
    // Skip if already has offer
    if (comboItemIds.has(item.productId)) continue;
    if (itemOfferMap.has(item.id)) continue;

    const categoryId = getCategoryId?.(item.productId);

    for (const offer of discountOffers) {
      if (!isProductEligible(offer, item.productId, categoryId)) continue;

      const { discountedPrice, discountAmount } = calculateDiscount(
        offer,
        item.price,
        item.quantity
      );

      if (discountAmount > 0) {
        itemOfferMap.set(item.id, {
          offerId: offer.id,
          offerName: offer.name,
          offerType: "discount",
          originalPrice: item.price,
          discountedPrice,
          discountAmount,
          badgeText:
            offer.badgeText ||
            (offer.discountType === "percentage"
              ? `${offer.discountValue}% OFF`
              : `₹${offer.discountValue} OFF`),
          badgeColor: offer.badgeColor || "#2E7D32",
        });

        // Update summary
        const existingSummary = appliedOffersSummary.find(
          (s) => s.offerId === offer.id
        );
        if (existingSummary) {
          existingSummary.discountAmount += discountAmount;
          existingSummary.itemsAffected += 1;
        } else {
          appliedOffersSummary.push({
            offerId: offer.id,
            offerName: offer.name,
            offerType: "discount",
            discountAmount,
            itemsAffected: 1,
          });
        }

        break; // Only one offer per item
      }
    }
  }

  // ---- BUILD RESULT ----
  const itemsWithOffers: CartItemWithOffer[] = itemsCopy.map((item) => {
    const appliedOffer = itemOfferMap.get(item.id);
    const originalTotal = item.price * item.quantity;

    if (appliedOffer) {
      const effectivePrice = appliedOffer.discountedPrice;
      const effectiveTotal = originalTotal - appliedOffer.discountAmount;

      return {
        ...item,
        appliedOffer,
        effectivePrice,
        effectiveTotal: Math.max(0, effectiveTotal),
        savings: appliedOffer.discountAmount,
      };
    }

    return {
      ...item,
      effectivePrice: item.price,
      effectiveTotal: originalTotal,
      savings: 0,
    };
  });

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const totalDiscount = appliedOffersSummary.reduce(
    (sum, s) => sum + s.discountAmount,
    0
  );
  const total = Math.max(0, subtotal - totalDiscount);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const totals: CartTotalsWithOffers = {
    subtotal,
    totalDiscount,
    total,
    itemCount,
    appliedOffers: appliedOffersSummary,
    freeItems: allFreeItems,
  };

  return { itemsWithOffers, totals };
}

// ============================================
// PRODUCT OFFER INFO (for display)
// ============================================

/**
 * Get offer info for a single product (for product cards/detail pages)
 */
export function getProductOfferInfo(
  productId: string,
  categoryId: string | undefined,
  price: number,
  offers: Offer[]
): ProductOfferInfo {
  const noOffer: ProductOfferInfo = {
    hasOffer: false,
    originalPrice: price,
    effectivePrice: price,
    discountAmount: 0,
    discountPercentage: 0,
  };

  const validOffers = getValidOffers(offers);

  // Find the best applicable offer (highest priority = lowest number)
  for (const offer of validOffers) {
    // Skip BOGO and Combo for product display (they need quantity context)
    if (offer.type !== "discount") continue;

    if (!isProductEligible(offer, productId, categoryId)) continue;

    // Calculate discount for single item
    const { discountedPrice, discountAmount } = calculateDiscount(
      offer,
      price,
      1
    );

    if (discountAmount > 0) {
      const discountPercentage = Math.round((discountAmount / price) * 100);

      return {
        hasOffer: true,
        offer,
        originalPrice: price,
        effectivePrice: discountedPrice,
        discountAmount,
        discountPercentage,
        badgeText:
          offer.badgeText ||
          (offer.discountType === "percentage"
            ? `${offer.discountValue}% OFF`
            : `₹${offer.discountValue} OFF`),
        badgeColor: offer.badgeColor || "#2E7D32",
        offerDescription: offer.description,
      };
    }
  }

  // Check for BOGO offers (show badge but don't change price)
  for (const offer of validOffers) {
    if (offer.type !== "bogo") continue;
    if (!isProductEligible(offer, productId, categoryId)) continue;

    return {
      hasOffer: true,
      offer,
      originalPrice: price,
      effectivePrice: price, // Price doesn't change for display
      discountAmount: 0,
      discountPercentage: 0,
      badgeText:
        offer.badgeText ||
        `Buy ${offer.buyQuantity} Get ${offer.getQuantity} Free`,
      badgeColor: offer.badgeColor || "#F97316",
      offerDescription: offer.description,
    };
  }

  return noOffer;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if user has exceeded per-user limit for an offer
 */
export function hasExceededUserLimit(
  offer: Offer,
  userUsageCount: number
): boolean {
  if (!offer.perUserLimit) return false;
  return userUsageCount >= offer.perUserLimit;
}

/**
 * Generate badge text based on offer type and configuration
 */
export function generateBadgeText(offer: Offer): string {
  if (offer.badgeText) return offer.badgeText;

  switch (offer.type) {
    case "discount":
      return offer.discountType === "percentage"
        ? `${offer.discountValue}% OFF`
        : `₹${offer.discountValue} OFF`;

    case "bogo":
      return `Buy ${offer.buyQuantity} Get ${offer.getQuantity} Free`;

    case "combo":
      return "COMBO DEAL";

    default:
      return "SPECIAL OFFER";
  }
}

/**
 * Format offer validity period as string
 */
export function formatOfferValidity(offer: Offer): string {
  const startDate = toDate(offer.startDate);
  const endDate = toDate(offer.endDate);

  if (!startDate || !endDate) return "";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

// ============================================
// COUPON VALIDATION & APPLICATION
// ============================================

/**
 * Validate a coupon code
 */
export function validateCoupon(
  couponCode: string,
  offers: Offer[],
  cartTotal: number,
  userUsageCount: number = 0,
  isFirstOrder: boolean = false
): CouponValidationResult {
  if (!couponCode || couponCode.trim() === "") {
    return { isValid: false, error: "Please enter a coupon code" };
  }

  const normalizedCode = couponCode.trim().toUpperCase();

  // Find coupon by code
  const coupon = offers.find(
    (o) =>
      o.type === "coupon" &&
      o.couponCode?.toUpperCase() === normalizedCode
  );

  if (!coupon) {
    return { isValid: false, error: "Invalid coupon code" };
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    return { isValid: false, error: "This coupon is no longer active" };
  }

  // Check validity period
  if (!isOfferValid(coupon)) {
    return { isValid: false, error: "This coupon has expired" };
  }

  // Check usage limit
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { isValid: false, error: "This coupon has reached its usage limit" };
  }

  // Check per-user limit
  if (coupon.maxUsesPerUser && userUsageCount >= coupon.maxUsesPerUser) {
    return { isValid: false, error: "You have already used this coupon the maximum number of times" };
  }

  // Check first order only
  if (coupon.isFirstOrderOnly && !isFirstOrder) {
    return { isValid: false, error: "This coupon is only valid for first-time orders" };
  }

  // Check minimum order amount
  if (coupon.minOrderAmount && cartTotal < coupon.minOrderAmount) {
    return {
      isValid: false,
      error: `Minimum order amount of ₹${coupon.minOrderAmount} required`,
    };
  }

  // Calculate discount amount
  let discountAmount = 0;
  if (coupon.discountType === "percentage" && coupon.discountValue) {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
    // Apply max discount cap if specified
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === "flat" && coupon.discountValue) {
    discountAmount = Math.min(coupon.discountValue, cartTotal);
  }

  return {
    isValid: true,
    coupon,
    discountAmount,
  };
}

/**
 * Apply a coupon to cart total
 */
export function applyCouponToCart(
  coupon: Offer,
  cartTotal: number
): AppliedCoupon | null {
  if (coupon.type !== "coupon" || !coupon.discountValue) {
    return null;
  }

  let discountAmount = 0;

  if (coupon.discountType === "percentage") {
    discountAmount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
      discountAmount = coupon.maxDiscountAmount;
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, cartTotal);
  }

  return {
    couponId: coupon.id,
    couponCode: coupon.couponCode || "",
    couponName: coupon.name,
    discountType: coupon.discountType || "percentage",
    discountValue: coupon.discountValue,
    discountAmount,
    minOrderAmount: coupon.minOrderAmount,
  };
}

/**
 * Calculate cart with offers AND applied coupon
 */
export function calculateCartWithOffersAndCoupon(
  items: CartItem[],
  offers: Offer[],
  appliedCoupon: Offer | null,
  getCategoryId?: (productId: string) => string | undefined
): {
  itemsWithOffers: CartItemWithOffer[];
  totals: CartTotalsWithOffers;
  couponDiscount: AppliedCoupon | null;
} {
  // First, calculate cart with regular offers (excluding coupons)
  const regularOffers = offers.filter((o) => o.type !== "coupon");
  const { itemsWithOffers, totals } = calculateCartWithOffers(
    items,
    regularOffers,
    getCategoryId
  );

  // If no coupon applied, return regular totals
  if (!appliedCoupon) {
    return { itemsWithOffers, totals, couponDiscount: null };
  }

  // Apply coupon to the total after other discounts
  const couponDiscount = applyCouponToCart(appliedCoupon, totals.total);

  if (couponDiscount) {
    // Update totals with coupon discount
    const newTotals: CartTotalsWithOffers = {
      ...totals,
      totalDiscount: totals.totalDiscount + couponDiscount.discountAmount,
      total: Math.max(0, totals.total - couponDiscount.discountAmount),
      appliedOffers: [
        ...totals.appliedOffers,
        {
          offerId: appliedCoupon.id,
          offerName: `Coupon: ${appliedCoupon.couponCode}`,
          offerType: "coupon",
          discountAmount: couponDiscount.discountAmount,
          itemsAffected: items.length,
        },
      ],
    };

    return { itemsWithOffers, totals: newTotals, couponDiscount };
  }

  return { itemsWithOffers, totals, couponDiscount: null };
}
