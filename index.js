const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const fetch = require('node-fetch'); // If using Node < 18
const querystring = require('querystring');

const app = express();
const port = process.env.PORT || 3000;

// Accept raw XML text
app.use(bodyParser.text({ type: 'application/xml' }));

// 🔁 Helper to flatten nested XML to key=value format
function flattenXml(obj, prefix = '', res = {}) {
  for (let key in obj) {
    const value = obj[key];
    const newKey = prefix ? `${prefix}_${key}` : key;

    if (Array.isArray(value) && typeof value[0] === 'object') {
      flattenXml(value[0], newKey, res);
    } else {
      res[newKey] = Array.isArray(value) ? value[0] : value;
    }
  }
  return res;
}

// 🔁 Forward to v0 as GET request
const forwardToV0 = async (parsedData, type = 'notify') => {
  try {
    const flatData = flattenXml(parsedData);
    const query = querystring.stringify(flatData);
    
    const v0Url = `https://your-v0-function-name.v0.dev/?source=${type}&${query}`;
    console.log(`🌐 Forwarding to v0: ${v0Url}`);

    const res = await fetch(v0Url);
    const text = await res.text();

    console.log('✅ v0 response:', text);
  } catch (err) {
    console.error('❌ Failed to forward to v0:', err);
  }
};

// 🔔 /notify handler
app.post('/notify', (req, res) => {
  xml2js.parseString(req.body, async (err, result) => {
    if (err) {
      console.error('❌ Invalid XML:', err);
      return res.status(400).send('Invalid XML');
    }

    console.log('📨 Notify received:', result);
    await forwardToV0(result, 'notify');
    res.sendStatus(200);
  });
});

// ↩️ /return handler
app.post('/return', (req, res) => {
  xml2js.parseString(req.body, async (err, result) => {
    if (err) {
      console.error('❌ Invalid XML:', err);
      return res.status(400).send('Invalid XML');
    }

    console.log('📨 Return received:', result);
    await forwardToV0(result, 'return');
    res.send('✅ Transaction return processed.');
  });
});

app.listen(port, () => {
  console.log(`🚀 PayGate handler running on port ${port}`);
});
