require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// Route imports
const authRoutes = require("./routes/authRoutes/authRoutes");
const surveyRoutes = require("./routes/surveyRoutes/routes");
const drugStoreRoutes = require("./routes/DrugStoreRoutes/routes");
const journalRoutes = require("./routes/journalRoutes/routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Welcome route
app.get("/", (req, res) => {
  res.send("Welcome to Mental Health API!");
});

// API Routes
app.use("/api/auth", authRoutes); // Authentication endpoints
app.use("/api/survey", surveyRoutes); // Mental health survey
app.use("/api/drug-store", drugStoreRoutes); // Find a Drug Store
app.use("/api/journal", journalRoutes); // Journal analysis

// Penanganan Kesalahan (Error Handling)
app.use((err, req, res, next) => {
  console.error(err.stack); // Log stack trace kesalahan
  res.status(500).json({ error: "Terjadi kesalahan pada server." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
