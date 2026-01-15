
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
    this.peer = new Peer();
    
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
      if (msg.type === P2P_MESSAGE_TYPE.HANDSHAKE) {
          console.log("Received HANDSHAKE from " + conn.peer + ", replying...");
          conn.send({ type: P2P_MESSAGE_TYPE.HANDSHAKE });
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
