import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { Pool } from "pg";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'auroparts',
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

async function syncDatabase() {
  try {
    const schemaPath = path.join(process.cwd(), "server/data/schema.json");
    if (!fs.existsSync(schemaPath)) return;
    
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));

    for (const [tableName, tableConfig] of Object.entries(schema.table)) {
      const sqlTableName = tableName.replace(/-/g, "_");
      const cols = (tableConfig as any).table.cols;

      // Create table if not exists
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${sqlTableName}" (
          id TEXT PRIMARY KEY,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Add columns from table definition
      for (const col of cols) {
        const colNames = Array.isArray(col.col) ? col.col : [col.col];
        
        for (const colName of colNames) {
          if (col.type === "action" || colName === "id" || colName === "created_at") continue;
          
          const colType = getPostgresType(col.type || col.columnType);
          const isUnique = col.unique ? "UNIQUE" : "";
          const isRequired = col.required ? "NOT NULL" : "";

          const checkColQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = LOWER($1) AND column_name = LOWER($2)
            AND table_schema = 'public'
          `;
          const res = await pool.query(checkColQuery, [sqlTableName, colName]);
          
          if (res.rows.length === 0) {
            console.log(`Adding column ${colName} to ${sqlTableName}`);
            let alterQuery = `ALTER TABLE "${sqlTableName}" ADD COLUMN "${colName}" ${colType}`;
            if (isUnique) alterQuery += ` ${isUnique}`;
            if (isRequired) {
              alterQuery += ` ${isRequired}`;
            }
            await pool.query(alterQuery);
            
            // Add index for searchable columns
            if (col.searchable) {
              console.log(`Adding index for ${colName} on ${sqlTableName}`);
              await pool.query(`CREATE INDEX IF NOT EXISTS idx_${sqlTableName}_${colName} ON "${sqlTableName}"("${colName}")`);
            }
          }
        }
      }

      // Also check form fields for columns
      const formFields = schema.form[tableName];
      if (formFields) {
        for (const section of formFields) {
          for (const field of (section as any).fields) {
            const colName = field.dbcol || field.name;
            if (colName && colName !== "id" && colName !== "created_at" && colName !== "save") {
              const colType = getPostgresType(field.type);

              const res = await pool.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = LOWER($1) AND column_name = LOWER($2)
                AND table_schema = 'public'
              `, [sqlTableName, colName]);
              
              if (res.rows.length === 0) {
                console.log(`Adding form column ${colName} to ${sqlTableName}`);
                await pool.query(`ALTER TABLE "${sqlTableName}" ADD COLUMN "${colName}" ${colType}`);
              }
            }
          }
        }
      }
    }
    console.log("Database synced with schema successfully.");
  } catch (err) {
    console.error("Database sync failed:", err);
  }
}

function getPostgresType(type: string): string {
  switch (type) {
    case "number": return "NUMERIC";
    case "boolean": return "BOOLEAN";
    case "date": return "TIMESTAMP";
    case "json":
    case "images":
    case "repeater":
    case "variation":
      return "JSONB"; // Store complex types as JSONB
    default: return "TEXT";
  }
}

