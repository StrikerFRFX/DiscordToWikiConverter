import express, { Request, Response } from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// GET /api/discord/user/:id
router.get("/discord/user/:id", async (req: Request, res: Response) => {
  console.log("[discordUser] --- ROUTE ENTERED ---");
  try {
    const token = process.env.DISCORD_BOT_TOKEN;
    console.log(
      "[discordUser] Token present:",
      !!token,
      "Token value:",
      token ? token.slice(0, 10) + "..." : "<none>"
    );
    const { id } = req.params;
    if (!id) {
      console.log("[discordUser] No user ID provided");
      return res.status(400).json({ message: "User ID required" });
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
      console.log(
        "[discordUser] Failed to parse Discord API response as JSON",
        e
      );
      return res.status(500).json({
        message: "Failed to parse Discord API response as JSON",
        raw: text,
      });
    }
    return res.json(user);
  } catch (err: any) {
    console.error(
      "[discordUser] TOP-LEVEL ERROR:",
      err,
      err && (err as Error).stack
    );
    return res.status(500).json({
      message: "Internal server error",
      error: String(err),
      stack: err && (err as Error).stack,
    });
  }
});

export default router;
