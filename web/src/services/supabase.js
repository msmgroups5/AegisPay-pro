import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL || "https://wtcspnrmsoisroavojop.supabase.co";
const key = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_pDg6Ef_P6fZnNvrKkuBm0Q_uEQMItB2";

export const supabase = createClient(url, key, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
});

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(), password
  });
  if (error) throw error;
  if (!data.user) throw new Error("Login failed.");
  return loadProfile(data.user.id);
}

export async function signUp(name, email, password, referralCode = "") {
  const { data, error } = await supabase.functions.invoke("public-signup", {
    body: { email: email.trim().toLowerCase(), password, name: name.trim(), referralCode: referralCode.trim().toUpperCase(), preferredLanguage: "en" }
  });
  if (error) throw error;
  return data;
}

export async function loadProfile(authUserId) {
  const { data, error } = await supabase
    .from("users")
    .select("id,name,email,role,status,current_platform_balance,principal_balance,profit_balance,withdrawal_held,referral_code,destination_address,withdrawal_wallet_owner_name,selected_tier_id,first_deposit_done,created_at")
    .eq("auth_user_id", authUserId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Your AegisPay account is authenticated but no approved profile is linked yet.");
  return data;
}

export async function getSessionProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return loadProfile(user.id);
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function submitDeposit({ tierId, amount, txid, screenshot }) {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Please sign in first.");
  const gross = Number(amount);
  if (!Number.isFinite(gross) || gross <= 0) throw new Error("Enter a valid deposit amount.");
  if (!txid.trim()) throw new Error("Transaction hash / TXID is required.");
  if (!/^[a-f\\d]{64}$/i.test(txid.trim())) throw new Error("Enter the 64-character TRON transaction ID.");
  if (!screenshot) throw new Error("Deposit screenshot is required.");
  if (!["image/jpeg","image/png","image/webp"].includes(screenshot.type)) throw new Error("Use JPG, PNG or WebP for the screenshot.");
  if (screenshot.size > 10 * 1024 * 1024) throw new Error("Screenshot must be 10 MB or smaller.");

  const path = authData.user.id + "/deposits/" + (crypto.randomUUID ? crypto.randomUUID() : Date.now()+"-"+Math.random().toString(16).slice(2)) + "-" + screenshot.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const upload = await supabase.storage.from("private-verification").upload(path, screenshot, {
    cacheControl: "3600", upsert: false, contentType: screenshot.type
  });
  if (upload.error) throw new Error("Evidence upload failed: " + upload.error.message);

  const result = await supabase.functions.invoke("submit-deposit", {
    body: { tierId, amount: gross, txid: txid.trim(), screenshotPath: path }
  });
  if (result.error) {
    await supabase.storage.from("private-verification").remove([path]);
    throw result.error;
  }
  if (!result.data?.depositId) throw new Error("Deposit service did not return a deposit reference.");
  return result.data;
}
