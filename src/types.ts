import { ImportAnalysis, ShippingRates } from './services/gemini';

export interface SavedResult {
  id: string;
  product: string;
  country: string;
  analysis: ImportAnalysis;
  date: string;
  actualCosts?: { item: string, cost: string }[];
}

export type AppView = 'search' | 'saved' | 'constants' | 'calculator' | 'tracking' | 'settings' | 'hscode';

export interface Language {
  code: string;
  label: string;
  dir: 'rtl' | 'ltr';
}
