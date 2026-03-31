import { ESCPOSCommands as ESC } from "./ESCPOSCommands";
import { ReceiptData, InvoiceData, BarcodeData, ReceiptSettings, GSTDisplayType } from "../../types";
import { generateOrderPaymentURI } from "../../utils/upiQR";

// Default settings (used when no settings provided)
const DEFAULT_STORE_NAME = "DHIVA DEVA";
const DEFAULT_STORE_TAGLINE = "SUPER MARKET";
const DEFAULT_STORE_ADDRESS = "122 Sollaikolaimedu, Ambur";
const DEFAULT_STORE_PHONE = "+91 89404 50960";
const DEFAULT_FOOTER_MESSAGE = "Thank you for shopping!";
const DEFAULT_FOOTER_SUB = "Visit again!";

/**
 * Builds ESC/POS commands for various receipt types
 */
export class ReceiptBuilder {
  private settings: ReceiptSettings | null = null;

  /**
   * Set receipt settings
   */
  setSettings(settings: ReceiptSettings | null): void {
    this.settings = settings;
  }

  /**
   * Get paper width in characters (default 58mm = 32 chars)
   */
  private getPaperWidth(): number {
    return 32; // 58mm paper = 32 characters
  }

  /**
   * Format currency in Indian Rupees
   */
  private formatCurrency(amount: number): string {
    return `Rs.${amount.toFixed(2)}`;
  }

