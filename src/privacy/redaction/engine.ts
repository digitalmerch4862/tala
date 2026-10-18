import type { GovIdSubType, PiiCategory, RedactedSpan, RedactionOptions, RedactionResult, TranscriptUtterance } from '../types/index.js';
import { isValidLuhn } from './luhn.js';
import { buildAddressRegex, PATTERNS } from './patterns.js';

interface RawMatch {
  start: number;
  end: number;
  category: PiiCategory;
  subType?: GovIdSubType | string;
  originalText: string;
}

export class RedactionEngine {
  private defaultOptions: RedactionOptions;

  constructor(options: RedactionOptions = {}) {
    this.defaultOptions = {
      categories: ['email', 'phone', 'credit_card', 'gov_id', 'address', 'custom_term'],
      replacementStrategy: 'token',
      validateCreditCardLuhn: true,
      caseSensitiveCustomTerms: false,
      ...options
    };
  }

  /**
   * Redacts PII from text and generates an audit report.
   */
  public redact(text: string, options: RedactionOptions = {}): RedactionResult {
    const startTime = performance.now();
    const effectiveOptions: RedactionOptions = {
      ...this.defaultOptions,
      ...options,
      categories: options.categories || this.defaultOptions.categories || ['email', 'phone', 'credit_card', 'gov_id', 'address', 'custom_term']
    };

    if (!text || typeof text !== 'string') {
      return {
        originalText: text || '',
        redactedText: text || '',
        spans: [],
        summary: {
          email: 0,
          phone: 0,
          credit_card: 0,
          gov_id: 0,
          address: 0,
          custom_term: 0
        },
        totalMatches: 0,
        durationMs: 0
      };
    }

    const categories = new Set(effectiveOptions.categories);
    const rawMatches: RawMatch[] = [];

    // 1. Custom Terms
    if (categories.has('custom_term') && effectiveOptions.customTerms && effectiveOptions.customTerms.length > 0) {
      for (const term of effectiveOptions.customTerms) {
        if (!term || term.trim() === '') continue;
        const flags = effectiveOptions.caseSensitiveCustomTerms ? 'g' : 'gi';
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, flags);
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          rawMatches.push({
            start: m.index,
            end: m.index + m[0].length,
            category: 'custom_term',
            originalText: m[0]
          });
        }
      }
    }

    // 2. Emails
    if (categories.has('email')) {
      const emailRegex = new RegExp(PATTERNS.email.source, PATTERNS.email.flags);
      let m: RegExpExecArray | null;
      while ((m = emailRegex.exec(text)) !== null) {
        rawMatches.push({
          start: m.index,
          end: m.index + m[0].length,
          category: 'email',
          originalText: m[0]
        });
      }
    }

    // 3. Government IDs
    if (categories.has('gov_id')) {
      const govPatterns: Array<{ subType: GovIdSubType; regex: RegExp }> = [
        { subType: 'ph_tin', regex: new RegExp(PATTERNS.govId.phTin.source, PATTERNS.govId.phTin.flags) },
        { subType: 'ph_sss', regex: new RegExp(PATTERNS.govId.phSss.source, PATTERNS.govId.phSss.flags) },
        { subType: 'ph_philhealth', regex: new RegExp(PATTERNS.govId.phPhilhealth.source, PATTERNS.govId.phPhilhealth.flags) },
        { subType: 'ph_pagibig', regex: new RegExp(PATTERNS.govId.phPagibig.source, PATTERNS.govId.phPagibig.flags) },
        { subType: 'ph_passport', regex: new RegExp(PATTERNS.govId.phPassport.source, PATTERNS.govId.phPassport.flags) },
        { subType: 'ph_national_id', regex: new RegExp(PATTERNS.govId.phNationalId.source, PATTERNS.govId.phNationalId.flags) },
        { subType: 'generic_ssn', regex: new RegExp(PATTERNS.govId.genericSsn.source, PATTERNS.govId.genericSsn.flags) }
      ];

      for (const { subType, regex } of govPatterns) {
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          // Extra validation: ensure it's not a generic sequence of zeros
          const digitsOnly = m[0].replace(/\D/g, '');
          if (/^0+$/.test(digitsOnly)) continue;

          rawMatches.push({
            start: m.index,
            end: m.index + m[0].length,
            category: 'gov_id',
            subType,
            originalText: m[0]
          });
        }
      }
    }

    // 4. Phone Numbers (PH Mobile, Landline, International)
    if (categories.has('phone')) {
      const phoneRegexes = [
        new RegExp(PATTERNS.phonePhMobile.source, PATTERNS.phonePhMobile.flags),
        new RegExp(PATTERNS.phoneInternational.source, PATTERNS.phoneInternational.flags),
        new RegExp(PATTERNS.phonePhLandline.source, PATTERNS.phonePhLandline.flags)
      ];

      for (const rx of phoneRegexes) {
        let m: RegExpExecArray | null;
        while ((m = rx.exec(text)) !== null) {
          const digits = m[0].replace(/\D/g, '');
          if (digits.length >= 7 && digits.length <= 15) {
            rawMatches.push({
              start: m.index,
              end: m.index + m[0].length,
              category: 'phone',
              originalText: m[0]
            });
          }
        }
      }
    }

    // 5. Credit Cards
    if (categories.has('credit_card')) {
      const cardRegex = new RegExp(PATTERNS.creditCardCandidate.source, PATTERNS.creditCardCandidate.flags);
      let m: RegExpExecArray | null;
      while ((m = cardRegex.exec(text)) !== null) {
        const candidate = m[0];
        const digits = candidate.replace(/\D/g, '');

        if (digits.length >= 13 && digits.length <= 19) {
          if (!effectiveOptions.validateCreditCardLuhn || isValidLuhn(digits)) {
            rawMatches.push({
              start: m.index,
              end: m.index + candidate.length,
              category: 'credit_card',
              originalText: candidate
            });
          }
        }
      }
    }

    // 6. Addresses
    if (categories.has('address')) {
      const addressRegex = buildAddressRegex(effectiveOptions.customAddressKeywords);
      let m: RegExpExecArray | null;
      while ((m = addressRegex.exec(text)) !== null) {
        rawMatches.push({
          start: m.index,
          end: m.index + m[0].length,
          category: 'address',
          originalText: m[0]
        });
      }
    }

    // Filter against whitelist
    const whitelist = (effectiveOptions.whitelist || []).map(w => w.toLowerCase());
    const filteredMatches = rawMatches.filter(match => {
      const lower = match.originalText.toLowerCase();
      return !whitelist.some(w => lower.includes(w));
    });

    // Resolve overlaps: sort by start ascending, then length descending
    filteredMatches.sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return (b.end - b.start) - (a.end - a.start);
    });

    const nonOverlapping: RawMatch[] = [];
    let lastEnd = -1;

    for (const match of filteredMatches) {
      if (match.start >= lastEnd) {
        nonOverlapping.push(match);
        lastEnd = match.end;
      }
    }

    // Generate replacement tokens and compose redacted text
    const summary: Record<PiiCategory, number> = {
      email: 0,
      phone: 0,
      credit_card: 0,
      gov_id: 0,
      address: 0,
      custom_term: 0
    };

    const spans: RedactedSpan[] = [];
    let result = '';
    let cursor = 0;

    for (const match of nonOverlapping) {
      result += text.slice(cursor, match.start);

      const replacement = this.formatReplacement(
        match.category,
        match.originalText,
        effectiveOptions,
        match.subType
      );

      result += replacement;
      cursor = match.end;

      summary[match.category]++;
      spans.push({
        start: match.start,
        end: match.end,
        category: match.category,
        subType: match.subType,
        originalText: match.originalText,
        replacement
      });
    }

    result += text.slice(cursor);

    const totalMatches = spans.length;
    const durationMs = Math.round((performance.now() - startTime) * 100) / 100;

    return {
      originalText: text,
      redactedText: result,
      spans,
      summary,
      totalMatches,
      durationMs
    };
  }

  /**
   * Helper to redact structured transcript utterances.
   */
  public redactTranscript(
    utterances: TranscriptUtterance[],
    options: RedactionOptions = {}
  ): { utterances: TranscriptUtterance[]; report: RedactionResult } {
    const combinedOriginal = utterances.map(u => u.text).join('\n');
    const combinedReport = this.redact(combinedOriginal, options);

    const redactedUtterances = utterances.map(u => {
      const red = this.redact(u.text, options);
      return {
        ...u,
        text: red.redactedText
      };
    });

    return {
      utterances: redactedUtterances,
      report: combinedReport
    };
  }

  private formatReplacement(
    category: PiiCategory,
    originalText: string,
    options: RedactionOptions,
    subType?: string
  ): string {
    if (options.replacementStrategy === 'custom' && options.customReplacer) {
      return options.customReplacer(category, originalText, subType);
    }

    if (options.replacementStrategy === 'mask') {
      return '[REDACTED]';
    }

    // Default 'token' format
    switch (category) {
      case 'email':
        return '[REDACTED_EMAIL]';
      case 'phone':
        return '[REDACTED_PHONE]';
      case 'credit_card':
        return '[REDACTED_CARD]';
      case 'gov_id':
        return subType ? `[REDACTED_GOV_ID: ${subType.toUpperCase()}]` : '[REDACTED_GOV_ID]';
      case 'address':
        return '[REDACTED_ADDRESS]';
      case 'custom_term':
        return '[REDACTED_TERM]';
      default:
        return '[REDACTED]';
    }
  }
}

// Global convenience function
const defaultEngine = new RedactionEngine();

export function redactText(text: string, options?: RedactionOptions): RedactionResult {
  return defaultEngine.redact(text, options);
}

export function redactTranscript(
  utterances: TranscriptUtterance[],
  options?: RedactionOptions
): { utterances: TranscriptUtterance[]; report: RedactionResult } {
  return defaultEngine.redactTranscript(utterances, options);
}
