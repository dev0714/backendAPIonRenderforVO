import express from 'express';
import bodyParser from 'body-parser';
import querystring from 'querystring';

const app = express();
const port = process.env.PORT || 3000;

// 🧠 Parse x-www-form-urlencoded from PayGate
app.use(bodyParser.urlencoded({ extended: false }));

// 🔁 Flatten form and send to v0 as query params
const forwardToV0 = async (parsedData, type = 'notify') => {
  try {
    const query = querystring.stringify({
      source: type,
      ...parsedData,
    });

    const v0Url = `https://your-v0-function-name.v0.dev/?${query}`;
    console.log(`🌐 Forwarding to v0: ${v0Url}`);

    const response = await fetch(v0Url);
    const result = await response.text();

    console.log('✅ v0 response:', result);
  } catch (err) {
    console.error('❌ Forwarding to v0 failed:', err);
  }
};

// 🛎️ Handle notifyUrl
app.post('/notify', async (req, res) => {
  try {
    const parsedData = req.body;
    console.log('📨 /notify received:', parsedData);

    await forwardToV0(parsedData, 'notify');
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Notify error:', err);
    res.sendStatus(500);
  }
});

// 🔁 Handle returnUrl
app.post('/return', async (req, res) => {
  try {
    const parsedData = req.body;
    console.log('📨 /return received:', parsedData);

    await forwardToV0(parsedData, 'return');
    res.send('✅ Transaction processed. Thank you.');
  } catch (err) {
    console.error('❌ Return error:', err);
    res.sendStatus(500);
  }
});

app.listen(port, () => {
  console.log(`🚀 PayGate handler listening on port ${port}`);
});
