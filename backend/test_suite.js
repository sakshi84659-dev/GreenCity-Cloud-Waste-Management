require("dotenv").config();
const http = require("http");
const https = require("https");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const db = require("./db");

const BASE_URL = process.env.TEST_URL || `http://localhost:${process.env.PORT || 5000}`;
let authToken = "";
let testComplaintId = null;
let testVehicleId = null;
let testCollectionId = null;
let testLocationId = null;
let ephemeralTestUserId = null;
const ephemeralEmail = `temp_tester_${Date.now()}@greencity.test`;
const ephemeralPassword = `TestSecret#${crypto.randomBytes(8).toString("hex")}`;

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const client = url.protocol === "https:" ? https : http;
    const options = {
      method,
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname + url.search,
      servername: url.hostname,
      headers: {
        Host: url.hostname,
        ...headers
      }
    };

    let payload = null;
    if (body) {
      payload = JSON.stringify(body);
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(payload);
    }

    if (authToken && !options.headers["Authorization"]) {
      options.headers["Authorization"] = `Bearer ${authToken}`;
    }

    const req = client.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log("============================================================");
  console.log(" GreenCity Automated System Test Suite");
  console.log(` Target: ${BASE_URL}`);
  console.log(` Mode: Local System Integration Verification`);
  console.log("============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // 0. Setup Ephemeral Test Account
    const hashedPassword = await bcrypt.hash(ephemeralPassword, 10);
    const [userRes] = await db.query(
      "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, 'Admin', 'Active')",
      ["Ephemeral Test Runner", ephemeralEmail, hashedPassword]
    );
    ephemeralTestUserId = userRes.insertId;

    // 1. Health & DB Check
    console.log("--- 1. Health & Connectivity Endpoints ---");
    const health = await request("GET", "/api/health");
    assert(health.status === 200 && health.data.status === "healthy", "GET /api/health returns 200 healthy");

    const dbCheck = await request("GET", "/api/db-check");
    assert(dbCheck.status === 200 && dbCheck.data.database === "Connected", "GET /api/db-check returns 200 Connected");

    // 2. Authentication
    console.log("\n--- 2. Authentication & Authorization ---");
    const badLogin = await request("POST", "/api/users/login", { email: ephemeralEmail, password: "InvalidPassword999" });
    assert(badLogin.status === 401, "POST /api/users/login with invalid password rejected (401)");

    const goodLogin = await request("POST", "/api/users/login", { email: ephemeralEmail, password: ephemeralPassword });
    assert(goodLogin.status === 200 && Boolean(goodLogin.data.token), "POST /api/users/login succeeds & returns JWT token");
    authToken = goodLogin.data.token;

    // 3. Complaints Module
    console.log("\n--- 3. Complaints & Complaint Tracking Module ---");
    const createComplaint = await request("POST", "/api/complaints", {
      name: "CITIZEN_TEST",
      location: "Sector 14 Green Park",
      category: "Overflowing Dustbin",
      description: "Dustbin near community center is overflowing with recyclable waste."
    });
    assert(createComplaint.status === 201 && createComplaint.data.id, "POST /api/complaints creates complaint (201)");
    testComplaintId = createComplaint.data.id;

    const listComplaints = await request("GET", "/api/complaints");
    assert(Array.isArray(listComplaints.data) && listComplaints.data.some(c => c.id === testComplaintId), "GET /api/complaints lists created complaint");

    const statsSummary = await request("GET", "/api/complaints/stats/summary");
    assert(statsSummary.status === 200 && typeof statsSummary.data.total === "number", "GET /api/complaints/stats/summary returns aggregated counts");

    const updateComplaint = await request("PATCH", `/api/complaints/${testComplaintId}/status`, { status: "In Progress" });
    assert(updateComplaint.status === 200, "PATCH /api/complaints/:id/status updates status to In Progress (200)");

    const resolveComplaint = await request("PATCH", `/api/complaints/${testComplaintId}/status`, { status: "Resolved" });
    assert(resolveComplaint.status === 200, "PATCH /api/complaints/:id/status updates status to Resolved (200)");

    // 4. Vehicles Module
    console.log("\n--- 4. Vehicles & Fleet Management Module ---");
    const vehicleNumber = `DL-01-GC-${Date.now().toString().slice(-4)}`;
    const createVehicle = await request("POST", "/api/vehicles", {
      vehicle_number: vehicleNumber,
      vehicle_type: "Compactor Truck",
      driver_name: "Rajesh Kumar",
      driver_phone: "9876543210",
      capacity: 5.5,
      status: "Active"
    });
    assert(createVehicle.status === 201, "POST /api/vehicles creates new vehicle (201)");
    testVehicleId = createVehicle.data.id;

    const listVehicles = await request("GET", "/api/vehicles");
    assert(Array.isArray(listVehicles.data) && listVehicles.data.some(v => v.id === testVehicleId), "GET /api/vehicles returns fleet list containing new vehicle");

    const updateVehicle = await request("PUT", `/api/vehicles/${testVehicleId}`, {
      vehicle_number: vehicleNumber,
      vehicle_type: "Compactor Truck",
      driver_name: "Rajesh Kumar",
      driver_phone: "9876543210",
      capacity: 6.0,
      status: "Maintenance"
    });
    assert(updateVehicle.status === 200, "PUT /api/vehicles/:id updates vehicle details (200)");

    // 5. Waste Collections Module
    console.log("\n--- 5. Waste Collection Scheduling Module ---");
    const createCollection = await request("POST", "/api/waste-collections", {
      location: "Sector 14 Central Market",
      waste_type: "Organic Waste",
      quantity: 2.8,
      collection_date: new Date().toISOString().slice(0, 10),
      vehicle_number: vehicleNumber,
      status: "Scheduled"
    });
    assert(createCollection.status === 201, "POST /api/waste-collections schedules collection (201)");
    testCollectionId = createCollection.data.id;

    const listCollections = await request("GET", "/api/waste-collections");
    assert(Array.isArray(listCollections.data) && listCollections.data.some(c => c.id === testCollectionId), "GET /api/waste-collections returns collections list");

    const updateCollection = await request("PUT", `/api/waste-collections/${testCollectionId}`, {
      location: "Sector 14 Central Market",
      waste_type: "Organic Waste",
      quantity: 3.1,
      collection_date: new Date().toISOString().slice(0, 10),
      vehicle_number: vehicleNumber,
      status: "Collected"
    });
    assert(updateCollection.status === 200, "PUT /api/waste-collections/:id marks collection as Collected (200)");

    // 6. Collection Locations Module
    console.log("\n--- 6. Collection Locations & GIS Module ---");
    const createLocation = await request("POST", "/api/collection-locations", {
      location_name: "Green Park Bin #104",
      address: "Main Road Gate 2",
      area: "Sector 14",
      latitude: 28.5355,
      longitude: 77.2100,
      bin_capacity: 500.0,
      waste_type: "General Waste",
      status: "Active"
    });
    assert(createLocation.status === 201, "POST /api/collection-locations adds GIS location (201)");
    testLocationId = createLocation.data.id;

    const listLocations = await request("GET", "/api/collection-locations");
    assert(Array.isArray(listLocations.data) && listLocations.data.some(l => l.id === testLocationId), "GET /api/collection-locations lists location points");

    // 7. Reports & Analytics
    console.log("\n--- 7. Reports & Analytics Module ---");
    const reports = await request("GET", "/api/reports/summary");
    assert(
      reports.status === 200 &&
      Array.isArray(reports.data.complaints) &&
      Array.isArray(reports.data.collections) &&
      Array.isArray(reports.data.wasteTypes),
      "GET /api/reports/summary returns comprehensive aggregated metrics"
    );

    // 8. Users & Authorization
    console.log("\n--- 8. Users & Role-Based Access Control ---");
    const listUsers = await request("GET", "/api/users");
    assert(listUsers.status === 200 && Array.isArray(listUsers.data), "GET /api/users accessible by authenticated Admin (200)");

    // 9. Teardown
    console.log("\n--- 9. Cleanup Ephemeral Test Records ---");
    if (testComplaintId) {
      const delC = await request("DELETE", `/api/complaints/${testComplaintId}`);
      assert(delC.status === 200, "DELETE /api/complaints/:id cleans up test complaint");
    }
    if (testVehicleId) {
      const delV = await request("DELETE", `/api/vehicles/${testVehicleId}`);
      assert(delV.status === 200, "DELETE /api/vehicles/:id cleans up test vehicle");
    }
    if (testCollectionId) {
      const delCol = await request("DELETE", `/api/waste-collections/${testCollectionId}`);
      assert(delCol.status === 200, "DELETE /api/waste-collections/:id cleans up test collection");
    }
    if (testLocationId) {
      const delLoc = await request("DELETE", `/api/collection-locations/${testLocationId}`);
      assert(delLoc.status === 200, "DELETE /api/collection-locations/:id cleans up test location");
    }
    if (ephemeralTestUserId) {
      await db.query("DELETE FROM users WHERE id = ?", [ephemeralTestUserId]);
      assert(true, "Teardown: Removed ephemeral test user from database");
    }

    console.log("\n============================================================");
    console.log(` Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log("============================================================\n");

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error("Test execution failed:", err);
    if (ephemeralTestUserId) {
      await db.query("DELETE FROM users WHERE id = ?", [ephemeralTestUserId]).catch(() => {});
    }
    process.exit(1);
  }
}

runTests();
