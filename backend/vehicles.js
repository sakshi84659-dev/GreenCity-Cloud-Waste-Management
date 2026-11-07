
const express = require("express");
const router = express.Router();
const db = require("./db");

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM vehicles ORDER BY id DESC");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      vehicle_number,
      vehicle_type,
      driver_name,
      driver_phone,
      capacity,
      status
    } = req.body;

    if (!vehicle_number || !vehicle_type || !driver_name || !capacity) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    const [result] = await db.query(
      `INSERT INTO vehicles
      (vehicle_number, vehicle_type, driver_name, driver_phone, capacity, status)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [
        vehicle_number,
        vehicle_type,
        driver_name,
        driver_phone || null,
        capacity,
        status || "Active"
      ]
    );

    res.status(201).json({
      message: "Vehicle added successfully",
      id: result.insertId
    });
  } catch (error) {
    res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      message: error.code === "ER_DUP_ENTRY"
        ? "This vehicle number already exists"
        : "Failed to add vehicle"
    });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      vehicle_number,
      vehicle_type,
      driver_name,
      driver_phone,
      capacity,
      status
    } = req.body;

    const [result] = await db.query(
      `UPDATE vehicles SET
      vehicle_number = ?, vehicle_type = ?, driver_name = ?,
      driver_phone = ?, capacity = ?, status = ?
      WHERE id = ?`,
      [
        vehicle_number,
        vehicle_type,
        driver_name,
        driver_phone || null,
        capacity,
        status,
        req.params.id
      ]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Vehicle updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to update vehicle" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [result] = await db.query(
      "DELETE FROM vehicles WHERE id = ?",
      [req.params.id]
    );

    if (!result.affectedRows) {
      return res.status(404).json({ message: "Vehicle not found" });
    }

    res.json({ message: "Vehicle deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete vehicle" });
  }
});

module.exports = router;
