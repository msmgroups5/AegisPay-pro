(function(){
'use strict';

var KEY='aegispay-v4-state';
var SESSION='aegispay-v4-session';

var TIERS=[
 {id:'T1',name:'Tier 1',deposit:30,profit:5,color:'green',rate:5/30},
 {id:'T2',name:'Tier 2',deposit:50,profit:10,color:'blue',rate:10/50},
 {id:'T3',name:'Tier 3',deposit:100,profit:15,color:'purple',rate:15/100},
 {id:'V1',name:'VVIP 1',deposit:250,profit:40,color:'gold',rate:40/250},
 {id:'V2',name:'VVIP 2',deposit:500,profit:65,color:'violet',rate:65/500},
 {id:'V3',name:'VVIP 3',deposit:1000,profit:135,color:'platinum',rate:135/1000}
];

var DEFAULT_SETTINGS={
 mode:'TESTNET_DEMO',
 network:'TRON TESTNET',
 receivingAddress:'TTEST-AEGISPAY-DEMO-RECEIVE',
 depositFee:2,
 repeatDepositMinimum:10,
 firstDepositMinimum:30,
 withdrawalMinimum:50,
 withdrawalFeeRate:0.10,
 cycleHours:18,
 passwordResetFreezeHours:24,
 referralL1:5,
 referralL2:2,
 profitBasis:'TIER_GROSS_DEPOSIT',
 support:'AI ASSISTANT',
 walletLocked:true,
 realPayouts:false,
 notes:'Prototype/Testnet only. No live custody or Mainnet payout execution.'
};

var DEMO_USERS=[
 {id:'USR-001',name:'Demo Client',email:'user@aegispay.demo',password:'AP10023',role:'USER',referralCode:'AEGIS001',referredBy:null,status:'NORMAL',wallet:'TTEST-CLIENT-001',walletOwnerName:'Demo Client',balance:75,principal:28,profit:47,manualCredit:0,firstDepositDone:true,selectedTier:'T1',registeredAt:'2026-09-28T10:00:00Z',frozenUntil:null,lastPasswordResetAt:null},
 {id:'ADM-001',name:'Operations Admin',email:'admin@aegispay.demo',password:'APADMIN',role:'ADMIN',referralCode:'ADMIN01',referredBy:null,status:'NORMAL',wallet:null,walletOwnerName:null,balance:0,principal:0,profit:0,manualCredit:0,firstDepositDone:false,selectedTier:null,registeredAt:'2026-09-28T10:00:00Z',frozenUntil:null,lastPasswordResetAt:null},
 {id:'MAS-001',name:'Master Administrator',email:'master@aegispay.demo',password:'APMASTER',role:'MASTER ADMIN',referralCode:'MASTER01',referredBy:null,status:'NORMAL',wallet:null,walletOwnerName:null,balance:0,principal:0,profit:0,manualCredit:0,firstDepositDone:false,selectedTier:null,registeredAt:'2026-09-28T10:00:00Z',frozenUntil:null,lastPasswordResetAt:null},
 {id:'USR-002',name:'Aisha Khan',email:'aisha@aegispay.demo',password:'DEMO123',role:'USER',referralCode:'AEGIS002',referredBy:'USR-001',status:'NORMAL',wallet:'TTEST-CLIENT-002',walletOwnerName:'Aisha Khan',balance:55,principal:28,profit:27,manualCredit:0,firstDepositDone:true,selectedTier:'T1',registeredAt:'2026-09-28T10:00:00Z',frozenUntil:null,lastPasswordResetAt:null},
 {id:'USR-003',name:'Usman Ali',email:'usman@aegispay.demo',password:'DEMO123',role:'USER',referralCode:'AEGIS003',referredBy:'USR-002',status:'NORMAL',wallet:'TTEST-CLIENT-003',walletOwnerName:'Usman Ali',balance:75,principal:28,profit:47,manualCredit:0,firstDepositDone:true,selectedTier:'T1',registeredAt:'2026-09-28T10:00:00Z',frozenUntil:null,lastPasswordResetAt:null}
];

var OFFERS=[
 {id:'O1',title:'Tier 1 Amazon Shopping',subtitle:'Standard product browsing + shopping task',tierMin:'T1',rewardText:'Tier 1 task',status:'ACTIVE'},
 {id:'O2',title:'Tier 2 Featured Products',subtitle:'Review and complete the assigned featured offer',tierMin:'T2',rewardText:'Tier 2 task',status:'ACTIVE'},
 {id:'O3',title:'Tier 3 Product Discovery',subtitle:'Complete the tier 3 product discovery task',tierMin:'T3',rewardText:'Tier 3 task',status:'ACTIVE'},
 {id:'O4',title:'VVIP 1 Premium Shopping',subtitle:'Complete the premium offer assigned to VVIP 1',tierMin:'V1',rewardText:'VVIP 1 task',status:'ACTIVE'},
 {id:'O5',title:'VVIP 2 Premium Review',subtitle:'Complete the premium review assigned to VVIP 2',tierMin:'V2',rewardText:'VVIP 2 task',status:'ACTIVE'},
 {id:'O6',title:'VVIP 3 Priority Offer',subtitle:'Complete the priority shopping offer assigned to VVIP 3',tierMin:'V3',rewardText:'VVIP 3 task',status:'ACTIVE'}
];

function now(){return Date.now();}
function iso(){return new Date().toISOString();}
function clone(x){return JSON.parse(JSON.stringify(x));}
function uid(prefix){return prefix+'-'+Math.random().toString(36).slice(2,7).toUpperCase()+'-'+Date.now().toString(36).slice(-5).toUpperCase();}
function baseState(){
 return {
  version:4,
  settings:clone(DEFAULT_SETTINGS),
  tiers:clone(TIERS),
  offers:clone(OFFERS),
  users:clone(DEMO_USERS),
  deposits:[],
  cycles:[],
  referrals:[],
  withdrawals:[],
  ledger:[],
  activity:[
   {id:uid('EV'),type:'System',text:'AegisPay testnet demo workspace initialized',time:iso(),userId:'MAS-001'},
   {id:uid('EV'),type:'Deposit',text:'Demo Client deposit verified',time:iso(),userId:'USR-001'}
  ],
  notifications:[
   {id:uid('NT'),userId:'USR-001',title:'Welcome to AegisPay',body:'Complete your profile and review the deposit instructions.',read:false,time:iso()},
   {id:uid('NT'),userId:'USR-001',title:'Testnet Mode Active',body:'This prototype does not move real funds.',read:false,time:iso()}
  ]
 };
}
function load(){
 try{
  var raw=localStorage.getItem(KEY);
  if(!raw){var s=baseState();localStorage.setItem(KEY,JSON.stringify(s));return s;}
  var s=JSON.parse(raw);
  s.settings=Object.assign(clone(DEFAULT_SETTINGS),s.settings||{});
  s.tiers=s.tiers||clone(TIERS);s.offers=s.offers||clone(OFFERS);s.users=s.users||clone(DEMO_USERS);
  s.deposits=s.deposits||[];s.cycles=s.cycles||[];s.referrals=s.referrals||[];s.withdrawals=s.withdrawals||[];s.ledger=s.ledger||[];s.activity=s.activity||[];s.notifications=s.notifications||[];
  return s;
 }catch(e){var fresh=baseState();localStorage.setItem(KEY,JSON.stringify(fresh));return fresh;}
}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));return s;}
function session(){try{return JSON.parse(localStorage.getItem(SESSION)||'null');}catch(e){return null;}}
function saveSession(v){localStorage.setItem(SESSION,JSON.stringify(v));}
function clearSession(){localStorage.removeItem(SESSION);}
function userById(s,id){return s.users.find(function(u){return u.id===id;});}
function currentProfile(){var sess=session(); if(!sess)return null; return userById(load(),sess.userId)||null;}
function profileOrThrow(){var p=currentProfile();if(!p)throw new Error('Please sign in first.');return p;}
function findTier(s,id){return s.tiers.find(function(t){return t.id===id;})||null;}
function can(role,action){
 if(action==='dashboard:read')return role==='USER'||role==='ADMIN'||role==='MASTER ADMIN';
 if(role==='MASTER ADMIN')return true;
 if(role==='ADMIN')return ['users:read','tasks:manage','referrals:read','withdrawals:read','activity:read'].indexOf(action)>=0;
 return ['withdrawals:create','tasks:read','referrals:read','profile:read','deposit:create','wallet:link','ai:use'].indexOf(action)>=0;
}
function assert(role,action){if(!can(role,action))throw new Error('Permission denied.');}

