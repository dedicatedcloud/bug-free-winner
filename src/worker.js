/**
 * Cloudflare Worker that serves static assets from /public and adds secure headers.
 * Uses Wrangler v3 "assets" feature which binds env.ASSETS.
 */
export default {
  async fetch(request, env, ctx) {
    // Only allow GET/HEAD to static content; reject others (you can add API routes explicitly below).
    const method = request.method.toUpperCase();
    if (!["GET", "HEAD"].includes(method)) {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Example API route (optional): GET /api/health
    const url = new URL(request.url);
    if (url.pathname === "/api/health") {
      return withSecurityHeaders(
        new Response(JSON.stringify({ ok: true, ts: new Date().toISOString() }), {
          status: 200,
          headers: { "content-type": "application/json; charset=utf-8" }
        })
      );
    }

    // Serve static asset from /public (index.html, about.html, CSS, JS, etc.)
    // env.ASSETS.fetch handles ETag/304 and edge caching for you.
    const assetResponse = await env.ASSETS.fetch(request);

    // If not found, return a tidy 404 page (you can create /public/404.html and map it here if desired)
    if (assetResponse.status === 404) {
      return withSecurityHeaders(
        new Response(
          `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Not found</title>
<meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,Cantarell,Noto Sans,sans-serif;max-width:60ch;margin:10vh auto;padding:0 1rem;">
  <h1>404 – Page not found</h1>
  <p>The page you requested does not exist.</p>
  <p><a href="/">Go home</a></p>
</body>
</html>`,
          { status: 404, headers: { "content-type": "text/html; charset=utf-8" } }
        )
      );
    }

    // Add security headers to the asset response
    return withSecurityHeaders(assetResponse);
  }
};

/**
 * Clone a response and add strict security headers suitable for a static site.
 */
function withSecurityHeaders(resp) {
  const headers = new Headers(resp.headers);

  // Content Security Policy: self-only by default; adjust if you use external CDNs/fonts.
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'", // allow inline styles in demo HTML; remove 'unsafe-inline' if not needed
    "img-src 'self' data:",
    "font-src 'self' data:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join("; ");

  headers.set("Content-Security-Policy", csp);
  headers.set("Referrer-Policy", "no-referrer");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers
  });
}