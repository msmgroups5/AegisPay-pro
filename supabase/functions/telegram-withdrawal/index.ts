import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!,SERVICE_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,BOT=Deno.env.get("TELEGRAM_BOT_TOKEN"),CHAT=Deno.env.get("TELEGRAM_CHAT_ID");
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Content-Type":"application/json"};
const json=(b:any,s=200)=>new Response(JSON.stringify(b),{status:s,headers:cors});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:cors});
 try{
  if(!BOT||!CHAT)return json({error:"TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID are not configured."},503);
  const auth=req.headers.get("Authorization")||"",token=auth.replace(/^Bearer\s+/i,"");if(!token)return json({error:"Authorization required."},401);
  const admin=createClient(SUPABASE_URL,SERVICE_KEY,{auth:{persistSession:false}});const {data:appEnabled,error:runtimeError}=await admin.rpc("app_runtime_enabled");if(runtimeError)return json({error:"Unable to confirm AegisPay runtime status."},503);if(appEnabled!==true)return json({error:"AegisPay is paused by Master Admin."},423);const {data:au}=await admin.auth.getUser(token);if(!au.user)return json({error:"Invalid token"},401);
  const {data:me}=await admin.from("users").select("id,role").eq("auth_user_id",au.user.id).single();if(me?.role!=="MASTER ADMIN")return json({error:"Master Admin access required."},403);
  const {withdrawalId}=await req.json();const {data:w}=await admin.from("withdrawal_requests").select("*").eq("id",withdrawalId).single();if(!w)return json({error:"Withdrawal not found."},404);
  const {data:u}=await admin.from("users").select("name,email").eq("id",w.user_id).single();
  const text="AegisPay Withdrawal Request\n\nRequest: "+w.id+"\nClient: "+(u?.name||"Unknown")+"\nEmail: "+(u?.email||"")+
    "\nAmount: $"+Number(w.amount).toFixed(2)+"\nFee: $"+Number(w.fee_amount).toFixed(2)+"\nNet: $"+Number(w.net_amount).toFixed(2)+
    "\nWallet: "+w.destination_address+"\nStatus: "+w.status;
  const send=await fetch("https://api.telegram.org/bot"+BOT+"/sendMessage",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({chat_id:CHAT,text})});
  const result=await send.json();
  if(!send.ok||!result.ok)return json({error:"Telegram send failed.",detail:result},502);
  await admin.from("withdrawal_requests").update({telegram_status:"SENT"}).eq("id",w.id);
  return json({sent:true,message_id:result.result?.message_id||null});
 }catch(e){return json({error:String((e as Error)?.message||e)},500);}
});
