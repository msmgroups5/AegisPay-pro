const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const PORT = Number(process.env.PORT || 8080);
const DATA_FILE = process.env.AEGISPAY_DATA_FILE || path.join(__dirname, "data.json");
const MAX_WITHDRAWAL = Number(process.env.MAX_DEMO_WITHDRAWAL || 100000);

function load() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function save(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}
function send(res, code, body) {
  res.writeHead(code, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer"
  });
  res.end(JSON.stringify(body));
}
function authRole(req) {
  return String(req.headers["x-demo-role"] || "USER").toUpperCase();
}
function requireAdmin(req, masterOnly = false) {
  const role = authRole(req);
  return masterOnly ? role === "MASTER ADMIN" : role === "ADMIN" || role === "MASTER ADMIN";
}
function body(req) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", chunk => {
      raw += chunk;
      if (raw.length > 1000000) req.destroy();
    });
    req.on("end", () => {
      try { resolve(raw ? JSON.parse(raw) : {}); } catch (e) { reject(e); }
    });
    req.on("error", reject);
  });
}
function riskScore(amount) {
  const base = Math.min(0.35, Math.max(0.02, amount / 5000));
  return Number((base + Math.random() * 0.03).toFixed(2));
}

const routes = {
  "/api/v1/health": () => ({
    ok: true,
    mode: "DEMO",
    service: "AegisPay",
    timestamp: new Date().toISOString()
  }),
  "/api/v1/liquidity/metrics": () => ({
    mode: "DEMO",
    liquidityRatio: 98.4,
    reserves: 98400,
    liabilities: 100000,
    availableLiquidity: 98400,
    timestamp: new Date().toISOString()
  }),
  "/api/v1/liquidity/audit": () => ({
    mode: "DEMO",
    verificationStatus: "SYSTEM DATA ONLY",
    methodology: "Internal demonstration dataset",
    independentAudit: false
  }),
  "/api/v1/ai-assistant/recommendation": () => ({
    mode: "DEMO",
    message: "Informational platform only; not individualized financial advice."
  })
};

const server = http.createServer(async (req, res) => {
  const data = load();
  const url = new URL(req.url, "http://localhost");

  try {
    if (req.method === "GET" && routes[url.pathname]) {
      return send(res, 200, routes[url.pathname](req, data));
    }

    if (req.method === "POST" && url.pathname === "/api/v1/ai-assistant/chat") {
      const input = await body(req);
      const q = String(input.message || "").toLowerCase();
      let message = "I can explain current nodes, tasks, referrals, liquidity data or withdrawal status from the demonstration dataset.";
      if (q.includes("node")) message = "Current node records are available under the Nodes view.";
      else if (q.includes("task")) message = "Open Tasks to review pending and completed activity.";
      else if (q.includes("referral")) message = "Open Referrals to review the multi-tier relationship view.";
      else if (q.includes("liquidity")) message = "System data currently shows a 98.4% liquidity ratio; this is not an independent financial audit.";
      else if (q.includes("withdraw")) message = "Withdrawal status is approval workflow data only; no payment is executed.";
      return send(res, 200, {
        mode: "DEMO",
        message,
        disclaimer: "Informational platform only; not individualized financial advice."
      });
    }

    if (req.method === "POST" && url.pathname === "/api/v1/withdraw/request") {
      const input = await body(req);
      const amount = Number(input.amount);
      const destinationAddress = String(input.destinationAddress || "").trim();
      if (!Number.isFinite(amount) || amount <= 0) return send(res, 400, {error:"Amount must be greater than zero."});
      if (amount > MAX_WITHDRAWAL) return send(res, 400, {error:"Amount exceeds the configured demo request limit."});
      if (!destinationAddress) return send(res, 400, {error:"Destination address is required."});
      const item = {
        id: "WD-" + crypto.randomInt(1000, 9999),
        userId: String(input.userId || "USR-001"),
        amount,
        destinationAddress,
        riskScore: riskScore(amount),
        status: "PENDING_APPROVAL",
        createdAt: new Date().toISOString(),
        approvedAt: null,
        approvedBy: null
      };
      data.withdrawals.unshift(item);
      data.activity.unshift({
        type: "Withdrawal request",
        location: "Account",
        text: item.id + " entered approval queue",
        time: "now"
      });
      save(data);
      return send(res, 201, item);
    }

    if (req.method === "GET" && url.pathname === "/api/v1/withdraw/requests") {
      if (!requireAdmin(req)) return send(res, 403, {error:"Administrator access required."});
      return send(res, 200, {mode:"DEMO",requests:data.withdrawals});
    }

    if (req.method === "POST" && url.pathname === "/api/v1/admin/approve") {
      if (!requireAdmin(req, true)) return send(res, 403, {error:"Master Admin access required."});
      const input = await body(req);
      const item = data.withdrawals.find(x => x.id === input.requestId);
      if (!item) return send(res, 404, {error:"Request not found."});
      if (item.status !== "PENDING_APPROVAL") return send(res, 409, {error:"Request is already finalized."});
      item.status = input.decision === "REJECT" ? "REJECTED" : "APPROVED";
      item.approvedAt = new Date().toISOString();
      item.approvedBy = String(input.approvedBy || "Master Administrator");
      data.activity.unshift({
        type:"Admin decision",
        location:"Approval Center",
        text:item.id+" → "+item.status,
        time:"now"
      });
      save(data);
      return send(res, 200, {
        mode:"DEMO",
        request:item,
        note:"Status and audit decision only. No real payment is executed."
      });
    }

    send(res, 404, {error:"Not found"});
  } catch (err) {
    send(res, 500, {error:"Server error"});
  }
});

server.listen(PORT, () => console.log("AegisPay demo API listening on " + PORT));
