import express from 'express';
import bodyParser from 'body-parser';

// ❗ Only for testing if you have self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const port = process.env.PORT || 3000;

// ----------------- CONFIG -----------------
const FRONTEND_RETURN_URL = 'https://frontend.mondomobile.co.za/return/page';
const V0_NOTIFY_URL = 'https://payments.mondomobile.co.za/api/notify';
const V0_RETURN_URL = 'https://payments.mondomobile.co.za/api/return';

// ----------------- MIDDLEWARE -----------------
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ----------------- HELPERS -----------------
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
    console.log(`[postForm] -> ${targetUrl} | status=${res.status} | body="${text.slice(0,300)}"`);
    if (!res.ok) throw new Error(`Upstream responded ${res.status}`);
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// ----------------- NOTIFY ROUTES -----------------
app.all(['/notify', '/api/notify'], async (req, res) => {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
    console.log(`[notify:${req.method}] received`, data);

    await postForm(V0_NOTIFY_URL, data);

    // Notify route is server-to-server: just return 200
    return res.sendStatus(200);
  } catch (err) {
    console.error(`[notify:${req.method}] error`, err);
    return res.sendStatus(500);
  }
});

// ----------------- RETURN ROUTES -----------------
app.all(['/return', '/api/return'], async (req, res) => {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
    console.log(`[return:${req.method}] received`, data);

    // Call your background API first (server-to-server)
    await postForm(V0_RETURN_URL, data);

    // Redirect user to the front-end page with query params
    const query = new URLSearchParams(data).toString();
    const frontendRedirectUrl = `${FRONTEND_RETURN_URL}?${query}`;
    console.log(`[return:${req.method}] redirecting user ->`, frontendRedirectUrl);

    return res.redirect(302, frontendRedirectUrl);
  } catch (err) {
    console.error(`[return:${req.method}] error`, err);
    return res.sendStatus(500);
  }
});

// ----------------- TEST ROUTE -----------------
app.get('/test', (req, res) => {
  console.log('Test route hit!');
  res.redirect(FRONTEND_RETURN_URL);
});

// ----------------- START SERVER -----------------
app.listen(port, () => {
  console.log(`Pay gateway listener running on port ${port}`);
});
