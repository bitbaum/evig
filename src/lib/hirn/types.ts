/**
 * Global TypeScript type definitions
 */

export type NumberFormat = 'CHF' | 'percent' | 'number';

export type SourceType = 'source' | 'derived' | 'estimated' | 'target';

import type { ConfidenceLevel } from './data/methodology-ssot';
export type { ConfidenceLevel };

export interface NumberSource {
  id: string;
  name: string;
  category: string;
  dimension: string;
  format: NumberFormat;
  source: {
    type: SourceType;
    confidence: ConfidenceLevel;
    path?: string;
    account?: string;
    lastUpdated?: string;
  };
  formula?: {
    type: string;
    expression: string;
    dependencies?: string[];
  };
  validation?: {
    min?: number;
    max?: number;
    rules?: string[];
  };
  documentation: {
    description: string;
    whyItMatters?: string;
    limitations?: string[];
  };
}

export interface FinancialData {
  year: number;
  month: string;
  total: number;
  warenverkauf: number;
  dienstleistungen: number;
  integration: number;
  spenden: number;
  aufstockung: number;
}

export interface KPIData {
  id: string;
  name: string;
  value: number;
  target?: number;
  unit: string;
  category: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'good' | 'warning' | 'danger';
}
