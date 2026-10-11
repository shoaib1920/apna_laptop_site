// Pakistani mobile numbers in any common format -> "923001234567".
// Returns null when the number is not a valid Pakistani mobile number.
// The result ("phone key") identifies a customer for order limits, loyalty
// points and abandoned carts.
export const toPhoneKey = (phone: string): string | null => {
  let digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('0092')) digits = digits.slice(2);
  if (digits.startsWith('92')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return /^3\d{9}$/.test(digits) ? `92${digits}` : null;
};

export const PHONE_HINT = 'Please enter a valid Pakistani mobile number, e.g. 0300 1234567';
