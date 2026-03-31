require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";
const isProduction = process.env.NODE_ENV === "production";

app.use(cors({
  origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map(origin => origin.trim()),
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.use("/api", require("./routes/auth"));
app.use("/api/profile", require("./routes/profile"));
app.use("/api/profiles", require("./routes/profile"));
app.use("/api/materials", require("./routes/materials"));

const startServer = () => {
  app.listen(PORT, () => {
    const mode = process.env.USE_MEMORY_DB === "true" ? "memory mode" : "database mode";
    console.log(`Server running on port ${PORT} (${mode})`);
  });
};

if (isProduction && !MONGO_URI) {
  console.error("MONGO_URI is required in production.");
  process.exit(1);
}

if (isProduction && (!process.env.JWT_SECRET || process.env.JWT_SECRET === "dev-only-secret-change-me")) {
  console.error("A strong JWT_SECRET is required in production.");
  process.exit(1);
}

if (!MONGO_URI) {
  process.env.USE_MEMORY_DB = "true";
  console.warn("MONGO_URI not found. Starting backend with in-memory data.");
  startServer();
} else {
  mongoose
    .connect(MONGO_URI)
    .then(() => {
      console.log("MongoDB connected");
      startServer();
    })
    .catch((error) => {
      process.env.USE_MEMORY_DB = "true";
      console.warn(`MongoDB connection failed (${error.message}). Starting backend with in-memory data.`);
      startServer();
    });
}
