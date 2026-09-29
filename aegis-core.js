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

var DEMO_USERS=[];

var OFFERS=[
 {id:'O1',title:'Tier 1 Shopping Set',subtitle:'Assigned AegisPay Shop tasks for Tier 1',tierMin:'T1',rewardText:'Tier 1 task',status:'ACTIVE'},
 {id:'O2',title:'Tier 2 Shopping Set',subtitle:'Assigned AegisPay Shop tasks for Tier 2',tierMin:'T2',rewardText:'Tier 2 task',status:'ACTIVE'},
 {id:'O3',title:'Tier 3 Shopping Set',subtitle:'Assigned AegisPay Shop tasks for Tier 3',tierMin:'T3',rewardText:'Tier 3 task',status:'ACTIVE'},
 {id:'O4',title:'VVIP 1 Premium Set',subtitle:'Assigned AegisPay Shop tasks for VVIP 1',tierMin:'V1',rewardText:'VVIP 1 task',status:'ACTIVE'},
 {id:'O5',title:'VVIP 2 Premium Set',subtitle:'Assigned AegisPay Shop tasks for VVIP 2',tierMin:'V2',rewardText:'VVIP 2 task',status:'ACTIVE'},
 {id:'O6',title:'VVIP 3 Priority Set',subtitle:'Assigned AegisPay Shop tasks for VVIP 3',tierMin:'V3',rewardText:'VVIP 3 task',status:'ACTIVE'}
];

var SHOP_CATALOG=[
 {id:'P01',title:'AeroPods Pro 2',category:'Electronics',subcategory:'Headphones',brand:'Aegis Select',art:'pods',rating:4.8,badge:'Featured',image:'',marketPrice:199,stock:42},
 {id:'P02',title:'Nova Phone 15',category:'Electronics',subcategory:'Mobile Phones',brand:'Aegis Select',art:'phone',rating:4.8,badge:'-15%',image:'',marketPrice:699,stock:18},
 {id:'P03',title:'VisionBook Air',category:'Electronics',subcategory:'Laptops',brand:'Aegis Select',art:'laptop',rating:4.8,badge:'-18%',image:'',marketPrice:999,stock:12},
 {id:'P04',title:'Pulse Watch 9',category:'Electronics',subcategory:'Smart Watches',brand:'Aegis Select',art:'watch',rating:4.7,badge:'Hot',image:'',marketPrice:249,stock:31},
 {id:'P05',title:'StreetRun Max',category:'Fashion',subcategory:'Footwear',brand:'Aegis Select',art:'shoe',rating:4.7,badge:'New',image:'',marketPrice:149,stock:25},
 {id:'P06',title:'Aero Hoodie',category:'Fashion',subcategory:'Men',brand:'Aegis Select',art:'hoodie',rating:4.8,badge:'Top Pick',image:'',marketPrice:79,stock:36},
 {id:'P07',title:'Classic Timepiece',category:'Fashion',subcategory:'Accessories',brand:'Aegis Select',art:'timepiece',rating:4.8,badge:'-20%',image:'',marketPrice:129,stock:19},
 {id:'P08',title:'Urban Tote',category:'Fashion',subcategory:'Accessories',brand:'Aegis Select',art:'bag',rating:4.7,badge:'New',image:'',marketPrice:59,stock:28},
 {id:'P09',title:'BrewMaster Coffee Set',category:'Home & Kitchen',subcategory:'Kitchen',brand:'Aegis Select',art:'coffee',rating:4.7,badge:'Featured',image:'',marketPrice:69,stock:17},
 {id:'P10',title:'Air Fryer Pro',category:'Home & Kitchen',subcategory:'Appliances',brand:'Aegis Select',art:'fryer',rating:4.6,badge:'Hot',image:'',marketPrice:119,stock:22},
 {id:'P11',title:'PureGlow Beauty Kit',category:'Beauty',subcategory:'Skin Care',brand:'Aegis Select',art:'beauty',rating:4.8,badge:'Best Seller',image:'',marketPrice:49,stock:54},
 {id:'P12',title:'SmartClean Vacuum',category:'Home & Kitchen',subcategory:'Appliances',brand:'Aegis Select',art:'vacuum',rating:4.6,badge:'-22%',image:'',marketPrice:179,stock:14}
];