function authLogin(email,password){
 var s=load();var u=s.users.find(function(x){return x.email.toLowerCase()===String(email||'').trim().toLowerCase();});
 if(!u||u.password!==String(password||''))throw new Error('Invalid email or password.');
 if(u.status==='BLOCKED')throw new Error('Account is blocked. Contact Master Admin.');
 if(u.frozenUntil&&new Date(u.frozenUntil).getTime()>now())throw new Error('Account is temporarily frozen until '+new Date(u.frozenUntil).toLocaleString()+'.');
 saveSession({userId:u.id,role:u.role,at:iso()});
 return {profile:clone(u)};
}
function authLogout(){clearSession();return true;}

function signup(input){
 var s=load(),name=String(input.name||'').trim(),email=String(input.email||'').trim().toLowerCase(),password=String(input.password||''),refCode=String(input.referralCode||'').trim().toUpperCase();
 if(name.length<2)throw new Error('Enter your full name.');
 if(!email||password.length<6)throw new Error('Enter a valid email and a password of at least 6 characters.');
 if(s.users.some(function(u){return u.email.toLowerCase()===email;}))throw new Error('This email is already registered.');
 var ref=s.users.find(function(u){return u.referralCode===refCode;});
 var u={id:uid('USR'),name:name,email:email,password:password,role:'USER',referralCode:'AEGIS'+Math.random().toString(36).slice(2,7).toUpperCase(),referredBy:ref?ref.id:null,status:'NORMAL',wallet:null,walletOwnerName:null,balance:0,principal:0,profit:0,manualCredit:0,firstDepositDone:false,selectedTier:null,registeredAt:iso(),frozenUntil:null,lastPasswordResetAt:null};
 s.users.push(u);
 s.activity.unshift({id:uid('EV'),type:'Signup',text:u.name+' created an account',time:iso(),userId:u.id});
 save(s);saveSession({userId:u.id,role:u.role,at:iso()});
 return {profile:clone(u)};
}

