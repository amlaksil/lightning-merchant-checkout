import {
  getCoinbaseExchangeRateUrl,
  getFxCacheTtlSeconds,
  getManualEtbPerBtcRate,
} from "@/config/env";
import { ExchangeRateQuote, PricingCurrency } from "@/types/checkout";

const SATS_PER_BTC = 100_000_000;
const REQUEST_TIMEOUT_MS = 5_000;

let cachedQuote: ExchangeRateQuote | null = null;
let cachedAtMs = 0;

const assertPositiveAmount = (amount: number, fieldName: string) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error(`${fieldName} must be a positive number`);
  }
};

const roundToTwoDecimals = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const buildQuote = (
  btcEtbRate: number,
  source: ExchangeRateQuote["source"],
  fetchedAt: string
): ExchangeRateQuote => ({
  btcEtbRate,
  satsPerEtb: SATS_PER_BTC / btcEtbRate,
  source,
  fetchedAt,
});

const parseCoinbaseRate = (payload: unknown) => {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("data" in payload) ||
    !payload.data ||
    typeof payload.data !== "object" ||
    !("rates" in payload.data) ||
    !payload.data.rates ||
    typeof payload.data.rates !== "object" ||
    !("ETB" in payload.data.rates)
  ) {
    throw new Error("Coinbase response did not include a BTC/ETB rate");
  }

  const rawRate = payload.data.rates.ETB;
  const parsedRate = Number(rawRate);

  if (!Number.isFinite(parsedRate) || parsedRate <= 0) {
    throw new Error("Coinbase returned an invalid BTC/ETB rate");
  }

  return parsedRate;
};

const fetchCoinbaseQuote = async (): Promise<ExchangeRateQuote> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(getCoinbaseExchangeRateUrl(), {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(
        `Coinbase exchange-rate request failed with ${response.status}`
      );
    }

    const payload = (await response.json()) as unknown;
    const btcEtbRate = parseCoinbaseRate(payload);

    return buildQuote(btcEtbRate, "coinbase", new Date().toISOString());
  } finally {
    clearTimeout(timeout);
  }
};

const getManualQuote = (): ExchangeRateQuote => {
  const manualRate = getManualEtbPerBtcRate();

  if (!manualRate) {
    throw new Error(
      "Manual ETB/BTC fallback is not configured. Set MANUAL_ETB_PER_BTC."
    );
  }

  return buildQuote(manualRate, "manual", new Date().toISOString());
};

export const getBtcEtbQuote = async (
  options: { forceRefresh?: boolean } = {}
): Promise<ExchangeRateQuote> => {
  const ttlMs = getFxCacheTtlSeconds() * 1000;

  if (
    !options.forceRefresh &&
    cachedQuote &&
    Date.now() - cachedAtMs < ttlMs
  ) {
    return cachedQuote;
  }

  try {
    const quote = await fetchCoinbaseQuote();
    cachedQuote = quote;
    cachedAtMs = Date.now();
    return quote;
  } catch (error) {
    console.warn("Falling back to manual BTC/ETB rate:", error);
    const quote = getManualQuote();
    cachedQuote = quote;
    cachedAtMs = Date.now();
    return quote;
  }
};

export const convertDisplayAmountToSats = async (
  displayAmount: number,
  displayCurrency: PricingCurrency
) => {
  assertPositiveAmount(displayAmount, "displayAmount");

  const quote = await getBtcEtbQuote();

  if (displayCurrency === "SAT") {
    const amountSats = Math.round(displayAmount);
    assertPositiveAmount(amountSats, "amountSats");

    return {
      amountSats,
      normalizedDisplayAmount: amountSats,
      quote,
    };
  }

  const amountSats = Math.ceil((displayAmount / quote.btcEtbRate) * SATS_PER_BTC);
  assertPositiveAmount(amountSats, "amountSats");

  return {
    amountSats,
    normalizedDisplayAmount: roundToTwoDecimals(displayAmount),
    quote,
  };
};

export const convertSatsToEtb = async (amountSats: number) => {
  assertPositiveAmount(amountSats, "amountSats");

  const quote = await getBtcEtbQuote();
  const displayAmount = roundToTwoDecimals(
    (amountSats / SATS_PER_BTC) * quote.btcEtbRate
  );

  return {
    displayAmount,
    quote,
  };
};
