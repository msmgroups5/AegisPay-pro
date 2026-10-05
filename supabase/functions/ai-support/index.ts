import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const AI_ENDPOINT = Deno.env.get("AI_REVIEW_ENDPOINT") || "";
const AI_KEY = Deno.env.get("AI_REVIEW_API_KEY") || "";
const AI_MODEL = Deno.env.get("AI_REVIEW_MODEL") || "";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

function completionUrl(value: string) {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("AI endpoint must use HTTPS.");
  const base = url.toString().replace(/\/+$/, "");
  return base.endsWith("/chat/completions") ? base : base + "/chat/completions";
}

function fallback(message: string) {
  const q = message.toLowerCase();
  if (q.includes("deposit")) return "For a deposit, select your tier, use the configured TRON network, then submit the payment screenshot and TXID. Balance is credited only after evidence review and a confirmed matching transfer.";
  if (q.includes("shop") || q.includes("task")) return "After a verified deposit, your Shop cycle is generated automatically. While your available balance is above $0 and there is no active or waiting cycle, the next Shop task set is assigned automatically; Master Admin does not need to manually assign normal client tasks. Complete the full task set to start the 18-hour settlement timer.";
  if (q.includes("withdraw")) return "Withdrawals require verified KYC and a linked TRON wallet. The request then needs Master Admin approval plus the configured Telegram approval.";
  if (q.includes("kyc")) return "Upload clear CNIC or Passport images. Withdrawals remain locked until the KYC review is verified.";
  if (q.includes("referral")) return "Qualifying verified first deposits can create the configured Level 1 and Level 2 referral rewards.";
  return "I can help with AegisPay deposits, Shop tasks, withdrawals, KYC, referrals and account navigation. I cannot approve transactions or change balances.";
}

async function actor(req: Request, admin: ReturnType<typeof createClient>) {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) throw new Response("Authorization required.", { status: 401 });
  const { data: auth, error } = await admin.auth.getUser(token);
  if (error || !auth.user) throw new Response("Invalid authentication token.", { status: 401 });
  const { data: profile } = await admin.from("users").select("id,role,status,name,email")
    .eq("auth_user_id", auth.user.id).maybeSingle();
  if (!profile || !["USER","MASTER ADMIN"].includes(String(profile.role))) {
    throw new Response("AegisPay profile not found.", { status: 404 });
  }
  if (["BLOCKED","SUSPENDED","DELETED"].includes(String(profile.status || "").toUpperCase())) {
    throw new Response("This account is not active.", { status: 403 });
  }
  return profile;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "AI support service is not configured." }, 503);

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
    const profile = await actor(req, admin);
    const { data: enabled, error: runtimeError } = await admin.rpc("app_runtime_enabled");
    if (runtimeError) return json({ error: "Unable to confirm AegisPay runtime status." }, 503);
    if (enabled !== true) return json({ error: "AegisPay is paused by Master Admin." }, 423);

    const body = await req.json().catch(() => null);
    const message = String(body?.message || "").trim().slice(0, 1000);
    if (!message) return json({ error: "A message is required." }, 400);

    if (!AI_ENDPOINT || !AI_KEY || !AI_MODEL) {
      return json({ configured: false, answer: fallback(message) });
    }

    const response = await fetch(completionUrl(AI_ENDPOINT), {
      method: "POST",
      headers: { "Authorization": "Bearer " + AI_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_MODEL,
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: "You are AegisPay's informational support assistant. Answer only about navigation, deposits, Shop tasks, withdrawals, KYC, referrals, language, account status and general platform use. Never approve, reject, initiate, or recommend a financial transaction. Never change or claim to change balances, KYC, withdrawals, user status, or admin settings. Do not invent current balances, transaction status, blockchain confirmations, secrets, or user-specific facts. Explain that normal Shop tasks are assigned automatically while available balance remains above $0 and no active cycle exists; Master Admin manual assignment is not required for normal cycles. When a question requires an action by Master Admin or Telegram approval, explain that requirement."
          },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) return json({ configured: true, answer: fallback(message), degraded: true });
    const bodyJson = await response.json().catch(() => null);
    const answer = String(bodyJson?.choices?.[0]?.message?.content || "").trim();
    if (!answer) return json({ configured: true, answer: fallback(message), degraded: true });
    return json({ configured: true, answer, degraded: false, role: profile.role });
  } catch (error) {
    if (error instanceof Response) return json({ error: await error.text() }, error.status);
    return json({ error: "AI support is temporarily unavailable." }, 503);
  }
});
