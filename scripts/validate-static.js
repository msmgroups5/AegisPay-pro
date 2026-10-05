const fs=require('node:fs');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const exists=p=>fs.existsSync(p);

const must=[
  'client.html','client-fresh.html','client-home.css','master-admin.html','styles.css','premium.css','client-auth.js','admin-auth.js',
  'supabase-client.js','supabase-service.js','aegis-auth-redirect.js','app-update.js',
  'service-worker.js','manifest.webmanifest','_headers','aegispay-logo.svg','_redirects','package.json','netlify.toml',
  'database/migrations/20261003_private_verification_storage_policies.sql','database/migrations/20261004_restore_baseline_demo_configuration.sql',
  'database/migrations/20261005_align_withdrawal_wallet_rpc_grants.sql',
  'site/index.html','site/site.css','android/app/build.gradle',
  'android/app/src/main/java/com/aegispay/app/MainActivity.java',
  '.github/workflows/ci.yml','.github/workflows/android-apk.yml',
  '.github/workflows/web-portal-deploy.yml','.github/workflows/website-apk-release.yml'
];
for(const p of must)assert(exists(p),'Missing canonical source file: '+p);

const client=fs.readFileSync('client.html','utf8');
for(const marker of ['client-auth.js','supabase-client.js','supabase-service.js','aegis-auth-redirect.js','./client-home.css']) {
  assert(client.includes(marker),'Client runtime wiring is incomplete: '+marker);
}
for(const marker of ['AegisPay','app','AEGIS_ANDROID_APP']) {
  assert(client.includes(marker),'Client entry marker missing: '+marker);
}
assert(client.includes('client-home.css'),'Canonical client stylesheet is not wired to client');
assert(client.includes('client-auth.js'),'Canonical client runtime is not wired to client');
const clientAuth=fs.readFileSync('client-auth.js','utf8');
for(const marker of ['function homeView','function handleLogin','function refreshProfile']) {
  assert(clientAuth.includes(marker),'Clean Home Dashboard implementation missing: '+marker);
}
for(const marker of ['Welcome,','Client ID:','Top Up','Shop','Account Details','Crypto','Referral','Shop Millions','Assets','My Profile','AI Bot']) {
  assert(clientAuth.includes(marker),'Home Dashboard UI text missing: '+marker);
}
assert(clientAuth.length<75000,'Client source unexpectedly exceeded the merged client runtime budget');
assert(clientAuth.includes("rpc('link_withdrawal_wallet',{p_address:address,p_owner_name:owner})"),'Client withdrawal wallet flow is not aligned with the active two-argument RPC');
assert(!client.includes('aegis-core.js')&&!client.includes('app.js'),'Legacy demo scripts are still wired to client');

const admin=fs.readFileSync('master-admin.html','utf8');
assert(admin.includes('./admin-auth.js')&&!admin.includes('aegis-core.js')&&!admin.includes('app.js'),'Admin entry wiring incomplete');

const service=fs.readFileSync('supabase-service.js','utf8');
for(const m of [
  'claim_aegispay_profile','public-signup','signInWithPassword','resetPasswordForEmail',
  'request_withdrawal','app_runtime_enabled','set_app_runtime_enabled'
])assert(service.includes(m),'Supabase marker missing: '+m);

const gradle=fs.readFileSync('android/app/build.gradle','utf8');
assert(gradle.includes("include 'client.html'")&&gradle.includes("include 'client-fresh.html'")&&gradle.includes("include 'master-admin.html'"),'Android canonical entries missing');
assert(!gradle.includes('syncBlueprintRuntime')&&!gradle.includes('aegis-core.js')&&!gradle.includes('app.js'),'Legacy Android runtime remains wired');

const native=fs.readFileSync('android/app/src/main/java/com/aegispay/app/MainActivity.java','utf8');
assert(native.includes('aegispay-pro-web.aegispay.workers.dev')&&!native.includes('aegispay-client.netlify.app')&&!native.includes('__UNI__D835ED9'),'Android remote/legacy identity is stale');
assert(native.includes('aegispay-pro.pages.dev')&&native.includes('UPDATE_HOST'),'Android update endpoint must remain explicitly allowlisted for Cloudflare Pages');

const deploy=fs.readFileSync('.github/workflows/web-portal-deploy.yml','utf8');
assert(deploy.includes('cp client.html site/app/index.html'),'Deploy source of truth is not client.html');
assert(deploy.includes('cp master-admin.html site/master-admin.html'),'Admin deploy source is not master-admin.html');
assert(deploy.includes('rm -rf site/app site/downloads'),'Generated deploy directories are rebuilt cleanly');
assert(!deploy.includes('netlify-cli deploy'),'Legacy Netlify production deployment must stay disabled during Cloudflare migration');

const rel=fs.readFileSync('.github/workflows/website-apk-release.yml','utf8');
assert(rel.includes('cp client.html site/app/index.html'),'Release workflow source is not client.html');
assert(!rel.includes('netlify-cli deploy'),'Release workflow still has active Netlify production deployment');

assert(fs.readFileSync('app-update.js','utf8').includes('/app-version.json'),'Updater manifest endpoint missing');
assert(fs.readFileSync('_redirects','utf8').includes('/app /app/ 301')&&fs.readFileSync('_redirects','utf8').includes('/app/ /app/home.html 200'),'Canonical app redirect missing');

const functions=[
  'admin-queues','admin-review','admin-account-ops','ai-support','execute-payout','monitor-deposits',
  'public-signup','submit-deposit','submit-kyc','telegram-withdrawal','verify-deposit'
];
for(const f of functions)assert(exists('supabase/functions/'+f+'/index.ts'),'Missing Edge Function source: '+f);

const stale=['index.html','app.js','aegis-core.js','backend','preview','apk-artifact','database/schema.sql','scripts/smoke-api.js','scripts/test-core-auth.js','assets/apps'];
for(const p of stale)assert(!exists(p),'Legacy path remains in canonical main: '+p);

console.log('AegisPay canonical architecture validation: PASS');