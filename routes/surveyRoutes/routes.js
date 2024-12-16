const express = require("express");
const router = express.Router();
const {
  getSurveyQuestions,
  submitSurveyAnswers,
  getSurveyResults,
  createSurvey,
  validateToken,
} = require("./controllers");

// Get all survey questions (token required)
router.get("/questions", getSurveyQuestions);

// Submit survey answers (token required)
router.post("/submit", submitSurveyAnswers);

// Get survey results (token required)
router.get("/results/:userId", getSurveyResults);

// Create new survey (admin only)
router.post("/create", createSurvey);

module.exports = router;
