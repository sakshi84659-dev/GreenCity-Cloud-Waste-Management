
require("dotenv").config();

const bcrypt = require("bcrypt");
const readline = require("readline");
const db = require("./db");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function createAdmin() {
  try {
    const name = await ask("Enter Admin name: ");
    const email = await ask("Enter Admin email: ");
    const password = await ask("Create Admin password (minimum 8 characters): ");

    if (!name.trim() || !email.trim() || password.length < 8) {
      throw new Error("Enter a name, valid email and password of at least 8 characters.");
    }

    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email.trim()]
    );

    if (existing.length > 0) {
      throw new Error("This email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await db.query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'Admin', 'Active')",
      [name.trim(), email.trim(), hashedPassword]
    );

    console.log("Admin account created successfully.");
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    rl.close();
    await db.end();
  }
}

createAdmin();
