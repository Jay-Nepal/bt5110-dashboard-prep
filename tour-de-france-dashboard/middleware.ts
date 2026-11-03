// Password gate for the Vercel deployment.
//
// Vercel runs this file before every request, static files included (no matcher
// is exported), so the page, CSVs, map and DuckDB WASM are only served after the
// password is entered. Set DASHBOARD_PASSWORD in Vercel → Project Settings →
// Environment Variables. If it is missing, every request is refused.
//
// Local `npm run dev` / `npm run preview` do not run this file, so they stay open.
import {next} from '@vercel/functions';

const PASSWORD_ENV = 'DASHBOARD_PASSWORD';
const COOKIE = 'tdf_auth';
const LOGIN_PATH = '/__login';
const LOGOUT_PATH = '/__logout';
const SESSION_DAYS = 30;
const WRONG_PASSWORD_DELAY_MS = 600;

const encoder = new TextEncoder();

// The session cookie is an HMAC derived from the password, so changing the
// password in Vercel signs everyone out without any stored session state.
async function token(password: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode('tdf-dashboard-session-v1'));
  return Array.from(new Uint8Array(mac), b => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function readCookie(request: Request, name: string): string | undefined {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const eq = part.indexOf('=');
    if (eq > -1 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return undefined;
}

// Only same-site paths, so the login form cannot be used as an open redirect.
function safeReturnPath(value: FormDataEntryValue | null): string {
  const path = typeof value === 'string' ? value : '/';
  const ok = path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\') && !/[\r\n]/.test(path) && !path.startsWith(LOGIN_PATH) && !path.startsWith(LOGOUT_PATH);
  return ok ? path : '/';
}

function redirect(location: string, cookie?: string): Response {
  const headers: Record<string, string> = {Location: location, 'Cache-Control': 'no-store'};
  if (cookie) headers['Set-Cookie'] = cookie;
  return new Response(null, {status: 303, headers});
}

function escapeAttr(value: string): string {
  return value.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`);
}

function html(body: string, status: number): Response {
  return new Response(body, {status, headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Frame-Options': 'DENY'}});
}

function loginPage(wrong: boolean, returnTo = '/'): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Le Tour Lab · Sign in</title>
<style>
:root{--bg:#f5f5f1;--panel:#fff;--ink:#18222e;--muted:#586471;--line:#dfe3e4;--accent:#f3ce3b;--error:#b3261e;color-scheme:light}
@media (prefers-color-scheme:dark){:root{--bg:#10171f;--panel:#18222e;--ink:#f1f4f7;--muted:#b5c0cc;--line:#354351;--error:#ffb4ab;color-scheme:dark}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;padding:16px;background:var(--bg);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
form{width:100%;max-width:360px;background:var(--panel);border:1px solid var(--line);border-top:6px solid var(--accent);border-radius:12px;padding:28px}
h1{margin:0 0 4px;font-size:1.35rem}
p{margin:0 0 20px;color:var(--muted);font-size:.95rem}
label{display:block;font-weight:600;font-size:.9rem;margin-bottom:6px}
input{width:100%;font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--ink)}
input:focus-visible,button:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
button{margin-top:16px;width:100%;font:inherit;font-weight:700;padding:10px 12px;border:0;border-radius:8px;background:var(--accent);color:#18222e;cursor:pointer}
.error{color:var(--error);font-size:.9rem;margin:10px 0 0}
</style></head><body>
<form method="post" action="${LOGIN_PATH}">
<h1>Le Tour Lab</h1>
<p>Tour de France 2025 dashboard · BT5110 Group 31</p>
<label for="password">Password</label>
<input id="password" name="password" type="password" autocomplete="current-password" required autofocus${wrong ? ' aria-invalid="true" aria-describedby="error"' : ''}>
${wrong ? '<p class="error" id="error" role="alert">Incorrect password. Try again.</p>' : ''}
<input type="hidden" name="next" id="next" value="${escapeAttr(returnTo)}">
<button type="submit">View dashboard</button>
</form>
<script>
// Keep deep links (#/rider?rider=11 and demo steps) working after signing in.
if(location.pathname!=='${LOGIN_PATH}')document.getElementById('next').value=location.pathname+location.search+location.hash;
</script>
</body></html>`;
}

export default async function middleware(request: Request): Promise<Response> {
  const password = process.env[PASSWORD_ENV];
  if (!password) {
    return new Response(`${PASSWORD_ENV} is not set for this deployment. Add it in Vercel → Project Settings → Environment Variables, then redeploy.`, {status: 503, headers: {'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store'}});
  }

  const {pathname} = new URL(request.url);
  const expected = await token(password);
  const signedIn = safeEqual(readCookie(request, COOKIE) ?? '', expected);

  if (pathname === LOGOUT_PATH) {
    return redirect('/', `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
  }

  if (pathname === LOGIN_PATH && request.method === 'POST') {
    let submitted = '';
    let returnTo: FormDataEntryValue | null = null;
    try {
      const form = await request.formData();
      const value = form.get('password');
      submitted = typeof value === 'string' ? value : '';
      returnTo = form.get('next');
    } catch {
      // Malformed body: treated as a wrong password below.
    }
    // Compare fixed-length HMACs rather than the raw strings.
    if (submitted && safeEqual(await token(submitted), expected)) {
      return redirect(safeReturnPath(returnTo), `${COOKIE}=${expected}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`);
    }
    await new Promise(resolve => setTimeout(resolve, WRONG_PASSWORD_DELAY_MS));
    return html(loginPage(true, safeReturnPath(returnTo)), 401);
  }

  if (signedIn) return pathname === LOGIN_PATH ? redirect('/') : next();

  return html(loginPage(false), 401);
}
