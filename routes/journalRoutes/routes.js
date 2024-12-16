const express = require("express");
const router = express.Router();
const {
  createJournalEntry,
  getJournalEntries,
  getJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  analyzeJournalMood,
} = require("./controllers");

// Create new journal entry
router.post("/", createJournalEntry);

// Get all journal entries for a user
router.get("/user/:userId", getJournalEntries);

// Get specific journal entry
router.get("/:id", getJournalEntry);

// Update journal entry
router.put("/:id", updateJournalEntry);

// Delete journal entry
router.delete("/:id", deleteJournalEntry);

// Analyze journal mood
router.post("/analyze", analyzeJournalMood);

module.exports = router;