var LIVE_MARKET_ENDPOINT='https://dummyjson.com/products?limit=100';

function now(){return Date.now();}
function iso(){return new Date().toISOString();}
function clone(x){return JSON.parse(JSON.stringify(x));}
function uid(prefix){return prefix+'-'+Math.random().toString(36).slice(2,7).toUpperCase()+'-'+Date.now().toString(36).slice(-5).toUpperCase();}
function baseState(){
 return {
  version:5,
  settings:clone(DEFAULT_SETTINGS),
  tiers:clone(TIERS),
  offers:clone(OFFERS),
  catalog:clone(SHOP_CATALOG),
  users:clone(DEMO_USERS),
  deposits:[],
  cycles:[],
  referrals:[],
  shopItems:[],
  carts:{},
  orders:[],
  withdrawals:[],
  ledger:[],
  activity:[{id:uid('EV'),type:'System',text:'AegisPay operational workspace initialized',time:iso(),userId:null}],
  notifications:[]
 };
}
function load(){
 try{
  var raw=localStorage.getItem(KEY);
  if(!raw){var s=baseState();localStorage.setItem(KEY,JSON.stringify(s));return s;}
  var s=JSON.parse(raw);
   s.settings=Object.assign(clone(DEFAULT_SETTINGS),s.settings||{});
  s.tiers=s.tiers||clone(TIERS);s.offers=s.offers||clone(OFFERS);s.catalog=s.catalog||clone(SHOP_CATALOG);
  s.liveMarket=s.liveMarket||{provider:'Live marketplace catalog',updatedAt:null,lastStatus:'NOT_LOADED'};
  s.users=(s.users||clone(DEMO_USERS)).filter(function(u){return !/@aegispay\.demo$/i.test(String(u.email||''));});
  s.deposits=s.deposits||[];s.cycles=s.cycles||[];s.referrals=s.referrals||[];s.shopItems=s.shopItems||[];s.carts=s.carts||{};s.orders=s.orders||[];s.withdrawals=s.withdrawals||[];s.ledger=s.ledger||[];s.activity=s.activity||[];s.notifications=s.notifications||[];
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

function cents(n){return Math.round((Number(n)||0)*100);}
function money2(c){return cents(c)/100;}
function createAssignedShopItems(s,c,u,tier){
 var balanceCents=cents(c.cycleBase), count=6;
 var weights=[20,18,17,15,14,16];
 var items=[],used=0;
 for(var i=0;i<count;i++){
  var amountCents=(i===count-1)?(balanceCents-used):Math.max(1,Math.floor(balanceCents*weights[i]/100));
  used+=amountCents;
  var product=s.catalog[i % s.catalog.length];
  var profitCents=Math.round(amountCents*tier.rate);
  items.push({
   id:uid('ITM'),
   cycleId:c.id,
   userId:u.id,
   productId:product.id,
   title:product.title,
   category:product.category,
   subcategory:product.subcategory,
   brand:product.brand,
   art:product.art,
   rating:product.rating,
   badge:product.badge,
   amount:money2(amountCents),
   profit:money2(profitCents),
   amountCents:amountCents,
   profitCents:profitCents,
   status:'AVAILABLE',
   addedAt:null,
   completedAt:null
  });
 }
 s.shopItems=s.shopItems.filter(function(x){return x.cycleId!==c.id;}).concat(items);
 c.shopItemIds=items.map(function(x){return x.id;});
 c.offerIds=c.shopItemIds.slice();
 c.completedOfferIds=[];
 c.completedItemIds=[];
 c.taskProfit=0;
}
function syncCycleLiveProducts(s,c){
 var changed=false,ids=c.shopItemIds||[];
 ids.forEach(function(id,index){
  var item=s.shopItems.find(function(x){return x.id===id;});
  var product=s.catalog[index%s.catalog.length];
  if(!item||!product)return;
  item.productId=product.id;
  ['title','category','subcategory','brand','art','rating','badge','image','marketPrice','stock'].forEach(function(k){
   if(product[k]!==undefined&&item[k]!==product[k]){item[k]=product[k];changed=true;}
  });
 });
 return changed;
}
function ensureCycleTasks(s,userId){
 var open=s.cycles.find(function(c){return c.userId===userId&&(c.status==='TASKS_OPEN'||c.status==='WAITING_18H');});
 if(open){syncCycleLiveProducts(s,open);return;}
 var u=userById(s,userId),tier=findTier(s,u.selectedTier);if(!tier)return;
 var base=Math.max(0,Number(u.balance||0));if(base<=0)return;
 var offer=s.offers.find(function(o){return o.status==='ACTIVE'&&o.tierMin===tier.id;});
 var c={id:uid('CYC'),userId:userId,tierId:tier.id,cycleBase:base,status:'TASKS_OPEN',taskIds:[],offerIds:[],shopItemIds:[],completedOfferIds:[],completedItemIds:[],startedAt:iso(),taskCompletedAt:null,readyAt:null,settledAt:null,profit:0,taskProfit:0,offerSetId:offer?offer.id:null};
 s.cycles.unshift(c);
 s.carts[c.id]=[];
 createAssignedShopItems(s,c,u,tier);
}
function currentCycle(userId){
 var s=load();return s.cycles.find(function(c){return c.userId===userId&&['TASKS_OPEN','WAITING_18H'].indexOf(c.status)>=0;})||null;
}

function currentOpenCycleFor(p,s){
 return s.cycles.find(function(c){return c.userId===p.id&&c.status==='TASKS_OPEN';})||null;
}
async function refreshLiveCatalog(force){
 var s=load(),stamp=s.liveMarket&&s.liveMarket.updatedAt?new Date(s.liveMarket.updatedAt).getTime():0;
 if(!force&&stamp&&now()-stamp<15*60*1000)return {live:s.liveMarket.lastStatus==='LIVE',count:s.catalog.length,updatedAt:s.liveMarket.updatedAt};
 try{
  var response=await fetch(LIVE_MARKET_ENDPOINT,{headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('Marketplace service returned '+response.status);
  var payload=await response.json(),products=Array.isArray(payload.products)?payload.products:[];
  if(!products.length)throw new Error('Marketplace returned no products.');
  s.catalog=products.slice(0,60).map(function(p,i){
   var cat=String(p.category||'Other').replace(/-/g,' ');
   var titleCase=function(v){return String(v||'').replace(/\b\w/g,function(x){return x.toUpperCase();});};
   var art=cat.indexOf('laptop')>=0?'laptop':cat.indexOf('mobile')>=0||cat.indexOf('smartphone')>=0?'phone':cat.indexOf('shoes')>=0?'shoe':cat.indexOf('shirts')>=0?'hoodie':cat.indexOf('dresses')>=0?'dress':cat.indexOf('fragrances')>=0||cat.indexOf('beauty')>=0?'beauty':cat.indexOf('furniture')>=0?'bag':cat.indexOf('kitchen')>=0||cat.indexOf('groceries')>=0?'fryer':'phone';
   return {id:'LIVE-'+p.id,title:String(p.title||'Marketplace Product'),category:titleCase(cat),subcategory:titleCase(cat),brand:String(p.brand||'Marketplace Brand'),art:art,rating:Number(p.rating||4.5),badge:Number(p.discountPercentage||0)>=15?'-'+Math.round(p.discountPercentage)+'%':(i%9===0?'Featured':'Popular'),image:String(p.thumbnail||((p.images||[])[0]||'')),marketPrice:Number(p.price||0),stock:Number(p.stock||0)};
  });
  s.liveMarket={provider:'Live marketplace catalog',updatedAt:iso(),lastStatus:'LIVE'};
  s.cycles.forEach(function(c){syncCycleLiveProducts(s,c);});
  save(s);
  return {live:true,count:s.catalog.length,updatedAt:s.liveMarket.updatedAt};
 }catch(e){
  s.liveMarket=s.liveMarket||{};
  s.liveMarket.lastStatus='ERROR';
  s.liveMarket.lastError=String(e.message||e);
  save(s);
  return {live:false,count:s.catalog.length,error:String(e.message||e),updatedAt:s.liveMarket.updatedAt||null};
}
}
function getShopState(){
 settleReadyCycles();
 var p=profileOrThrow(),s=load(),c=s.cycles.find(function(x){return x.userId===p.id&&(x.status==='TASKS_OPEN'||x.status==='WAITING_18H');});
 if(!c)return {cycle:null,items:[],cart:[],cartItems:[],available:[],remaining:0,total:0,profit:0,canCheckout:false,liveMarket:clone(s.liveMarket||{})};
 syncCycleLiveProducts(s,c);
 var items=s.shopItems.filter(function(x){return x.cycleId===c.id&&x.status!=='CANCELLED';});
 var cartIds=s.carts[c.id]||[];
 var cartItems=items.filter(function(x){return cartIds.indexOf(x.id)>=0;});
 var total=cartItems.reduce(function(a,x){return a+cents(x.amount);},0)/100;
 var balance=Number(c.cycleBase||0);
 var remaining=Math.max(0,Math.round((balance-total)*100)/100);
 var available=items.filter(function(x){return x.status==='AVAILABLE'&&cartIds.indexOf(x.id)<0&&cents(x.amount)<=cents(remaining);});
 save(s);
 return {cycle:clone(c),items:clone(items),cart:clone(cartIds),cartItems:clone(cartItems),available:clone(available),remaining:remaining,total:total,profit:cartItems.reduce(function(a,x){return a+Number(x.profit||0);},0),canCheckout:c.status==='TASKS_OPEN'&&cents(remaining)===0&&cartItems.length>0,liveMarket:clone(s.liveMarket||{})};
}
function addToCart(itemId){
 var p=profileOrThrow();assert(p.role,'tasks:read');var s=load(),c=currentOpenCycleFor(p,s);
 if(!c)throw new Error('There is no open Shop cycle.');
 var item=s.shopItems.find(function(x){return x.id===itemId&&x.cycleId===c.id;});if(!item)throw new Error('Shop item not found.');
 if(item.status!=='AVAILABLE')throw new Error('This item is not available.');
 s.carts[c.id]=s.carts[c.id]||[];
 if(s.carts[c.id].indexOf(itemId)>=0)throw new Error('Item already added to cart.');
 var total=s.carts[c.id].reduce(function(sum,id){var x=s.shopItems.find(function(y){return y.id===id;});return sum+(x?cents(x.amount):0);},0);
 if(total+cents(item.amount)>cents(c.cycleBase))throw new Error('This item is above your remaining cycle balance.');
 s.carts[c.id].push(itemId);item.addedAt=iso();save(s);return getShopState();
}
function removeFromCart(itemId){
 var p=profileOrThrow();var s=load(),c=currentOpenCycleFor(p,s);if(!c)throw new Error('There is no open Shop cycle.');
 s.carts[c.id]=(s.carts[c.id]||[]).filter(function(id){return id!==itemId;});
 save(s);return getShopState();
}
function clearCart(){
 var p=profileOrThrow();var s=load(),c=currentOpenCycleFor(p,s);if(!c)throw new Error('There is no open Shop cycle.');
 s.carts[c.id]=[];save(s);return getShopState();
}
function smartFillCart(){
 var p=profileOrThrow();var s=load(),c=currentOpenCycleFor(p,s);if(!c)throw new Error('There is no open Shop cycle.');
 s.carts[c.id]=(c.shopItemIds||[]).slice();
 s.carts[c.id].forEach(function(id){var item=s.shopItems.find(function(x){return x.id===id;});if(item)item.addedAt=iso();});
 save(s);return getShopState();
}
function checkoutCart(){
 var p=profileOrThrow(),s=load(),c=currentOpenCycleFor(p,s);if(!c)throw new Error('There is no open Shop cycle.');
 var ids=s.carts[c.id]||[],items=ids.map(function(id){return s.shopItems.find(function(x){return x.id===id&&x.cycleId===c.id;});}).filter(Boolean);
 var totalCents=items.reduce(function(a,x){return a+cents(x.amount);},0),baseCents=cents(c.cycleBase);
 if(totalCents!==baseCents)throw new Error('Complete the task set until Remaining Balance is exactly $0.00.');
 if(!items.length)throw new Error('Add your Shop tasks to the cart first.');
 var taskProfit=items.reduce(function(a,x){return a+cents(x.profit);},0)/100;
 items.forEach(function(x){x.status='COMPLETED';x.completedAt=iso();});
 c.completedOfferIds=items.map(function(x){return x.id;});
 c.completedItemIds=items.map(function(x){return x.id;});
 c.taskProfit=taskProfit;
 c.profit=taskProfit;
 c.status='WAITING_18H';
 c.taskCompletedAt=iso();
 c.readyAt=new Date(now()+s.settings.cycleHours*3600000).toISOString();
 p=profileOrThrow();var u=userById(s,p.id);u.balance=0;
 s.orders.unshift({
  id:uid('ORD'),userId:u.id,cycleId:c.id,total:c.cycleBase,profit:taskProfit,status:'COMPLETED_TASKS',createdAt:iso(),
  items:items.map(function(x){return {itemId:x.id,title:x.title,amount:x.amount,profit:x.profit,art:x.art};})
 });
 s.ledger.unshift({id:uid('LED'),type:'SHOP_CHECKOUT',userId:u.id,amount:c.cycleBase,description:'AegisPay Shop task set completed; balance moved to 18-hour settlement',time:iso(),meta:{items:items.length,taskProfit:taskProfit}});
 s.notifications.unshift({id:uid('NT'),userId:u.id,title:'All Shop tasks completed',body:'Your balance reached $0.00. The 18-hour settlement timer is now running.',read:false,time:iso()});
 s.activity.unshift({id:uid('EV'),type:'Shop checkout',text:u.name+' completed '+items.length+' assigned Shop tasks',time:iso(),userId:u.id});
 s.carts[c.id]=[];
 save(s);return clone(c);
}
function completeOffer(offerId){
 var state=addToCart(offerId);
 if(state.canCheckout)return checkoutCart();
 return state.cycle;
}

function rejectDeposit(depositId,note){
 var p=profileOrThrow();if(p.role!=='MASTER ADMIN')throw new Error('Master Admin only.');
 var s=load(),d=s.deposits.find(function(x){return x.id===depositId;});if(!d)throw new Error('Deposit not found.');
 if(d.status!=='PENDING_VERIFICATION')throw new Error('Deposit already processed.');
 d.status='REJECTED';d.verificationNote=note||'Deposit rejected by Master Admin';d.verifiedAt=null;
 var u=userById(s,d.userId);if(u)s.notifications.unshift({id:uid('NT'),userId:u.id,title:'Deposit rejected',body:d.verificationNote,read:false,time:iso()});
 s.activity.unshift({id:uid('EV'),type:'Deposit rejected',text:'Deposit '+d.id+' rejected',time:iso(),userId:p.id});
 save(s);return clone(d);
}

function settleReadyCycles(){
 var s=load(),changed=false,stamp=now();
 s.cycles.forEach(function(c){
  if(c.status!=='WAITING_18H'||!c.readyAt||new Date(c.readyAt).getTime()>stamp)return;
  var u=userById(s,c.userId);var tier=findTier(s,c.tierId);if(!u||!tier)return;
  var basis=Number(c.cycleBase||0),profit=Number(c.taskProfit||0);
  if(!profit)profit=Math.round(basis*tier.rate*100)/100;
  var total=Math.round((basis+profit)*100)/100;
  c.status='SETTLED';c.profit=profit;c.settledAt=iso();u.balance=total;u.profit+=profit;
  s.ledger.unshift({id:uid('LED'),type:'CYCLE_PROFIT',userId:u.id,amount:profit,description:'18-hour Shop task settlement credited',time:iso(),meta:{basis:basis,rate:tier.rate,tier:tier.name,taskProfit:profit}});
  s.notifications.unshift({id:uid('NT'),userId:u.id,title:'Profit credited',body:'Your completed Shop cycle settled. Total available amount: '+total.toFixed(2)+'.',read:false,time:iso()});
  s.activity.unshift({id:uid('EV'),type:'Cycle settlement',text:u.name+' cycle settled at '+total.toFixed(2),time:iso(),userId:u.id});
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
 currentCycle:currentCycle,refreshLiveCatalog:refreshLiveCatalog,getShopState:getShopState,addToCart:addToCart,removeFromCart:removeFromCart,clearCart:clearCart,smartFillCart:smartFillCart,checkoutCart:checkoutCart,rejectDeposit:rejectDeposit
};
})();
