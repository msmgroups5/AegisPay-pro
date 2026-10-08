import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL"), SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const TRONGRID_KEY=Deno.env.get("TRONGRID_API_KEY"), CRON_SECRET=Deno.env.get("AEGIS_CRON_SECRET");
const MAINNET_PAYOUT_KEY=Deno.env.get("TRON_PAYOUT_PRIVATE_KEY"), TESTNET_PAYOUT_KEY=Deno.env.get("TRON_TESTNET_PAYOUT_PRIVATE_KEY");
const AI_ENDPOINT=Deno.env.get("AI_REVIEW_ENDPOINT"), AI_KEY=Deno.env.get("AI_REVIEW_API_KEY"), AI_MODEL=Deno.env.get("AI_REVIEW_MODEL");
const TELEGRAM_TOKEN=Deno.env.get("TELEGRAM_BOT_TOKEN");
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
Deno.serve(async(req:Request)=>{
if(req.method==="OPTIONS")return new Response("ok",{headers:cors}); if(req.method!=="POST")return json({error:"Method not allowed."},405);
if(!SUPABASE_URL||!SERVICE_KEY)return json({error:"Production readiness service is not configured."},503);
try{
const token=(req.headers.get("Authorization")||"").replace(/^Bearer\s+/i,""); if(!token)return json({error:"Authorization required."},401);
const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const {data:authResult,error:authError}=await admin.auth.getUser(token); if(authError||!authResult.user)return json({error:"Invalid authentication token."},401);
const {data:profile,error:profileError}=await admin.from("users").select("id,role,status").eq("auth_user_id",authResult.user.id).maybeSingle();
if(profileError||!profile)return json({error:"AegisPay profile not found."},404);
if(profile.role!=="MASTER ADMIN"||!["ACTIVE","NORMAL"].includes(String(profile.status||"").toUpperCase()))return json({error:"Active Master Admin access is required."},403);
const userDb=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:"Bearer "+token}}});
const readiness=await userDb.rpc("get_production_readiness"); if(readiness.error)return json({error:readiness.error.message},500);
const {data:systemRow}=await admin.from("platform_settings").select("value_json").eq("key","system_mode").maybeSingle();
const {data:depositRow}=await admin.from("platform_settings").select("value_json").eq("key","deposit_rules").maybeSingle();
const system=systemRow?.value_json||{},deposit=depositRow?.value_json||{},network=String(deposit.network||"").toUpperCase();
const secrets={supabase_service_role:Boolean(SERVICE_KEY),trongrid_api:Boolean(TRONGRID_KEY),cron_secret:Boolean(CRON_SECRET),mainnet_payout_key:Boolean(MAINNET_PAYOUT_KEY),testnet_payout_key:Boolean(TESTNET_PAYOUT_KEY),ai_review_endpoint:Boolean(AI_ENDPOINT),ai_review_api_key:Boolean(AI_KEY),ai_review_model:Boolean(AI_MODEL),telegram_bot_token:Boolean(TELEGRAM_TOKEN)};
const mainnetMonitoringReady=system.mode==="MAINNET"&&network==="TRON MAINNET"&&Boolean(String(deposit.receiving_address||"").trim())&&system.live_deposits===true&&secrets.trongrid_api&&secrets.cron_secret;
const mainnetPayoutOperational=Boolean(readiness.data?.mainnet_payout_gate_ok)&&secrets.trongrid_api&&secrets.mainnet_payout_key;
return json({readiness:readiness.data||{},secrets,mainnet_monitoring_ready:mainnetMonitoringReady,mainnet_payout_operational:mainnetPayoutOperational,checked_at:new Date().toISOString()});
}catch(error){return json({error:String((error as Error)?.message||error).slice(0,500)},500);}
});