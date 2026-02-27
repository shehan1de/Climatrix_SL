require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
const mongoose = require("mongoose");

const connectDB = require("./Configuration/db");
const authRoutes = require("./Route/authRoutes");
const contactRoutes = require("./Route/contactRoutes");
const adminQueryRoutes = require("./Route/adminQueryRoutes");
const PredictionRoutes = require("./Route/predictions");
const userRoutes = require("./Route/userRoutes");
const alertRoutes = require("./Route/alertRoutes");

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(helmet());

app.use("/api/auth", authRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api", adminQueryRoutes);

app.use("/api/predictions", PredictionRoutes);
app.use("/api", userRoutes);
app.use("/api", alertRoutes);

app.use(
  "/image",
  (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  },
  express.static(path.join(__dirname, "image"))
);

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    await connectDB();

    mongoose.connection.on("error", (err) =>
      console.error("MongoDB error:", err.message)
    );
    mongoose.connection.on("disconnected", () =>
      console.log("MongoDB disconnected")
    );

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Closing server & DB...`);

      server.close(async () => {
        try {
          await mongoose.connection.close(false);
          console.log("MongoDB connection closed.");
          process.exit(0);
        } catch (err) {
          console.error("Error closing MongoDB:", err.message);
          process.exit(1);
        }
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();