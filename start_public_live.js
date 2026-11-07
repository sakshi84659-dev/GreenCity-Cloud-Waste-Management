const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const backendPath = path.join(__dirname, "backend", "server.js");

console.log("Starting GreenCity Unified Backend...");
const server = spawn(process.execPath, [backendPath], {
  cwd: path.join(__dirname, "backend"),
  stdio: "inherit",
  detached: false
});

// Wait for server to start, then launch tunnel
setTimeout(() => {
  console.log("Launching Public Cloud Tunnel on port 5000...");
  const tunnel = spawn("npx.cmd", ["--yes", "localtunnel", "--port", "5000"], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true
  });

  tunnel.stdout.on("data", (data) => {
    const text = data.toString();
    console.log("[CloudTunnel]", text.trim());
  });

  tunnel.stderr.on("data", (data) => {
    console.error("[TunnelLog]", data.toString().trim());
  });

  tunnel.on("close", (code) => {
    console.log("Tunnel closed with code:", code);
  });
}, 3000);

process.on("SIGINT", () => {
  server.kill();
  process.exit(0);
});
