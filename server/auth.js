import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "change-this-secret";
const JWT_EXPIRY = process.env.JWT_EXPIRY || "7d";

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, displayName: user.display_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

// Middleware: verify JWT and attach req.user
export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// Verify a token string (used by WebSocket)
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      "INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, email, display_name, created_at",
      [email, hash, displayName || email.split("@")[0]]
    );

    const user = rows[0];
    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
});

// POST /api/auth/signin
router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (rows.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, displayName: user.display_name } });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ error: "Signin failed" });
  }
});

// POST /api/auth/signout
router.post("/signout", (_req, res) => {
  // Token-based auth — client just discards the token
  res.json({ ok: true });
});

// GET /api/auth/me
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, displayName: req.user.displayName } });
});

export default router;
