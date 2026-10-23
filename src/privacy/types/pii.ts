export type PiiCategory = 
  | 'email'
  | 'phone'
  | 'credit_card'
  | 'gov_id'
  | 'address'
  | 'custom_term';

export type GovIdSubType = 
  | 'ph_tin'
  | 'ph_sss'
  | 'ph_philhealth'
  | 'ph_pagibig'
  | 'ph_passport'
  | 'ph_national_id'
  | 'generic_ssn';

export interface RedactedSpan {
  start: number;
  end: number;
  category: PiiCategory;
  subType?: GovIdSubType | string;
  originalText: string;
  replacement: string;
}

export interface RedactionResult {
  originalText: string;
  redactedText: string;
  spans: RedactedSpan[];
  summary: Record<PiiCategory, number>;
  totalMatches: number;
  durationMs: number;
}

export type ReplacementStrategy = 
  | 'token'   // e.g. [REDACTED_EMAIL]
  | 'mask'    // e.g. [REDACTED] or *******
  | 'custom'; // Custom replacer function

export interface RedactionOptions {
  /** Which PII categories to inspect. Defaults to all */
  categories?: PiiCategory[];
  /** Custom proprietary terms/names to redact */
  customTerms?: string[];
  /** Case sensitivity for custom terms. Defaults to false */
  caseSensitiveCustomTerms?: boolean;
  /** Replacement strategy. Defaults to 'token' */
  replacementStrategy?: ReplacementStrategy;
  /** Custom replacer function if replacementStrategy is 'custom' */
  customReplacer?: (category: PiiCategory, originalText: string, subType?: string) => string;
  /** Additional custom address trigger keywords */
  customAddressKeywords?: string[];
  /** Whitelisted terms that should never be redacted */
  whitelist?: string[];
  /** Whether to strictly validate credit cards using Luhn algorithm. Defaults to true */
  validateCreditCardLuhn?: boolean;
}
