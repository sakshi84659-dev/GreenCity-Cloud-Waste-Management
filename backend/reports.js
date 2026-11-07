
const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/summary", async (req, res) => {
  try {
    const [complaints] = await db.query(`
      SELECT
        status,
        COUNT(*) AS total
      FROM complaints
      GROUP BY status
    `);

    const [collections] = await db.query(`
      SELECT
        status,
        COUNT(*) AS total,
        COALESCE(SUM(quantity), 0) AS total_quantity
      FROM waste_collections
      GROUP BY status
    `);

    const [wasteTypes] = await db.query(`
      SELECT
        waste_type,
        COALESCE(SUM(quantity), 0) AS total_quantity
      FROM waste_collections
      GROUP BY waste_type
    `);

    const [monthlyCollections] = await db.query(`
      SELECT
        DATE_FORMAT(MIN(collection_date), '%b %Y') AS month,
        SUM(quantity) AS total_quantity
      FROM waste_collections
      GROUP BY YEAR(collection_date), MONTH(collection_date)
      ORDER BY YEAR(collection_date), MONTH(collection_date)
    `);

    res.json({
      complaints,
      collections,
      wasteTypes,
      monthlyCollections
    });

  } catch (error) {
    console.error("Reports API error:", error);

    res.status(500).json({
      message: "Unable to generate reports.",
      error: error.message
    });
  }
});

module.exports = router;
