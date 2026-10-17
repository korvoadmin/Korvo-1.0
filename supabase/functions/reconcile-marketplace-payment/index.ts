import {createClient} from 'npm:@supabase/supabase-js@2.117.3';
import {createReconciliationHandler} from './handler.mjs';
Deno.serve(createReconciliationHandler({createClient,env:(name:string)=>Deno.env.get(name)}));
