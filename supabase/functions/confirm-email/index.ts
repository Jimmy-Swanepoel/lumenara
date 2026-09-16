// Public, unauthenticated landing page for signup confirmation links (deployed
// with --no-verify-jwt - real users clicking an email link carry no bearer
// token). Supabase's own confirmation link points here (set as
// emailRedirectTo at signup, see lib/auth.js) with a `to` query param holding
// the actual app deep link that was live at signup time - either an EAS
// build's fixed lumenara:// scheme, or Expo Go's ephemeral exp://host:port
// scheme, whichever the signup happened under. That's what makes this work
// for same-device Expo Go testing AND the real distributed build with one
// page: we don't guess the scheme, we carry forward the exact one signup used.
//
// GoTrue appends the session tokens after redirecting here - either as a URL
// hash fragment (#access_token=...&refresh_token=...) for the implicit flow,
// or a `code` query param for PKCE. Fragments never reach the server, so this
// has to read them client-side and merge them onto `to` before attempting
// window.location.href - if that hands off to the app (same device, app
// installed and able to own that scheme), this page is only ever glimpsed for
// an instant. If the OS can't open it (different device, or Expo Go can't own
// the app's own lumenara:// scheme the way a real build does), the page stays
// up and reveals the fallback below after a short wait.
Deno.serve((req) => {
  const url = new URL(req.url)
  const to = url.searchParams.get('to') ?? ''

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Account verified</title>
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
    background: #F4F4F6; padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  @media (prefers-color-scheme: dark) { body { background: #16171D; } }
  .card {
    max-width: 380px; width: 100%; text-align: center;
    background: #FFFFFF; border-radius: 24px; padding: 44px 28px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.08);
  }
  @media (prefers-color-scheme: dark) { .card { background: #1F2027; box-shadow: none; } }
  .icon {
    width: 72px; height: 72px; border-radius: 999px; background: #E8E8FB; margin: 0 auto 20px;
    display: flex; align-items: center; justify-content: center; font-size: 32px; color: #5B5BD6;
  }
  @media (prefers-color-scheme: dark) { .icon { background: #2A2A45; } }
  h1 { font-size: 21px; margin: 0 0 10px; color: #111827; }
  @media (prefers-color-scheme: dark) { h1 { color: #F2F2F5; } }
  p { font-size: 15px; line-height: 1.5; color: #6B7280; margin: 0 0 26px; }
  a.btn {
    display: inline-block; background: #5B5BD6; color: #fff; text-decoration: none;
    font-weight: 700; padding: 14px 30px; border-radius: 12px; font-size: 15px;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="icon">&#10003;</div>
    <h1>Your account is verified</h1>
    <p id="msg">Opening Lumenara&hellip;</p>
    <a class="btn" id="openBtn" href="#" style="display:none;">Open Lumenara</a>
  </div>
  <script>
    (function () {
      var to = ${JSON.stringify(to)};
      var hash = window.location.hash;
      var code = new URLSearchParams(window.location.search).get('code');

      var target = to;
      if (target && hash) {
        target += hash;
      } else if (target && code) {
        target += (target.indexOf('?') === -1 ? '?' : '&') + 'code=' + encodeURIComponent(code);
      }

      var msg = document.getElementById('msg');
      var btn = document.getElementById('openBtn');

      if (!target) {
        msg.textContent = 'You can now log in from the app.';
        return;
      }

      btn.href = target;
      window.location.href = target;

      setTimeout(function () {
        if (!document.hidden) {
          msg.textContent = "You're verified — tap below to open the app.";
          btn.style.display = 'inline-block';
        }
      }, 1500);
    })();
  </script>
</body>
</html>`

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } })
})
