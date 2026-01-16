import express from "npm:express@4.18.2";
import { ExpressPeerServer } from "npm:peer@1.0.0";

// Deno Deploy sets the PORT environment variable (defaults to 8000)
const PORT = Number(Deno.env.get("PORT")) || 9000;
const PATH = "/guess-number";

console.log(`Starting PeerServer on port ${PORT}...`);

const app = express();

// Health check endpoint for Deno Deploy
// This is crucial to prevent "Warm up (Failed)" errors
app.get("/", (_req: any, res: any) => {
  res.send("PeerJS Server is running OK");
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`PeerServer running on port ${PORT}, path: ${PATH}`);
});

// Initialize PeerServer
const peerServer = ExpressPeerServer(server, {
  allow_discovery: true,
  proxied: true, // Required for Deno Deploy (running behind a load balancer)
  path: "/" // Internal path for ExpressPeerServer, mounted below
});

// Mount PeerJS at the specified path
app.use(PATH, peerServer);

peerServer.on("connection", (client: any) => {
  console.log(`Client connected: ${client.getId()}`);
});

peerServer.on("disconnect", (client: any) => {
  console.log(`Client disconnected: ${client.getId()}`);
});
