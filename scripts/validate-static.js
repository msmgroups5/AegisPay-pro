const fs=require('node:fs');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const exists=p=>fs.existsSync(p);

const must=[
  'client.html','master-admin.html','styles.css','premium.css','admin-auth.js',
  'supabase-client.js','supabase-service.js','aegis-auth-redirect.js','app-update.js',
   'service-worker.js','manifest.webmanifest','_headers','aegispay-logo.svg','_redirects','package.json',
  'database/migrations/20261003_private_verification_storage_policies.sql','database/migrations/20261004_restore_baseline_demo_configuration.sql',
  'database/migrations/20261005_align_withdrawal_wallet_rpc_grants.sql',
  'database/migrations/20261005_retire_client_complete_task_rpc.sql',
  'site/index.html','site/site.css','android/app/build.gradle',
  'android/app/src/main/java/com/aegispay/app/MainActivity.java',
  '.github/workflows/ci.yml','.github/workflows/android-apk.yml',
  '.github/workflows/web-portal-deploy.yml','.github/workflows/website-apk-release.yml'
];
for(const p of must)assert(exists(p),'Missing canonical source file: '+p);

const client=fs.readFileSync('client.html','utf8');
assert(client.includes('bootLive'),'Client inline runtime bootstrap is missing');
assert(client.includes('liveHome'),'Client Home runtime is missing');
assert(client.includes('liveTopup'),'Client Top Up runtime is missing');
assert(client.includes('liveWithdraw'),'Client Withdrawal runtime is missing');
assert(client.includes('Username or Email'),'Canonical client login must accept username or email');
assert(client.includes('resolve_login_email'),'Username login resolution is not wired');
assert(client.includes('public-signup'),'Canonical client signup function is not wired');
assert(client.includes('Secure &amp; Verified'),'Client security footer is missing');
assert(client.includes('© 2023–2026 AegisPay'),'Client year marker is missing');
assert(client.length>20000,'Canonical client source unexpectedly shrank; review before release');
assert(!client.includes('aegis-core.js')&&!client.includes('app.js'),'Legacy demo scripts are still wired to client');

const admin=fs.readFileSync('master-admin.html','utf8');
assert(admin.includes('./admin-auth.js')&&!admin.includes('aegis-core.js')&&!admin.includes('app.js'),'Admin entry wiring incomplete');

const service=fs.readFileSync('supabase-service.js','utf8');
for(const m of [
  'claim_aegispay_profile','public-signup','signInWithPassword','resetPasswordForEmail',
  'request_withdrawal','app_runtime_enabled','set_app_runtime_enabled'
])assert(service.includes(m),'Supabase marker missing: '+m);

const gradle=fs.readFileSync('android/app/build.gradle','utf8');
assert(gradle.includes("include 'client.html'")&&!gradle.includes("include 'client-fresh.html'")&&gradle.includes("include 'master-admin.html'"),'Android canonical entries missing');
assert(gradle.includes('ensureSupabaseSdk'),'Build must provision the pinned Supabase SDK for web packaging');
assert(!gradle.includes("include 'client-auth.js'")&&!gradle.includes("include 'client-home.css'"),'Retired client runtime assets must not be bundled into Android client builds');
assert(!gradle.includes('syncBlueprintRuntime')&&!gradle.includes('aegis-core.js')&&!gradle.includes('app.js'),'Legacy Android runtime remains wired');

const native=fs.readFileSync('android/app/src/main/java/com/aegispay/app/MainActivity.java','utf8');
assert(!native.includes('aegispay-pro-web.aegispay.workers.dev')&&!native.includes('aegispay-client.netlify.app')&&!native.includes('__UNI__D835ED9'),'Android stale remote/legacy identity remains');
assert(native.includes('aegispay-pro.pages.dev')&&native.includes('UPDATE_HOST'),'Android update endpoint must remain explicitly allowlisted for Cloudflare Pages');

const deploy=fs.readFileSync('.github/workflows/web-portal-deploy.yml','utf8');
assert(deploy.includes('cp client.html site/app/index.html'),'Deploy source of truth is not client.html');
assert(deploy.includes('cp master-admin.html site/master-admin.html'),'Admin deploy source is not master-admin.html');
assert(deploy.includes('rm -rf site/app site/downloads'),'Generated deploy directories are rebuilt cleanly');
assert(!deploy.includes('netlify-cli deploy'),'Legacy Netlify production deployment must stay disabled during Cloudflare migration');

const rel=fs.readFileSync('.github/workflows/website-apk-release.yml','utf8');
assert(rel.includes(':app:assembleClientDebug'),'Aurora APK release workflow must build the canonical client flavor');
assert(!rel.includes('netlify-cli deploy'),'Release workflow still has active Netlify production deployment');

assert(fs.readFileSync('app-update.js','utf8').includes('/app-version.json'),'Updater manifest endpoint missing');
assert(fs.readFileSync('_redirects','utf8').includes('/app /app/ 301')&&fs.readFileSync('_redirects','utf8').includes('/app/ /app/home.html 200'),'Canonical app redirect missing');

const functions=[
  'admin-queues','admin-review','admin-account-ops','ai-support','execute-payout','monitor-deposits','complete-cycle-checkout',
  'public-signup','submit-deposit','submit-kyc','telegram-withdrawal','verify-deposit'
];
for(const f of functions)assert(exists('supabase/functions/'+f+'/index.ts'),'Missing Edge Function source: '+f);

const stale=['index.html','app.js','aegis-core.js','backend','preview','apk-artifact','database/schema.sql','scripts/smoke-api.js','scripts/test-core-auth.js','assets/apps'];
for(const p of stale)assert(!exists(p),'Legacy path remains in canonical main: '+p);

console.log('AegisPay canonical architecture validation: PASS');
assert(!fs.existsSync('netlify.toml'),'Obsolete Netlify production configuration must not return to canonical main');
