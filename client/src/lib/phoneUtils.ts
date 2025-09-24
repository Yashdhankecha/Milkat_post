/**
 * Phone number utilities for consistent handling across the app
 */

export const normalizePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Handle Indian numbers specifically
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    // Already has country code, keep as is
    return cleaned;
  } else if (cleaned.length === 10) {
    // Add Indian country code
    return `91${cleaned}`;
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    // Remove leading 0 and add country code
    return `91${cleaned.substring(1)}`;
  }
  
  return cleaned;
};

export const formatPhoneForDisplay = (phone: string): string => {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.startsWith('91') && normalized.length === 12) {
    return `+91 ${normalized.substring(2, 7)} ${normalized.substring(7)}`;
  }
  return phone;
};

export const formatPhoneForAuth = (phone: string): string => {
  const normalized = normalizePhoneNumber(phone);
  return `+${normalized}`;
};

export const getPhoneVariations = (phone: string): string[] => {
  const normalized = normalizePhoneNumber(phone);
  const withoutCountryCode = normalized.startsWith('91') ? normalized.substring(2) : normalized;
  
  return [
    normalized,
    withoutCountryCode,
    `+${normalized}`,
    `+91${withoutCountryCode}`,
    phone // Original input
  ];
};
