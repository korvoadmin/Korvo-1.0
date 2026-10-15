import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {createWebhookHandler} from './handler.mjs';
Deno.serve(createWebhookHandler({createClient,env:(name:string)=>Deno.env.get(name)}));
