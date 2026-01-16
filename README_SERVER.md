# PeerServer 配置指南

本项目使用自托管的 PeerServer 进行多人联机。

## 1. 当前配置

前端连接的 PeerServer 配置位于 `.env` 文件中：

```env
VITE_PEER_HOST=real-zebra-15.zhaoygcq.deno.net
VITE_PEER_PORT=443
VITE_PEER_PATH=/guess-number
VITE_PEER_SECURE=true
```

## 2. 服务端代码备份

由于您已经将服务部署在 Deno Playground/Deploy 上，本地的 `peer-server` 文件夹已被移除。

如果您需要重新部署，可以使用以下代码（保存为 `server.ts`）：

```typescript
import express from "npm:express@4.18.2";
import { ExpressPeerServer } from "npm:peer@1.0.0";

// Deno Deploy sets the PORT environment variable (defaults to 8000)
const PORT = Number(Deno.env.get("PORT")) || 9000;
const PATH = "/guess-number";

console.log(`Starting PeerServer on port ${PORT}...`);

const app = express();

// Health check endpoint for Deno Deploy
app.get("/", (_req: any, res: any) => {
  res.send("PeerJS Server is running OK");
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`PeerServer running on port ${PORT}, path: ${PATH}`);
});

// Initialize PeerServer
const peerServer = ExpressPeerServer(server, {
  allow_discovery: true,
  proxied: true,
  path: "/" 
});

// Mount PeerJS at the specified path
app.use(PATH, peerServer);

peerServer.on("connection", (client: any) => {
  console.log(`Client connected: ${client.getId()}`);
});

peerServer.on("disconnect", (client: any) => {
  console.log(`Client disconnected: ${client.getId()}`);
});
```
