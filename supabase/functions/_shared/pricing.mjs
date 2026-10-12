export const PRICING_VERSION = 'quote_plus_12_percent_v1';
export const FEE_BASIS_POINTS = 1200;
export const MAX_STRIPE_AMOUNT_CENTS = 99_999_999;

function integer(value, name, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`INVALID_${name}`);
  return value;
}

export function dollarsToCents(value) {
  const text = typeof value === 'number' && Number.isFinite(value) ? String(value) : value;
  if (typeof text !== 'string' || !/^\d+(?:\.\d{1,2})?$/.test(text)) throw new Error('INVALID_QUOTE_AMOUNT');
  const [whole, fraction = ''] = text.split('.');
  const cents = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (cents < 1n || cents > BigInt(MAX_STRIPE_AMOUNT_CENTS)) throw new Error('INVALID_QUOTE_AMOUNT');
  return Number(cents);
}

export function priceQuoteCents(quoteCents) {
  integer(quoteCents, 'QUOTE_AMOUNT', 1);
  const fee = Number((BigInt(quoteCents) * 12n + 50n) / 100n);
  const total = quoteCents + fee;
  if (total > MAX_STRIPE_AMOUNT_CENTS) throw new Error('CUSTOMER_TOTAL_TOO_LARGE');
  return Object.freeze({
    pricing_version: PRICING_VERSION, currency: 'usd', quote_cents: quoteCents,
    professional_gross_cents: quoteCents, platform_fee_cents: fee, customer_total_cents: total,
  });
}

export function priceQuote(value) { return priceQuoteCents(dollarsToCents(value)); }

export function validatePricingSnapshot(snapshot) {
  if (!snapshot || snapshot.pricing_version !== PRICING_VERSION || snapshot.currency !== 'usd')
    throw new Error('INVALID_PRICING_VERSION');
  const expected = priceQuoteCents(snapshot.quote_cents);
  for (const key of ['professional_gross_cents','platform_fee_cents','customer_total_cents']) {
    if (snapshot[key] !== expected[key]) throw new Error('PAYMENT_ALLOCATION_MISMATCH');
  }
  return expected;
}

// The caller must supply an approved allocation. This helper chooses no refund policy.
export function refundAllocation(payment, professionalCents, feeCents) {
  validatePricingSnapshot(payment);
  integer(professionalCents, 'PROFESSIONAL_REFUND');integer(feeCents, 'FEE_REFUND');
  const previousProfessional = integer(payment.professional_refunded_cents ?? 0, 'PREVIOUS_PROFESSIONAL_REFUND');
  const previousFee = integer(payment.platform_fee_refunded_cents ?? 0, 'PREVIOUS_FEE_REFUND');
  if (professionalCents + feeCents < 1
    || previousProfessional + professionalCents > payment.professional_gross_cents
    || previousFee + feeCents > payment.platform_fee_cents) throw new Error('REFUND_EXCEEDS_ALLOCATION');
  return Object.freeze({ professional_refund_cents: professionalCents, platform_fee_refund_cents: feeCents,
    customer_refund_cents: professionalCents + feeCents });
}

export function remainingProfessionalCents(payment) {
  validatePricingSnapshot(payment);
  const refunded = integer(payment.professional_refunded_cents ?? 0, 'PROFESSIONAL_REFUND');
  if (refunded > payment.professional_gross_cents) throw new Error('REFUND_EXCEEDS_ALLOCATION');
  return payment.professional_gross_cents - refunded;
}

export function formatUsd(cents) {
  integer(cents, 'DISPLAY_AMOUNT');
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}
