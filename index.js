import express from 'express';
import bodyParser from 'body-parser';

// Temporary workaround to ignore SSL verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const port = process.env.PORT || 3000;

// Two separate URLs for V0
const V0_NOTIFY_URL = 'https://payments.mondomobile.co.za/notify';
const V0_RETURN_URL = 'https://payments.mondomobile.co.za/return';

// Parse x-www-form-urlencoded (PayGate sends this format)
app.use(bodyParser.urlencoded({ extended: false }));

// Generic forwarder
const forwardToV0 = async (data, targetUrl) => {
  try {
    const query = new URLSearchParams(data).toString();
    const v0Url = `${targetUrl}?${query}`;

    console.log('Calling v0 URL:', v0Url);

    const res = await fetch(v0Url);
    const result = await res.text();

    console.log('V0 response:', result);
  } catch (err) {
    console.error('Failed to forward to v0:', err);
  }
};

// Notify handler (server-to-server callback)
app.post('/notify', async (req, res) => {
  try {
    console.log('/notify received:', req.body);
    await forwardToV0(req.body, V0_NOTIFY_URL);
    res.sendStatus(200);
  } catch (err) {
    console.error('Notify error:', err);
    res.sendStatus(500);
  }
});

// Return handler (redirect user’s browser to V0 link)
app.post('/return', async (req, res) => {
  try {
    console.log('/return received:', req.body);
    const query = new URLSearchParams(req.body).toString();
    const v0RedirectUrl = `${V0_RETURN_URL}?${query}`;
    console.log('Redirecting user to:', v0RedirectUrl);
    res.redirect(v0RedirectUrl);
  } catch (err) {
    console.error('Return error:', err);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`PayGate listener running on port ${port}`);
});
