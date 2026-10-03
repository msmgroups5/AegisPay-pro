const fs=require('node:fs');
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)};
const exists=p=>fs.existsSync(p);

const must=[
  'client.html','master-admin.html','styles.css','premium.css','client-auth.js','admin-auth.js',
  'supabase-client.js','supabase-service.js','aegis-auth-redirect.js','app-update.js',
  'service-worker.js','manifest.webmanifest','aegispay-logo.svg','_redirects','package.json','netlify.toml',
  'database/migrations/20261003_private_verification_storage_policies.sql',
  'site/index.html','site/site.css','android/app/build.gradle',
  'android/app/src/main/java/com/aegispay/app/MainActivity.java',
  '.github/workflows/ci.yml','.github/workflows/android-apk.yml',
  '.github/workflows/web-portal-deploy.yml','.github/workflows/website-apk-release.yml'
];
for(const p of must)assert(exists(p),'Missing canonical source file: '+p);

const client=fs.readFileSync('client.html','utf8');
assert(
  client.includes('./client-auth.js')&&
  client.includes('./supabase-client.js')&&
  client.includes('./supabase-service.js')&&
  client.includes('./shop-catalog.js'),
  'Client entry wiring incomplete'
);
assert(!client.includes('aegis-core.js')&&!client.includes('app.js'),'Legacy demo scripts are still wired to client');

const admin=fs.readFileSync('master-admin.html','utf8');
assert(admin.includes('./admin-auth.js')&&!admin.includes('aegis-core.js')&&!admin.includes('app.js'),'Admin entry wiring incomplete');

const service=fs.readFileSync('supabase-service.js','utf8');
for(const m of [
  'claim_aegispay_profile','public-signup','signInWithPassword','resetPasswordForEmail',
  'request_withdrawal','app_runtime_enabled','set_app_runtime_enabled'
])assert(service.includes(m),'Supabase marker missing: '+m);

const gradle=fs.readFileSync('android/app/build.gradle','utf8');
assert(gradle.includes("include 'client.html'")&&gradle.includes("include 'master-admin.html'"),'Android canonical entries missing');
assert(!gradle.includes('syncBlueprintRuntime')&&!gradle.includes('aegis-core.js')&&!gradle.includes('app.js'),'Legacy Android runtime remains wired');

const native=fs.readFileSync('android/app/src/main/java/com/aegispay/app/MainActivity.java','utf8');
assert(native.includes('aegispay-pro.netlify.app')&&!native.includes('aegispay-client.netlify.app')&&!native.includes('__UNI__D835ED9'),'Android remote/legacy identity is stale');

const deploy=fs.readFileSync('.github/workflows/web-portal-deploy.yml','utf8');
assert(deploy.includes('NETLIFY_SITE_ID: 80dd262c-dfec-427a-9820-0eb98ec829b5'),'Netlify site ID is not canonical');
assert(deploy.includes('cp client.html site/app/index.html'),'Deploy source of truth is not client.html');
assert(deploy.includes('cp master-admin.html site/master-admin.html'),'Admin deploy source is not master-admin.html');
assert(deploy.includes('rm -rf site/app site/downloads'),'Generated deploy directories are rebuilt cleanly');
assert(!deploy.includes('0aa38615-c9e6-4129-bc08-cd28739606d0')&&!deploy.includes('aegispay-client.netlify.app'),'Stale Netlify target remains');

const rel=fs.readFileSync('.github/workflows/website-apk-release.yml','utf8');
assert(rel.includes('cp client.html site/app/index.html')&&rel.includes('80dd262c-dfec-427a-9820-0eb98ec829b5')&&!rel.includes('0aa38615-c9e6-4129-bc08-cd28739606d0'),'Release workflow is not canonical');

assert(fs.readFileSync('app-update.js','utf8').includes('https://aegispay-pro.netlify.app/app-version.json'),'Updater endpoint is stale');
assert(fs.readFileSync('_redirects','utf8').includes('/app /app/ 301'),'Canonical app redirect missing');

const functions=[
  'admin-queues','admin-review','ai-support','execute-payout','monitor-deposits',
  'public-signup','submit-deposit','submit-kyc','telegram-withdrawal','verify-deposit'
];
for(const f of functions)assert(exists('supabase/functions/'+f+'/index.ts'),'Missing Edge Function source: '+f);

const stale=['index.html','app.js','aegis-core.js','backend','preview','apk-artifact','database/schema.sql','scripts/smoke-api.js','scripts/test-core-auth.js','assets/apps'];
for(const p of stale)assert(!exists(p),'Legacy path remains in canonical main: '+p);

console.log('AegisPay canonical architecture validation: PASS');