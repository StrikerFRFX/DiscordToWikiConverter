import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// GET /api/roblox-thumbnail?assetId=...
router.get("/roblox-thumbnail", async (req, res) => {
  const { assetId } = req.query;
  if (!assetId) return res.status(400).json({ error: "Missing assetId" });
  const url = `https://thumbnails.roblox.com/v1/assets?assetIds=${assetId}&size=420x420&format=Png&isCircular=false`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.set("Access-Control-Allow-Origin", "*");
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch Roblox thumbnail" });
  }
});

export default router;
