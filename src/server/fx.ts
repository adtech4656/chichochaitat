import { store } from './store.js';

export async function refreshExchangeRates(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch('https://open.er-api.com/v6/latest/XOF', {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      console.warn(`FX provider returned HTTP ${res.status}`);
      return false;
    }

    const data: any = await res.json();
    if (data && data.rates) {
      const currencies = ['USD', 'EUR', 'NGN', 'GHS', 'GBP', 'CAD'];
      for (const code of currencies) {
        if (typeof data.rates[code] === 'number' && data.rates[code] > 0) {
          store.updateCurrencyRate(code, data.rates[code]);
        }
      }
      return true;
    }
  } catch (err: any) {
    console.warn('Live FX rate refresh skipped:', err.message || err);
  }
  return false;
}

export function startFxService() {
  // Initial refresh
  refreshExchangeRates();

  // Run every 1 hour
  const interval = setInterval(refreshExchangeRates, 60 * 60 * 1000);
  interval.unref(); // Won't hold Node process open on exit
}
