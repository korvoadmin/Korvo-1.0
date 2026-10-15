import { FEE_BASIS_POINTS, MAX_STRIPE_AMOUNT_CENTS } from './pricing.mjs';

export const GIG_PRICING_VERSION = 'worker_gross_plus_12_percent_v1';
const classifications = new Set(['unreviewed', 'potential_employee', 'independent_contractor', 'employee']);
function whole(value, name, minimum = 0) {
  if (!Number.isSafeInteger(value) || value < minimum) throw new Error(`INVALID_${name}`);
  return value;
}
function rounded(numerator, denominator) { return (numerator + denominator / 2n) / denominator; }
function cents(value) {
  if (value > BigInt(MAX_STRIPE_AMOUNT_CENTS)) throw new Error('GIG_AMOUNT_TOO_LARGE');
  return Number(value);
}

// Pure calculation only. The server must authenticate and authorize time/payroll
// attestations before calling this function; browser flags confer no authority.
export function priceGig(input) {
  if (!input || !classifications.has(input.classification)) throw new Error('CLASSIFICATION_REQUIRED');
  if (!['estimate', 'reconciled'].includes(input.stage)) throw new Error('INVALID_PRICING_STAGE');
  let base;
  if (input.compensation_type === 'hourly') {
    const rate = whole(input.hourly_rate_cents, 'HOURLY_RATE', 1);
    const seconds = input.stage === 'estimate' ? input.estimated_payable_seconds : input.time_record?.payable_seconds;
    whole(seconds, 'PAYABLE_SECONDS');
    if (input.stage === 'reconciled' && (!input.time_record?.verified_by || !input.time_record?.id))
      throw new Error('VERIFIED_PAYABLE_TIME_REQUIRED');
    base = cents(rounded(BigInt(rate) * BigInt(seconds), 3600n));
  } else if (input.compensation_type === 'fixed') {
    base = whole(input.fixed_gross_cents, 'FIXED_COMPENSATION', 1);
  } else throw new Error('INVALID_COMPENSATION_TYPE');
  const employee = input.classification !== 'independent_contractor';
  if (input.stage === 'reconciled' && input.classification === 'unreviewed') throw new Error('CLASSIFICATION_REVIEW_REQUIRED');
  let gross = base;
  if (employee && input.stage === 'reconciled') {
    const payroll = input.payroll_record;
    if (!payroll?.id || !payroll?.verified_by || payroll.workweek_reviewed !== true)
      throw new Error('VERIFIED_PAYROLL_REQUIRED');
    gross = whole(payroll.gross_compensation_cents, 'PAYROLL_GROSS');
    if (gross < base) throw new Error('PAYROLL_BELOW_AGREED_COMPENSATION');
  }
  const tips = whole(input.worker_tips_cents ?? 0, 'WORKER_TIPS');
  const fee = cents(rounded(BigInt(gross) * BigInt(FEE_BASIS_POINTS), 10_000n));
  let businessCosts = 0n;
  const unresolved = [];
  const costs = input.other_costs ?? [];
  if (!Array.isArray(costs)) throw new Error('INVALID_OTHER_COSTS');
  const codes = new Set();
  for (const cost of costs) {
    if (!cost || typeof cost.code !== 'string' || !cost.code.trim()) throw new Error('INVALID_COST_CODE');
    if (codes.has(cost.code)) throw new Error('DUPLICATE_COST_CODE');
    codes.add(cost.code);
    if (!['business', 'platform', 'unresolved'].includes(cost.payer)) throw new Error('UNAPPROVED_COST_PAYER');
    if (cost.amount_cents != null) whole(cost.amount_cents, 'OTHER_COST');
    if (cost.payer === 'unresolved' || cost.amount_cents == null) unresolved.push(cost.code);
    else if (cost.payer === 'business') businessCosts += BigInt(cost.amount_cents);
  }
  // These owner decisions cannot default to zero or be silently deducted.
  if (!costs.some(c => c.code === 'processing')) unresolved.push('processing');
  if (employee && !costs.some(c => c.code === 'employer_payroll')) unresolved.push('employer_payroll');
  const subtotal = cents(BigInt(gross) + BigInt(fee));
  const knownTotal = cents(BigInt(subtotal) + BigInt(tips) + businessCosts);
  return Object.freeze({
    pricing_version: GIG_PRICING_VERSION, currency: 'usd', stage: input.stage,
    agreed_base_compensation_cents: base, worker_gross_compensation_cents: gross,
    worker_tips_cents: tips, platform_fee_cents: fee,
    compensation_and_fee_cents: subtotal, known_business_costs_cents: cents(businessCosts),
    known_business_total_cents: knownTotal,
    unresolved_costs: Object.freeze([...new Set(unresolved)]),
    final_business_total_cents: unresolved.length ? null : knownTotal,
    payment_execution_enabled: false,
    payment_route: employee ? 'payroll_required' : 'contractor_review_required',
    payroll_review_required: employee,
  });
}

// No approved employee can be converted to a contractor payment by enabling a flag.
export function contractorGigPaymentEligibility({ classification, review_id, category_approved, bookings_enabled }) {
  return Object.freeze({
    eligible_for_future_contractor_route: classification === 'independent_contractor'
      && typeof review_id === 'string' && review_id.length > 0 && category_approved === true && bookings_enabled === true,
    execution_enabled: false,
  });
}

// Sum independently rounded worker allocations; never reduce one worker's gross
// to balance a roster. This creates no charge or payroll instruction.
export function priceGigRoster(inputs) {
  if (!Array.isArray(inputs) || inputs.length<1 || inputs.length>100) throw new Error('INVALID_WORKER_ROSTER');
  const workers=inputs.map(priceGig);
  const sum=key=>cents(workers.reduce((n,p)=>n+BigInt(p[key]),0n));
  const unresolved=[...new Set(workers.flatMap(p=>p.unresolved_costs))];
  return Object.freeze({worker_count:workers.length,workers:Object.freeze(workers),
    worker_gross_compensation_cents:sum('worker_gross_compensation_cents'),
    worker_tips_cents:sum('worker_tips_cents'),platform_fee_cents:sum('platform_fee_cents'),
    compensation_and_fee_cents:sum('compensation_and_fee_cents'),known_business_total_cents:sum('known_business_total_cents'),
    final_business_total_cents:unresolved.length?null:sum('known_business_total_cents'),
    unresolved_costs:Object.freeze(unresolved),payment_execution_enabled:false});
}
