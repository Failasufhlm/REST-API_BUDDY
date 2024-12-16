const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

// Initialize Firebase Admin with Storage (Google Cloud Storage)
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "capstonestorage1", // Menggunakan Google Cloud Storage
});

// Menginisialisasi koneksi dengan Google Cloud Storage
const bucket = admin.storage().bucket(); // Menyimpan file ke bucket

// Fungsi untuk mendaftarkan pengguna
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validasi email dan password
    if (!email || !password || !name) {
      return res.status(400).json({
        error: true,
        message: "Nama, email, dan password harus diisi",
      });
    }

    // Validasi format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: true,
        message: "Format email tidak valid",
      });
    }

    // Validasi panjang password
    if (password.length < 8) {
      return res.status(400).json({
        error: true,
        message: "Password harus memiliki minimal 8 karakter",
      });
    }

    // Cek apakah email sudah terdaftar di Firebase
    let existingUser;
    try {
      existingUser = await admin.auth().getUserByEmail(email);
    } catch (err) {
      // Jika tidak ada, Firebase akan melemparkan error
      if (err.code !== "auth/user-not-found") {
        throw err; // Jika error lain, lemparkan error
      }
    }

    if (existingUser) {
      return res.status(400).json({
        error: true,
        message: "Email sudah terdaftar",
      });
    }

    // Buat pengguna dengan Firebase Auth
    const userRecord = await admin.auth().createUser({
      displayName: name,
      email: email,
      password: password,
    });

    // Simpan data pengguna ke Google Cloud Storage sebagai file JSON
    const userData = {
      name: name,
      email: email,
      userId: userRecord.uid,
    };

    const file = bucket.file(`users/${userRecord.uid}.json`);
    await file.save(JSON.stringify(userData));

    res.status(200).json({
      error: false,
      message: "Pengguna berhasil terdaftar",
      userId: userRecord.uid,
    });
  } catch (error) {
    res.status(400).json({
      error: true,
      message: error.message,
    });
  }
};

// Fungsi untuk login pengguna
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Authenticate with Firebase Auth
    const userRecord = await admin.auth().getUserByEmail(email);

    // Create a custom token with extended expiry
    const token = await admin.auth().createCustomToken(userRecord.uid);

    // Get user data from Google Cloud Storage
    const file = bucket.file(`users/${userRecord.uid}.json`);
    const [fileExists] = await file.exists();

    if (!fileExists) {
      throw new Error("Data pengguna tidak ditemukan");
    }

    // Download file pengguna
    const [fileData] = await file.download();
    const userData = JSON.parse(fileData.toString());

    // Update last login timestamp in storage (optional, could store in a separate log file)
    const logFile = bucket.file(`users/${userRecord.uid}_login_logs.json`);
    const loginData = { userId: userRecord.uid, loginTime: new Date() };
    await logFile.save(JSON.stringify(loginData));

    res.status(200).json({
      error: false,
      message: "Login successful",
      loginResult: {
        userId: userRecord.uid,
        name: userData.name,
        email: userData.email,
        token: token,
        tokenExpiration: "1h",
      },
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fungsi untuk menghapus pengguna
const deleteUser = async (req, res) => {
  try {
    const { uid } = req.params;

    // Hapus pengguna dari Firebase Auth
    await admin.auth().deleteUser(uid);

    // Hapus data pengguna dari Google Cloud Storage
    const file = bucket.file(`users/${uid}.json`);
    await file.delete();

    res.status(200).json({ message: "Pengguna berhasil dihapus" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fungsi untuk mengupdate pengguna
const updateUser = async (req, res) => {
  try {
    const { uid } = req.params;
    const { name, email } = req.body;

    // Proses pembaruan pengguna berdasarkan uid di Firebase Auth
    await admin.auth().updateUser(uid, { displayName: name, email });

    // Proses pembaruan data pengguna di Google Cloud Storage
    const file = bucket.file(`users/${uid}.json`);
    const updatedData = {
      name: name,
      email: email,
      userId: uid,
    };
    await file.save(JSON.stringify(updatedData));

    res.status(200).json({ message: "Pengguna berhasil diperbarui" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Fungsi untuk mendapatkan data pengguna berdasarkan userId
const user = async (req, res) => {
  try {
    const { uid } = req.params;

    // Proses mendapatkan data pengguna dari Google Cloud Storage
    const file = bucket.file(`users/${uid}.json`);
    const [fileExists] = await file.exists();

    if (!fileExists) {
      throw new Error("Data pengguna tidak ditemukan");
    }

    const [fileData] = await file.download();
    const userData = JSON.parse(fileData.toString());

    res.status(200).json({ user: userData });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    // Lakukan proses logout di sini
    // Misalnya, hapus token yang digunakan oleh pengguna atau sesi yang aktif

    res.status(200).json({ error: false, message: "Pengguna berhasil logout" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  register,
  login,
  deleteUser,
  updateUser,
  user,
  logout,
};
