import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {createCheckoutHandler} from './handler.mjs';
Deno.serve(createCheckoutHandler({createClient,env:(name:string)=>Deno.env.get(name)}));