function resetPassword(email,newPassword){
 var s=load(),u=s.users.find(function(x){return x.email.toLowerCase()===String(email||'').trim().toLowerCase();});
 if(!u)throw new Error('No account found for this email.');
 if(String(newPassword||'').length<6)throw new Error('New password must be at least 6 characters.');
 u.password=String(newPassword);u.lastPasswordResetAt=iso();u.frozenUntil=new Date(now()+s.settings.passwordResetFreezeHours*3600000).toISOString();
 s.notifications.unshift({id:uid('NT'),userId:u.id,title:'Security freeze enabled',body:'Password reset completed. Your account is temporarily frozen for security.',read:false,time:iso()});
 s.activity.unshift({id:uid('EV'),type:'Password reset',text:u.name+' reset the account password',time:iso(),userId:u.id});
 save(s);return true;
}

function linkWallet(address,ownerName){
 var p=profileOrThrow();assert(p.role,'wallet:link');
 if(p.role!=='USER')throw new Error('Only clients link withdrawal wallets.');
 var s=load(),u=userById(s,p.id);
 if(u.wallet)throw new Error('Withdrawal wallet is already linked. Only Master Admin can change it.');
 address=String(address||'').trim();ownerName=String(ownerName||'').trim();
 if(!address)throw new Error('Enter a valid TRON wallet address.');
 if(ownerName.toLowerCase()!==u.name.toLowerCase())throw new Error('Wallet owner name must match your signup name.');
 u.wallet=address;u.walletOwnerName=ownerName;
 s.ledger.unshift({id:uid('LED'),type:'WALLET_LINK',userId:u.id,amount:0,description:'Withdrawal wallet linked',time:iso(),meta:{address:address}});
 s.activity.unshift({id:uid('EV'),type:'Wallet',text:u.name+' linked a withdrawal wallet',time:iso(),userId:u.id});
 save(s);return clone(u);
}

