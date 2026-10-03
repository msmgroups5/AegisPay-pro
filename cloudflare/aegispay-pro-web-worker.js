const COMMIT = "2a4e5764f7c9c1b5139607e38313f9868b9e4cd7";
const RAW = "https://raw.githubusercontent.com/msmgroups5/AegisPay-pro/" + COMMIT + "/";
const MIME = {
  html: "text/html; charset=UTF-8",
  css: "text/css; charset=UTF-8",
  js: "text/javascript; charset=UTF-8",
  json: "application/json; charset=UTF-8",
  svg: "image/svg+xml",
  webmanifest: "application/manifest+json",
  txt: "text/plain; charset=UTF-8",
};

const ROOT_FILES = new Set([
  "styles.css",
  "premium.css",
  "client-home.css",
  "client-ui-reference.css",
  "client-auth.js",
  "supabase-client.js",
  "supabase-service.js",
  "aegis-auth-redirect.js",
  "app-update.js",
  "shop-catalog.js",
  "service-worker.js",
  "manifest.webmanifest",
  "aegispay-logo.svg",
  "aegispay-logo-light.svg",
  "app-version.json",
]);

function contentType(path) {
  if (path.endsWith(".html")) return MIME.html;
  if (path.endsWith(".css")) return MIME.css;
  if (path.endsWith(".js")) return MIME.js;
  if (path.endsWith(".json")) return MIME.json;
  if (path.endsWith(".svg")) return MIME.svg;
  if (path.endsWith(".webmanifest")) return MIME.webmanifest;
  return MIME.txt;
}

function sourcePath(pathname) {
  if (pathname === "/" || pathname === "/index.html") return "site/index.html";
  if (pathname === "/site.css") return "site/site.css";
  if (pathname === "/admin" || pathname === "/admin/") return "master-admin.html";
  if (pathname === "/app/master-admin.html") return "master-admin.html";
  if (pathname === "/app" ) return null;
  if (pathname === "/app/" || pathname === "/app/index.html" || pathname === "/app/home.html") return "client.html";

  if (pathname.startsWith("/app/")) {
    const file = pathname.slice("/app/".length);
    if (file === "auth/callback") return "client.html";
    if (ROOT_FILES.has(file)) return file;
  }

  const root = pathname.startsWith("/") ? pathname.slice(1) : pathname;
  if (ROOT_FILES.has(root)) return root;
  if (root === "master-admin.html" || root === "admin-auth.js") return root;
  if (root === "client.html") return root;
  return null;
}

function redirect(location, status = 301) {
  return new Response(null, { status, headers: { Location: location } });
}

async function handleRequest(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/app") return redirect("/app/");
    if (path === "/admin") return redirect("/admin/");
    if (path === "/auth/callback" || path === "/app/auth/callback") {
      return redirect("/app/home.html", 302);
    }

    const file = sourcePath(path);
    if (!file) {
      return new Response("AegisPay resource not found", {
        status: 404,
        headers: { "Content-Type": "text/plain; charset=UTF-8" },
      });
    }

    try {
      const upstream = await fetch(RAW + file, {
        cf: { cacheEverything: false },
        cache: "no-store",
      });

      if (!upstream.ok) {
        return new Response("AegisPay resource unavailable", {
          status: upstream.status,
          headers: { "Content-Type": "text/plain; charset=UTF-8" },
        });
      }

      const headers = new Headers(upstream.headers);
      headers.set("Content-Type", contentType(file));
      headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
      headers.set("Pragma", "no-cache");
      headers.set("X-AegisPay-Source-Commit", COMMIT);

      return new Response(upstream.body, {
        status: upstream.status,
        headers,
      });
    } catch (error) {
      return new Response("AegisPay service unavailable", {
        status: 502,
        headers: { "Content-Type": "text/plain; charset=UTF-8" },
      });
    }
}

addEventListener("fetch", event => {
  event.respondWith(handleRequest(event.request));
});