  /**
   * Format date for receipt
   */
  private formatDate(date: Date = new Date()): string {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /**
   * Format a row with columns (58mm paper - 32 chars)
   */
  private formatRow(
    col1: string,
    col2: string,
    col3: string,
    col4: string
  ): string {
    // 58mm paper - 32 chars total
    const widths = [14, 4, 7, 7];
    return `${col1.substring(0, widths[0]).padEnd(widths[0])}${col2
      .substring(0, widths[1])
      .padStart(widths[1])}${col3
      .substring(0, widths[2])
      .padStart(widths[2])}${col4
      .substring(0, widths[3])
      .padStart(widths[3])}\n`;
  }

  /**
   * Format a total row
   */
  private formatTotalRow(label: string, value: string): string {
    const paperWidth = this.getPaperWidth();
    const padding = paperWidth - label.length - value.length;
    return `${label}${" ".repeat(Math.max(0, padding))}${value}\n`;
  }

  /**
   * Get store name from settings
   */
  private getStoreName(): string {
    return this.settings?.storeName || DEFAULT_STORE_NAME;
  }

  /**
   * Get store tagline from settings
   */
  private getStoreTagline(): string {
    return this.settings?.tagline || DEFAULT_STORE_TAGLINE;
  }

  /**
   * Get store address from settings
   */
  private getStoreAddress(): string {
    if (this.settings) {
      const parts = [this.settings.address];
      if (this.settings.city) parts.push(this.settings.city);
      if (this.settings.pincode) parts.push(this.settings.pincode);
      return parts.join(", ");
    }
    return DEFAULT_STORE_ADDRESS;
  }

  /**
   * Get store phone from settings
   */
  private getStorePhone(): string {
    return this.settings?.phone || DEFAULT_STORE_PHONE;
  }

  /**
   * Get footer message from settings
   */
  private getFooterMessage(): string {
    return this.settings?.footerMessage || DEFAULT_FOOTER_MESSAGE;
  }

  /**
   * Get footer sub message from settings
   */
  private getFooterSubMessage(): string {
    return this.settings?.footerSubMessage || DEFAULT_FOOTER_SUB;
  }

  /**
   * Build QR code commands for UPI payment
   */
  private buildUPIQRCode(amount: number, orderId: string): Uint8Array[] {
    if (!this.settings?.upiEnabled || !this.settings?.upiId || !this.settings?.upiMerchantName) {
      return [];
    }

    const commands: Uint8Array[] = [];
    const upiUri = generateOrderPaymentURI(
      this.settings.upiId,
      this.settings.upiMerchantName,
      amount,
      orderId
    );

    const qrCommands = ESC.qrCode(upiUri);
    commands.push(ESC.ALIGN_CENTER);
    commands.push(ESC.LINE_FEED);
    commands.push(ESC.text("Scan to Pay\n"));
    commands.push(qrCommands.model);
    commands.push(qrCommands.size);
    commands.push(qrCommands.data);
    commands.push(qrCommands.print);
    commands.push(ESC.LINE_FEED);
    commands.push(ESC.text(`UPI: ${this.settings.upiId}\n`));
    commands.push(ESC.LINE_FEED);

    return commands;
  }

  /**
   * Build GST details section
   */
  private buildGSTSection(totals: {
    subtotal: number;
    tax: number;
    total: number;
  }): Uint8Array[] {
    if (!this.settings?.gstEnabled) {
      return [];
    }

    const commands: Uint8Array[] = [];
    const gstType = this.settings.gstDisplayType || "none";
    const gstRate = this.settings.gstRate || 5;

    if (gstType === "none") {
      return [];
    }

    // Add GSTIN
    if (this.settings.gstin) {
      commands.push(ESC.text(`GSTIN: ${this.settings.gstin}\n`));
    }

    // Calculate GST based on settings
    let totalTax = totals.tax;

    // If tax is 0 but we have a GST rate, calculate it
    if (totalTax === 0 && gstRate > 0) {
      if (gstType === "inclusive") {
        // Extract tax from inclusive price
        totalTax = totals.subtotal - (totals.subtotal / (1 + gstRate / 100));
      } else {
        // Calculate tax on subtotal
        totalTax = totals.subtotal * (gstRate / 100);
      }
    }

    // Split into CGST/SGST (50-50 for intrastate)
    const cgst = totalTax / 2;
    const sgst = totalTax / 2;
    const halfRate = gstRate / 2;

    if (gstType === "inclusive") {
      // GST Inclusive: Tax is already included in prices
      commands.push(ESC.text(`(GST ${gstRate}% Inclusive)\n`));
      if (totalTax > 0) {
        commands.push(
          ESC.text(
            this.formatTotalRow(`CGST (${halfRate}%):`, this.formatCurrency(cgst))
          )
        );
        commands.push(
          ESC.text(
            this.formatTotalRow(`SGST (${halfRate}%):`, this.formatCurrency(sgst))
          )
        );
      }
    } else if (gstType === "exclusive") {
      // GST Exclusive: Tax is added separately
      commands.push(ESC.text(`(GST ${gstRate}% Exclusive)\n`));
      commands.push(
        ESC.text(
          this.formatTotalRow("Taxable Value:", this.formatCurrency(totals.subtotal))
        )
      );
      if (totalTax > 0) {
        commands.push(
          ESC.text(
            this.formatTotalRow(`CGST (${halfRate}%):`, this.formatCurrency(cgst))
          )
        );
        commands.push(
          ESC.text(
            this.formatTotalRow(`SGST (${halfRate}%):`, this.formatCurrency(sgst))
          )
        );
        commands.push(
          ESC.text(
            this.formatTotalRow("Total Tax:", this.formatCurrency(totalTax))
          )
        );
      }
    }

    return commands;
  }

  /**
   * Build receipt for billing
   */
  buildReceipt(data: ReceiptData): Uint8Array {
    const commands: Uint8Array[] = [];
    const paperWidth = this.getPaperWidth();

    // Initialize printer
    commands.push(ESC.INIT);

    // Header - Store name
    commands.push(ESC.ALIGN_CENTER);
    commands.push(ESC.DOUBLE_SIZE);
    commands.push(ESC.BOLD_ON);
    commands.push(ESC.text(`${this.getStoreName()}\n`));
    commands.push(ESC.text(`${this.getStoreTagline()}\n`));
    commands.push(ESC.BOLD_OFF);
    commands.push(ESC.NORMAL_SIZE);
    commands.push(ESC.LINE_FEED);

    // Store info
    commands.push(ESC.text(`${this.getStoreAddress()}\n`));
    commands.push(ESC.text(`Phone: ${this.getStorePhone()}\n`));

    // Add email if available
    if (this.settings?.email) {
      commands.push(ESC.text(`Email: ${this.settings.email}\n`));
    }

    commands.push(ESC.horizontalLine("-", paperWidth));

    // Order info
    commands.push(ESC.ALIGN_LEFT);
    commands.push(ESC.text(`Order ID: ${data.orderId}\n`));
    commands.push(ESC.text(`Date: ${this.formatDate()}\n`));
    if (data.customer?.name) {
      commands.push(ESC.text(`Customer: ${data.customer.name}\n`));
    }
    if (data.customer?.phone) {
      commands.push(ESC.text(`Phone: ${data.customer.phone}\n`));
    }
    commands.push(ESC.horizontalLine("-", paperWidth));

    // Column headers
    commands.push(ESC.BOLD_ON);
    commands.push(ESC.text(this.formatRow("Item", "Qty", "Price", "Total")));
    commands.push(ESC.BOLD_OFF);
    commands.push(ESC.horizontalLine("-", paperWidth));

    // Items
    data.items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      commands.push(ESC.text(`${item.name}\n`));
      commands.push(
        ESC.text(
          this.formatRow(
            item.selectedWeight || "",
            `x${item.quantity}`,
            this.formatCurrency(item.price),
            this.formatCurrency(itemTotal)
          )
        )
      );
    });

