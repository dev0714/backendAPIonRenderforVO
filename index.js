import express from 'express';
import bodyParser from 'body-parser';
import xml2js from 'xml2js';
import fetch from 'node-fetch';
import querystring from 'querystring';

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.text({ type: 'application/xml' }));

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

const forwardToV0 = async (parsedData, type = 'notify') => {
  try {
    const flatData = flattenXml(parsedData);
    const query = querystring.stringify(flatData);
    const v0Url = `https://your-v0-function-name.v0.dev/?source=${type}&${query}`;

    const res = await fetch(v0Url);
    const text = await res.text();

    console.log('✅ v0 response:', text);
  } catch (err) {
    console.error('❌ Forwarding error:', err);
  }
};

app.post('/notify', (req, res) => {
  xml2js.parseString(req.body, async (err, result) => {
    if (err) return res.status(400).send('Invalid XML');

    console.log('📨 /notify:', result);
    await forwardToV0(result, 'notify');
    res.sendStatus(200);
  });
});

app.post('/return', (req, res) => {
  xml2js.parseString(req.body, async (err, result) => {
    if (err) return res.status(400).send('Invalid XML');

    console.log('📨 /return:', result);
    await forwardToV0(result, 'return');
    res.send('✅ Return received');
  });
});

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
