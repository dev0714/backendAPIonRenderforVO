import express from 'express';
import bodyParser from 'body-parser';

// ❗WARNING: Disabling TLS verification is unsafe. Use ONLY for debugging.
// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const port = process.env.PORT || 3000;

// Point these to your Next.js *API* endpoints (NOT the /return page)
const V0_NOTIFY_URL = 'https://payments.mondomobile.co.za/api/notify';
const V0_RETURN_URL = 'https://payments.mondomobile.co.za/api/return';

// PayGate posts x-www-form-urlencoded by default
app.use(bodyParser.urlencoded({ extended: false }));

// Small helper: POST form-encoded to a target URL (server-to-server)
async function postForm(targetUrl, data) {
  const body = new URLSearchParams(data).toString();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });
    const text = await res.text().catch(() => '');
    console.log([postForm] -> ${targetUrl} | status=${res.status} body="${text.slice(0, 300)}");
    if (!res.ok) {
      throw new Error(Upstream responded ${res.status});
    }
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// ----- NOTIFY: server-to-server callback (no redirect) -----
app.post('/notify', async (req, res) => {
  try {
    console.log('[notify:POST] received', req.body);
    await postForm(V0_NOTIFY_URL, req.body);
    // If your upstream does idempotent writes, 200 is fine even on repeats
    return res.sendStatus(200);
  } catch (err) {
    console.error('[notify:POST] error', err);
    // If you prefer the gateway to retry, return 500; otherwise 200
    return res.sendStatus(500);
  }
});

// Some gateways may GET notify (rare) — handle defensively
app.get('/notify', async (req, res) => {
  try {
    console.log('[notify:GET] received', req.query);
    await postForm(V0_NOTIFY_URL, req.query);
    return res.sendStatus(200);
  } catch (err) {
    console.error('[notify:GET] error', err);
    return res.sendStatus(500);
  }
});

// ----- RETURN: browser return (redirect user to Next /api/return) -----
app.post('/return', async (req, res) => {
  try {
    console.log('[return:POST] received', req.body);
    const query = new URLSearchParams(req.body).toString();
    const v0RedirectUrl = ${V0_RETURN_URL}?${query};
    console.log('[return:POST] redirecting user ->', v0RedirectUrl);
    return res.redirect(302, v0RedirectUrl);
  } catch (err) {
    console.error('[return:POST] error', err);
    return res.sendStatus(500);
  }
});

// In case PayGate calls /return with GET
app.get('/return', (req, res) => {
  const query = new URLSearchParams(req.query).toString();
  const v0RedirectUrl = ${V0_RETURN_URL}?${query};
  console.log('[return:GET] redirecting user ->', v0RedirectUrl);
  return res.redirect(302, v0RedirectUrl);
});

app.listen(port, () => {
  console.log(Pay gateway listener running on port ${port});
});
