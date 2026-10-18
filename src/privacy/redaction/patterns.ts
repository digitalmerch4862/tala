import type { GovIdSubType } from '../types/pii.js';

export const PATTERNS = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi,

  // Philippine Mobile: +63 9xx, 09xx, 639xx
  phonePhMobile: /(?:(?:\+?63|0)[\s.-]?)9\d{2}[\s.-]?\d{3}[\s.-]?\d{4}\b/g,

  // Philippine Landline: (02) 8xxx-xxxx, +63 2 8xxx-xxxx
  phonePhLandline: /(?:(?:\+?63|0)[\s.-]?)?(?:\(?0?[2-8]\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}\b/g,

  // International general phone numbers: e.g. +1 (555) 123-4567, +44 20 7946 0958
  phoneInternational: /\+(?:[1-9]\d{0,2})[\s.-]?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g,

  // Potential card-like digits (13-19 digits formatted or raw)
  creditCardCandidate: /\b(?:\d[ -]*?){13,19}\b/g,

  // Government IDs
  govId: {
    // PH SSS: 2 digits - 7 digits - 1 check digit (e.g., 34-1234567-8)
    phSss: /\b\d{2}[ -]?\d{7}[ -]?\d{1}\b/g,

    // PH PhilHealth: 2 digits - 9 digits - 1 digit (e.g., 12-345678901-2)
    phPhilhealth: /\b\d{2}[ -]?\d{9}[ -]?\d{1}\b/g,

    // PH Pag-IBIG (MID): 12 digits, typically formatted as 4-4-4 (e.g., 1234-5678-9012)
    phPagibig: /\b\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,

    // PH Tax Identification Number (TIN): 9 or 12 digits (e.g., 123-456-789 or 123-456-789-000)
    phTin: /\b\d{3}[ -]?\d{3}[ -]?\d{3}(?:[ -]?\d{3})?\b/g,

    // PH Passport: 1 letter + 7 digits + 1 letter, or 2 letters + 7 digits (e.g., P1234567A, EC1234567)
    phPassport: /\b(?:[A-Z]\d{7}[A-Z]|[A-Z]{2}\d{7})\b/g,

    // PH PhilSys National ID (PCN): 16 digits, 4-4-4-4 format
    phNationalId: /\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b/g,

    // Generic US Social Security Number: 3-2-4 digits
    genericSsn: /\b\d{3}[ -]\d{2}[ -]\d{4}\b/g
  }
};

export const DEFAULT_ADDRESS_KEYWORDS = [
  'street', 'st.', 'st', 'avenue', 'ave.', 'ave', 'boulevard', 'blvd.', 'blvd',
  'road', 'rd.', 'rd', 'highway', 'hwy', 'drive', 'dr.', 'dr', 'lane', 'ln.', 'ln',
  'barangay', 'brgy.', 'brgy', 'bgy.', 'subdivision', 'subd.', 'subd',
  'village', 'compound', 'poblacion', 'district',
  'building', 'bldg.', 'bldg', 'tower', 'condominium', 'condo',
  'unit', 'room', 'rm.', 'floor', 'flr.', 'blk', 'block', 'lot',
  'city', 'municipality', 'province', 'metro manila', 'zip code'
];

/**
 * Builds a regex that detects street/address structures anchored on location keywords.
 */
export function buildAddressRegex(additionalKeywords: string[] = []): RegExp {
  const allKeywords = Array.from(new Set([...DEFAULT_ADDRESS_KEYWORDS, ...additionalKeywords.map(k => k.toLowerCase())]));
  const escaped = allKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');

  // Matches patterns like:
  // "Unit 1204, Tower 2, Horizon Condominium, Ayala Avenue, Makati City"
  // "Block 5 Lot 12, Mahogany Street, San Lorenzo Village, Makati"
  // "123 Mabini St., Brgy. San Antonio, Pasig City"
  return new RegExp(
    `\\b(?:(?:unit|lot|block|blk|flr|floor|rm|room)\\s+\\d+[\\w\\s,-]*)?(?:\\d{1,5}\\s+)?(?:[A-Z0-9][a-zA-Z0-9.'-]+[\\s,.-]+){1,6}(?:${escaped})(?:[\\s,.-]+[A-Za-z0-9.'-]+){1,6}\\b`,
    'gi'
  );
}
