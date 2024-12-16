const path = require("path");
const fs = require("fs");
const xlsx = require("xlsx");

// Fungsi untuk mendapatkan obat berdasarkan kategori
function getMedicineByCategory(req, res) {
  const { category } = req.params;
  const { name } = req.query; // Menambahkan parameter 'name' dari query string

  // Path ke folder data
  const filePath = path.join(__dirname, "data", `${category}.xls`);

  // Cek apakah file ada
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "Category not found." });
  }

  try {
    // Baca file Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Format data sesuai dengan kolom kategori lama
    const formattedData = sheetData.map((row) => ({
      name: row["Name"], // Kolom Name
      price: row["Price"], // Kolom Price
      url: row["URL"], // Kolom URL
      imageUrl: row["Image URL"], // Kolom Image URL
    }));

    // Jika ada query 'name', lakukan pencarian berdasarkan nama obat
    if (name) {
      const filteredData = formattedData.filter(
        (medicine) =>
          medicine.name &&
          medicine.name.toLowerCase().includes(name.toLowerCase())
      );

      if (filteredData.length === 0) {
        return res.status(404).json({ error: "Medicine not found." });
      }

      return res.status(200).json(filteredData);
    }

    // Jika tidak ada query 'name', tampilkan semua obat berdasarkan kategori
    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error reading Excel file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

// Fungsi untuk mendapatkan semua obat berdasarkan format baru
function getAllMedicines(req, res) {
  const filePath = path.join(__dirname, "data", "general.xlsx");

  // Cek apakah file ada
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: "File not found." });
  }

  try {
    // Baca file Excel
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Format data sesuai dengan kolom baru
    const formattedData = sheetData.map((row) => ({
      name: row["Nama Produk"], // Kolom Nama Produk
      price: row["Harga"], // Kolom Harga
      url: row["URL"], // Kolom URL
      description: row["Deskripsi"], // Kolom Deskripsi
    }));

    res.status(200).json(formattedData);
  } catch (error) {
    console.error("Error reading Excel file:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { getMedicineByCategory, getAllMedicines };
