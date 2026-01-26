/**
 * Generate QR code for coupon code
 * Returns base64 encoded QR code image
 */
const QRCode = require('qrcode');

const generateQRCode = async (couponCode) => {
  try {
    // Generate QR code as data URL (base64)
    const qrCodeDataUrl = await QRCode.toDataURL(couponCode, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

module.exports = { generateQRCode };

