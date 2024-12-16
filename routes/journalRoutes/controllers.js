const admin = require("firebase-admin");
const db = admin.firestore();
const language = require("@google-cloud/language");
const languageClient = new language.LanguageServiceClient();

// Create new journal entry
const createJournalEntry = async (req, res) => {
  try {
    const { userId, content, title } = req.body;

    // Analyze sentiment
    const sentiment = await analyzeSentiment(content);

    const journalEntry = {
      userId,
      title,
      content,
      sentiment,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("journal_entries").add(journalEntry);

    res.status(201).json({
      id: docRef.id,
      ...journalEntry,
      message: "Journal entry created successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Mendapatkan semua entri jurnal untuk pengguna
const getJournalEntries = async (req, res) => {
  try {
    const { userId } = req.params;
    const entriesSnapshot = await db
      .collection("journal_entries")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const entries = [];
    entriesSnapshot.forEach((doc) => {
      entries.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    res.status(200).json({ entries });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Dapatkan entri jurnal tertentu
const getJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("journal_entries").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    res.status(200).json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Memperbarui entri jurnal
const updateJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, title } = req.body;

    // Analisis kembali sentimen jika konten berubah
    const sentiment = content ? await analyzeSentiment(content) : undefined;

    const updateData = {
      ...(title && { title }),
      ...(content && { content, sentiment }),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await db.collection("journal_entries").doc(id).update(updateData);

    res.status(200).json({
      message: "Journal entry updated successfully",
      sentiment,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Menghapus entri jurnal
const deleteJournalEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("journal_entries").doc(id).delete();
    res.status(200).json({ message: "Journal entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Analisis suasana jurnal
const analyzeJournalMood = async (req, res) => {
  try {
    const { content } = req.body;
    const sentiment = await analyzeSentiment(content);
    res.status(200).json({ sentiment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Fungsi pembantu untuk menganalisis sentimen menggunakan Google Cloud Natural Language API
async function analyzeSentiment(text) {
  const document = {
    content: text,
    type: "PLAIN_TEXT",
  };

  const [result] = await languageClient.analyzeSentiment({ document });
  const sentiment = result.documentSentiment;

  return {
    score: sentiment.score,
    magnitude: sentiment.magnitude,
    mood: interpretMood(sentiment.score),
  };
}

// Fungsi pembantu untuk menafsirkan skor sentimen
function interpretMood(score) {
  const moods = {
    veryPositive: { threshold: 0.5, label: "Very Positive", emoji: "😊", advice: "Keep up the great energy!" },
    positive: { threshold: 0.1, label: "Positive", emoji: "🙂", advice: "You're doing well!" },
    neutral: { threshold: -0.1, label: "Neutral", emoji: "😐", advice: "Consider what might lift your spirits." },
    negative: { threshold: -0.5, label: "Negative", emoji: "😔", advice: "Consider talking to someone about your feelings." },
    veryNegative: { threshold: -Infinity, label: "Very Negative", emoji: "😢", advice: "Please reach out for support - you're not alone." }
  };

  for (const mood of Object.values(moods)) {
    if (score >= mood.threshold) {
      return {
        label: mood.label,
        emoji: mood.emoji,
        advice: mood.advice,
        score: score
      };
    }
  }
}

module.exports = {
  createJournalEntry,
  getJournalEntries,
  getJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
  analyzeJournalMood,
};