    commands.push(ESC.horizontalLine("-", paperWidth));

    // Totals
    commands.push(
      ESC.text(
        this.formatTotalRow("Subtotal:", this.formatCurrency(data.totals.subtotal))
      )
    );
    if (data.totals.discount > 0) {
      commands.push(
        ESC.text(
          this.formatTotalRow(
            "Discount:",
            `-${this.formatCurrency(data.totals.discount)}`
          )
        )
      );
    }

    // GST Section
    const gstCommands = this.buildGSTSection(data.totals);
    gstCommands.forEach((cmd) => commands.push(cmd));

    // Tax (if GST not enabled but tax exists)
    if (!this.settings?.gstEnabled && data.totals.tax > 0) {
      commands.push(
        ESC.text(
          this.formatTotalRow("Tax:", this.formatCurrency(data.totals.tax))
        )
      );
    }

    if (data.totals.delivery > 0) {
      commands.push(
        ESC.text(
          this.formatTotalRow("Delivery:", this.formatCurrency(data.totals.delivery))
        )
      );
    } else if (data.totals.delivery === 0 && data.totals.subtotal > 0) {
      commands.push(
        ESC.text(
          this.formatTotalRow("Delivery:", "Free")
        )
      );
    }

    commands.push(ESC.horizontalLine("-", paperWidth));
    commands.push(ESC.BOLD_ON);
    commands.push(ESC.DOUBLE_HEIGHT);
    commands.push(
      ESC.text(
        this.formatTotalRow("TOTAL:", this.formatCurrency(data.totals.total))
      )
    );
    commands.push(ESC.NORMAL_SIZE);
    commands.push(ESC.BOLD_OFF);

    commands.push(ESC.horizontalLine("-", paperWidth));

    // Payment method
    commands.push(ESC.text(`Payment: ${data.paymentMethod.toUpperCase()}\n`));
    commands.push(ESC.LINE_FEED);

    // UPI QR Code (if enabled and payment method allows)
    const upiCommands = this.buildUPIQRCode(data.totals.total, data.orderId);
    upiCommands.forEach((cmd) => commands.push(cmd));

    // Footer
    commands.push(ESC.ALIGN_CENTER);
    commands.push(ESC.text(`${this.getFooterMessage()}\n`));
    const footerSub = this.getFooterSubMessage();
    if (footerSub) {
      commands.push(ESC.text(`${footerSub}\n`));
    }
    commands.push(ESC.LINE_FEED);

    // Feed and cut
    commands.push(ESC.feedLines(3));
    commands.push(ESC.FEED_AND_CUT);

