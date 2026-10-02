import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: cors });
}

const ipLastSeen = new Map<string, number>();
const emailLastSeen = new Map<string, number>();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed." }, 405);

  try {
    if (!SUPABASE_URL || !SERVICE_KEY) return json({ error: "Signup service is not configured." }, 503);

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const referralCode = typeof body?.referralCode === "string" ? body.referralCode.trim().toUpperCase() : "";
    const preferredLanguage = body?.preferredLanguage === "ur" ? "ur" : "en";
    const requestId = crypto.randomUUID();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return json({ error: "Enter a valid email address." }, 400);
    }
    if (name.length < 2 || name.length > 100) return json({ error: "Enter a valid full name." }, 400);
    if (password.length < 8 || password.length > 128) return json({ error: "Password must contain 8 to 128 characters." }, 400);
    if (referralCode.length > 32) return json({ error: "Referral code is too long." }, 400);

    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || "unknown").split(",")[0].trim();
    const now = Date.now();
    if ((now - (ipLastSeen.get(ip) || 0)) < 15_000 || (now - (emailLastSeen.get(email) || 0)) < 60_000) {
      return json({ error: "Please wait a moment before trying signup again." }, 429);
    }
    ipLastSeen.set(ip, now);
    emailLastSeen.set(email, now);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const { data: modeRow, error: modeError } = await admin
      .from("platform_settings")
      .select("value_json")
      .eq("key", "system_mode")
      .maybeSingle();
    if (modeError) return json({ error: "Unable to confirm signup mode." }, 503);
    const mode = modeRow?.value_json || {};
    if (String(mode.status || "").toUpperCase() !== "TEST_MODE" || String(mode.mode || "").toUpperCase() !== "TESTNET_DEMO") {
      return json({ error: "Email confirmation is required outside test mode. Configure a verified SMTP sender first." }, 403);
    }

    const { data: existingProfile, error: existingError } = await admin
      .from("users").select("id,status").eq("email", email).maybeSingle();
    if (existingError) return json({ error: "Unable to check the account." }, 503);
    if (existingProfile) return json({ error: "This email already has an AegisPay profile. Please sign in or contact support." }, 409);

    const { data: existingAuth } = await admin.auth.admin.getUserByEmail(email);
    if (existingAuth?.user) return json({ error: "An account with this email already exists. Please sign in.", code: "EMAIL_EXISTS", requestId }, 409);

    if (referralCode) {
      const { data: referrer, error: referralError } = await admin
        .from("users")
        .select("id")
        .eq("referral_code", referralCode)
        .eq("role", "USER")
        .in("status", ["Active", "NORMAL", "ACTIVE"])
        .maybeSingle();
      if (referralError) {
        console.error("public-signup referral validation failed", { requestId, message: referralError.message, code: referralError.code });
        return json({ error: "Unable to validate the referral code. Please try again.", code: "REFERRAL_CHECK_FAILED", requestId }, 503);
      }
      if (!referrer) {
        return json({ error: "Referral code is invalid.", code: "INVALID_REFERRAL", requestId }, 400);
      }
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: name.slice(0, 100),
        referral_code: referralCode,
        preferred_language: preferredLanguage,
      },
      app_metadata: {
        aegispay_approved: true,
        signup_channel: "client_test_mode",
      },
    });

    if (error || !data?.user) {
      const rawMessage = String(error?.message || "AegisPay could not create the account.");
      const lower = rawMessage.toLowerCase();
      console.error("public-signup createUser failed", {
        requestId,
        status: error?.status ?? null,
        code: error?.code ?? null,
        message: rawMessage,
      });

      let status = Number(error?.status || 0);
      if (!Number.isFinite(status) || status < 400 || status > 599) status = 500;
      if (/already registered|already exists|duplicate|23505/.test(lower)) status = 409;
      else if (/invalid|validation|password|email|referral/.test(lower) && status >= 500) status = 400;

      const message = status >= 500
        ? "AegisPay could not create the account right now. Please try again."
        : rawMessage;

      return json({ error: message, code: status >= 500 ? "SIGNUP_SERVER_ERROR" : (error?.code || "SIGNUP_VALIDATION_ERROR"), requestId }, status);
    }

    const { data: linkedProfile, error: profileError } = await admin
      .from("users")
      .select("id,role,status")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();

    if (profileError || !linkedProfile) {
      console.error("public-signup profile link failed", {
        requestId,
        authUserId: data.user.id,
        message: profileError?.message || "Profile was not created by the Auth trigger.",
        code: profileError?.code || null,
      });
      try {
        await admin.auth.admin.deleteUser(data.user.id);
      } catch (cleanupError) {
        console.error("public-signup cleanup failed", {
          requestId,
          message: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });
      }
      return json({
        error: "Account setup could not be completed. No usable AegisPay account was created.",
        code: "PROFILE_LINK_FAILED",
        requestId,
      }, 500);
    }

    return json({
      user: { id: data.user.id, email: data.user.email || email },
      profile: { id: linkedProfile.id, role: linkedProfile.role, status: linkedProfile.status },
      message: "Account created successfully.",
      requestId,
    }, 201);
  } catch (error) {
    console.error("public-signup unexpected failure", {
      requestId,
      message: error instanceof Error ? error.message : String(error),
    });
    return json({
      error: "AegisPay signup service failed unexpectedly. Please try again.",
      code: "SIGNUP_UNEXPECTED_ERROR",
      requestId,
    }, 500);
  }
});
