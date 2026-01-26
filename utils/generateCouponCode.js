/**
 * Generate a unique coupon code
 * Format: COUPON-XXXX-XXXX-XXXX (alphanumeric)
 */
const generateCouponCode = () => {
  const chars = '0123456789ABCDEF';
  const segments = [];
  
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }
  
  return `COUPON-${segments.join('-')}`;
};

module.exports = generateCouponCode;

