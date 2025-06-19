const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  try {
    const response = await axios.post(
      "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent",
      {
        contents: [
          {
            parts: [
              { text: message }
            ]
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json"
        },
        params: {
          key: process.env.GEMINI_API_KEY
        }
      }
    );

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
    res.json({ reply });
  } catch (error) {
    console.error(error.message, error.response?.data);
    res.status(500).json({ error: "Failed to process the request." });
  }
});

app.listen(PORT, () => {
  console.log(
    `\n\x1b[30m-> SERVIDOR RODANDO NA PORTA\x1b[0m \x1b[36m${PORT}\x1b[0m`
  );
});