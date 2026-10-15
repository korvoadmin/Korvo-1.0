import test from 'node:test';
import assert from 'node:assert/strict';
import { priceQuote, priceQuoteCents, validatePricingSnapshot, refundAllocation,
  remainingProfessionalCents, dollarsToCents, formatUsd } from '../supabase/functions/_shared/pricing.mjs';

for (const [quote, fee, total] of [[100,1200,11200],[500,6000,56000],[1000,12000,112000]]) {
  test(`$${quote}: customer pays quote + 12%; professional keeps full quote`, () => {
    const p=priceQuote(quote);
    assert.equal(p.quote_cents,quote*100);assert.equal(p.professional_gross_cents,quote*100);
    assert.equal(p.platform_fee_cents,fee);assert.equal(p.customer_total_cents,total);
    assert.deepEqual(validatePricingSnapshot(p),p);
    assert.equal(remainingProfessionalCents(p),quote*100);
  });
}
test('fractional prices use exact cents and the rounded fee sum', () => {
  assert.equal(dollarsToCents('0.01'),1);assert.equal(dollarsToCents('500.10'),50010);
  assert.equal(priceQuote('19.99').platform_fee_cents,240);
  assert.equal(priceQuote('19.99').customer_total_cents,2239);
  assert.equal(priceQuoteCents(13).platform_fee_cents,2);
});
test('reject invalid/fractional-cent and unsafe quotes', () => {
  for(const v of [-1,0,NaN,Infinity,'1.001','1e3','-500','',null,' 500','500,00']) assert.throws(()=>priceQuote(v));
  assert.throws(()=>priceQuoteCents(Number.MAX_SAFE_INTEGER));
  assert.throws(()=>priceQuoteCents(99_999_999));
});
test('persisted 88/12 split and tampered charge amounts are rejected', () => {
  const p=priceQuote(500);
  assert.throws(()=>validatePricingSnapshot({...p,professional_gross_cents:44000}));
  assert.throws(()=>validatePricingSnapshot({...p,customer_total_cents:50000}));
  assert.throws(()=>validatePricingSnapshot({...p,platform_fee_cents:5000}));
});
test('full refund uses entire $560, with original allocations preserved', () => {
  const p=priceQuote(500);const r=refundAllocation(p,50000,6000);
  assert.equal(r.customer_refund_cents,56000);assert.equal(p.professional_gross_cents,50000);
  assert.equal(p.platform_fee_cents,6000);
});
test('explicit partial refund reduces only separately approved components', () => {
  const p=priceQuote(500);const r=refundAllocation(p,5000,600);
  assert.equal(r.customer_refund_cents,5600);
  assert.equal(remainingProfessionalCents({...p,professional_refunded_cents:5000}),45000);
  assert.equal(remainingProfessionalCents({...p,platform_fee_refunded_cents:600}),50000);
});
test('cumulative refunds cannot exceed either allocation', () => {
  const p={...priceQuote(100),professional_refunded_cents:9000,platform_fee_refunded_cents:1000};
  assert.throws(()=>refundAllocation(p,1001,0));assert.throws(()=>refundAllocation(p,0,201));
  assert.throws(()=>refundAllocation(p,0,0));assert.throws(()=>refundAllocation(p,-1,0));
});
test('gross allocations never allocate processing fees implicitly', () => {
  const p=priceQuote(500);
  assert.equal(remainingProfessionalCents({...p,processor_fee_cents:1654}),50000);
  assert.equal(p.platform_fee_cents,6000);assert.equal(p.processing_fee_payer,undefined);
});
test('customer wording formats service, fee, and total separately', () => {
  const p=priceQuote(500);
  assert.equal(formatUsd(p.quote_cents),'$500.00');assert.equal(formatUsd(p.platform_fee_cents),'$60.00');
  assert.equal(formatUsd(p.customer_total_cents),'$560.00');
});
