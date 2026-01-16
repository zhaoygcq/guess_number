
import { P2P_MESSAGE_TYPE } from "../constants";
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

/**
 * GameNetworkManager (formerly P2PManager)
 * Re-implemented using WebSocket Relay for centralized communication
 * to avoid P2P NAT issues.
 */
export class P2PManager {
  private ws: WebSocket | null = null;
  private myId: string = "";
  private pendingIdResolve: ((id: string) => void) | null = null;
  
  // Callbacks
  private onMessageCallback: ((msg: NetworkMessage, peerId: string) => void) | null = null;
  private onConnectCallback: ((peerId: string) => void) | null = null;
  private onDisconnectCallback: ((peerId: string) => void) | null = null;

  constructor() {
    this.initWebSocket();
  }

  private initWebSocket() {
    const relayServer = import.meta.env.VITE_RELAY_SERVER;
    if (!relayServer) {
        console.error("VITE_RELAY_SERVER is not defined!");
        return;
    }

    console.log(`Connecting to Relay Server: ${relayServer}`);
    this.ws = new WebSocket(relayServer);

    this.ws.onopen = () => {
        console.log("WebSocket connected");
    };

    this.ws.onmessage = (e) => {
        try {
            const msg = JSON.parse(e.data);
            this.handleInternalMessage(msg);
        } catch (err) {
            console.error("Failed to parse WS message", err);
        }
    };

    this.ws.onclose = () => {
        console.log("WebSocket closed");
        // Reconnect logic could go here
    };
    
    this.ws.onerror = () => {
        // Avoid cyclic error structure when logging
        console.error("WebSocket error"); 
    };
  }

  private handleInternalMessage(msg: any) {
      switch (msg.type) {
          case "WELCOME":
              this.myId = msg.id;
              console.log(`My Socket ID: ${this.myId}`);
              if (this.pendingIdResolve) {
                  this.pendingIdResolve(this.myId);
                  this.pendingIdResolve = null;
              }
              // Auto-join my own room (as host)
              this.sendInternal({ type: "JOIN", roomId: this.myId });
              break;
              
          case "PEER_JOINED":
              console.log(`Peer joined: ${msg.peerId}`);
              if (this.onConnectCallback) this.onConnectCallback(msg.peerId);
              break;
              
          case "PEER_LEFT":
              console.log(`Peer left: ${msg.peerId}`);
              if (this.onDisconnectCallback) this.onDisconnectCallback(msg.peerId);
              break;
              
          case "ROOM_MEMBERS":
              console.log(`Room members: ${JSON.stringify(msg.members)}`);
              msg.members.forEach((mid: string) => {
                  if (this.onConnectCallback) this.onConnectCallback(mid);
              });
              break;
              
          case "SIGNAL":
              // Unwrap signal message
              if (msg.data && msg.from) {
                  // Special handle for KICK
                  if (msg.data.type === "KICK") {
                      // Disconnect self
                      if (this.onDisconnectCallback) this.onDisconnectCallback("HOST"); // Or specific msg
                      // Actually KICK is usually handled by useGame via onMessage
                  }
                  
                  if (this.onMessageCallback) {
                      this.onMessageCallback(msg.data, msg.from);
                  }
              }
              break;
      }
  }
  
  private sendInternal(msg: any) {
      if (this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify(msg));
      } else {
          console.warn("WS not open, cannot send", msg);
      }
  }

  // --- Public Interface (Matching old P2PManager) ---

  public getId(): Promise<string> {
      if (this.myId) return Promise.resolve(this.myId);
      return new Promise((resolve) => {
          this.pendingIdResolve = resolve;
      });
  }

  public connect(roomId: string): Promise<void> {
      // In Relay mode, "connect" means "join room"
      return new Promise((resolve, reject) => {
          if (!this.ws) {
              reject(new Error("WebSocket not initialized"));
              return;
          }
          
          if (this.ws.readyState !== WebSocket.OPEN) {
              // Wait for open? Or reject?
              // Simple retry logic for open
              const check = setInterval(() => {
                  if (this.ws?.readyState === WebSocket.OPEN) {
                      clearInterval(check);
                      this.doJoin(roomId, resolve);
                  } else if (this.ws?.readyState === WebSocket.CLOSED) {
                      clearInterval(check);
                      reject(new Error("Connection failed"));
                  }
              }, 100);
              return;
          }
          
          this.doJoin(roomId, resolve);
      });
  }
  
  private doJoin(roomId: string, resolve: () => void) {
      console.log(`Joining room: ${roomId}`);
      this.sendInternal({ type: "JOIN", roomId });
      // Assume success for now, or wait for ROOM_MEMBERS?
      // P2P connect resolves when connection is open.
      // Here we resolve immediately after sending JOIN.
      resolve(); 
  }

  public send(msg: NetworkMessage, targetPeerId?: string) {
      // Send SIGNAL
      // Sanitize msg to ensure no circular references before sending
      // But NetworkMessage should be clean JSON usually.
      // The circular error might be coming from Vue/React wrapping objects?
      // Let's shallow copy or ensure it's clean.
      
      this.sendInternal({
          type: "SIGNAL",
          target: targetPeerId,
          data: msg
      });
  }

  public kick(peerId: string) {
      // Send KICK signal
      this.sendInternal({
          type: "KICK",
          target: peerId
      });
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
      if (this.ws) {
          this.ws.close();
          this.ws = null;
      }
  }
}