function changeWalletByMaster(userId,address,ownerName){
 var p=profileOrThrow();assert(p.role,'settings:manage');
 var s=load();var u=userById(s,userId);if(!u)throw new Error('User not found.');
 if(String(ownerName||'').trim().toLowerCase()!==u.name.toLowerCase())throw new Error('Owner name must match the signup name in this prototype.');
 u.wallet=String(address||'').trim();u.walletOwnerName=String(ownerName||'').trim();
 s.ledger.unshift({id:uid('LED'),type:'WALLET_ADMIN_CHANGE',userId:u.id,amount:0,description:'Master Admin changed withdrawal wallet',time:iso(),actor:p.id});
 save(s);return clone(u);
}

function submitDeposit(input){
 var p=profileOrThrow();assert(p.role,'deposit:create');var s=load(),u=userById(s,p.id);
 if(u.status!=='NORMAL')throw new Error('Your account is not in normal status.');
 var tier=findTier(s,input.tierId);if(!tier)throw new Error('Please select a VIP tier.');
 var amount=Number(input.amount);
 if(!Number.isFinite(amount)||amount<tier.deposit)throw new Error('Deposit must meet the selected tier amount.');
 if(!u.firstDepositDone&&amount<s.settings.firstDepositMinimum)throw new Error('First deposit minimum is $30.');
 if(u.firstDepositDone&&amount<s.settings.repeatDepositMinimum)throw new Error('Additional deposits must be at least $10.');
 if(!input.screenshotName)throw new Error('Transaction screenshot is mandatory.');
 if(!input.txid)throw new Error('TXID is required for testnet verification.');
 var fee=s.settings.depositFee,credited=Math.max(0,amount-fee);
 var d={id:uid('DEP'),userId:u.id,tierId:tier.id,grossAmount:amount,fee:fee,creditedAmount:credited,screenshotName:input.screenshotName,txid:String(input.txid).trim(),status:'PENDING_VERIFICATION',createdAt:iso(),verifiedAt:null,verificationNote:'Awaiting blockchain/testnet verification'};
 s.deposits.unshift(d);save(s);return clone(d);
}

function verifyDeposit(depositId){
 var p=profileOrThrow();var s=load(),d=s.deposits.find(function(x){return x.id===depositId;});if(!d)throw new Error('Deposit not found.');
 if(p.role!=='MASTER ADMIN'&&d.userId!==p.id)throw new Error('Permission denied.');
 if(d.status!=='PENDING_VERIFICATION')throw new Error('Deposit already processed.');
 var u=userById(s,d.userId),tier=findTier(s,d.tierId);
 d.status='VERIFIED';d.verifiedAt=iso();d.verificationNote='Demo verification: screenshot TXID + configured receiving address match.';
 u.balance=Number(u.balance||0)+d.creditedAmount;u.principal=Number(u.principal||0)+d.creditedAmount;u.firstDepositDone=true;u.selectedTier=tier.id;
 s.ledger.unshift({id:uid('LED'),type:'USER_DEPOSIT',userId:u.id,amount:d.creditedAmount,description:'Verified deposit credit after $2 fee',time:iso(),meta:{gross:d.grossAmount,fee:d.fee,txid:d.txid,tier:tier.name}});
 s.activity.unshift({id:uid('EV'),type:'Deposit',text:u.name+' deposit verified for '+tier.name,time:iso(),userId:u.id});
 s.notifications.unshift({id:uid('NT'),userId:u.id,title:'Deposit verified',body:'Your verified amount of $'+d.creditedAmount.toFixed(2)+' is now reflected in your dashboard.',read:false,time:iso()});
 awardReferralBonuses(s,u);
 ensureCycleTasks(s,u.id);
 save(s);return clone(d);
}

function awardReferralBonuses(s,newUser){
 if(!newUser.firstDepositDone)return;
 var direct=userById(s,newUser.referredBy);if(!direct)return;
 var already=s.referrals.some(function(r){return r.referredUserId===newUser.id&&r.level===1;});
 if(!already){direct.balance+=s.settings.referralL1;direct.profit+=s.settings.referralL1;s.referrals.unshift({id:uid('REF'),userId:direct.id,referredUserId:newUser.id,level:1,bonus:s.settings.referralL1,time:iso()});s.ledger.unshift({id:uid('LED'),type:'REFERRAL_L1',userId:direct.id,amount:s.settings.referralL1,description:'Direct referral first-deposit bonus',time:iso(),meta:{referredUser:newUser.id}});}
 var second=userById(s,direct.referredBy);if(second){
  var already2=s.referrals.some(function(r){return r.referredUserId===newUser.id&&r.level===2;});
  if(!already2){second.balance+=s.settings.referralL2;second.profit+=s.settings.referralL2;s.referrals.unshift({id:uid('REF'),userId:second.id,referredUserId:newUser.id,level:2,bonus:s.settings.referralL2,time:iso()});s.ledger.unshift({id:uid('LED'),type:'REFERRAL_L2',userId:second.id,amount:s.settings.referralL2,description:'Second-level referral first-deposit bonus',time:iso(),meta:{referredUser:newUser.id}});}
 }
}

