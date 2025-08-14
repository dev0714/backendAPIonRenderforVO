import express from 'express';
import bodyParser from 'body-parser';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const port = process.env.PORT || 3000;

// Main *front-end* return page (user-facing)
const FRONTEND_RETURN_URL = 'https://payments.mondomobile.co.za/return';

// Background API URLs (server-to-server)
const V0_NOTIFY_URL = 'https://payments.mondomobile.co.za/api/notify';
const V0_RETURN_URL = 'https://payments.mondomobile.co.za/api/return';

app.use(bodyParser.urlencoded({ extended: false }));

// Helper: POST form data server-to-server
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
    console.log(`[postForm] -> ${targetUrl} | status=${res.status} body="${text.slice(0, 300)}"`);
    if (!res.ok) {
      throw new Error(`Upstream responded ${res.status}`);
    }
    return res;
  } finally {
    clearTimeout(timeout);
  }
}

// ----- NOTIFY: Background only -----
app.post('/api/notify', async (req, res) => {
  try {
    console.log('[notify:POST] received', req.body);
    await postForm(V0_NOTIFY_URL, req.body);
    return res.sendStatus(200);
  } catch (err) {
    console.error('[notify:POST] error', err);
    return res.sendStatus(500);
  }
});

app.get('/api/return', async (req, res) => {
  try {
    console.log('[notify:GET] received', req.query);
    await postForm(V0_NOTIFY_URL, req.query);
    return res.sendStatus(200);
  } catch (err) {
    console.error('[notify:GET] error', err);
    return res.sendStatus(500);
  }
});

// ----- RETURN: Background + Redirect -----
app.post('/return', async (req, res) => {
  try {
    console.log('[return:POST] received', req.body);

    // Call background API
    await postForm(V0_RETURN_URL, req.body);

    // Redirect user to front-end page
    const query = new URLSearchParams(req.body).toString();
    const frontendRedirectUrl = `${FRONTEND_RETURN_URL}?${query}`;
    console.log('[return:POST] redirecting user ->', frontendRedirectUrl);

    return res.redirect(302, frontendRedirectUrl);
  } catch (err) {
    console.error('[return:POST] error', err);
    return res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`Pay gateway listener running on port ${port}`);
});
