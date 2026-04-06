export interface ExchangeRates {
  [key: string]: number;
}

export async function fetchExchangeRates(base: string = 'USD'): Promise<ExchangeRates> {
  try {
    const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    if (!response.ok) throw new Error('Failed to fetch rates');
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    // Fallback rates if API fails
    return {
      USD: 1,
      EUR: 0.92,
      SAR: 3.75,
      AED: 3.67,
      EGP: 47.50,
      GBP: 0.79,
      CNY: 7.23
    };
  }
}

export function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function convertAmount(amountStr: string, rates: ExchangeRates, targetCurrency: string): string {
  // Extract numeric value from string like "$1,200" or "1500 USD"
  const numericValue = parseFloat(amountStr.replace(/[^0-9.]/g, '')) || 0;
  
  // Assume base is USD if not specified (most logistics data is in USD)
  const rate = rates[targetCurrency] || 1;
  const converted = numericValue * rate;
  
  return formatCurrency(converted, targetCurrency);
}
