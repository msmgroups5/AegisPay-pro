const {spawn} = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const port = 18080 + Math.floor(Math.random() * 400);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "aegispay-"));
const dataPath = path.join(tmp, "data.json");
fs.copyFileSync(path.join("backend", "data.json"), dataPath);

const child = spawn(process.execPath, ["backend/server.js"], {
  env: {...process.env, PORT:String(port), AEGISPAY_DATA_FILE:dataPath},
  stdio:["ignore","pipe","pipe"]
});

function wait(ms){return new Promise(r=>setTimeout(r,ms));}
async function request(url, options){
  for(let i=0;i<30;i++){
    try{return await fetch(url, options);}
    catch(e){await wait(100);}
  }
  throw new Error("API did not start");
}

(async()=>{
  try{
    let res = await request(`http://127.0.0.1:${port}/api/v1/health`);
    if(!res.ok) throw new Error("health endpoint failed");
    const health = await res.json();
    if(health.ok !== true) throw new Error("health payload invalid");

    res = await request(`http://127.0.0.1:${port}/api/v1/liquidity/metrics`);
    if(!res.ok) throw new Error("liquidity endpoint failed");
    const liquidity = await res.json();
    if(liquidity.liquidityRatio !== 98.4) throw new Error("liquidity payload invalid");

    res = await request(`http://127.0.0.1:${port}/api/v1/withdraw/request`,{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({userId:"USR-001",amount:100,destinationAddress:"DEMO-SMOKE-ADDRESS"})
    });
    if(res.status !== 201) throw new Error("withdraw request creation failed");
    const created = await res.json();
    if(created.status !== "PENDING_APPROVAL") throw new Error("withdraw status invalid");

    res = await request(`http://127.0.0.1:${port}/api/v1/withdraw/requests`,{
      headers:{"x-demo-role":"ADMIN"}
    });
    if(!res.ok) throw new Error("admin request list failed");

    res = await request(`http://127.0.0.1:${port}/api/v1/admin/approve`,{
      method:"POST",headers:{"Content-Type":"application/json","x-demo-role":"MASTER ADMIN"},
      body:JSON.stringify({requestId:created.id,decision:"APPROVE",approvedBy:"Master Administrator"})
    });
    if(!res.ok) throw new Error("master approval failed");
    const approved = await res.json();
    if(approved.request.status !== "APPROVED") throw new Error("approval status invalid");

    console.log("AegisPay API smoke tests: PASS");
  } finally {
    child.kill();
    fs.rmSync(tmp,{recursive:true,force:true});
  }
})().catch(err=>{
  console.error(err.stack || err.message);
  process.exitCode=1;
});
