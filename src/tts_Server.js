import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import bodyParser from "body-parser";
import cors from "cors";

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

app.post("/api/tts", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }

  const apiKey = process.env.VOICE_RSS_API_KEY;

  const url = `https://api.voicerss.org/?key=${apiKey}&hl=en-us&v=Mary&r=0&src=${encodeURIComponent(
  text
)}&c=MP3&f=44khz_16bit_stereo`;

  try {
    const response = await fetch(url);
    const audioBuffer = await response.arrayBuffer();

    res.set({
      "Content-Type": "audio/mpeg",
      "Content-Length": audioBuffer.byteLength,
    });

    res.send(Buffer.from(audioBuffer));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "TTS request failed" });
  }
});

app.listen(port, () => {
  console.log(`✅ TTS server running at http://localhost:${port}`);
});