async function migrateData() {
  try {
    // Migrate Products
    const productTable = "auroparts_product";
    const productCheck = await pool.query(`SELECT COUNT(*) FROM ${productTable}`);
    if (parseInt(productCheck.rows[0].count) === 0) {
      const productsPath = path.join(process.cwd(), "server/data/products.json");
      if (fs.existsSync(productsPath)) {
        const products = JSON.parse(fs.readFileSync(productsPath, "utf-8"));
        console.log(`Migrating ${products.length} products to PostgreSQL...`);
        for (const product of products) {
          const columns = Object.keys(product);
          const values = Object.values(product).map(val => 
            (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val
          );
          const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
          await pool.query(`INSERT INTO ${productTable} (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders})`, values);
        }
      }
    }

    // Migrate Media
    const mediaTable = "media";
    const mediaCheck = await pool.query(`SELECT COUNT(*) FROM ${mediaTable}`);
    if (parseInt(mediaCheck.rows[0].count) === 0) {
      const mediaPath = path.join(process.cwd(), "server/data/media.json");
      if (fs.existsSync(mediaPath)) {
        const media = JSON.parse(fs.readFileSync(mediaPath, "utf-8"));
        console.log(`Migrating ${media.length} media items to PostgreSQL...`);
        for (const item of media) {
          const columns = Object.keys(item);
          const values = Object.values(item);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
          await pool.query(`INSERT INTO ${mediaTable} (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders})`, values);
        }
      }
    }

    // Migrate Settings
    const settingsTable = "settings";
    const settingsCheck = await pool.query(`SELECT COUNT(*) FROM ${settingsTable}`);
    if (parseInt(settingsCheck.rows[0].count) === 0) {
      const settingsPath = path.join(process.cwd(), "server/data/settings.json");
      if (fs.existsSync(settingsPath)) {
        const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        console.log(`Migrating settings to PostgreSQL...`);
        // Use a simple key-value for settings
        await pool.query(`INSERT INTO ${settingsTable} (id, key, value) VALUES ($1, $2, $3)`, [`SET-${Date.now()}`, "app_settings", JSON.stringify(settings)]);
      }
    }

    // Add sample roles
    const roleTable = "user_roles";
    try {
      const roleCheck = await pool.query(`SELECT COUNT(*) FROM ${roleTable}`);
      if (parseInt(roleCheck.rows[0].count) === 0) {
        const sampleRoles = [
          {
            name: 'manager',
            description: 'Store Manager with full access to products and orders',
            access_config: {
              permissions: [
                { module: 'dashboard', access: 'read' },
                { module: 'products', access: 'write' },
                { module: 'orders', access: 'write' },
                { module: 'customers', access: 'read' }
              ],
              accessible_menus: [
                { path: 'dashboard' },
                { path: 'orders' },
                { path: 'products' },
                { path: 'customers' }
              ]
            }
          },
          {
            name: 'editor',
            description: 'Content Editor with access to products and media',
            access_config: {
              permissions: [
                { module: 'products', access: 'write' },
                { module: 'media', access: 'write' }
              ],
              accessible_menus: [
                { path: 'products' },
                { path: 'media' }
              ]
            }
          },
          {
            name: 'support',
            description: 'Customer Support with access to orders and customers',
            access_config: {
              permissions: [
                { module: 'orders', access: 'read' },
                { module: 'customers', access: 'write' }
              ],
              accessible_menus: [
                { path: 'orders' },
                { path: 'customers' }
              ]
            }
          }
        ];

        console.log(`Adding ${sampleRoles.length} sample roles to PostgreSQL...`);
        for (const role of sampleRoles) {
          const roleId = `ROLE-${role.name.toUpperCase()}`;
          await pool.query(
            `INSERT INTO ${roleTable} (id, name, description, access_config) VALUES ($1, $2, $3, $4)`,
            [roleId, role.name, role.description, JSON.stringify(role.access_config)]
          );
        }
      }
    } catch (e) {
      console.log("Role table might not be ready yet, skipping sample roles migration.");
    }

    // Migrate Users (Initial Admin)
    const usersTable = "users";
    const usersCheck = await pool.query(`SELECT COUNT(*) FROM ${usersTable}`);
    if (parseInt(usersCheck.rows[0].count) === 0) {
      console.log("Creating initial users...");
      const hashedPassword = await bcrypt.hash("admin123", 10);
      
      // Admin
      await pool.query(`
        INSERT INTO ${usersTable} (id, name, email, password, role, permissions) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [`USR-ADMIN`, "Admin User", "admin@auroparts.com", hashedPassword, "admin", JSON.stringify([
        { module: "dashboard", access: "write" },
        { module: "products", access: "write" },
        { module: "customers", access: "write" },
        { module: "users", access: "write" },
        { module: "media", access: "write" },
        { module: "settings", access: "write" }
      ])]);

      // Editor
      await pool.query(`
        INSERT INTO ${usersTable} (id, name, email, password, role, permissions) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [`USR-EDITOR`, "Editor User", "editor@auroparts.com", hashedPassword, "editor", JSON.stringify([
        { module: "dashboard", access: "read" },
        { module: "products", access: "write" },
        { module: "media", access: "write" }
      ])]);

      // Viewer
      await pool.query(`
        INSERT INTO ${usersTable} (id, name, email, password, role, permissions) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [`USR-VIEWER`, "Viewer User", "viewer@auroparts.com", hashedPassword, "user", JSON.stringify([
        { module: "dashboard", access: "read" },
        { module: "products", access: "read" }
      ])]);
    }

    console.log("Data migration completed successfully.");
  } catch (err) {
    console.error("Data migration failed:", err);
  }
}

async function testConnection() {
  try {
    await pool.query('SELECT NOW()');
    console.log("PostgreSQL connected successfully.");
    return true;
  } catch (err) {
    console.error("PostgreSQL connection failed. Please check your .env variables.");
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Test connection and sync database on start
  const isConnected = await testConnection();
  if (isConnected) {
    await syncDatabase();
    await migrateData();
  } else {
    console.warn("Starting server without database connection. Some features may be unavailable.");
  }

  const VALID_TOKEN = "auro-parts-secret-token-123";

  // Auth Middleware
  const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (authHeader === `Bearer ${VALID_TOKEN}`) {
      next();
    } else {
      res.status(401).json({ success: false, message: "Unauthorized: Token expired or invalid" });
    }
  };

  // Public Routes
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
      if (result.rows.length > 0) {
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          // Fetch role data if available
          let roleData = null;
          if (user.role && user.role !== 'admin') {
            const roleRes = await pool.query('SELECT * FROM user_roles WHERE name = $1', [user.role]);
            if (roleRes.rows.length > 0) {
              roleData = roleRes.rows[0];
            }
          }

          const accessConfig = roleData?.access_config 
            ? (typeof roleData.access_config === 'string' ? JSON.parse(roleData.access_config) : roleData.access_config)
            : null;

          const permissions = user.permissions 
            ? (typeof user.permissions === 'string' ? JSON.parse(user.permissions) : user.permissions)
            : (accessConfig?.permissions || []);

          const accessibleMenus = accessConfig?.accessible_menus || null;

          res.json({ 
            success: true, 
            user: { 
              email: user.email, 
              name: user.name, 
              role: user.role,
              permissions,
              accessibleMenus
            },
            token: VALID_TOKEN 
          });
        } else {
          res.status(401).json({ success: false, message: "Invalid email or password" });
        }
      } else {
        res.status(401).json({ success: false, message: "Invalid email or password" });
      }
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ success: false, message: "Database error", details: (err as any).message });
    }
  });

  // Protected Routes
  app.use("/api", (req, res, next) => {
    if (req.path === "/login") return next();
    authMiddleware(req, res, next);
  });

  app.get("/api/health", async (req, res) => {
    try {
      const tables = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      res.json({ 
        status: "ok", 
        tables: tables.rows.map(r => r.table_name) 
      });
    } catch (err) {
      res.status(500).json({ status: "error", message: (err as any).message });
    }
  });

  // API Routes
  app.get("/api/sidebar", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server/data/sidebar.json"), "utf-8"));
      res.json(data);
    } catch (err) {
      console.error("Error reading sidebar.json:", err);
      res.status(500).json({ message: "Error reading sidebar data", details: (err as any).message });
    }
  });

  app.get("/api/media", async (req, res) => {
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
  });

  app.post("/api/media", async (req, res) => {
    try {
      const newMedia = req.body;
      const id = `MED-${Date.now()}`;
      const columns = ["id", "created_at", ...Object.keys(newMedia)];
      const values = [id, new Date().toISOString(), ...Object.values(newMedia)];
      
      const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
      const query = `INSERT INTO media (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders}) RETURNING *`;
      
      const result = await pool.query(query, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error("Media upload error:", err);
      res.status(500).json({ message: "Database error", details: (err as any).message });
    }
  });

  app.delete("/api/media/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query("DELETE FROM media WHERE id = $1", [id]);
      if (result.rowCount && result.rowCount > 0) {
        res.json({ success: true, message: "Media deleted" });
      } else {
        res.status(404).json({ message: "Media not found" });
      }
    } catch (err) {
      res.status(500).json({ message: "Database error" });
    }
  });

  app.get("/api/schema", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server/data/schema.json"), "utf-8"));
      res.json(data);
    } catch (err) {
      console.error("Error reading schema.json:", err);
      res.status(500).json({ message: "Error reading schema data", details: (err as any).message });
    }
  });

  app.get("/api/routes", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server/data/routes.json"), "utf-8"));
      res.json(data);
    } catch (err) {
      console.error("Error reading routes.json:", err);
      res.status(500).json({ message: "Error reading routes data", details: (err as any).message });
    }
  });

  // Dynamic Table Routes
  const schemaPath = path.join(process.cwd(), "server/data/schema.json");
  if (fs.existsSync(schemaPath)) {
    const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
    
    for (const [tableName, tableConfig] of Object.entries(schema.table)) {
      const sqlTableName = tableName.replace(/-/g, "_");
      
      // Skip media and settings as they have custom logic below
      if (tableName === "media" || tableName === "settings") continue;

      const pluralLabel = (tableConfig as any).label?.plural?.toLowerCase();
      const routes = [tableName];
      if (pluralLabel && pluralLabel !== tableName) {
        routes.push(pluralLabel);
      }

      for (const routeName of routes) {
        // GET /api/{routeName}
        app.get(`/api/${routeName}`, async (req, res) => {
          try {
            const { page = 1, limit = 10, search = "", ...filters } = req.query;
            let query = `SELECT * FROM ${sqlTableName} WHERE 1=1`;
            const params: any[] = [];
            let paramIndex = 1;

            if (search) {
              const searchableCols = (tableConfig as any).table.cols
                .filter((c: any) => c.searchable)
                .map((c: any) => c.col);
              
              if (searchableCols.length > 0) {
                const searchClauses = searchableCols.map((col: string) => `"${col}" ILIKE $${paramIndex}`).join(" OR ");
                query += ` AND (${searchClauses})`;
                params.push(`%${search}%`);
                paramIndex++;
              }
            }

            for (const [key, value] of Object.entries(filters)) {
              if (value !== "all" && value !== undefined) {
                query += ` AND "${key}" = $${paramIndex}`;
                params.push(value);
                paramIndex++;
              }
            }

            const countQuery = query.replace("SELECT *", "SELECT COUNT(*)");
            const countRes = await pool.query(countQuery, params);
            const total = parseInt(countRes.rows[0].count);

            query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
            params.push(limit, (Number(page) - 1) * Number(limit));

            const result = await pool.query(query, params);
            
            // Use the plural label as the key in the response (e.g., products)
            const responseKey = pluralLabel || tableName.replace(/-/g, "_");

            res.json({
              [tableName]: result.rows,
              total,
              page: Number(page),
              limit: Number(limit),
              totalPages: Math.ceil(total / Number(limit))
            });
          } catch (err) {
            console.error(`Error fetching ${routeName}:`, err);
            res.status(500).json({ message: "Database error", details: (err as any).message });
          }
        });

        // GET /api/{routeName}/:id
        app.get(`/api/${routeName}/:id`, async (req, res) => {
          try {
            const { id } = req.params;
            const result = await pool.query(`SELECT * FROM ${sqlTableName} WHERE id = $1`, [id]);
            if (result.rows.length > 0) {
              res.json(result.rows[0]);
            } else {
              res.status(404).json({ message: "Not found" });
            }
          } catch (err) {
            res.status(500).json({ message: "Database error" });
          }
        });

        // POST /api/{routeName}
        app.post(`/api/${routeName}`, async (req, res) => {
          try {
            const data: any = { ...req.body };
            delete data.id;
            delete data.created_at;
            delete data.save;
            
            const prefix = sqlTableName.substring(0, 3).toUpperCase();
            const id = `${prefix}-${Date.now()}`;
            
            // If it's users table, hash password
            if (sqlTableName === "users" && data.password && data.password.trim() !== "") {
              data.password = await bcrypt.hash(data.password, 10);
            }

            // Fetch actual columns from database to filter data
            const colCheck = await pool.query(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = LOWER($1) AND table_schema = 'public'
            `, [sqlTableName]);
            const existingCols = colCheck.rows.map(r => r.column_name.toLowerCase());

            const columns = ["id"];
            const values: any[] = [id];

            for (const key of Object.keys(data)) {
              if (existingCols.includes(key.toLowerCase())) {
                columns.push(key);
                const val = data[key];
                values.push((typeof val === 'object' && val !== null) ? JSON.stringify(val) : val);
              }
            }
            
            const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
            const query = `INSERT INTO ${sqlTableName} (${columns.map(c => `"${c}"`).join(", ")}) VALUES (${placeholders}) RETURNING *`;
            
            const result = await pool.query(query, values);
            res.status(201).json(result.rows[0]);
          } catch (err) {
            console.error(`Error creating ${routeName}:`, err);
            res.status(500).json({ message: "Database error", details: (err as any).message });
          }
        });

        // PUT /api/${routeName}/:id
        app.put(`/api/${routeName}/:id`, async (req, res) => {
          try {
            const { id } = req.params;
            const updates: any = { ...req.body };
            delete updates.id;
            delete updates.created_at;
            delete updates.save;
            
            // If it's users table and password is being updated, hash it
            if (sqlTableName === "users") {
              if (updates.password && updates.password.trim() !== "") {
                updates.password = await bcrypt.hash(updates.password, 10);
              } else {
                delete updates.password;
              }
            }

            // Fetch actual columns from database to filter updates
            const colCheck = await pool.query(`
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = LOWER($1) AND table_schema = 'public'
            `, [sqlTableName]);
            const existingCols = colCheck.rows.map(r => r.column_name.toLowerCase());

            const setClauses = [];
            const values: any[] = [id];
            let paramIndex = 2;

            for (const [key, value] of Object.entries(updates)) {
              if (existingCols.includes(key.toLowerCase())) {
                setClauses.push(`"${key}" = $${paramIndex}`);
                values.push((typeof value === 'object' && value !== null) ? JSON.stringify(value) : value);
                paramIndex++;
              }
            }

            if (setClauses.length === 0) {
              return res.json({ message: "No valid fields to update" });
            }

            const query = `UPDATE ${sqlTableName} SET ${setClauses.join(", ")} WHERE id = $1 RETURNING *`;
            const result = await pool.query(query, values);
            
            if (result.rows.length > 0) {
              res.json(result.rows[0]);
            } else {
              res.status(404).json({ message: "Not found" });
            }
          } catch (err) {
            console.error(`Error updating ${routeName}:`, err);
            res.status(500).json({ message: "Database error", details: (err as any).message });
          }
        });

        // DELETE /api/${routeName}/:id
        app.delete(`/api/${routeName}/:id`, async (req, res) => {
          try {
            const { id } = req.params;
            const result = await pool.query(`DELETE FROM ${sqlTableName} WHERE id = $1`, [id]);
            if (result.rowCount && result.rowCount > 0) {
              res.json({ success: true, message: "Deleted" });
            } else {
              res.status(404).json({ message: "Not found" });
            }
          } catch (err) {
            console.error(`Error deleting ${routeName}:`, err);
            res.status(500).json({ message: "Database error", details: (err as any).message });
          }
        });

        // Bulk Delete
        app.post(`/api/${routeName}/bulk-delete`, async (req, res) => {
          try {
            const { ids } = req.body;
            await pool.query(`DELETE FROM ${sqlTableName} WHERE id = ANY($1)`, [ids]);
            res.json({ success: true, message: `${ids.length} items deleted` });
          } catch (err) {
            console.error(`Error bulk deleting ${routeName}:`, err);
            res.status(500).json({ message: "Database error", details: (err as any).message });
          }
        });
      }
    }
  }

  app.get("/api/dashboard", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server/data/dashboard.json"), "utf-8"));
      res.json(data);
    } catch (err) {
      console.error("Error reading dashboard.json:", err);
      res.status(500).json({ message: "Error reading dashboard data", details: (err as any).message });
    }
  });

  app.get("/api/available-permissions", (req, res) => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), "server/data/available-permissions.json"), "utf-8"));
      res.json(data);
    } catch (err) {
      console.error("Error reading available-permissions.json:", err);
      res.status(500).json({ message: "Error reading available-permissions data", details: (err as any).message });
    }
  });

  app.get("/api/roles/list", async (req, res) => {
    try {
      const result = await pool.query("SELECT name FROM user_roles ORDER BY name ASC");
      res.json(result.rows.map(r => ({ value: r.name, label: r.name.charAt(0).toUpperCase() + r.name.slice(1) })));
    } catch (err) {
      console.error("Error fetching roles list:", err);
      res.status(500).json({ message: "Error fetching roles list" });
    }
  });

  app.get("/api/settings", async (req, res) => {
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
      res.status(500).json({ message: "Database error" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const data = req.body;
      await pool.query("INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2", ["app_settings", JSON.stringify(data)]);
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Database error" });
    }
  });

  // 404 handler for API routes
  app.use("/api/*", (req, res) => {
    res.status(404).json({ message: `API endpoint not found: ${req.originalUrl}` });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