    return ESC.combine(...commands);
  }

  /**
   * Build invoice receipt
   */
  buildInvoice(data: InvoiceData): Uint8Array {
    const commands: Uint8Array[] = [];
    const paperWidth = this.getPaperWidth();

    commands.push(ESC.INIT);

    // Header
    commands.push(ESC.ALIGN_CENTER);
    commands.push(ESC.DOUBLE_SIZE);
    commands.push(ESC.BOLD_ON);
    commands.push(ESC.text(`${this.getStoreName()}\n`));
    commands.push(ESC.text("TAX INVOICE\n"));
    commands.push(ESC.BOLD_OFF);
    commands.push(ESC.NORMAL_SIZE);
    commands.push(ESC.LINE_FEED);

    commands.push(ESC.text(`${this.getStoreAddress()}\n`));
    commands.push(ESC.text(`Phone: ${this.getStorePhone()}\n`));

    // Add GSTIN for invoice
    if (this.settings?.gstin) {
      commands.push(ESC.text(`GSTIN: ${this.settings.gstin}\n`));
    }

    commands.push(ESC.horizontalLine("-", paperWidth));

    // Invoice details
    commands.push(ESC.ALIGN_LEFT);
    commands.push(ESC.text(`Invoice No: ${data.invoiceNumber}\n`));
    commands.push(ESC.text(`Date: ${data.date}\n`));

    if (data.customerInfo) {
      commands.push(ESC.horizontalLine("-", paperWidth));
      commands.push(ESC.BOLD_ON);
      commands.push(ESC.text("Bill To:\n"));
      commands.push(ESC.BOLD_OFF);
      commands.push(ESC.text(`${data.customerInfo.name}\n`));
      commands.push(ESC.text(`${data.customerInfo.address}\n`));
      commands.push(ESC.text(`Phone: ${data.customerInfo.phone}\n`));
    }

    commands.push(ESC.horizontalLine("-", paperWidth));

    // Items
    commands.push(ESC.BOLD_ON);
    commands.push(ESC.text(this.formatRow("Item", "Qty", "Rate", "Amount")));
    commands.push(ESC.BOLD_OFF);
    commands.push(ESC.horizontalLine("-", paperWidth));

    data.items.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      commands.push(ESC.text(`${item.name}\n`));
      commands.push(
        ESC.text(
          this.formatRow(
            "",
            `${item.quantity}`,
            this.formatCurrency(item.price),
            this.formatCurrency(itemTotal)
          )
        )
      );
    });

    commands.push(ESC.horizontalLine("-", paperWidth));

    // Totals
    commands.push(
      ESC.text(
        this.formatTotalRow("Subtotal:", this.formatCurrency(data.totals.subtotal))
      )
    );

    // GST breakdown for invoice
    if (this.settings?.gstEnabled && data.totals.gst > 0) {
      const gstRate = this.settings.gstRate || 5;
      const halfRate = gstRate / 2;
      const cgst = data.totals.gst / 2;
      const sgst = data.totals.gst / 2;

      const gstType = this.settings.gstDisplayType || "inclusive";
      if (gstType === "inclusive") {
        commands.push(ESC.text(`(GST ${gstRate}% Inclusive)\n`));
      } else {
        commands.push(ESC.text(`(GST ${gstRate}% Exclusive)\n`));
      }

      commands.push(
        ESC.text(
          this.formatTotalRow(`CGST (${halfRate}%):`, this.formatCurrency(cgst))
        )
      );
      commands.push(
        ESC.text(
          this.formatTotalRow(`SGST (${halfRate}%):`, this.formatCurrency(sgst))
        )
      );
    } else if (data.totals.gst > 0) {
      commands.push(
        ESC.text(
          this.formatTotalRow("GST:", this.formatCurrency(data.totals.gst))
        )
      );
    }

    commands.push(ESC.horizontalLine("-", paperWidth));
    commands.push(ESC.BOLD_ON);
    commands.push(
      ESC.text(
        this.formatTotalRow("TOTAL:", this.formatCurrency(data.totals.total))
      )
    );
    commands.push(ESC.BOLD_OFF);

    commands.push(ESC.LINE_FEED);
    commands.push(ESC.ALIGN_CENTER);
    commands.push(ESC.text(`${this.getFooterMessage()}\n`));

    commands.push(ESC.feedLines(3));
    commands.push(ESC.FEED_AND_CUT);

    return ESC.combine(...commands);
  }

  /**
   * Build barcode label
   */
  buildBarcode(data: BarcodeData): Uint8Array {
    const commands: Uint8Array[] = [];

    commands.push(ESC.INIT);
    commands.push(ESC.ALIGN_CENTER);

    // Product name if provided
    if (data.productName) {
      commands.push(ESC.text(`${data.productName}\n`));
    }

    // Product ID
    commands.push(ESC.text(`${data.productId}\n`));

    // Barcode
    commands.push(ESC.barcodeHeight(50));
    commands.push(ESC.barcodeWidth(2));
    commands.push(ESC.barcodeCODE128(data.productId));

    commands.push(ESC.feedLines(3));
    commands.push(ESC.FEED_AND_CUT);

    return ESC.combine(...commands);
  }
}

export default new ReceiptBuilder();
