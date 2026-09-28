const fs=require("node:fs");
const required=["index.html","styles.css","app.js","README.md","backend/server.js","backend/data.json","database/schema.sql",".github/workflows/pages.yml"];
for(const f of required) if(!fs.existsSync(f)) throw new Error("Missing required file: "+f);
const html=fs.readFileSync("index.html","utf8");
const js=fs.readFileSync("app.js","utf8");
if(!html.includes('id="app"')) throw new Error("App mount missing");
for(const marker of ["Operations Dashboard","My Nodes","Tasks","Referrals","Withdrawals","AI Assistant","Approval Center"]) if(!js.includes(marker)) throw new Error("Required UI marker missing: "+marker);
console.log("AegisPay static repository checks: PASS");
