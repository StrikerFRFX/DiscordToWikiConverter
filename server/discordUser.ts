import express, { Request, Response } from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// GET /api/discord/user/:id
router.get("/discord/user/:id", async (req: Request, res: Response) => {
  console.log(
    "[discordUser] Request received",
    req.method,
    req.originalUrl,
    req.params
  );
  const { id } = req.params;
  if (!id) {
    console.log("[discordUser] No user ID provided");
    return res.status(400).json({ message: "User ID required" });
  }

  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    console.log(
      "[discordUser] Using token:",
      token ? "[REDACTED]" : "[MISSING]"
    );
    if (!token) {
      console.log("[discordUser] Discord bot token not set");
      return res.status(500).json({ message: "Discord bot token not set" });
    }

    const url = `https://discord.com/api/v10/users/${id}`;
    console.log("[discordUser] Fetching from Discord API:", url);
    const discordRes = await fetch(url, {
      headers: { Authorization: `Bot ${token}` },
    });
    console.log(
      "[discordUser] Discord API response status:",
      discordRes.status
    );
    const text = await discordRes.text();
    console.log("[discordUser] Discord API response text:", text);
    if (!discordRes.ok) {
      return res.status(discordRes.status).json({ message: text });
    }
    let user;
    try {
      user = JSON.parse(text);
    } catch (e) {
      console.log("[discordUser] Failed to parse JSON:", e);
      return res
        .status(500)
        .json({ message: "Failed to parse Discord API response" });
    }
    console.log("[discordUser] Parsed user object:", user);
    res.json(user);
  } catch (error) {
    console.log("[discordUser] Error:", error);
    res.status(500).json({
      message: "Failed to fetch Discord user",
      error: error instanceof Error ? error.message : error,
    });
  }
});

export default router;
