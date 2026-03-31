/**
 * ESC/POS Commands for thermal receipt printers
 * Supports standard ESC/POS protocol used by Epson, Star, and compatible printers
 */

export class ESCPOSCommands {
  // Initialize printer
  static readonly INIT = new Uint8Array([0x1b, 0x40]);

  // Text alignment
  static readonly ALIGN_LEFT = new Uint8Array([0x1b, 0x61, 0x00]);
  static readonly ALIGN_CENTER = new Uint8Array([0x1b, 0x61, 0x01]);
  static readonly ALIGN_RIGHT = new Uint8Array([0x1b, 0x61, 0x02]);

  // Text formatting
  static readonly BOLD_ON = new Uint8Array([0x1b, 0x45, 0x01]);
  static readonly BOLD_OFF = new Uint8Array([0x1b, 0x45, 0x00]);
  static readonly UNDERLINE_ON = new Uint8Array([0x1b, 0x2d, 0x01]);
  static readonly UNDERLINE_OFF = new Uint8Array([0x1b, 0x2d, 0x00]);

  // Text size
  static readonly NORMAL_SIZE = new Uint8Array([0x1d, 0x21, 0x00]);
  static readonly DOUBLE_HEIGHT = new Uint8Array([0x1d, 0x21, 0x01]);
  static readonly DOUBLE_WIDTH = new Uint8Array([0x1d, 0x21, 0x10]);
  static readonly DOUBLE_SIZE = new Uint8Array([0x1d, 0x21, 0x11]);

  // Line feed and cut
  static readonly LINE_FEED = new Uint8Array([0x0a]);
  static readonly FEED_AND_CUT = new Uint8Array([0x1d, 0x56, 0x41, 0x03]);
  static feedLines(n: number): Uint8Array {
    return new Uint8Array([0x1b, 0x64, n]);
  }

  // Horizontal line
  static horizontalLine(char = "-", width = 32): Uint8Array {
    const line = char.repeat(width) + "\n";
    return this.text(line);
  }

  // Barcode settings
  static barcodeHeight(h: number): Uint8Array {
    return new Uint8Array([0x1d, 0x68, h]);
  }

  static barcodeWidth(w: number): Uint8Array {
    return new Uint8Array([0x1d, 0x77, w]);
  }

  // Print CODE128 barcode
  static barcodeCODE128(data: string): Uint8Array {
    const dataBytes = new TextEncoder().encode(data);
    return new Uint8Array([
      0x1d,
      0x6b,
      73, // CODE128
      dataBytes.length,
      ...dataBytes,
    ]);
  }

  // QR Code commands
  static qrCode(data: string): {
    model: Uint8Array;
    size: Uint8Array;
    data: Uint8Array;
    print: Uint8Array;
  } {
    const dataBytes = new TextEncoder().encode(data);
    const sizeL = dataBytes.length % 256;
    const sizeH = Math.floor(dataBytes.length / 256);

    return {
      model: new Uint8Array([
        0x1d, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00,
      ]),
      size: new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06]),
      data: new Uint8Array([
        0x1d,
        0x28,
        0x6b,
        sizeL + 3,
        sizeH,
        0x31,
        0x50,
        0x30,
        ...dataBytes,
      ]),
      print: new Uint8Array([0x1d, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30]),
    };
  }

  // Text encoding
  static text(str: string): Uint8Array {
    return new TextEncoder().encode(str);
  }

  // Combine multiple commands
  static combine(...commands: Uint8Array[]): Uint8Array {
    const totalLength = commands.reduce((sum, cmd) => sum + cmd.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    commands.forEach((cmd) => {
      result.set(cmd, offset);
      offset += cmd.length;
    });

    return result;
  }
}