function ensureCycleTasks(s,userId){
 var open=s.cycles.find(function(c){return c.userId===userId&&c.status==='TASKS_OPEN';});if(open)return;
 var u=userById(s,userId),tier=findTier(s,u.selectedTier);if(!tier)return;
 var tierIndex=Object.fromEntries(s.tiers.map(function(t,i){return [t.id,i];}))[tier.id];
 var offerIds=s.offers.filter(function(o){return o.status==='ACTIVE'&&o.tierMin===tier.id;}).map(function(o){return o.id;});
 if(!offerIds.length){offerIds=s.offers.filter(function(o){return o.status==='ACTIVE';}).slice(0,1).map(function(o){return o.id;});}
 s.cycles.unshift({id:uid('CYC'),userId:userId,tierId:tier.id,cycleBase:u.balance,status:'TASKS_OPEN',taskIds:offerIds.map(function(id){return uid('TASK');}),offerIds:offerIds,completedOfferIds:[],startedAt:iso(),taskCompletedAt:null,readyAt:null,settledAt:null,profit:0});
}

function currentCycle(userId){
 var s=load();return s.cycles.find(function(c){return c.userId===userId&&['TASKS_OPEN','WAITING_18H'].indexOf(c.status)>=0;})||null;
}

function completeOffer(offerId){
 var p=profileOrThrow();assert(p.role,'tasks:read');var s=load(),u=userById(s,p.id),c=s.cycles.find(function(x){return x.userId===u.id&&x.status==='TASKS_OPEN';});
 if(!c)throw new Error('No active shopping cycle. Complete or verify a deposit first.');
 if(c.completedOfferIds.indexOf(offerId)>=0)throw new Error('Task already completed.');
 if(c.offerIds.indexOf(offerId)<0)throw new Error('This offer is not assigned to your cycle.');
 c.completedOfferIds.push(offerId);
 if(c.completedOfferIds.length>=c.offerIds.length){
  c.status='WAITING_18H';c.taskCompletedAt=iso();c.readyAt=new Date(now()+s.settings.cycleHours*3600000).toISOString();c.cycleBase=u.balance;
  u.balance=0;
  s.ledger.unshift({id:uid('LED'),type:'CYCLE_TASK_COMPLETE',userId:u.id,amount:c.cycleBase,description:'Cycle tasks completed; balance moved to settlement state',time:iso()});
  s.notifications.unshift({id:uid('NT'),userId:u.id,title:'Cycle completed',body:'All assigned tasks are complete. Your 18-hour settlement timer has started.',read:false,time:iso()});
 }
 s.activity.unshift({id:uid('EV'),type:'Task',text:u.name+' completed '+offerId,time:iso(),userId:u.id});
 save(s);return clone(c);
}

function settleReadyCycles(){
 var s=load(),changed=false,stamp=now();
 s.cycles.forEach(function(c){
  if(c.status!=='WAITING_18H'||!c.readyAt||new Date(c.readyAt).getTime()>stamp)return;
  var u=userById(s,c.userId);var tier=findTier(s,c.tierId);if(!u||!tier)return;
  var basis=Number(c.cycleBase||0),profit=basis*tier.rate,total=basis+profit;
  c.status='SETTLED';c.profit=profit;c.settledAt=iso();u.balance=total;u.profit+=profit;
  s.ledger.unshift({id:uid('LED'),type:'CYCLE_PROFIT',userId:u.id,amount:profit,description:'18-hour cycle profit credited using configured compounded rate',time:iso(),meta:{basis:basis,rate:tier.rate,tier:tier.name}});
  s.notifications.unshift({id:uid('NT'),userId:u.id,title:'Profit credited',body:'Your completed cycle has settled. $'+total.toFixed(2)+' is now shown in your dashboard.',read:false,time:iso()});
  s.activity.unshift({id:uid('EV'),type:'Cycle settlement',text:u.name+' cycle settled at $'+total.toFixed(2),time:iso(),userId:u.id});
  changed=true;ensureCycleTasks(s,u.id);
 });
 if(changed)save(s);return changed;
}

