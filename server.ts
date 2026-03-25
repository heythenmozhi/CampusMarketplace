import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database("marketplace.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemName TEXT NOT NULL,
    category TEXT NOT NULL,
    price REAL NOT NULL,
    description TEXT NOT NULL,
    image TEXT NOT NULL,
    sellerId INTEGER NOT NULL,
    sellerName TEXT NOT NULL,
    contact TEXT NOT NULL,
    status TEXT DEFAULT 'Available',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sellerId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    userId INTEGER NOT NULL,
    itemId INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (userId, itemId),
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (itemId) REFERENCES items(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    itemId INTEGER NOT NULL,
    userId INTEGER NOT NULL,
    userName TEXT NOT NULL,
    text TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (itemId) REFERENCES items(id),
    FOREIGN KEY (userId) REFERENCES users(id)
  );
`);

// Safely add columns if they don't exist (for existing databases)
try {
  db.exec("ALTER TABLE items ADD COLUMN status TEXT DEFAULT 'Available'");
} catch (e) {
  // Column likely already exists, ignore
}

try {
  db.exec("ALTER TABLE items ADD COLUMN sellerId INTEGER NOT NULL DEFAULT 1");
} catch (e) {
}

try {
  db.exec("ALTER TABLE items ADD COLUMN sellerName TEXT NOT NULL DEFAULT 'Unknown'");
} catch (e) {
}

try {
  db.exec("ALTER TABLE items ADD COLUMN contact TEXT NOT NULL DEFAULT ''");
} catch (e) {
}

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-campus-marketplace";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" })); // Increased limit for larger images
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // --- API Routes ---

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token == null) return res.status(401).json({ error: "Unauthorized" });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.status(403).json({ error: "Forbidden" });
      req.user = user;
      next();
    });
  };

  // Signup
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare("INSERT INTO users (name, email, password) VALUES (?, ?, ?)");
      const info = stmt.run(name, email, hashedPassword);

      const token = jwt.sign({ id: info.lastInsertRowid, name, email }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token, user: { id: info.lastInsertRowid, name, email } });
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        return res.status(400).json({ error: "Email already exists" });
      }
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      const stmt = db.prepare("SELECT * FROM users WHERE email = ?");
      const user = stmt.get(email) as any;

      if (!user) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Get current user
  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    res.json({ user: req.user });
  });

  // Get all items
  app.get("/api/items", (req, res) => {
    const { category, search } = req.query;
    let query = "SELECT * FROM items WHERE 1=1";
    const params: any[] = [];

    if (category && category !== "All") {
      query += " AND category = ?";
      params.push(category);
    }

    if (search) {
      query += " AND (itemName LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    query += " ORDER BY createdAt DESC";

    const stmt = db.prepare(query);
    const items = stmt.all(...params);
    res.json(items);
  });

  // Get user's favorites
  app.get("/api/favorites", authenticateToken, (req: any, res) => {
    const stmt = db.prepare(`
      SELECT items.* FROM items 
      JOIN favorites ON items.id = favorites.itemId 
      WHERE favorites.userId = ?
      ORDER BY favorites.createdAt DESC
    `);
    const items = stmt.all(req.user.id);
    res.json(items);
  });

  // Toggle favorite
  app.post("/api/favorites/:itemId", authenticateToken, (req: any, res) => {
    const userId = req.user.id;
    const itemId = req.params.itemId;

    const checkStmt = db.prepare("SELECT * FROM favorites WHERE userId = ? AND itemId = ?");
    const exists = checkStmt.get(userId, itemId);

    if (exists) {
      db.prepare("DELETE FROM favorites WHERE userId = ? AND itemId = ?").run(userId, itemId);
      res.json({ isFavorite: false });
    } else {
      db.prepare("INSERT INTO favorites (userId, itemId) VALUES (?, ?)").run(userId, itemId);
      res.json({ isFavorite: true });
    }
  });

  // Get comments for an item
  app.get("/api/items/:itemId/comments", (req, res) => {
    const stmt = db.prepare("SELECT * FROM comments WHERE itemId = ? ORDER BY createdAt ASC");
    const comments = stmt.all(req.params.itemId);
    res.json(comments);
  });

  // Add a comment
  app.post("/api/items/:itemId/comments", authenticateToken, (req: any, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Comment text is required" });

    const stmt = db.prepare("INSERT INTO comments (itemId, userId, userName, text) VALUES (?, ?, ?, ?)");
    const info = stmt.run(req.params.itemId, req.user.id, req.user.name, text);
    
    const newComment = db.prepare("SELECT * FROM comments WHERE id = ?").get(info.lastInsertRowid);
    res.json(newComment);
  });

  // Get single item
  app.get("/api/items/:id", (req, res) => {
    const stmt = db.prepare("SELECT * FROM items WHERE id = ?");
    const item = stmt.get(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  });

  // Get user's items
  app.get("/api/users/:id/items", authenticateToken, (req: any, res) => {
    if (req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const stmt = db.prepare("SELECT * FROM items WHERE sellerId = ? ORDER BY createdAt DESC");
    const items = stmt.all(req.params.id);
    res.json(items);
  });

  // Post new item
  app.post("/api/items", authenticateToken, (req: any, res) => {
    const { itemName, category, price, description, image, contact } = req.body;
    const sellerId = req.user.id;
    const sellerName = req.user.name;

    if (!itemName || !category || !price || !description || !image || !contact) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const stmt = db.prepare(`
      INSERT INTO items (itemName, category, price, description, image, sellerId, sellerName, contact)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    try {
      const info = stmt.run(itemName, category, price, description, image, sellerId, sellerName, contact);
      res.json({ id: info.lastInsertRowid, message: "Item posted successfully" });
    } catch (e: any) {
      console.error("Error inserting item:", e);
      res.status(500).json({ error: "Failed to post item: " + e.message });
    }
  });

  // Update item
  app.put("/api/items/:id", authenticateToken, (req: any, res) => {
    const { itemName, category, price, description, image, contact, status } = req.body;
    
    // Check ownership
    const checkStmt = db.prepare("SELECT sellerId FROM items WHERE id = ?");
    const item = checkStmt.get(req.params.id) as any;
    
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.sellerId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    const stmt = db.prepare(`
      UPDATE items 
      SET itemName = ?, category = ?, price = ?, description = ?, image = ?, contact = ?, status = COALESCE(?, status)
      WHERE id = ?
    `);
    stmt.run(itemName, category, price, description, image, contact, status, req.params.id);
    
    res.json({ message: "Item updated successfully" });
  });

  // Purchase item (simulated payment)
  app.post("/api/items/:id/purchase", authenticateToken, (req: any, res) => {
    const itemId = req.params.id;
    const buyerId = req.user.id;

    const checkStmt = db.prepare("SELECT * FROM items WHERE id = ?");
    const item = checkStmt.get(itemId) as any;

    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.status === 'Sold') return res.status(400).json({ error: "Item is already sold" });

    // Simulate payment processing here...
    
    // Update item status to Sold
    const updateStmt = db.prepare("UPDATE items SET status = 'Sold' WHERE id = ?");
    updateStmt.run(itemId);

    res.json({ message: "Payment successful and item purchased", item: { ...item, status: 'Sold' } });
  });

  // Delete item
  app.delete("/api/items/:id", authenticateToken, (req: any, res) => {
    // Check ownership
    const checkStmt = db.prepare("SELECT sellerId FROM items WHERE id = ?");
    const item = checkStmt.get(req.params.id) as any;
    
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.sellerId !== req.user.id) return res.status(403).json({ error: "Forbidden" });

    const stmt = db.prepare("DELETE FROM items WHERE id = ?");
    stmt.run(req.params.id);
    
    res.json({ message: "Item deleted successfully" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
