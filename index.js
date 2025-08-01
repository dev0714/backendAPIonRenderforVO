import express from 'express';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 3000;

// 🧠 Parse x-www-form-urlencoded (PayGate sends this)
app.use(bodyParser.urlencoded({ extended: false }));

// 🔁 Forward data to V0 as a GET request with query string
const forwardToV0 = async (data, type = 'notify') => {
  try {
    const queryData = {
      source: type,
      ...data,
    };

    const query = new URLSearchParams(queryData).toString();
    const v0Url = `https://your-v0-function-name.v0.dev/?${query}`; // ⬅️ replace with your real V0 link

    console.log('🌐 Calling v0 URL:', v0Url);

    const res = await fetch(v0Url);
    const result = await res.text();

    console.log('✅ v0 response:', result);
  } catch (err) {
    console.error('❌ Failed to forward to v0:', err);
  }
};

// 🛎️ PayGate notify URL handler
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

// 🔁 PayGate return URL handler
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
  console.log(`🚀 PayGate listener running on port ${port}`);
});
