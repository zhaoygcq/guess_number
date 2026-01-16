
import Peer, { DataConnection } from "peerjs";
import { P2P_MESSAGE_TYPE, MAX_PLAYERS } from "../constants";
import { MatchStrategy } from "../types";

export type MessageType = typeof P2P_MESSAGE_TYPE[keyof typeof P2P_MESSAGE_TYPE];

export interface NetworkMessage {
  type: MessageType;
  payload?: any;
}

export interface GameConfigPayload {
  digits: number;
  allowDuplicates: boolean;
  matchStrategy: MatchStrategy;
  secret: string; 
  turnOrder?: string[];
  currentTurn?: string;
}

export interface TurnChangePayload {
  currentTurn: string;
}

export interface DuelInitPayload {
  digits: number;
  allowDuplicates: boolean;
  matchStrategy: MatchStrategy;
}

export interface PlayerInfoPayload {
  username: string;
}

export interface GuessUpdatePayload {
  guessCount: number;
  lastResult: { exact: number, total: number };
}

export class P2PManager {
  private peer: Peer;
  private conns: Map<string, DataConnection> = new Map();
  private onMessageCallback: ((msg: NetworkMessage, peerId: string) => void) | null = null;
  private onConnectCallback: ((peerId: string) => void) | null = null;
  private onDisconnectCallback: ((peerId: string) => void) | null = null;
  
  public myId: string = "";

  constructor() {
    const peerConfig: any = {
        config: {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:global.stun.twilio.com:3478' }
            ]
        }
    };

    // Check for custom PeerServer config from env
    const host = import.meta.env.VITE_PEER_HOST;
    const port = import.meta.env.VITE_PEER_PORT;
    const path = import.meta.env.VITE_PEER_PATH;
    const secure = import.meta.env.VITE_PEER_SECURE;

    if (host && port) {
        console.log(`Using custom PeerServer: ${host}:${port}${path || "/"}`);
        peerConfig.host = host;
        peerConfig.port = Number(port);
        peerConfig.path = path || "/";
        peerConfig.secure = secure === "true";
    }

    this.peer = new Peer(peerConfig);
    
    this.peer.on("open", (id) => {
      this.myId = id;
      console.log("My Peer ID is: " + id);
    });

    this.peer.on("connection", (conn) => {
      // Check for max players
      if (this.conns.size >= MAX_PLAYERS - 1) { // -1 because I am one player
          console.warn("Room full, rejecting connection from", conn.peer);
          const handleOpen = () => {
              conn.send({ type: P2P_MESSAGE_TYPE.ERROR, payload: { message: "房间已满" } });
              setTimeout(() => conn.close(), 500);
          };
          
          if (conn.open) {
              handleOpen();
          } else {
              conn.on("open", handleOpen);
          }
          return;
      }
      this.handleConnection(conn);
    });
    
