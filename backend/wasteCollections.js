
const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM waste_collections ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch waste collections" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      location,
      waste_type,
      quantity,
      collection_date,
      vehicle_number,
      status
    } = req.body;

    if (!location || !waste_type || !quantity || !collection_date) {
      return res.status(400).json({
        message: "Please fill all required fields"
      });
    }

    const [result] = await db.query(
      `INSERT INTO waste_collections
      (location, waste_type, quantity, collection_date, vehicle_number, status)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        location,
        waste_type,
        quantity,
        collection_date,
        vehicle_number || null,
        status || "Scheduled"
      ]
    );

    res.status(201).json({
      message: "Waste collection added successfully",
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to add waste collection"
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      location,
      waste_type,
      quantity,
      collection_date,
      vehicle_number,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE waste_collections
      SET location = ?, waste_type = ?, quantity = ?,
      collection_date = ?, vehicle_number = ?, status = ?
      WHERE id = ?`,
      [
        location,
        waste_type,
        quantity,
        collection_date,
        vehicle_number || null,
        status,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Waste collection not found"
      });
    }

    res.json({ message: "Waste collection updated successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update waste collection"
    });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM waste_collections WHERE id = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({
        message: "Waste collection not found"
      });
    }

    res.json({ message: "Waste collection deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete waste collection"
    });
  }
});

module.exports = router;
