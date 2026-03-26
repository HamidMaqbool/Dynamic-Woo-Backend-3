import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { pool } from "../../server";

export const SettingsController = {
  async getSettings(req: Request, res: Response) {
    try {
      const result = await pool.query("SELECT value FROM settings WHERE key = $1", ["app_settings"]);
      if (result.rows.length > 0) {
        res.json(result.rows[0].value);
      } else {
        // Fallback to file if not in DB
        const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server/data/settings.json"), "utf-8"));
        res.json(data);
      }
    } catch (err) {
      console.error("Settings fetch error:", err);
      res.status(500).json({ message: "Database error" });
    }
  },

  async updateSettings(req: Request, res: Response) {
    try {
      const data = req.body;
      await pool.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2", ["app_settings", JSON.stringify(data)]);
      res.json(data);
    } catch (err) {
      console.error("Settings update error:", err);
      res.status(500).json({ message: "Database error" });
    }
  }
};
