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

export async function submitDeposit({ tierId, amount, txid }) {
  const profile = await getSessionProfile();
  if (!profile) throw new Error("Please sign in first.");
  const gross = Number(amount);
  if (!Number.isFinite(gross) || gross <= 0) throw new Error("Enter a valid deposit amount.");
  if (!txid.trim()) throw new Error("Transaction hash / TXID is required.");
  const fee = 2;
  const credited = Math.max(0, gross - fee);
  const { data, error } = await supabase.from("deposit_submissions").insert({
    user_id: profile.id,
    tier_id: tierId,
    gross_amount: gross,
    deposit_fee: fee,
    credited_amount: credited,
    txid: txid.trim(),
    status: "PENDING_VERIFICATION"
  }).select().single();
  if (error) throw error;
  return data;
}

export async function requestWithdrawal(amount) {
  const { data, error } = await supabase.rpc("request_withdrawal", { p_amount: Number(amount) });
  if (error) throw error;
  return data;
}

export async function getReferrals() {
  const profile = await getSessionProfile();
  if (!profile) return [];
  const { data, error } = await supabase.from("referrals")
    .select("id,referred_user_id,referral_level,bonus_amount,created_at")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}
