export const isValidUPIId = (upiId: string): boolean => {
    if (!upiId) return false;
    const upiPattern = /^[a-zA-Z0-9._\-]+@[a-zA-Z0-9]+$/;
    return upiPattern.test(upiId);
};

export const generateUPIQRData = (upiId: string, merchantName: string, amount?: number): string => {
    let qr = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}`;
    if (amount) qr += `&am=${amount}`;
    return qr;
};
