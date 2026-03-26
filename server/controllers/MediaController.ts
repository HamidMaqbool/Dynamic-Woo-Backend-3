import { Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { pool } from "../../server";

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "video/mp4", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

export const MediaController = {
  async getMedia(req: Request, res: Response) {
    try {
      const { page = 1, limit = 12, search = "", dateFilter = "all" } = req.query;
      
      let query = `SELECT * FROM media WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (search) {
        query += ` AND name ILIKE $${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      if (dateFilter !== "all") {
        if (dateFilter === "today") {
          query += ` AND created_at::date = CURRENT_DATE`;
        } else if (dateFilter === "this-month") {
          query += ` AND date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)`;
        } else if (dateFilter === "this-year") {
          query += ` AND date_trunc('year', created_at) = date_trunc('year', CURRENT_DATE)`;
        }
      }

      // Get total count
      const countQuery = query.replace("SELECT *", "SELECT COUNT(*)");
      const countRes = await pool.query(countQuery, params);
      const total = parseInt(countRes.rows[0].count);

      // Add pagination
      query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, (Number(page) - 1) * Number(limit));

      const result = await pool.query(query, params);

      res.json({
        media: result.rows,
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      });
    } catch (err) {
      console.error("Media fetch error:", err);
      res.status(500).json({ message: "Database error", details: (err as any).message });
    }
  },

  async uploadMedia(req: Request, res: Response) {
    console.log("Media upload request received");
    try {
      if (!req.file) {
        console.error("No file in request");
        return res.status(400).json({ message: "No file uploaded" });
      }

      const file = req.file;
      console.log("File received:", file.originalname, file.mimetype, file.size);
      
      const id = `MED-${Date.now()}`;
      const name = file.originalname;
      const url = `/uploads/${file.filename}`;
      const type = file.mimetype.startsWith("image/") ? "image" : (file.mimetype.startsWith("video/") ? "video" : "file");
      const size = `${(file.size / 1024).toFixed(2)} KB`;
      const dimensions = ""; // For images, we could use a library like 'sharp' to get dimensions
      const thumbnail = url; // For simplicity, use the same URL for thumbnail

      const columns = ["id", "name", "url", "type", "size", "dimensions", "thumbnail", "created_at"];
      const values = [id, name, url, type, size, dimensions, thumbnail, new Date().toISOString()];
      
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
      const query = `INSERT INTO media (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders}) RETURNING *`;
      
      console.log("Inserting media into database...");
      const result = await pool.query(query, values);
      console.log("Media inserted successfully:", result.rows[0].id);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Media upload error:", err);
      res.status(500).json({ message: "Database error", details: (err as any).message });
    }
  },

  async deleteMedia(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // First, get the file path from DB
      const mediaRes = await pool.query("SELECT url FROM media WHERE id = $1", [id]);
      if (mediaRes.rows.length === 0) {
        return res.status(404).json({ message: "Media not found" });
      }

      const fileUrl = mediaRes.rows[0].url;
      const fileName = path.basename(fileUrl);
      const filePath = path.join(uploadDir, fileName);

      // Delete file from disk
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from DB
      const result = await pool.query("DELETE FROM media WHERE id = $1", [id]);
      if (result.rowCount && result.rowCount > 0) {
        res.json({ success: true, message: "Media deleted" });
      } else {
        res.status(404).json({ message: "Media not found" });
      }
    } catch (err) {
      console.error("Media delete error:", err);
      res.status(500).json({ message: "Database error" });
    }
  }
};
