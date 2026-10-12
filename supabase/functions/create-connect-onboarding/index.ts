import { createClient } from "npm:@supabase/supabase-js@2.117.3";
import { createHandler } from "./handler.ts";

Deno.serve(createHandler({ createClient, env: (name: string) => Deno.env.get(name) }));
