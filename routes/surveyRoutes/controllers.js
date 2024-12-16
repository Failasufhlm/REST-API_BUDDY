const { Storage } = require("@google-cloud/storage");
const admin = require("firebase-admin");
const storage = new Storage(); // Inisialisasi GCS client
const bucketName = "capstonestorage1"; // Ganti dengan nama bucket GCS kamu
const bucket = storage.bucket(bucketName);

// Validation middleware untuk memverifikasi token Firebase (token sekali pakai)
const validateToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verifikasi token menggunakan Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    // Check if the user is an admin (assuming you store a role in the token)
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only" });
    }

    next();
  } catch (error) {
    console.error("Error verifying token:", error);
    return res.status(401).json({
      error: "Unauthorized",
      message:
        "Decoding Firebase ID token failed. Make sure you passed the entire string JWT which represents an ID token.",
    });
  }
};

// Get all survey questions (menyimpan pertanyaan ke file JSON di GCS)
const getSurveyQuestions = async (req, res) => {
  try {
    const file = bucket.file("survey_questions.json");
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ error: "Survey questions not found" });
    }

    const [contents] = await file.download();
    const questions = JSON.parse(contents);

    res.status(200).json({ questions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Submit survey answers (menyimpan hasil survei ke GCS tanpa score)
const submitSurveyAnswers = async (req, res) => {
  try {
    const { userId, answers } = req.body;

    // Menyimpan hasil survei ke file JSON di GCS
    const file = bucket.file(`survey_responses/${userId}_survey_response.json`);
    const response = {
      userId,
      answers, // Menyimpan hanya jawaban yang diberikan pengguna
      timestamp: admin.firestore.FieldValue.serverTimestamp(), // Waktu pengisian survei
    };

    await file.save(JSON.stringify(response), { resumable: false });

    res.status(200).json({
      message: "Survey submitted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get survey results (ambil hasil survei berdasarkan userId tanpa score)
const getSurveyResults = async (req, res) => {
  try {
    const { userId } = req.params;
    const file = bucket.file(`survey_responses/${userId}_survey_response.json`);
    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({ error: "Survey results not found" });
    }

    const [contents] = await file.download();
    const result = JSON.parse(contents);

    res.status(200).json({ results: [result] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new survey (admin only) - menyimpan pertanyaan ke GCS
const createSurvey = async (req, res) => {
  try {
    const { questions } = req.body;

    // Simpan pertanyaan survei ke file JSON di GCS
    const file = bucket.file("survey_questions.json");
    await file.save(JSON.stringify(questions), { resumable: false });

    res.status(200).json({ message: "Survey created successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getSurveyQuestions,
  submitSurveyAnswers,
  getSurveyResults,
  createSurvey,
  validateToken,
};
