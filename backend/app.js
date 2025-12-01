const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// -------------------------------
// CORS FIX (works for Render + Vercel + Local)
// -------------------------------
app.use(
  cors({
    origin: [
      "http://localhost:5173",                       // local dev
      "https://creative-palette-api.onrender.com",  // Render health check
      "https://YOUR-VERCEL-FRONTEND.vercel.app"     // replace with your Vercel URL
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// -------------------------------
// Parsers
// -------------------------------
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// -------------------------------
// ROUTES
// -------------------------------
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/artworks", require("./routes/artwork.routes"));
app.use("/api/cart", require("./routes/cart.routes"));
app.use("/api/order", require("./routes/order.routes"));
app.use("/api/payment", require("./routes/payment.routes"));
app.use("/api/blog", require("./routes/blog.routes"));
app.use("/api/commission", require("./routes/commission.routes"));

// -------------------------------
// HEALTH CHECK (Render requires this)
// -------------------------------
app.get("/", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "ArtGallery backend is running 🚀",
  });
});

// -------------------------------
// NOT FOUND HANDLER
// -------------------------------
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

module.exports = app;
