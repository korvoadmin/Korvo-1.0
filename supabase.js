const SUPABASE_URL = "https://waaglkephsbxdlleuutr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_-1u_SBijq748zc6yZZvnVQ_BcmXOFIs";

const korvoSupabase = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);

console.log("Korvo connected to Supabase.");
