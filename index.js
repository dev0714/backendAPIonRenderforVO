import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 3000;

// Replace this with your actual V0 function URL
const V0_BASE_URL = 'https://payments.mondomobile.co.za/return';

// Parse x-www-form-urlencoded (PayGate sends this format)
app.use(bodyParser.urlencoded({ extended: false }));

// 🔁 Forward data to V0 as a GET request (for notify)
const forwardToV0 = async (data, type = 'notify') => {
  try {
    const queryData = {
      source: type,
      ...data,
    };

    const query = new URLSearchParams(queryData).toString();
    const v0Url = `${V0_BASE_URL}/?${query}`;

    console.log('🌐 Calling v0 URL:', v0Url);

    const res = await fetch(v0Url);
    const result = await res.text();

    console.log('✅ v0 response:', result);
  } catch (err) {
    console.error('❌ Failed to forward to v0:', err);
  }
};

// 🛎️ Notify handler (silent server-to-server callback)
app.post('/notify', async (req, res) => {
  try {
    const parsedData = req.body;
    console.log('📨 /notify received:', parsedData);

    await forwardToV0(parsedData, 'notify');
    res.sendStatus(200); // Respond to PayGate
  } catch (err) {
    console.error('❌ Notify error:', err);
    res.sendStatus(500);
  }
});

// 🔁 Return handler (redirect user’s browser to V0 link)
app.post('/return', async (req, res) => {
  try {
    const parsedData = req.body;
    console.log('📨 /return received:', parsedData);

    const queryData = {
      source: 'return',
      ...parsedData,
    };

    const query = new URLSearchParams(queryData).toString();
    const v0RedirectUrl = `${V0_BASE_URL}/?${query}`;

    console.log('🔁 Redirecting user to:', v0RedirectUrl);

    res.redirect(v0RedirectUrl); // Redirect user to v0
  } catch (err) {
    console.error('❌ Return error:', err);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`🚀 PayGate listener running on port ${port}`);
});
