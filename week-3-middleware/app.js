const crypto = require("crypto");
const path = require("path");
const express = require("express");
const dogsRouter = require("./routes/dogs");

const app = express();

// Request ID middleware
app.use((req, res, next) => {
  const requestId = crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("X-Request-Id", requestId);
  next();
});

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

// Content-Type validation middleware for POST requests
app.use((req, res, next) => {
  if (req.method === "POST") {
    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("application/json")) {
      return res.status(400).json({
        error: "Content-Type must be application/json",
        requestId: req.requestId,
      });
    }
  }
  next();
});

// JSON body parser with size limit
app.use(express.json({ limit: "1mb" }));

// Static file middleware for public directory
app.use(express.static(path.join(__dirname, "public")));

// Application routes
app.use("/", dogsRouter);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

// Centralized error handling middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.name === "ValidationError") {
    console.warn(`WARN: ValidationError: ${err.message}`);
    return res.status(400).json({
      error: err.message,
      requestId: req.requestId,
    });
  }

  if (err.name === "NotFoundError") {
    console.warn(`WARN: NotFoundError: ${err.message}`);
    return res.status(404).json({
      error: err.message,
      requestId: req.requestId,
    });
  }

  console.error(`ERROR: Error: ${err.message}`);
  return res.status(500).json({
    error: "Internal Server Error",
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;