    this.peer.on("error", (err) => {
        console.error("PeerJS Error:", err);
    });
  }

  public connect(peerId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already connected
      if (this.conns.has(peerId)) {
          console.warn("Already connected to " + peerId);
          resolve();
          return;
      }
      const conn = this.peer.connect(peerId);

      const cleanup = () => {
          clearTimeout(timer);
          conn.off("open", onOpen);
          conn.off("data", onHandshakeData); // Stop listening for handshake
          conn.off("error", onError);
          conn.off("close", onClose);
          this.peer.off("error", onPeerError);
      };

      const timer = setTimeout(() => {
          cleanup();
          conn.close();
          reject(new Error("连接超时，房间可能不存在"));
      }, 5000);

      const onOpen = () => {
          console.log("Connection opened to " + peerId + ", sending HANDSHAKE");
          conn.send({ type: P2P_MESSAGE_TYPE.HANDSHAKE });
      };

      const onHandshakeData = (data: any) => {
          if (data && data.type === P2P_MESSAGE_TYPE.HANDSHAKE) {
              console.log("Received HANDSHAKE from " + peerId);
              cleanup();
              resolve();
          }
      };

      const onError = (err: any) => {
          cleanup();
          reject(err);
      };

      const onClose = () => {
          cleanup();
          reject(new Error("连接被关闭"));
      };

      const onPeerError = (err: any) => {
          if (err.type === 'peer-unavailable') {
               // Usually message is "Could not connect to peer XXXXX"
               cleanup();
               reject(new Error("房间不存在"));
          }
      };

      conn.on("open", onOpen);
      conn.on("data", onHandshakeData);
      conn.on("error", onError);
      conn.on("close", onClose);
      this.peer.on("error", onPeerError);

      this.handleConnection(conn);
    });
  }

  private handleConnection(conn: DataConnection) {
    this.conns.set(conn.peer, conn);
    
    conn.on("open", () => {
      console.log("Connected to: " + conn.peer);
      if (this.onConnectCallback) this.onConnectCallback(conn.peer);
    });

    conn.on("data", (data) => {
      const msg = data as NetworkMessage;
      // Auto-reply to HANDSHAKE
      // Only reply if I am NOT the one who initiated the handshake (i.e. I received it first)
      // But PeerJS data channels are bidirectional.
      // To prevent loop:
      // 1. Handshake request (A -> B)
      // 2. Handshake reply (B -> A)
      // 3. A should NOT reply to B again.
      
      // Currently logic:
      // if msg == HANDSHAKE -> send HANDSHAKE.
      // A sends HS -> B receives HS -> B sends HS -> A receives HS -> A sends HS ... LOOP!
      
      // Fix: Add a payload to distinguish REQUEST vs ACK, or just don't auto-reply if we already established?
      // Simpler fix: Use payload to indicate "ACK".
      
      if (msg.type === P2P_MESSAGE_TYPE.HANDSHAKE) {
          if (msg.payload?.ack) {
              console.log("Received HANDSHAKE ACK from " + conn.peer);
          } else {
              console.log("Received HANDSHAKE from " + conn.peer + ", replying with ACK...");
              conn.send({ type: P2P_MESSAGE_TYPE.HANDSHAKE, payload: { ack: true } });
          }
      }

      if (this.onMessageCallback) {
        this.onMessageCallback(msg, conn.peer);
      }
    });

    conn.on("close", () => {
      console.log("Connection closed: " + conn.peer);
      this.conns.delete(conn.peer);
      if (this.onDisconnectCallback) this.onDisconnectCallback(conn.peer);
    });
    
    conn.on("error", (err) => {
        console.error("Connection error:", err);
        this.conns.delete(conn.peer);
        if (this.onDisconnectCallback) this.onDisconnectCallback(conn.peer);
    });
  }

  public send(msg: NetworkMessage, targetPeerId?: string) {
    if (targetPeerId) {
        const conn = this.conns.get(targetPeerId);
        if (conn && conn.open) {
            conn.send(msg);
        } else {
            console.warn(`Cannot send to ${targetPeerId}, connection not open`);
        }
    } else {
        // Broadcast to all
        this.conns.forEach(conn => {
            if (conn.open) {
                conn.send(msg);
            }
        });
    }
  }

  public kick(peerId: string) {
    const conn = this.conns.get(peerId);
    if (conn) {
        conn.send({ type: P2P_MESSAGE_TYPE.KICK, payload: { message: "你已被房主移出房间" } });
        // Close after a short delay to ensure message is sent
        setTimeout(() => {
            conn.close();
            this.conns.delete(peerId);
            if (this.onDisconnectCallback) this.onDisconnectCallback(peerId);
        }, 500);
    }
  }

  public onMessage(cb: (msg: NetworkMessage, peerId: string) => void) {
    this.onMessageCallback = cb;
  }

  public onConnect(cb: (peerId: string) => void) {
    this.onConnectCallback = cb;
  }
  
  public onDisconnect(cb: (peerId: string) => void) {
      this.onDisconnectCallback = cb;
  }

  public destroy() {
    this.peer.destroy();
    this.conns.clear();
  }
  
  public getId(): Promise<string> {
      return new Promise((resolve) => {
          if (this.myId) resolve(this.myId);
          else {
              this.peer.on('open', (id) => resolve(id));
          }
      });
  }
}
