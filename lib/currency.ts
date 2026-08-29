// lib/currency.ts
// Static exchange rates — replace with live API integration later (already TODO'd)
export const EXCHANGE_RATES: Record<string, number> = {
  INR: 1,
  USD: 83.0,
  EUR: 90.0,
  GBP: 105.0,
};

export type CurrencyCode = keyof typeof EXCHANGE_RATES;

/**
 * Converts an amount from its source currency into a target base currency.
 * Rates are expressed as "1 unit of currency = X INR", so:
 *   amountInBase = amount * rate(from) / rate(to)
 */
export function convertCurrency(
  amount: number,
  from: string,
  to: string
): number {
  const fromRate = EXCHANGE_RATES[from] ?? 1;
  const toRate = EXCHANGE_RATES[to] ?? 1;
  return (amount * fromRate) / toRate;
}

/**
 * Sums a list of renewals (each with its own currency) into a single
 * total expressed in `baseCurrency`. Use this everywhere a total is
 * calculated — never sum raw `amount` fields across mixed currencies.
 */
export function sumInBaseCurrency<T extends { amount: number; currency: string }>(
  renewals: T[],
  baseCurrency: string
): number {
  return renewals.reduce(
    (total, r) => total + convertCurrency(r.amount, r.currency, baseCurrency),
    0
  );
}