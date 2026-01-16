// server.ts
// 使用 Deno 原生 API (Deno.serve) 替代 std 库，更稳定且适配 Deno Deploy

const sockets = new Map<string, WebSocket>(); // id -> ws
const rooms = new Map<string, Set<string>>(); // roomId -> Set<id>
const socketRooms = new Map<string, string>(); // id -> roomId

// 使用 Deno.serve 启动服务 (默认端口 8000)
Deno.serve((req: Request) => {
  // 1. 处理普通 HTTP 请求 (健康检查/浏览器访问)
  if (req.headers.get("upgrade") !== "websocket") {
    return new Response("Guess Number Relay Server Running...", { status: 200 });
  }
  
  // 2. 处理 WebSocket 升级请求
  const { socket, response } = Deno.upgradeWebSocket(req);
  const id = crypto.randomUUID().slice(0, 8); // 生成短 ID

  socket.onopen = () => {
    console.log(`Socket connected: ${id}`);
    sockets.set(id, socket);
    // 告诉客户端它的 ID
    socket.send(JSON.stringify({ type: "WELCOME", id }));
  };

  socket.onmessage = (e) => {
    try {
        const msg = JSON.parse(e.data);
        
        if (msg.type === "JOIN") {
            const roomId = msg.roomId;

            // 房间号有效性验证：
            // 1. 如果是房主(roomId === id)，允许创建新房间
            // 2. 如果是访客(roomId !== id)，必须加入已存在的房间
            if (roomId !== id && !rooms.has(roomId)) {
                socket.send(JSON.stringify({ type: "ERROR", message: "房间不存在或已过期" }));
                return;
            }
            
            // 如果已经在其他房间，先退出
            const oldRoom = socketRooms.get(id);
            if (oldRoom) {
                rooms.get(oldRoom)?.delete(id);
                broadcast(oldRoom, { type: "PEER_LEFT", peerId: id }, id);
            }
            
            // 加入新房间
            if (!rooms.has(roomId)) rooms.set(roomId, new Set());
            const room = rooms.get(roomId)!;
            
            // 通知房间内其他人：我来了
            broadcast(roomId, { type: "PEER_JOINED", peerId: id }, id);
            
            // 更新状态
            room.add(id);
            socketRooms.set(id, roomId);
            
            // 告诉自己：房间里还有谁
            const members = Array.from(room).filter(mid => mid !== id);
            socket.send(JSON.stringify({ type: "ROOM_MEMBERS", members }));
            
        } else if (msg.type === "SIGNAL") {
            const roomId = socketRooms.get(id);
            if (roomId) {
                // 如果指定了目标，只发给目标
                if (msg.target) {
                    const targetWs = sockets.get(msg.target);
                    if (targetWs?.readyState === WebSocket.OPEN) {
                        targetWs.send(JSON.stringify({
                            type: "SIGNAL",
                            from: id,
                            data: msg.data
                        }));
                    }
                } else {
                    // 否则广播给房间内所有人（除了自己）
                    broadcast(roomId, {
                        type: "SIGNAL",
                        from: id,
                        data: msg.data
                    }, id);
                }
            }
        } else if (msg.type === "KICK") {
            // 房主踢人逻辑
             const targetWs = sockets.get(msg.target);
             if (targetWs?.readyState === WebSocket.OPEN) {
                targetWs.send(JSON.stringify({
                    type: "SIGNAL",
                    from: id,
                    data: { type: "KICK", payload: { message: "你已被移出房间" } }
                }));
             }
        }
    } catch (err) {
        console.error("Msg error", err);
    }
  };

  socket.onclose = () => {
      console.log(`Socket disconnected: ${id}`);
      const roomId = socketRooms.get(id);
      if (roomId) {
          rooms.get(roomId)?.delete(id);
          broadcast(roomId, { type: "PEER_LEFT", peerId: id }, id);
          if (rooms.get(roomId)?.size === 0) rooms.delete(roomId);
      }
      sockets.delete(id);
      socketRooms.delete(id);
  };

  function broadcast(roomId: string, msg: any, excludeId?: string) {
      const room = rooms.get(roomId);
      if (!room) return;
      room.forEach(mid => {
          if (mid === excludeId) return;
          const ws = sockets.get(mid);
          if (ws?.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify(msg));
          }
      });
  }

  return response;
});
