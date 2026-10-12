import test from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRelease} from '../supabase/functions/_shared/release.mjs';
import {priceQuote} from '../supabase/functions/_shared/pricing.mjs';
const now=Date.parse('2026-10-12T16:00:00Z');
const fixture=()=>({now,payment:{...priceQuote(500),id:'p',active_job_id:'job',customer_id:'c',professional_id:'pro',livemode:false,status:'paid',
 stripe_payment_intent_id:'pi_test',stripe_charge_id:'ch_test',verified_paid_event:true,refunded_total_cents:0,requires_review:false,release_status:'held',paid_at:'2026-10-12T14:00:00Z'},
 job:{id:'job',customer_id:'c',professional_id:'pro',status:'completed',professional_completed_at:'2026-10-12T14:30:00Z',customer_confirmed_at:'2026-10-12T15:00:00Z',has_open_issue:false,evidence_verified:true},
 professional:{id:'pro',active:true,restricted:false},connect:{professional_id:'pro',stripe_account_id:'acct_test',onboarding_status:'complete',details_submitted:true,payouts_enabled:true,transfers_active:true,status_checked_at:'2026-10-12T15:59:00Z'},
 actor:{server_verified:true,active:true,database_role:'owner'},policy:{owner_approved:true,processing_fee_decision_confirmed:true,release_delay_ms:0,maximum_age_ms:86400000},ledger:{state:'never_attempted'},
 funds:{server_verified:true,currency:'usd',available_cents:56000,platform_reserve_sufficient:true,verified_at:'2026-10-12T15:59:00Z'}});
test('eligible sandbox release retains full $500 gross and cannot execute',()=>{const r=evaluateRelease(fixture());assert.equal(r.eligible,true);assert.equal(r.execution_enabled,false);assert.equal(r.professional_gross_cents,50000);assert.equal(r.platform_gross_cents,6000);});
const cases=[
 ['customer authorization',f=>f.actor.database_role='customer','FINANCIAL_ADMIN_REQUIRED'],
 ['support cannot release',f=>f.actor.database_role='support','FINANCIAL_ADMIN_REQUIRED'],
 ['forged authority',f=>f.actor.server_verified=false,'FINANCIAL_ADMIN_REQUIRED'],
 ['live money',f=>f.payment.livemode=true,'SANDBOX_REQUIRED'],
 ['unverified payment',f=>f.payment.verified_paid_event=false,'VERIFIED_FULL_PAYMENT_REQUIRED'],
 ['refund',f=>f.payment.refunded_total_cents=1,'PAYMENT_REVIEW_REQUIRED'],
 ['dispute hold',f=>f.payment.requires_review=true,'PAYMENT_REVIEW_REQUIRED'],
 ['cross-account job',f=>f.job.professional_id='attacker','OWNERSHIP_MISMATCH'],
 ['incomplete work',f=>f.job.status='active','VERIFIED_COMPLETION_REQUIRED'],
 ['missing evidence',f=>f.job.evidence_verified=false,'VERIFIED_COMPLETION_REQUIRED'],
 ['restricted professional',f=>f.professional.restricted=true,'PROFESSIONAL_NOT_ELIGIBLE'],
 ['incomplete onboarding',f=>f.connect.payouts_enabled=false,'FRESH_CONNECT_VERIFICATION_REQUIRED'],
 ['stale Connect',f=>f.connect.status_checked_at='2026-10-12T15:00:00Z','FRESH_CONNECT_VERIFICATION_REQUIRED'],
 ['undecided fee payer',f=>f.policy.processing_fee_decision_confirmed=false,'OWNER_POLICY_REQUIRED'],
 ['unapproved policy',f=>f.policy.owner_approved=false,'OWNER_POLICY_REQUIRED'],
 ['release window',f=>f.policy.release_delay_ms=7200000,'RELEASE_WINDOW_NOT_REACHED'],
 ['aged funds',f=>f.payment.paid_at='2026-10-01T14:00:00Z','AGED_FUNDS_REVIEW_REQUIRED'],
 ['duplicate transfer',f=>f.ledger.state='succeeded','EXISTING_OR_AMBIGUOUS_RELEASE'],
 ['ambiguous transfer timeout',f=>f.ledger.state='unknown','EXISTING_OR_AMBIGUOUS_RELEASE'],
 ['insufficient balance',f=>f.funds.available_cents=49999,'VERIFIED_FUNDS_AND_RESERVE_REQUIRED'],
 ['missing reserve verification',f=>f.funds.platform_reserve_sufficient=false,'VERIFIED_FUNDS_AND_RESERVE_REQUIRED'],
 ['stale balance snapshot',f=>f.funds.verified_at='2026-10-12T15:00:00Z','VERIFIED_FUNDS_AND_RESERVE_REQUIRED']];
for(const [name,change,reason] of cases)test('release denies '+name,()=>{const f=fixture();change(f);const r=evaluateRelease(f);assert.equal(r.eligible,false);assert.equal(r.execution_enabled,false);assert.ok(r.reasons.includes(reason));});
