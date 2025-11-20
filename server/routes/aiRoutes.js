import express from "express";
import fetch from "node-fetch"; // only needed if Node < 18

const router = express.Router();

router.post("/ask", async (req, res) => {
  try {
    const AI_URL = process.env.AI_SERVICE_URL;

    const response = await fetch(`${AI_URL}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.json(data);

  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ error: "AI service failed" });
  }
});

export default router;
