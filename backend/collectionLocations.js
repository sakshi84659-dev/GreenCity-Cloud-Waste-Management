
const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM collection_locations ORDER BY id DESC"
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch locations" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      location_name,
      address,
      area,
      latitude,
      longitude,
      bin_capacity,
      waste_type,
      status
    } = req.body;

    if (!location_name || !address || !area) {
      return res.status(400).json({
        message: "Location name, address and area are required"
      });
    }

    const [result] = await db.query(
      `INSERT INTO collection_locations
      (location_name, address, area, latitude, longitude, bin_capacity, waste_type, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        location_name,
        address,
        area,
        latitude || null,
        longitude || null,
        bin_capacity || null,
        waste_type || null,
        status || "Active"
      ]
    );

    res.status(201).json({
      message: "Collection location added successfully",
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add location" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      location_name,
      address,
      area,
      latitude,
      longitude,
      bin_capacity,
      waste_type,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE collection_locations
      SET location_name = ?, address = ?, area = ?, latitude = ?,
      longitude = ?, bin_capacity = ?, waste_type = ?, status = ?
      WHERE id = ?`,
      [
        location_name,
        address,
        area,
        latitude || null,
        longitude || null,
        bin_capacity || null,
        waste_type || null,
        status,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.json({ message: "Location updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update location" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM collection_locations WHERE id = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Location not found" });
    }

    res.json({ message: "Location deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete location" });
  }
});

module.exports = router;
