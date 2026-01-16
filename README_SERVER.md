# 自托管 PeerServer 指南

如果您希望完全控制连接数据，或者在没有互联网连接的局域网环境中使用，您可以自己部署 `peerjs-server`。

## 1. 安装 PeerJS Server

首先，您需要一个 Node.js 环境。

```bash
mkdir my-peer-server
cd my-peer-server
npm init -y
npm install peer
```

## 2. 创建服务器脚本

创建 `index.js` 文件：

```javascript
const { PeerServer } = require('peer');

const port = 9000;

const peerServer = PeerServer({
  port: port,
  path: '/guess-number'
});

console.log(`PeerServer running on port ${port}, path: /guess-number`);
```

## 3. 运行服务器

```bash
node index.js
```

## 4. 配置前端项目

在 `guess-number` 项目根目录下创建 `.env` 文件（或修改现有的）：

```env
VITE_PEER_HOST=localhost
VITE_PEER_PORT=9000
VITE_PEER_PATH=/guess-number
VITE_PEER_SECURE=false
```

> 注意：如果您部署在服务器上，请将 `VITE_PEER_HOST` 更改为您的服务器 IP 或域名。如果您的网站使用 HTTPS，则 PeerServer 也必须使用 HTTPS（需要配置 SSL 证书），并将 `VITE_PEER_SECURE` 设置为 `true`。

## 5. 重新启动前端

```bash
npm run dev
```

## 6. 部署到 Deno Deploy

如果您希望免费部署到公网，可以使用 Deno Deploy。

1.  将代码推送到 GitHub。
2.  访问 [Deno Deploy](https://dash.deno.com)。
3.  创建新项目，选择您的仓库。
4.  设置 **Entrypoint** 为 `peer-server/server.ts`。
5.  部署成功后，获取您的项目域名（例如 `your-project.deno.dev`）。

**更新前端配置：**

```env
VITE_PEER_HOST=your-project.deno.dev
VITE_PEER_PORT=443
VITE_PEER_PATH=/guess-number
VITE_PEER_SECURE=true
```

> 注意：Deno Deploy 强制使用 HTTPS，所以端口必须是 `443`，且 `VITE_PEER_SECURE` 必须为 `true`。

