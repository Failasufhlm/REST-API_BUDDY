const express = require("express");
const router = express.Router();
const { getMedicineByCategory, getAllMedicines } = require("./controllers");

// Endpoint GET untuk kategori obat dan pencarian nama obat
router.get("/medicines/:category", getMedicineByCategory);

// Endpoint GET untuk mendapatkan seluruh obat dari general.xlsx
router.get("/medicines", getAllMedicines);

module.exports = router;
