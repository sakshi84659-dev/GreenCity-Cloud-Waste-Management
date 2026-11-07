
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./users");
const complaintRoutes = require("./complaints");
const collectionLocationRoutes = require("./collectionLocations");
const vehicleRoutes = require("./vehicles");
const wasteCollectionRoutes = require("./wasteCollections");
const reportsRoutes = require("./reports");

app.use("/api/auth", authRoutes);
app.use("/api/users", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/collection-locations", collectionLocationRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/waste-collections", wasteCollectionRoutes);
app.use("/api/reports", reportsRoutes);

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "GreenCity Backend is Running"
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`GreenCity Backend running on http://localhost:${PORT}`);
});

server.on("error", (error) => {
    console.error("Server error:", error);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", (error) => {
    console.error("Unhandled rejection:", error);
});