function createWithdrawal(amount){
 var p=profileOrThrow();assert(p.role,'withdrawals:create');settleReadyCycles();var s=load(),u=userById(s,p.id);
 if(u.status!=='NORMAL')throw new Error('Withdrawals are unavailable while the account is not normal.');
 amount=Number(amount);
 if(!Number.isFinite(amount)||amount<s.settings.withdrawalMinimum)throw new Error('Minimum withdrawal is $50.');
 if(!u.wallet)throw new Error('Link your withdrawal wallet first.');
 var available=Number(u.balance||0)-Number(u.withdrawalHeld||0);if(amount>available)throw new Error('Withdrawal exceeds your available balance.');
 var fee=amount*s.settings.withdrawalFeeRate,net=amount-fee;
 u.withdrawalHeld=Number(u.withdrawalHeld||0)+amount;
 var w={id:uid('WD'),userId:u.id,amount:amount,fee:fee,netAmount:net,destination:u.wallet,status:'PENDING_APPROVAL',createdAt:iso(),approvalDate:null,approvedBy:null,telegramStatus:'PREPARED'};
 s.withdrawals.unshift(w);s.ledger.unshift({id:uid('LED'),type:'WITHDRAWAL_REQUEST',userId:u.id,amount:amount,description:'Withdrawal request with 10% demo transfer fee',time:iso(),meta:{fee:fee,net:net}});
 s.notifications.unshift({id:uid('NT'),userId:u.id,title:'Withdrawal submitted',body:'Request '+w.id+' is pending Master Admin approval.',read:false,time:iso()});
 s.activity.unshift({id:uid('EV'),type:'Withdrawal request',text:u.name+' requested $'+amount.toFixed(2),time:iso(),userId:u.id});
 save(s);return clone(w);
}

function finalizeWithdrawal(requestId,approve){
 var p=profileOrThrow();if(p.role!=='MASTER ADMIN')throw new Error('Master Admin approval is required.');
 var s=load(),w=s.withdrawals.find(function(x){return x.id===requestId;});if(!w)throw new Error('Withdrawal request not found.');
 if(w.status!=='PENDING_APPROVAL')throw new Error('Withdrawal is already finalized.');
 var u=userById(s,w.userId);if(!u)throw new Error('User not found.');
 u.withdrawalHeld=Math.max(0,Number(u.withdrawalHeld||0)-w.amount);
 w.status=approve?'APPROVED':'REJECTED';w.approvalDate=iso();w.approvedBy=p.id;w.telegramStatus='MASTER_DECISION';
 if(approve){
  u.balance=Math.max(0,Number(u.balance||0)-w.amount);
  s.ledger.unshift({id:uid('LED'),type:'WITHDRAWAL_PAYOUT_SIMULATED',userId:u.id,amount:w.netAmount,description:'Approved payout recorded; no live blockchain transfer in prototype',time:iso(),meta:{fee:w.fee,requestId:w.id}});
  applyLiquiditySettlement(s,w);
  s.notifications.unshift({id:uid('NT'),userId:u.id,title:'Withdrawal approved',body:'Your request '+w.id+' has been approved. Prototype payout processing is simulated.',read:false,time:iso()});
 }else{
  s.notifications.unshift({id:uid('NT'),userId:u.id,title:'Withdrawal rejected',body:'Your request '+w.id+' was rejected by Master Admin.',read:false,time:iso()});
 }
 s.activity.unshift({id:uid('EV'),type:'Master Admin decision',text:w.id+' → '+w.status,time:iso(),userId:p.id});
 save(s);return clone(w);
}

