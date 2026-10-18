import type { RetentionPolicy } from '../types/retention.js';

export const ZERO_DAY_POLICY: RetentionPolicy = {
  id: 'policy-zero-day',
  name: 'Zero-Day Ephemeral',
  type: 'zero_day',
  description: 'Purge meeting assets immediately once meeting has concluded and notes are finalized.'
};

export const DAYS_7_POLICY: RetentionPolicy = {
  id: 'policy-7d',
  name: '7-Day Retention',
  type: 'fixed_days',
  days: 7,
  description: 'Retain meeting assets for 7 calendar days before automated purge.'
};

export const DAYS_30_POLICY: RetentionPolicy = {
  id: 'policy-30d',
  name: '30-Day Retention',
  type: 'fixed_days',
  days: 30,
  description: 'Standard 30-day operational retention window.'
};

export const DAYS_90_POLICY: RetentionPolicy = {
  id: 'policy-90d',
  name: '90-Day Retention',
  type: 'fixed_days',
  days: 90,
  description: 'Quarterly 90-day retention policy.'
};

export const DAYS_365_POLICY: RetentionPolicy = {
  id: 'policy-1y',
  name: '1-Year Retention',
  type: 'fixed_days',
  days: 365,
  description: 'Annual corporate compliance retention window.'
};

export const INDEFINITE_POLICY: RetentionPolicy = {
  id: 'policy-indefinite',
  name: 'Indefinite Retention',
  type: 'indefinite',
  description: 'Retain indefinitely until explicitly removed by owner.'
};

export const LEGAL_HOLD_POLICY: RetentionPolicy = {
  id: 'policy-legal-hold',
  name: 'Legal Hold Freeze',
  type: 'legal_hold',
  description: 'Absolute freeze preventing any automated or scheduled purge.'
};

export const DEFAULT_GLOBAL_POLICY: RetentionPolicy = DAYS_90_POLICY;
