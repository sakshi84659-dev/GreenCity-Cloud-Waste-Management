
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db");
const { authenticateToken, requireAdmin } = require("./authMiddleware");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const [users] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );

    if (!users.length) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const user = users[0];

    if (user.status !== "Active") {
      return res.status(403).json({
        message: "Your account is inactive."
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    if (user.role !== "Admin") {
      return res.status(403).json({
        message: "Only Admin accounts can access this dashboard."
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT secret is not configured."
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Login failed."
    });
  }
});

router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name || !email || !name.trim() || !email.trim()) {
      return res.status(400).json({
        message: "Name and email are required."
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email.trim(), req.user.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "This email address is already registered."
      });
    }

    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ? WHERE id = ?",
      [name.trim(), email.trim(), req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User account not found."
      });
    }

    const [updatedUsers] = await db.query(
      "SELECT id, name, email, role, status FROM users WHERE id = ?",
      [req.user.id]
    );

    res.json({
      message: "Profile updated successfully.",
      user: updatedUsers[0]
    });
  } catch (error) {
    console.error("Profile update error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "This email address is already registered."
      });
    }

    res.status(500).json({
      message: "Unable to update profile."
    });
  }
});

router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT id, name, email, role, status, created_at FROM users ORDER BY id DESC"
    );

    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      message: "Unable to retrieve users."
    });
  }
});

router.post("/register", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must contain at least 8 characters."
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Email already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'Staff', 'Active')",
      [name, email, hashedPassword]
    );

    res.status(201).json({
      message: "Staff account created successfully."
    });
  } catch (error) {
    console.error("Register user error:", error);
    res.status(500).json({
      message: "Unable to create user."
    });
  }
});

router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status } = req.body;

    if (!name || !email || !role || !status) {
      return res.status(400).json({
        message: "All fields are required."
      });
    }

    if (!["Admin", "Staff"].includes(role)) {
      return res.status(400).json({
        message: "Invalid user role."
      });
    }

    if (!["Active", "Inactive"].includes(status)) {
      return res.status(400).json({
        message: "Invalid user status."
      });
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ? AND id != ?",
      [email, id]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: "Email already exists."
      });
    }

    const [result] = await db.query(
      "UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?",
      [name, email, role, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.json({
      message: "User updated successfully."
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      message: "Unable to update user."
    });
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === Number(req.user.id)) {
      return res.status(400).json({
        message: "You cannot delete your own account."
      });
    }

    const [result] = await db.query(
      "DELETE FROM users WHERE id = ?",
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "User not found."
      });
    }

    res.json({
      message: "User deleted successfully."
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      message: "Unable to delete user."
    });
  }
});

module.exports = router;
