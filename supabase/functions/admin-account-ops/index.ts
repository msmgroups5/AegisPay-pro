import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Admin operations are not configured." }, 503);

  try {
    const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Authorization required." }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) return json({ error: "Invalid authentication token." }, 401);

    const { data: actor, error: actorError } = await admin
      .from("users")
      .select("id,role,status")
      .eq("auth_user_id", auth.user.id)
      .maybeSingle();

    if (actorError || !actor || actor.role !== "MASTER ADMIN" || !["ACTIVE","NORMAL"].includes(String(actor.status || "").toUpperCase())) {
      return json({ error: "Active Master Admin access is required." }, 403);
    }

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const action = String(body?.action || "");

    if (action === "status") {
      const userId = String(body?.userId || "");
      const status = String(body?.status || "");
      if (!isUuid(userId)) return json({ error: "A valid user is required." }, 400);
      if (!["NORMAL","FROZEN","BLOCKED"].includes(status)) return json({ error: "Invalid account status." }, 400);

      const { data: target, error: targetError } = await admin.from("users").select("id,status").eq("id", userId).maybeSingle();
      if (targetError || !target) return json({ error: "User not found." }, 404);

      const { error } = await admin.from("users").update({ status }).eq("id", userId);
      if (error) return json({ error: "Account status update failed." }, 400);

      await admin.from("audit_events").insert({
        actor_user_id: actor.id,
        target_user_id: userId,
        event_type: "ACCOUNT_STATUS_CHANGED",
        description: "Master Admin changed account status from " + String(target.status || "") + " to " + status + ".",
      });

      return json({ status });
    }

    if (action === "wallet") {
      const userId = String(body?.userId || "");
      const wallet = String(body?.wallet || "").trim().toUpperCase();
      if (!isUuid(userId)) return json({ error: "A valid user is required." }, 400);
      if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(wallet)) return json({ error: "Enter a valid TRC20 wallet address." }, 400);

      const { data: target, error: targetError } = await admin
        .from("users")
        .select("id,role,destination_address")
        .eq("id", userId)
        .maybeSingle();
      if (targetError || !target || target.role !== "USER") return json({ error: "Client account not found." }, 404);

      const { error: updateError } = await admin.from("users")
        .update({ destination_address: wallet })
        .eq("id", userId);
      if (updateError) return json({ error: "Withdrawal wallet change failed." }, 400);

      await admin.from("audit_events").insert({
        actor_user_id: actor.id,
        target_user_id: userId,
        event_type: "WITHDRAWAL_WALLET_CHANGED",
        description: "Master Admin changed the client's withdrawal wallet."
      });

      return json({ wallet });
    }

    if (action === "balance") {
      const userId = String(body?.userId || "");
      const type = String(body?.type || "").toUpperCase();
      const amount = Number(body?.amount);
      const reason = String(body?.reason || "").trim().slice(0, 500) || "Master Admin balance adjustment";
      if (!isUuid(userId)) return json({ error: "A valid user is required." }, 400);
      if (!["CREDIT","REVERSAL"].includes(type)) return json({ error: "Invalid adjustment type." }, 400);
      if (!Number.isFinite(amount) || amount <= 0) return json({ error: "Amount must be positive." }, 400);

      const { data: newBalance, error: rpcError } = await admin.rpc("master_admin_adjust_balance", {
        p_user_id: userId,
        p_amount: amount,
        p_type: type,
        p_reason: reason,
      });
      if (rpcError) {
        return json({ error: rpcError.message || "Balance adjustment failed." }, 400);
      }

      return json({ balance: Number(newBalance || 0), type, amount, reason });
    }

    return json({ error: "Unsupported admin operation." }, 400);
  } catch {
    return json({ error: "Admin operation could not be completed." }, 500);
  }
});