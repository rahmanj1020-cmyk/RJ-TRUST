/**
 * Phone Number Normalization and Lookup Utilities for RJ TRUST
 * Handles Bangladeshi phone formats, Bengali numerals, country codes (+880, 880),
 * spaces, dashes, and account ID lookups.
 */

// Mapping from Bengali numerals to standard ASCII digits
const BENGALI_TO_ASCII: Record<string, string> = {
  '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
  '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
};

/**
 * Normalizes any Bangladeshi phone number to standard 11 digits (e.g. 01712345678)
 */
export function normalizePhoneNumber(input: string | number | undefined | null): string {
  if (!input) return '';
  let str = String(input).trim();
  
  // Convert Bengali numerals
  str = str.replace(/[০-৯]/g, (char) => BENGALI_TO_ASCII[char] || char);
  
  // Strip all non-digit characters (+, -, spaces, parentheses, etc.)
  let digits = str.replace(/\D/g, '');
  
  // Handle country code +880 or 880
  if (digits.startsWith('8801') && digits.length >= 13) {
    digits = digits.substring(2); // '88017...' -> '017...'
  } else if (digits.startsWith('880') && digits.length === 13) {
    digits = digits.substring(2);
  } else if (digits.startsWith('88') && digits.length >= 13) {
    digits = digits.substring(2);
  } else if (digits.startsWith('1') && digits.length === 10) {
    // Missing leading zero: '17XXXXXXXX' -> '017XXXXXXXX'
    digits = '0' + digits;
  }
  
  return digits;
}

/**
 * Returns an array of search keys/variants to check when looking up a user
 */
export function getLookupKeys(input: string): string[] {
  if (!input) return [];
  const raw = input.trim();
  const normalized = normalizePhoneNumber(raw);
  const keys = new Set<string>();

  if (raw) {
    keys.add(raw);
    keys.add(raw.toLowerCase());
  }
  if (normalized) {
    keys.add(normalized);
    keys.add('+88' + normalized);
    keys.add('88' + normalized);
    if (normalized.startsWith('0')) {
      keys.add(normalized.substring(1)); // '17XXXXXXXX'
      keys.add('+880' + normalized.substring(1));
      keys.add('880' + normalized.substring(1));
    }
  }

  return Array.from(keys);
}

/**
 * Matches two phone numbers or identifiers considering normalization, leading zeroes, and suffixes
 */
export function isPhoneMatch(phoneA: string | undefined | null, phoneB: string | undefined | null): boolean {
  if (!phoneA || !phoneB) return false;
  const cleanA = String(phoneA).trim();
  const cleanB = String(phoneB).trim();
  
  if (cleanA === cleanB || cleanA.toLowerCase() === cleanB.toLowerCase()) {
    return true;
  }
  
  const normA = normalizePhoneNumber(cleanA);
  const normB = normalizePhoneNumber(cleanB);
  
  if (normA && normB && normA === normB) {
    return true;
  }
  
  // Last 10 digits match (standard Bangladeshi mobile number without leading 0)
  if (normA.length >= 10 && normB.length >= 10) {
    if (normA.slice(-10) === normB.slice(-10)) {
      return true;
    }
  }
  
  return false;
}
