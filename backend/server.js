require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const donationRoutes = require("./routes/donationRoutes");

const app = express();

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/blockchain", donationRoutes);

app.get("/api/health", (req, res) => res.json({ status: "ok", message: "BloodChain API running" }));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB connected successfully"))
  .catch(err => console.error("MongoDB error:", err));

app.listen(process.env.PORT, () => console.log("Server running on port", process.env.PORT));
