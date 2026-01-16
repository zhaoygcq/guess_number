import { DurableObject } from "cloudflare:workers";

export interface Env {
  RELAY_SERVER: DurableObjectNamespace;
}

// Worker: 处理路由和 WebSocket 升级
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // WebSocket 连接请求
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader === "websocket") {
      // 获取或创建 Durable Object 实例
      const id = env.RELAY_SERVER.idFromName("default");
      const stub = env.RELAY_SERVER.get(id);

      // 将请求转发给 Durable Object 处理 WebSocket
      return stub.fetch(request);
    }

    // HTTP 请求 - 简单响应
    return new Response("Guess Number Relay Server (Cloudflare Workers)", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  },
};

// Durable Object: 处理 WebSocket 通信
export class RelayServer extends DurableObject {
  private sockets: Map<string, WebSocket> = new Map();
  private rooms: Map<string, Set<string>> = new Map();
  private socketRooms: Map<string, string> = new Map();

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
  }

  async fetch(): Promise<Response> {
    // 创建 WebSocketPair
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    // 接受服务器端 WebSocket
    server.accept();

    // 生成唯一 ID
    const id = crypto.randomUUID().slice(0, 8);

    // 初始化连接
    this.sockets.set(id, server);

    // 发送欢迎消息
    server.send(JSON.stringify({ type: "WELCOME", id }));

    // 消息处理
    server.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;

      try {
        const msg = JSON.parse(event.data);
        this.handleMessage(server, id, msg);
      } catch (e) {
        console.error("Parse error:", e);
      }
    });

    // 关闭处理
    server.addEventListener("close", () => {
      this.handleDisconnect(id);
    });

    server.addEventListener("error", () => {
      this.handleDisconnect(id);
    });

    // 返回 WebSocket 响应
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private handleMessage(socket: WebSocket, id: string, msg: any): void {
    if (msg.type === "JOIN") {
      const roomId = msg.roomId;

      // 检查房间是否存在（访客不能创建房间）
      if (roomId !== id && !this.rooms.has(roomId)) {
        socket.send(JSON.stringify({ type: "ERROR", message: "房间不存在" }));
        return;
      }

      // 退出旧房间
      const oldRoom = this.socketRooms.get(id);
      if (oldRoom) {
        this.rooms.get(oldRoom)?.delete(id);
        this.broadcast(oldRoom, { type: "PEER_LEFT", peerId: id }, id);
        if (this.rooms.get(oldRoom)?.size === 0) {
          this.rooms.delete(oldRoom);
        }
      }

      // 加入新房间
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
      }
      this.rooms.get(roomId)!.add(id);
      this.socketRooms.set(id, roomId);

      // 通知其他人
      this.broadcast(roomId, { type: "PEER_JOINED", peerId: id }, id);

      // 告诉自己房间成员
      const members = Array.from(this.rooms.get(roomId)!).filter(mid => mid !== id);
      socket.send(JSON.stringify({ type: "ROOM_MEMBERS", members }));

    } else if (msg.type === "SIGNAL") {
      const roomId = this.socketRooms.get(id);
      if (!roomId) return;

      if (msg.target) {
        // 单点发送
        const targetWs = this.sockets.get(msg.target);
        if (targetWs && targetWs.readyState === WebSocket.OPEN) {
          targetWs.send(JSON.stringify({
            type: "SIGNAL",
            from: id,
            data: msg.data
          }));
        }
      } else {
        // 广播
        this.broadcast(roomId, {
          type: "SIGNAL",
          from: id,
          data: msg.data
        }, id);
      }
    }
  }

  private handleDisconnect(id: string): void {
    const roomId = this.socketRooms.get(id);
    if (roomId) {
      this.rooms.get(roomId)?.delete(id);
      this.broadcast(roomId, { type: "PEER_LEFT", peerId: id }, id);
      if (this.rooms.get(roomId)?.size === 0) {
        this.rooms.delete(roomId);
      }
    }
    this.sockets.delete(id);
    this.socketRooms.delete(id);
  }

  private broadcast(roomId: string, msg: any, excludeId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const msgStr = JSON.stringify(msg);
    for (const memberId of room) {
      if (memberId === excludeId) continue;
      const ws = this.sockets.get(memberId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(msgStr);
      }
    }
  }
}
