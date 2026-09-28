/* AegisPay browser demo foundation */
(function () {
  var USERS = [
    {id:"U1", email:"user@aegispay.demo", pass:"demo123", name:"Alex Morgan", role:"USER", balance:12480},
    {id:"A1", email:"admin@aegispay.demo", pass:"demo123", name:"Operations Admin", role:"ADMIN", balance:0},
    {id:"M1", email:"master@aegispay.demo", pass:"demo123", name:"Master Administrator", role:"MASTER ADMIN", balance:0}
  ];
  var NODES = [
    {id:"N-001",user:"U1",tier:"Guardian",region:"New York",country:"USA",allocation:12500,yieldPct:1.24},
    {id:"N-002",user:"U1",tier:"Sentinel",region:"Dubai",country:"UAE",allocation:6200,yieldPct:.92},
    {id:"N-003",user:"U1",tier:"Sentinel",region:"London",country:"UK",allocation:8400,yieldPct:.96},
    {id:"N-004",user:"U1",tier:"Vanguard",region:"Singapore",country:"Singapore",allocation:17500,yieldPct:1.31}
  ];
  var TASKS = [
    {id:"T-101",user:"U1",title:"Node Health Review",status:"In Progress",progress:70,reward:18},
    {id:"T-102",user:"U1",title:"Referral Orientation",status:"Pending",progress:20,reward:12},
    {id:"T-103",user:"U1",title:"Weekly Dashboard Review",status:"Completed",progress:100,reward:10}
  ];
  var REFS = [{id:"R-001",user:"U1",level:1,reward:42},{id:"R-002",user:"U1",level:1,reward:28}];
  var WITHDRAWALS = JSON.parse(localStorage.getItem("aegis_withdrawals") || "null") || [
    {id:"WD-1042",user:"U1",amount:100,destination:"DEMO-ADDRESS",risk:.02,status:"PENDING_APPROVAL"}
  ];
  var session = JSON.parse(localStorage.getItem("aegis_session") || "null");
  var page = "dashboard";
  var root = document.getElementById("app");

  function currentUser(){ return USERS.find(function(u){ return u.id === (session && session.id); }) || session; }
  function money(v){ return new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(v); }
  function badge(s){ return '<span class="badge">' + s.replace(/_/g," ") + '</span>'; }
  function save(){ localStorage.setItem("aegis_withdrawals", JSON.stringify(WITHDRAWALS)); }
  function go(p){ page=p; render(); }
  function nav(p,t,roles){
    if(roles && roles.indexOf(currentUser().role) < 0) return "";
    return '<button class="nav-btn ' + (page===p ? "active" : "") + '" onclick="Aegis.go(\''+p+'\')">' + t + '</button>';
  }
  function hero(t,s){ return '<div class="hero"><div><h2>'+t+'</h2><p>'+s+'</p></div>'+badge("SYSTEM DATA")+" "+badge("DEMO MODE")+"</div>"; }
  function shell(body){
    return '<div class="app-shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">A</div><b>AegisPay</b></div>' +
      nav("dashboard","Dashboard")+nav("nodes","My Nodes")+nav("tasks","Tasks")+nav("referrals","Referrals")+nav("activity","Activity")+nav("withdrawals","Withdrawals")+nav("ai","AI Assistant")+nav("profile","Profile") +
      nav("admin","Admin Dashboard",["ADMIN","MASTER ADMIN"])+nav("users","Users",["ADMIN","MASTER ADMIN"])+nav("manage-nodes","Node Management",["ADMIN","MASTER ADMIN"])+nav("manage-tasks","Task Management",["ADMIN","MASTER ADMIN"])+nav("manage-referrals","Referral Management",["ADMIN","MASTER ADMIN"])+nav("approvals","Approval Center",["MASTER ADMIN"])+nav("logs","Audit Logs",["ADMIN","MASTER ADMIN"])+nav("settings","Settings",["ADMIN","MASTER ADMIN"]) +
      '</aside><main><header class="topbar"><b>'+page+'</b><span>'+badge("SYSTEM ONLINE")+" "+badge(currentUser().role)+' <button class="btn" onclick="Aegis.logout()">Logout</button></span></header>'+body+'</main></div>';
  }
  function tablePage(title,heads,rows){
    return shell('<section class="page">'+hero(title,"Authorized administrative records.")+'<div class="card table-wrap"><table class="table"><tr>'+heads.map(function(h){return "<th>"+h+"</th>";}).join("")+"</tr>"+rows+"</table></div></section>");
  }
  function dashboard(){
    var me=currentUser();
    var ns=NODES.filter(function(n){return n.user===me.id;});
    var ts=TASKS.filter(function(t){return t.user===me.id;});
    var ws=WITHDRAWALS.filter(function(w){return w.user===me.id;});
    var cards=[
      ["Current Balance",money(me.balance)],
      ["Active Nodes",ns.length],
      ["Pending Withdrawals",money(ws.filter(function(w){return w.status==="PENDING_APPROVAL";}).reduce(function(a,w){return a+w.amount;},0))],
      ["Referral Records",REFS.filter(function(r){return r.user===me.id;}).length]
    ];
    var html='<section class="page">'+hero("Operations Dashboard","Account, nodes, tasks, referrals, liquidity and withdrawal workflow.")+
      '<div class="alert">System data only. No real payment, blockchain execution or custody operation is connected.</div><div class="grid metrics">'+
      cards.map(function(c){return '<div class="card metric"><span>'+c[0]+'</span><strong>'+c[1]+'</strong></div>';}).join("")+
      '</div><div class="grid two"><div class="card"><h3>Liquidity & Reserves</h3><div class="gauge"><strong>98.4%</strong><small>System liquidity ratio</small></div>'+
      '<div class="kpi"><span>Current reserves</span><b>'+money(98400)+'</b></div><div class="kpi"><span>Current liabilities</span><b>'+money(100000)+'</b></div><div class="kpi"><span>Audit status</span><b>Not independent</b></div></div>'+
      '<div class="card"><h3>Global Node Network</h3><div class="map">'+["New York","London","Dubai","Singapore","Tokyo","Sydney"].map(function(x,i){return '<i style="left:'+(12+i*15)+'%;top:'+(28+(i%3)*22)+'%"><span>'+x+'</span></i>';}).join("")+'</div></div></div>'+
      '<div class="grid two"><div class="card"><h3>Task Progress</h3>'+ts.map(function(t){return '<div class="kpi"><span>'+t.title+'</span><b>'+t.progress+'%</b></div><div class="progress"><span style="width:'+t.progress+'%"></span></div>';}).join("")+'</div>'+
      '<div class="card"><h3>AI Strategy Assistant</h3><p class="muted">Informational application only; not individualized financial advice.</p><button class="btn primary" onclick="Aegis.go(\'ai\')">Open Assistant</button></div></div></section>';
    return shell(html);
  }
  function nodes(){
    var me=currentUser();
    var list=NODES.filter(function(n){return n.user===me.id;}).map(function(n){
      return '<div class="card"><div class="kpi"><span>'+n.id+'</span>'+badge("ACTIVE")+'</div><h3>'+n.tier+'</h3><p>'+n.region+', '+n.country+'</p><div class="kpi"><span>Allocation</span><b>'+money(n.allocation)+'</b></div><div class="kpi"><span>Current yield</span><b>'+n.yieldPct+'%</b></div><button class="btn primary" onclick="Aegis.node(\''+n.id+'\')">View Details</button></div>';
    }).join("");
    return shell('<section class="page">'+hero("My Nodes","Current hardware/node records.")+'<div class="grid cards">'+list+'</div></section>');
  }
  function tasks(){
    var me=currentUser();
    var list=TASKS.filter(function(t){return t.user===me.id;}).map(function(t){
      return '<div class="card"><div class="kpi"><span>'+t.title+'</span>'+badge(t.status)+'</div><div class="progress"><span style="width:'+t.progress+'%"></span></div><p>'+t.progress+'% complete · Reward '+money(t.reward)+'</p><button class="btn primary" '+(t.status==="Completed"?"disabled":"")+' onclick="Aegis.complete(\''+t.id+'\')">'+(t.status==="Completed"?"Completed":"Mark Complete")+'</button></div>';
    }).join("");
    return shell('<section class="page">'+hero("Tasks","Task activity and progress.")+'<div class="grid cards">'+list+'</div></section>');
  }
  function referrals(){
    var me=currentUser();
    var rs=REFS.filter(function(r){return r.user===me.id;});
    return shell('<section class="page">'+hero("Referrals","Multi-tier referral records.")+'<div class="grid metrics">'+
      '<div class="card metric"><span>Referral Code</span><strong>AEG-AX9</strong></div>'+
      '<div class="card metric"><span>Level 1</span><strong>'+rs.length+'</strong></div>'+
      '<div class="card metric"><span>Network Records</span><strong>'+rs.length+'</strong></div>'+
      '<div class="card metric"><span>System Rewards</span><strong>'+money(rs.reduce(function(a,r){return a+r.reward;},0))+'</strong></div></div></section>');
  }
  function activity(){
    var rows=[["Node heartbeat","New York","NODE-NY-01 healthy","2 min ago"],["Task sync","Dubai","TASK-102 synchronized","6 min ago"],["Referral activity","London","Level 1 activity recorded","11 min ago"]];
    return shell('<section class="page">'+hero("Activity Stream","System-generated current activity.")+'<div class="card">'+rows.map(function(a){return '<div class="activity-row"><i></i><div><b>'+a[0]+' · '+a[1]+'</b><small>'+a[2]+'</small></div><small>'+a[3]+'</small></div>';}).join("")+'</div></section>');
  }
  function withdrawals(){
    var me=currentUser();
    var rows=WITHDRAWALS.filter(function(w){return w.user===me.id;}).map(function(w){return '<tr><td>'+w.id+'</td><td>'+money(w.amount)+'</td><td>'+w.destination+'</td><td>'+w.risk.toFixed(2)+'</td><td>'+badge(w.status)+'</td></tr>';}).join("");
    return shell('<section class="page">'+hero("Withdrawals","Request tracking and approval status.")+'<div class="card"><h3>New Withdrawal Request</h3><div class="form-grid"><input id="amount" class="input" type="number" min="1" placeholder="Amount"><input id="destination" class="input" placeholder="Destination Address"><button class="btn primary" onclick="Aegis.withdraw()">Submit Request</button></div></div><div class="card table-wrap"><table class="table"><tr><th>ID</th><th>Amount</th><th>Destination</th><th>Risk</th><th>Status</th></tr>'+rows+'</table></div></section>');
  }
  function ai(){ return shell('<section class="page">'+hero("AI Strategy Assistant","Current-data informational assistant.")+'<div class="card"><div id="chat" class="chat"><div class="info-box">Informational application only; not individualized financial advice.</div></div><div class="form-grid"><input id="question" class="input" placeholder="Ask about nodes, tasks, referrals, liquidity or withdrawals"><button class="btn primary" onclick="Aegis.ai()">Send</button></div></div></section>'); }
  function profile(){var me=currentUser();return shell('<section class="page">'+hero("Profile","Account information.")+'<div class="card">'+[["Name",me.name],["Email",me.email],["User ID",me.id],["Role",me.role],["Balance",money(me.balance)]].map(function(x){return '<div class="kpi"><span>'+x[0]+'</span><b>'+x[1]+'</b></div>';}).join("")+'</div></section>');}
  function admin(){return tablePage("Admin Dashboard",["Metric","Value"],'<tr><td>Total Users</td><td>'+USERS.length+'</td></tr><tr><td>Active Nodes</td><td>'+NODES.length+'</td></tr><tr><td>Pending Approvals</td><td>'+WITHDRAWALS.filter(function(w){return w.status==="PENDING_APPROVAL";}).length+'</td></tr>');}
  function approvals(){
    if(currentUser().role!=="MASTER ADMIN") return tablePage("Access Restricted",["Status"],"<tr><td>Master Admin access required.</td></tr>");
    var rows=WITHDRAWALS.map(function(w){return '<tr><td>'+w.id+'</td><td>'+w.user+'</td><td>'+money(w.amount)+'</td><td>'+w.destination+'</td><td>'+w.risk.toFixed(2)+'</td><td>'+badge(w.status)+'</td><td>'+(w.status==="PENDING_APPROVAL"?'<button class="btn" onclick="Aegis.approve(\''+w.id+'\',1)">Approve</button> <button class="btn" onclick="Aegis.approve(\''+w.id+'\',0)">Reject</button>':"—")+'</td></tr>';}).join("");
    return tablePage("Approval Center",["Request","User","Amount","Destination","Risk","Status","Action"],rows);
  }
  var views={dashboard:dashboard,nodes:nodes,tasks:tasks,referrals:referrals,activity:activity,withdrawals:withdrawals,ai:ai,profile:profile,admin:admin,approvals:approvals};
  views.users=function(){return tablePage("User Management",["ID","Name","Email","Role"],USERS.map(function(u){return "<tr><td>"+u.id+"</td><td>"+u.name+"</td><td>"+u.email+"</td><td>"+u.role+"</td></tr>";}).join(""));};
  views["manage-nodes"]=function(){return tablePage("Node Management",["ID","User","Tier","Region","Allocation"],NODES.map(function(n){return "<tr><td>"+n.id+"</td><td>"+n.user+"</td><td>"+n.tier+"</td><td>"+n.region+"</td><td>"+money(n.allocation)+"</td></tr>";}).join(""));};
  views["manage-tasks"]=function(){return tablePage("Task Management",["ID","Title","User","Status","Progress"],TASKS.map(function(t){return "<tr><td>"+t.id+"</td><td>"+t.title+"</td><td>"+t.user+"</td><td>"+t.status+"</td><td>"+t.progress+"%</td></tr>";}).join(""));};
  views["manage-referrals"]=function(){return tablePage("Referral Management",["ID","User","Level","Reward"],REFS.map(function(r){return "<tr><td>"+r.id+"</td><td>"+r.user+"</td><td>Level "+r.level+"</td><td>"+money(r.reward)+"</td></tr>";}).join(""));};
  views.logs=function(){return tablePage("Audit Logs",["Event","Status"],WITHDRAWALS.map(function(w){return "<tr><td>"+w.id+"</td><td>"+w.status+"</td></tr>";}).join(""));};
  views.settings=function(){return tablePage("Platform Settings",["Setting","Value"],"<tr><td>System Mode</td><td>DEMO</td></tr><tr><td>Data Source</td><td>Local system dataset</td></tr><tr><td>Real payment execution</td><td>Not connected</td></tr><tr><td>Audit</td><td>Not independent</td></tr>");};

  function render(){
    if(!session){
      root.innerHTML='<div class="login-shell"><div class="card login"><div class="brand"><div class="brand-mark">A</div><b>AegisPay</b></div><h2>Sign in</h2><input id="email" class="input" value="user@aegispay.demo"><input id="pass" class="input" type="password" value="demo123"><button class="btn primary" style="width:100%;margin-top:12px" onclick="Aegis.login()">Sign In</button><div class="demo-users">User: user@aegispay.demo / demo123<br>Admin: admin@aegispay.demo / demo123<br>Master: master@aegispay.demo / demo123</div></div></div>';
      return;
    }
    if(!views[page]) page="dashboard";
    if(["admin","users","manage-nodes","manage-tasks","logs"].indexOf(page)>=0 && currentUser().role==="USER") page="dashboard";
    if(page==="approvals" && currentUser().role!=="MASTER ADMIN") page="dashboard";
    root.innerHTML=views[page]();
  }

  window.Aegis={
    login:function(){var e=$("email").value.trim(),p=$("pass").value,u=USERS.find(function(x){return x.email===e&&x.pass===p;});if(!u)return alert("Invalid demo credentials");session=u;localStorage.setItem("aegis_session",JSON.stringify(u));page="dashboard";render();},
    logout:function(){session=null;localStorage.removeItem("aegis_session");render();},
    go:go,
    complete:function(id){var t=TASKS.find(function(x){return x.id===id;});if(t){t.status="Completed";t.progress=100;render();}},
    node:function(id){var n=NODES.find(function(x){return x.id===id;});if(n)alert(n.tier+" · "+n.id+"\\n"+n.region+", "+n.country+"\\nAllocation: "+money(n.allocation)+"\\nCurrent yield: "+n.yieldPct+"%");},
    withdraw:function(){var a=Number($("amount").value),d=$("destination").value.trim();if(!(a>0)||!d)return alert("Valid amount and destination are required");WITHDRAWALS.unshift({id:"WD-"+Math.floor(1000+Math.random()*9000),user:currentUser().id,amount:a,destination:d,risk:.02,status:"PENDING_APPROVAL"});save();render();},
    approve:function(id,ok){if(currentUser().role!=="MASTER ADMIN")return;var w=WITHDRAWALS.find(function(x){return x.id===id;});if(w&&w.status==="PENDING_APPROVAL"){w.status=ok?"APPROVED":"REJECTED";save();render();}},
    ai:function(){var q=$("question").value.trim();if(!q)return;var l=q.toLowerCase(),a="I can explain current nodes, tasks, referrals, liquidity or withdrawals.";if(l.indexOf("node")>=0)a="You have "+NODES.filter(function(n){return n.user===currentUser().id;}).length+" active node record(s).";else if(l.indexOf("task")>=0)a="You have "+TASKS.filter(function(t){return t.user===currentUser().id&&t.status!=="Completed";}).length+" open task(s).";else if(l.indexOf("referral")>=0)a="You have "+REFS.filter(function(r){return r.user===currentUser().id;}).length+" referral record(s).";else if(l.indexOf("liquidity")>=0)a="System liquidity is 98.4%; this is not an independent financial audit.";else if(l.indexOf("withdraw")>=0)a="Withdrawal approval is a status workflow only; no real payment is executed.";$("chat").innerHTML+="<div class='chat-row'><b>You:</b> "+q+"<br><b>AegisPay:</b> "+a+"</div>";$("question").value="";}
  };
  function $(id){return document.getElementById(id);}
  render();
})();