function applyLiquiditySettlement(s,w){
 var u=userById(s,w.userId),ownPrincipal=Math.min(Number(u.principal||0),Number(w.netAmount||0)),remaining=Math.max(0,Number(w.netAmount||0)-ownPrincipal);
 if(remaining<=0)return;
 var others=s.users.filter(function(x){return x.role==='USER'&&x.id!==u.id&&x.principal>0&&x.status!=='BLOCKED';});
 if(!others.length)return;
 var each=remaining/others.length;
 others.forEach(function(o){
  var adj=Math.min(Number(o.principal||0),each);
  if(adj>0)s.ledger.unshift({id:uid('LED'),type:'LIQUIDITY_PRINCIPAL_ADJUSTMENT',userId:o.id,amount:-adj,description:'Backend liquidity settlement adjustment against approved withdrawal',time:iso(),meta:{sourceWithdrawal:w.id,displayBalanceAffected:false}});
 });
}

function manualCredit(userId,amount,reason){
 var p=profileOrThrow();if(p.role!=='MASTER ADMIN')throw new Error('Master Admin only.');
 var s=load(),u=userById(s,userId);amount=Number(amount);if(!u||!Number.isFinite(amount)||amount<=0)throw new Error('Valid amount required.');
 u.balance+=amount;u.manualCredit+=amount;
 s.ledger.unshift({id:uid('LED'),type:'MASTER_ADMIN_CREDIT',userId:u.id,amount:amount,description:reason||'Manual credit by Master Admin',time:iso(),actor:p.id});
 s.activity.unshift({id:uid('EV'),type:'Admin credit',text:'$'+amount.toFixed(2)+' credited to '+u.name,time:iso(),userId:p.id});
 save(s);return clone(u);
}
function manualReverse(userId,amount,reason){
 var p=profileOrThrow();if(p.role!=='MASTER ADMIN')throw new Error('Master Admin only.');
 var s=load(),u=userById(s,userId);amount=Number(amount);if(!u||!Number.isFinite(amount)||amount<=0)throw new Error('Valid amount required.');
 var allowed=Math.min(Number(u.balance||0),amount);u.balance-=allowed;u.manualCredit=Math.max(0,Number(u.manualCredit||0)-allowed);
 s.ledger.unshift({id:uid('LED'),type:'MASTER_ADMIN_REVERSAL',userId:u.id,amount:-allowed,description:reason||'Manual reversal by Master Admin',time:iso(),actor:p.id});
 s.activity.unshift({id:uid('EV'),type:'Admin reversal',text:'$'+allowed.toFixed(2)+' reversed from '+u.name,time:iso(),userId:p.id});
 save(s);return clone(u);
}
function setUserStatus(userId,status){
 var p=profileOrThrow();if(p.role!=='MASTER ADMIN')throw new Error('Master Admin only.');
 var s=load(),u=userById(s,userId);if(!u)throw new Error('User not found.');
 if(['NORMAL','FROZEN','BLOCKED'].indexOf(status)<0)throw new Error('Invalid status.');
 u.status=status;s.activity.unshift({id:uid('EV'),type:'Account status',text:u.name+' set to '+status,time:iso(),userId:p.id});save(s);return clone(u);
}
function markNotification(id){
 var p=profileOrThrow();var s=load(),n=s.notifications.find(function(x){return x.id===id;});if(n&&(n.userId===p.id||p.role==='MASTER ADMIN'))n.read=true;save(s);return true;
}
function updateSettings(patch){
 var p=profileOrThrow();if(p.role!=='MASTER ADMIN')throw new Error('Master Admin only.');
 var s=load();s.settings=Object.assign(s.settings,patch||{});s.activity.unshift({id:uid('EV'),type:'Settings',text:'Master Admin updated platform settings',time:iso(),userId:p.id});save(s);return clone(s.settings);
}
function getData(resource){
 settleReadyCycles();var s=load();var p=profileOrThrow();
 var map={users:s.users,tiers:s.tiers,offers:s.offers,deposits:s.deposits,cycles:s.cycles,referrals:s.referrals,withdrawals:s.withdrawals,ledger:s.ledger,activity:s.activity,notifications:s.notifications,settings:s.settings};
 var value=map[resource];if(value===undefined)throw new Error('Unknown resource.');
 if(resource==='users'&&p.role==='USER')return [clone(userById(s,p.id))];
 if(['deposits','cycles','referrals','withdrawals','ledger','notifications'].indexOf(resource)>=0&&p.role==='USER')return clone(value.filter(function(x){return x.userId===p.id||resource==='referrals'&&(x.referredUserId===p.id);}));
 if(resource==='activity'&&p.role==='USER')return clone(value.filter(function(x){return x.userId===p.id;}));
 if(['users','deposits','cycles','referrals','withdrawals','ledger','activity','notifications','tiers','offers','settings'].indexOf(resource)>=0)return clone(value);
 return clone(value);
}
function getDashboard(){
 settleReadyCycles();var s=load(),p=profileOrThrow(),u=userById(s,p.id),tier=u.selectedTier?findTier(s,u.selectedTier):null;
 var myCycles=s.cycles.filter(function(c){return c.userId===u.id;});
 var activeCycle=myCycles.find(function(c){return c.status==='TASKS_OPEN'||c.status==='WAITING_18H';})||null;
 var direct=s.users.filter(function(x){return x.referredBy===u.id;}).length;
 var level2=s.users.filter(function(x){var parent=userById(s,x.referredBy);return parent&&parent.referredBy===u.id;}).length;
 var pending=s.withdrawals.filter(function(w){return w.userId===u.id&&w.status==='PENDING_APPROVAL';}).reduce(function(a,w){return a+w.amount;},0);
 return {profile:clone(u),tier:clone(tier),activeCycle:clone(activeCycle),directReferrals:direct,level2Referrals:level2,pendingWithdrawal:pending,withdrawable:Math.max(0,u.balance-(u.withdrawalHeld||0)),settings:clone(s.settings)};
}
function adminSummary(){
 var s=load(),p=profileOrThrow();if(p.role==='USER')return {role:'USER'};
 return {role:p.role,totalUsers:s.users.filter(function(u){return u.role==='USER';}).length,activeUsers:s.users.filter(function(u){return u.role==='USER'&&u.status==='NORMAL';}).length,pendingWithdrawals:s.withdrawals.filter(function(w){return w.status==='PENDING_APPROVAL';}).length,approvedWithdrawals:s.withdrawals.filter(function(w){return w.status==='APPROVED';}).length,rejectedWithdrawals:s.withdrawals.filter(function(w){return w.status==='REJECTED';}).length,totalDeposits:s.deposits.filter(function(d){return d.status==='VERIFIED';}).reduce(function(a,d){return a+d.creditedAmount;},0),ledgerEvents:s.ledger.length};
}
function exportData(){var p=profileOrThrow();assert(p.role,'data:export');return load();}
function resetDemo(){var p=profileOrThrow();if(p.role!=='MASTER ADMIN')throw new Error('Master Admin only.');localStorage.setItem(KEY,JSON.stringify(baseState()));clearSession();return true;}
function getSystemState(){return load();}
function telegramPayload(requestId){
 var p=profileOrThrow();if(p.role!=='MASTER ADMIN')throw new Error('Master Admin only.');
 var s=load(),w=s.withdrawals.find(function(x){return x.id===requestId;});if(!w)throw new Error('Request not found.');var u=userById(s,w.userId);
 return {requestId:w.id,userId:u.id,user:u.name,amount:w.amount,fee:w.fee,net:w.netAmount,destination:w.destination,status:w.status,message:'AegisPay withdrawal approval request — Master Admin action required.'};
}

window.AegisCore={
 config:{mode:'TESTNET_DEMO',network:'TRON TESTNET'},
 tiers:TIERS,can:can,session:session,saveSession:saveSession,clearSession:clearSession,currentProfile:currentProfile,
 authLogin:authLogin,authLogout:authLogout,signup:signup,resetPassword:resetPassword,linkWallet:linkWallet,changeWalletByMaster:changeWalletByMaster,
 submitDeposit:submitDeposit,verifyDeposit:verifyDeposit,completeOffer:completeOffer,settleReadyCycles,createWithdrawal:createWithdrawal,finalizeWithdrawal:finalizeWithdrawal,
 markNotification:markNotification,updateSettings:updateSettings,getData:getData,getDashboard:getDashboard,adminSummary:adminSummary,manualCredit:manualCredit,manualReverse:manualReverse,
 setUserStatus:setUserStatus,exportData:exportData,resetDemo:resetDemo,getSystemState:getSystemState,telegramPayload:telegramPayload,
 currentCycle:currentCycle
};
})();