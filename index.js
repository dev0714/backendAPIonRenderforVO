// index.js
import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/return", async (req, res) => {
  const xmlEncoded = req.query.xml || req.body.xml;
  const xml = decodeURIComponent(decodeURIComponent(xmlEncoded));

  console.log("Payment Data:", xml);

  // Optional: forward to your frontend (v0) or another API
  try {
    await axios.post("https://your-frontend-api.com/api/payment", { xml });
  } catch (err) {
    console.error("Error sending to frontend:", err.message);
  }

  res.status(200).send("Received");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Listening on port ${port}`));
