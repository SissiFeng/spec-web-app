import express from "express";
import cors from "cors";
import { createServer } from "http";
import { initDB } from "./db.js";
import authRouter from "./auth.js";
import projectsRouter from "./routes/projects.js";
import itemsRouter from "./routes/items.js";
import { setupWebSocket } from "./ws.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/projects/:pid/items", itemsRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Start
const server = createServer(app);
setupWebSocket(server);

initDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });
