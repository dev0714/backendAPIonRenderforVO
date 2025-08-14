import express from 'express';
import bodyParser from 'body-parser';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const port = process.env.PORT || 3000;

// ----------------- CONFIG -----------------
const FRONTEND_RETURN_URL = 'https://payments.mondomobile.co.za/return';
const BACKEND_NOTIFY_URL = 'https://payments.mondomobile.co.za/api/notify';
const BACKEND_RETURN_URL = 'https://payments.mondomobile.co.za/api/return';

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ----------------- HELPER -----------------
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

// ----------------- NOTIFY ROUTE -----------------
app.all(['/notify', '/api/notify'], async (req, res) => {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
    console.log('[notify] received', data);

    // Forward to backend notify API
    try {
      await postForm(BACKEND_NOTIFY_URL, data);
    } catch (err) {
      console.warn('[notify] backend failed', err);
    }

    // No redirect — server-to-server only
    return res.sendStatus(200);
  } catch (err) {
    console.error('[notify] error', err);
    return res.sendStatus(500);
  }
});

// ----------------- RETURN ROUTE -----------------
app.all(['/return', '/api/return'], async (req, res) => {
  try {
    const data = req.method === 'POST' ? req.body : req.query;
    console.log('[return] received', data);

    // Forward to backend return API
    try {
      await postForm(BACKEND_RETURN_URL, data);
    } catch (err) {
      console.warn('[return] backend failed', err);
    }

    // Redirect user to front-end with query params
    const query = new URLSearchParams(data).toString();
    const frontendRedirectUrl = `${FRONTEND_RETURN_URL}?${query}`;
    console.log('[return] redirecting user ->', frontendRedirectUrl);

    return res.redirect(302, frontendRedirectUrl);
  } catch (err) {
    console.error('[return] error', err);
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
