
import Peer, { DataConnection } from "peerjs";

export type MessageType = 
  | "HANDSHAKE"     
  | "GAME_START"    
  | "GUESS_UPDATE"  
  | "GAME_OVER"     
  | "DUEL_INIT"     
  | "DUEL_READY"    
  | "RESTART_REQUEST" 
  | "RESTART_ACCEPT"; 

export interface NetworkMessage {
  type: MessageType;
  payload?: any;
}

export interface GameConfigPayload {
  digits: number;
  allowDuplicates: boolean;
  matchStrategy: 'exact' | 'value';
  secret: string; 
}

export interface DuelInitPayload {
  digits: number;
  allowDuplicates: boolean;
  matchStrategy: 'exact' | 'value';
}

export interface GuessUpdatePayload {
  guessCount: number;
  lastResult: { exact: number, total: number };
}

export class P2PManager {
  private peer: Peer;
  private conn: DataConnection | null = null;
  private onMessageCallback: ((msg: NetworkMessage) => void) | null = null;
  private onConnectCallback: (() => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  
  public myId: string = "";

  constructor() {
    this.peer = new Peer();
    
    this.peer.on("open", (id) => {
      this.myId = id;
      console.log("My Peer ID is: " + id);
    });

    this.peer.on("connection", (conn) => {
      this.handleConnection(conn);
    });
    
    this.peer.on("error", (err) => {
        console.error("PeerJS Error:", err);
    });
  }

  public connect(peerId: string) {
    const conn = this.peer.connect(peerId);
    this.handleConnection(conn);
  }

  private handleConnection(conn: DataConnection) {
    if (this.conn) {
        this.conn.close();
    }
    
    this.conn = conn;
    
    conn.on("open", () => {
      console.log("Connected to: " + conn.peer);
      if (this.onConnectCallback) this.onConnectCallback();
    });

    conn.on("data", (data) => {
      if (this.onMessageCallback) {
        this.onMessageCallback(data as NetworkMessage);
      }
    });

    conn.on("close", () => {
      console.log("Connection closed");
      this.conn = null;
      if (this.onDisconnectCallback) this.onDisconnectCallback();
    });
    
    conn.on("error", (err) => {
        console.error("Connection error:", err);
        if (this.onDisconnectCallback) this.onDisconnectCallback();
    });
  }

  public send(msg: NetworkMessage) {
    if (this.conn && this.conn.open) {
      this.conn.send(msg);
    } else {
        console.warn("Cannot send message, connection not open");
    }
  }

  public onMessage(cb: (msg: NetworkMessage) => void) {
    this.onMessageCallback = cb;
  }

  public onConnect(cb: () => void) {
    this.onConnectCallback = cb;
  }
  
  public onDisconnect(cb: () => void) {
      this.onDisconnectCallback = cb;
  }

  public destroy() {
    this.peer.destroy();
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
