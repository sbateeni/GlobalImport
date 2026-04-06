import { ImportAnalysis, ShippingRates, ContainerTrackingInfo } from './types';

export function isQuotaError(error: any): boolean {
  const errorStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
  return (
    error?.status === 'RESOURCE_EXHAUSTED' || 
    error?.code === 429 ||
    errorStr.includes('429') || 
    errorStr.includes('quota') ||
    errorStr.includes('RESOURCE_EXHAUSTED')
  );
}
