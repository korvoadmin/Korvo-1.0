// Sandbox-only Connect onboarding. Never accept a professional/account ID from the client.
const siteUrl = "https://korvoadmin.github.io/Korvo-1.0";
const cors = {
  "Access-Control-Allow-Origin": "https://korvoadmin.github.io",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const stripeVersion = "2026-09-30.endive";
const stripeHosts = new Set(["accounts.stripe.com", "connect.stripe.com"]);

class Failure extends Error {
  constructor(public code: string, public status = 500, public upstream?: number,
    public upstreamCode?: string, public stripeRequestId?: string, public fieldDiagnostic?: string) { super(code); }
}

export function accountStatus(account: any) {
  const complete = account.details_submitted === true && account.payouts_enabled === true
    && account.capabilities?.transfers === "active";
  const disabled = account.requirements?.disabled_reason;
  const restricted = disabled && disabled !== "requirements.pending_verification";
  return {
    onboarding_status: complete ? "complete" : restricted ? "restricted"
      : account.details_submitted ? "in_progress" : "pending",
    charges_enabled: account.charges_enabled === true,
    payouts_enabled: account.payouts_enabled === true,
    details_submitted: account.details_submitted === true,
  };
}

export function createHandler({ createClient, env, fetch: request = globalThis.fetch,
  log = (value: unknown) => console.error(JSON.stringify(value)) }: {
  createClient: (...args: any[]) => any; env: (name: string) => string | undefined;
  fetch?: typeof fetch; log?: (value: unknown) => void;
}) {
  return async (req: Request) => {
    const requestId = crypto.randomUUID();
    const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
      status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
    if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
    let stage = "configuration";
    try {
      const url = env("SUPABASE_URL"), anon = env("SUPABASE_ANON_KEY");
      const service = env("SUPABASE_SERVICE_ROLE_KEY"), key = env("STRIPE_SECRET_KEY");
      if (!url || !anon || !service || !key) throw new Failure("SERVER_CONFIGURATION_MISSING", 503);
      if (!key.startsWith("sk_test_")) throw new Failure("SANDBOX_KEY_REQUIRED", 503);
      stage = "authentication";
      const authorization = req.headers.get("Authorization");
      if (!authorization) throw new Failure("LOGIN_REQUIRED", 401);
      const clientOptions = { auth: { persistSession: false, autoRefreshToken: false } };
      const userClient = createClient(url, anon, { ...clientOptions,
        global: { headers: { Authorization: authorization } } });
      const { data, error } = await userClient.auth.getUser();
      if (error || !data?.user) throw new Failure("LOGIN_REQUIRED", 401);
      const user = data.user;
      let body;
      try { body = await req.json(); } catch { throw new Failure("INVALID_REQUEST", 400); }
      if (!body || typeof body !== "object" || Array.isArray(body)
        || Object.keys(body).some(k => k !== "action")) throw new Failure("INVALID_REQUEST", 400);
      const action = body.action ?? "start";
      if (action !== "start" && action !== "status") throw new Failure("INVALID_REQUEST", 400);
      const admin = createClient(url, service, clientOptions);
      stage = "professional_eligibility";
      const profile = await admin.from("profiles")
        .select("id,account_type,is_active,onboarding_complete").eq("id", user.id).maybeSingle();
      if (profile.error) throw new Failure("DATABASE_ERROR", 500, undefined, profile.error.code);
      if (!profile.data || profile.data.account_type !== "professional" || !profile.data.is_active
        || !profile.data.onboarding_complete) throw new Failure("PROFESSIONAL_REQUIRED", 403);
      const professional = await admin.from("professional_profiles").select("id").eq("id", user.id).maybeSingle();
      if (professional.error) throw new Failure("DATABASE_ERROR", 500, undefined, professional.error.code);
      if (!professional.data) throw new Failure("PROFESSIONAL_REQUIRED", 403);
      stage = "account_lookup";
      const lookup = await admin.from("professional_stripe_accounts").select("stripe_account_id")
        .eq("professional_id", user.id).maybeSingle();
      if (lookup.error) throw new Failure("DATABASE_ERROR", 500, undefined, lookup.error.code);
      let accountId = lookup.data?.stripe_account_id;

      async function stripe(path: string, payload?: unknown, idempotency?: string) {
        const response = await request(`https://api.stripe.com/${path}`, {
          method: payload === undefined ? "GET" : "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json",
            "Stripe-Version": stripeVersion, ...(idempotency ? { "Idempotency-Key": idempotency } : {}) },
          ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
          signal: AbortSignal.timeout(20000),
        });
        const result = await response.json();
        if (!response.ok) {
          // Do not log raw Stripe errors: they can contain supplied personal data or key fragments.
          const fieldDiagnostic = result?.error?.code === "invalid_fields"
            ? String(result.error.message ?? "").replace(/(?:sk|rk)_(?:test|live)_\S+/g, "[redacted]")
              .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g, "[email]").slice(0,1000)
            : undefined;
          throw new Failure("STRIPE_REQUEST_FAILED", 502, response.status,
            result?.error?.code ?? result?.error?.type, response.headers.get("request-id") ?? undefined, fieldDiagnostic);
        }
        if (result.livemode === true) throw new Failure("SANDBOX_RESPONSE_REQUIRED", 502);
        return result;
      }

      if (!accountId && action === "status") return json({ status: "not_connected", sandbox: true });
      if (!accountId) {
        if (!user.email) throw new Failure("CONTACT_EMAIL_REQUIRED", 400);
        stage = "stripe_account_create";
        const account = await stripe("v2/core/accounts", {
          contact_email: user.email,
          dashboard: "express", identity: { country: "us" },
          defaults: { responsibilities: { fees_collector: "application", losses_collector: "application" } },
          configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
          metadata: { korvo_professional_id: user.id },
        }, `korvo-connect-v2-${user.id}`);
        accountId = account.id;
        if (!/^acct_[A-Za-z0-9]+$/.test(accountId ?? "")) throw new Failure("STRIPE_ACCOUNT_INVALID", 502);
        stage = "account_save";
        // Never overwrite an existing mapping if concurrent requests reach this point.
        const save = await admin.from("professional_stripe_accounts").upsert({
          professional_id: user.id, stripe_account_id: accountId, onboarding_status: "pending",
          updated_at: new Date().toISOString(),
        }, { onConflict: "professional_id", ignoreDuplicates: true });
        if (save.error) throw new Failure("DATABASE_ERROR", 500, undefined, save.error.code);
        const saved = await admin.from("professional_stripe_accounts").select("stripe_account_id")
          .eq("professional_id", user.id).single();
        if (saved.error || !saved.data) throw new Failure("DATABASE_ERROR", 500, undefined, saved.error?.code);
        accountId = saved.data.stripe_account_id;
      }
      if (!/^acct_[A-Za-z0-9]+$/.test(accountId)) throw new Failure("STRIPE_ACCOUNT_INVALID", 500);
      stage = "stripe_account_status";
      // Stripe explicitly supports retrieving v2 accounts through the v1 API. This preserves
      // the existing DB flags without storing identity, bank details or requirement payloads.
      const account = await stripe(`v1/accounts/${accountId}`);
      if (account.id !== accountId || account.metadata?.korvo_professional_id !== user.id)
        throw new Failure("STRIPE_ACCOUNT_OWNER_MISMATCH", 403);
      const snapshot = accountStatus(account);
      stage = "status_save";
      const savedStatus = await admin.from("professional_stripe_accounts").update({ ...snapshot,
        updated_at: new Date().toISOString() }).eq("professional_id", user.id).eq("stripe_account_id", accountId);
      if (savedStatus.error) throw new Failure("DATABASE_ERROR", 500, undefined, savedStatus.error.code);
      if (action === "status") return json({ status: snapshot.onboarding_status, ...snapshot, sandbox: true });

      stage = "stripe_account_link";
      const link = await stripe("v2/core/account_links", { account: accountId,
        use_case: { type: "account_onboarding", account_onboarding: {
          refresh_url: `${siteUrl}/professional-dashboard.html?stripe=refresh`,
          return_url: `${siteUrl}/professional-dashboard.html?stripe=return`,
        } },
      });
      let linkUrl;
      try { linkUrl = new URL(link.url); } catch { throw new Failure("STRIPE_LINK_INVALID", 502); }
      if (linkUrl.protocol !== "https:" || !stripeHosts.has(linkUrl.hostname) || linkUrl.username || linkUrl.password)
        throw new Failure("STRIPE_LINK_INVALID", 502);
      return json({ onboarding_url: link.url, status: snapshot.onboarding_status, sandbox: true });
    } catch (error) {
      const failure = error instanceof Failure ? error : new Failure("UNEXPECTED_ERROR");
      log({ event: "connect_onboarding_failure", request_id: requestId, stage, code: failure.code,
        upstream_status: failure.upstream, upstream_code: failure.upstreamCode,
        stripe_request_id: failure.stripeRequestId, field_diagnostic: failure.fieldDiagnostic });
      return json({ error: "Stripe onboarding could not be completed.", code: failure.code,
        stage, request_id: requestId }, failure.status);
    }
  };
}
