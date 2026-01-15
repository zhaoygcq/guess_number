import { useState, useEffect, useRef } from "react";
import { GameEngine, GuessResult } from "../game/engine";
import { P2PManager, GameConfigPayload, GuessUpdatePayload, DuelInitPayload, PlayerInfoPayload } from "../game/p2p";
import { GameMode, PlayStyle, MatchStrategy } from "../types";
import { GAME_MODE, PLAY_STYLE, MATCH_STRATEGY, GAME_STATUS, VIEW, P2P_MESSAGE_TYPE } from "../constants";

const generateRandomUsername = () => {
  const adjectives = ["Happy", "Lucky", "Sunny", "Clever", "Brave", "Swift", "Calm", "Cool"];
  const nouns = ["Panda", "Tiger", "Eagle", "Fox", "Bear", "Lion", "Wolf", "Hawk"];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]}${nouns[Math.floor(Math.random() * nouns.length)]}${Math.floor(Math.random() * 100)}`;
};

export function useGame() {
  // --- State ---
  const [digits, setDigits] = useState(3);
  const allowDuplicates = true; 
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost" | "setting_secret">(GAME_STATUS.PLAYING);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Network & Flow State
  const [isInitializing, setIsInitializing] = useState(false);
  const [mode, setMode] = useState<GameMode>(GAME_MODE.SINGLE);
  const [playStyle, setPlayStyle] = useState<PlayStyle>(PLAY_STYLE.RACE);
  const [matchStrategy, setMatchStrategy] = useState<MatchStrategy>(MATCH_STRATEGY.EXACT); 
  const [view, setView] = useState<"home" | "lobby" | "game">(VIEW.HOME); 
  const [p2p, setP2P] = useState<P2PManager | null>(null);
  const [myId, setMyId] = useState<string>("");
  const [username, setUsername] = useState(generateRandomUsername());
  const [peerIdInput, setPeerIdInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs for callbacks to access fresh state
  const modeRef = useRef(mode);
  const viewRef = useRef(view);
  const isKickedRef = useRef(false);

  useEffect(() => {
      modeRef.current = mode;
      viewRef.current = view;
  }, [mode, view]);

  // Opponent State (Map of PeerID -> State)
  const [opponents, setOpponents] = useState<Map<string, {
    username?: string;
    guessCount: number;
    lastResult: { exact: number; total: number } | null;
  }>>(new Map());
  
  // Turn State
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [currentTurn, setCurrentTurn] = useState<string | null>(null);

  // Duel State
  const [mySecret, setMySecret] = useState("");
  const [opponentSecret, setOpponentSecret] = useState<string | null>(null);

  // --- Effects ---

  useEffect(() => {
    return () => {
      p2p?.destroy();
    };
  }, [p2p]);

  // Check if we can start duel
  useEffect(() => {
     if (mode !== GAME_MODE.SINGLE && playStyle === PLAY_STYLE.DUEL && mySecret && opponentSecret && status === GAME_STATUS.SETTING_SECRET) {
         startDuelGame();
     }
  }, [mySecret, opponentSecret, status, mode, playStyle]);

  // Auto scroll history
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (view !== VIEW.GAME) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GAME_STATUS.PLAYING && status !== GAME_STATUS.SETTING_SECRET) return;
      
      if (/^[0-9]$/.test(e.key)) {
        handleVirtualKeyPress(e.key);
      } else if (e.key === "Backspace") {
        handleVirtualDelete();
      } else if (e.key === "Enter") {
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [view, status, guess, digits]); 

  // --- Network Logic ---

  const initP2P = async () => {
    if (p2p) return p2p;
    const newP2P = new P2PManager();
    const id = await newP2P.getId();
    setMyId(id);
    
    newP2P.onConnect((peerId) => {
      setIsConnected(true);
      setError(null);
      // Initialize opponent state
      setOpponents(prev => {
         const next = new Map(prev);
         if (!next.has(peerId)) {
             next.set(peerId, { guessCount: 0, lastResult: null });
         }
         return next;
      });

      // Send my username with a slight delay to ensure connection is ready
      setTimeout(() => {
        console.log(`[P2P] Sending username to ${peerId} (delayed): ${username}`);
        newP2P.send({ type: P2P_MESSAGE_TYPE.PLAYER_INFO, payload: { username } }, peerId);
      }, 500);
      
      if (view !== VIEW.GAME) setView(VIEW.LOBBY); 
    });

    newP2P.onDisconnect((peerId) => {
      setOpponents(prev => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
      });
      
      if (modeRef.current === GAME_MODE.MULTI_JOIN) {
          // If we are a client and disconnected from Host
          // Check if we were kicked first
          if (isKickedRef.current) {
              // We were kicked, so the KICK message handler will handle the UI reset.
              // Just reset the flag for next time (though we are leaving anyway)
              isKickedRef.current = false;
              return;
          }

          setIsConnected(false);
          setError("对方已断开连接");
          setMode(GAME_MODE.SINGLE);
          setView(VIEW.HOME);
          setP2P(null);
      }
    });

    newP2P.onMessage((msg, peerId) => {
      switch (msg.type) {
        case P2P_MESSAGE_TYPE.GAME_START:
          const config = msg.payload as GameConfigPayload;
          handleRemoteGameStart(config);
          break;
        case P2P_MESSAGE_TYPE.DUEL_INIT:
          const duelConfig = msg.payload as DuelInitPayload;
          handleDuelInit(duelConfig);
          break;
        case P2P_MESSAGE_TYPE.DUEL_READY:
           setOpponentSecret(msg.payload.secret);
           break;
        case P2P_MESSAGE_TYPE.GUESS_UPDATE:
          const update = msg.payload as GuessUpdatePayload;
          setOpponents(prev => new Map(prev).set(peerId, update));
          
          // If we are Host, we check if we need to advance the turn
          if (modeRef.current === GAME_MODE.MULTI_HOST && playStyle === PLAY_STYLE.RACE) {
              // Wait a bit to ensure UI updates, then advance
              // Actually, we can advance immediately. 
              // The rule: "Must wait for everyone to guess... before next round"
              // implies round-robin.
              advanceTurnRef();
          }
          break;
        case P2P_MESSAGE_TYPE.TURN_CHANGE:
           setCurrentTurn(msg.payload.currentTurn);
           break;
        case P2P_MESSAGE_TYPE.PLAYER_INFO:
          const info = msg.payload as PlayerInfoPayload;
          console.log(`[P2P] Received username from ${peerId}: ${info.username}`);
          setOpponents(prev => {
            const next = new Map(prev);
            const existing = next.get(peerId) || { guessCount: 0, lastResult: null };
            next.set(peerId, { ...existing, username: info.username });
            return next;
          });
          break;
        case P2P_MESSAGE_TYPE.KICK:
          isKickedRef.current = true;
          setError(msg.payload.message);
          setIsConnected(false);
          // Force exit after delay
          setTimeout(() => {
               setView(VIEW.HOME);
               setMode(GAME_MODE.SINGLE);
               setP2P(null);
               isKickedRef.current = false; // Reset
          }, 2000);
          break;
        case P2P_MESSAGE_TYPE.ERROR:
          setError(msg.payload.message);
          setIsConnected(false);
          if (viewRef.current === VIEW.LOBBY && modeRef.current === GAME_MODE.MULTI_JOIN) {
               // Kick out to home
               setTimeout(() => {
                   setView(VIEW.HOME);
                   setMode(GAME_MODE.SINGLE);
                   setP2P(null);
               }, 2000);
          }
          break;
        case P2P_MESSAGE_TYPE.GAME_OVER:
          setStatus(GAME_STATUS.LOST);
          break;
      }
    });

    setP2P(newP2P);
    return newP2P;
  };

  // --- Game Logic Handlers ---

  const handleRemoteGameStart = (config: GameConfigPayload) => {
    setDigits(config.digits);
    setPlayStyle(PLAY_STYLE.RACE);
    setMatchStrategy(config.matchStrategy);
    
    // Turn management
    if (config.turnOrder && config.currentTurn) {
        setTurnOrder(config.turnOrder);
        setCurrentTurn(config.currentTurn);
    }

    const engine = new GameEngine({ digits: config.digits, allowDuplicates: true });
    // @ts-ignore
    engine["secret"] = config.secret; 
    
    setGameEngine(engine);
    resetGameState();
    setView(VIEW.GAME);
  };

  const handleDuelInit = (config: DuelInitPayload) => {
    setDigits(config.digits);
    setPlayStyle(PLAY_STYLE.DUEL);
    setMatchStrategy(config.matchStrategy);
    setStatus(GAME_STATUS.SETTING_SECRET);
    setMySecret("");
    setOpponentSecret(null);
    setHistory([]);
    setError(null);
    setView(VIEW.GAME);
  };

  const startDuelGame = () => {
      if (!opponentSecret) return;
      
      const engine = new GameEngine({ digits, allowDuplicates: true });
      // @ts-ignore
      engine["secret"] = opponentSecret;
      setGameEngine(engine);
      
      setStatus(GAME_STATUS.PLAYING);
      setHistory([]);
      setGuess("");
      setActiveIndex(0);
      setError(null);
      // Reset opponents stats
      setOpponents(prev => {
          const next = new Map();
          for (const [key, val] of prev) {
              next.set(key, { ...val, guessCount: 0, lastResult: null });
          }
          return next;
      });
  };

  const resetGameState = () => {
    setHistory([]);
    setStatus(GAME_STATUS.PLAYING);
    setGuess("");
    setActiveIndex(0);
    setError(null);
    // Reset opponents stats
    setOpponents(prev => {
        const next = new Map();
        for (const [key, val] of prev) {
            next.set(key, { ...val, guessCount: 0, lastResult: null });
        }
        return next;
    });
  };

  const startSingleGame = () => {
    let d = digits;
    if (d < 3) d = 3;
    if (d > 10) d = 10;
    if (d !== digits) setDigits(d);

    const engine = new GameEngine({ digits: d, allowDuplicates: true });
    setGameEngine(engine);
    resetGameState();
    setView(VIEW.GAME);
  };

  const startHostGame = async () => {
    if (!p2p) return;
    
    let d = digits;
    if (d < 3) d = 3;
    if (d > 10) d = 10;

    if (playStyle === PLAY_STYLE.RACE) {
        const engine = new GameEngine({ digits: d, allowDuplicates: true });
        setGameEngine(engine);
        resetGameState();
        const secret = engine.getSecret();
        
        // Setup turn order
        const order = [myId, ...Array.from(opponents.keys())];
        // Sort to ensure consistency? Or just use this order (Host first, then connect order)
        setTurnOrder(order);
        setCurrentTurn(order[0]);
        
        p2p.send({ 
            type: P2P_MESSAGE_TYPE.GAME_START, 
            payload: { 
                digits: d, 
                allowDuplicates: true, 
                matchStrategy, 
                secret,
                turnOrder: order,
                currentTurn: order[0]
            } 
        });
    } else {
        setStatus(GAME_STATUS.SETTING_SECRET);
        setMySecret("");
        setOpponentSecret(null);
        p2p.send({ type: P2P_MESSAGE_TYPE.DUEL_INIT, payload: { digits: d, allowDuplicates: true, matchStrategy } });
    }
    setView(VIEW.GAME);
  };

  // Refs for Game Logic
  const turnOrderRef = useRef<string[]>([]);
  const currentTurnRef = useRef<string | null>(null);

  useEffect(() => {
      turnOrderRef.current = turnOrder;
      currentTurnRef.current = currentTurn;
  }, [turnOrder, currentTurn]);

  const advanceTurnRef = () => {
      if (!p2p) return;
      const order = turnOrderRef.current;
      const current = currentTurnRef.current;
      if (!order.length || !current) return;

      const idx = order.indexOf(current);
      if (idx === -1) return;

      const nextIdx = (idx + 1) % order.length;
      const nextPlayer = order[nextIdx];
      
      // Update local state
      setCurrentTurn(nextPlayer); // Triggers useEffect -> updates Ref
      
      // Broadcast
      p2p.send({ type: P2P_MESSAGE_TYPE.TURN_CHANGE, payload: { currentTurn: nextPlayer } });
  };

  const handleJoin = async () => {
    if (!peerIdInput) return;
    setIsInitializing(true);
    // Move initP2P outside try-catch to ensure we get the manager to destroy it on error
    let manager = p2p;
    if (!manager) {
        manager = await initP2P();
    }
    
    try {
      await manager.connect(peerIdInput);
      setMode(GAME_MODE.MULTI_JOIN);
      setView(VIEW.LOBBY);
      setMatchStrategy(MATCH_STRATEGY.EXACT); 
    } catch (e: any) {
      // If connection fails, we should destroy the peer instance to allow retries
      // and prevent "ghost" connections or weird states
      if (!p2p) { // Only destroy if we just created it (or if we want to reset completely)
          manager.destroy();
          setP2P(null);
      }
      console.error(e);
      setError(e.message || "连接失败");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleCreateRoom = async () => {
    setIsInitializing(true);
    try {
      await initP2P();
      setMode(GAME_MODE.MULTI_HOST);
      setView(VIEW.LOBBY);
    } catch (e) {
      console.error(e);
      setError("创建房间失败");
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSecretSubmit = () => {
      if (!p2p) return;
      
      if (!validateInput(guess)) return;
      
      setMySecret(guess);
      setGuess("");
      setActiveIndex(0);
      setError(null);
      
      p2p.send({ type: P2P_MESSAGE_TYPE.DUEL_READY, payload: { secret: guess } });
  };

  const validateInput = (val: string) => {
    if (val.length !== digits) {
      setError(`请输入 ${digits} 位数字`);
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (status === GAME_STATUS.SETTING_SECRET) {
        handleSecretSubmit();
        return;
    }

    if (!gameEngine || status !== GAME_STATUS.PLAYING) return;

    if (!validateInput(guess)) return;

    try {
      const result = gameEngine.checkGuess(guess);
      const newHistory = [...history, result]; 
      setHistory(newHistory);
      setGuess("");
      setActiveIndex(0);
      setError(null);

      if (mode !== GAME_MODE.SINGLE && p2p) {
        p2p.send({
          type: P2P_MESSAGE_TYPE.GUESS_UPDATE,
          payload: {
            guessCount: newHistory.length,
            lastResult: { exact: result.exact, total: result.total }
          }
        });
      }

      if (matchStrategy === MATCH_STRATEGY.EXACT) {
          if (result.exact === digits) {
             setStatus(GAME_STATUS.WON);
             if (mode !== GAME_MODE.SINGLE && p2p) {
                p2p.send({ type: P2P_MESSAGE_TYPE.GAME_OVER });
             }
          } else {
             // If not won, check if we need to advance turn (if we are Host and it's our turn)
             // But wait, the advanceTurnRef logic is triggered by GUESS_UPDATE.
             // If I am Host, I just updated my local state. I should also trigger advanceTurnRef.
             if (mode === GAME_MODE.MULTI_HOST && playStyle === PLAY_STYLE.RACE) {
                 advanceTurnRef();
             }
          }
      } else {
          if (result.exact === digits) {
             setStatus(GAME_STATUS.WON);
             if (mode !== GAME_MODE.SINGLE && p2p) {
                p2p.send({ type: P2P_MESSAGE_TYPE.GAME_OVER });
             }
          } else {
             if (mode === GAME_MODE.MULTI_HOST && playStyle === PLAY_STYLE.RACE) {
                 advanceTurnRef();
             }
          }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVirtualKeyPress = (key: string) => {
    // If input is full and cursor is at end, do nothing
    if (guess.length >= digits && activeIndex >= digits) return;

    let nextGuess = guess;
    if (activeIndex >= guess.length) {
      // Append mode
      nextGuess = guess + key;
    } else {
      // Replace mode
      nextGuess = guess.substring(0, activeIndex) + key + guess.substring(activeIndex + 1);
    }

    if (nextGuess.length <= digits) {
      setGuess(nextGuess);
      setActiveIndex(prev => Math.min(digits, prev + 1));
      setError(null); 
    }
  };

  const handleVirtualDelete = () => {
    if (activeIndex === 0) return;

    // Logic: Backspace always deletes the previous character (like standard input)
    // If we are at index 2 (after 2nd char), delete index 1.
    const idxToDelete = activeIndex - 1;
    const nextGuess = guess.substring(0, idxToDelete) + guess.substring(idxToDelete + 1);
    
    setGuess(nextGuess);
    setActiveIndex(prev => Math.max(0, prev - 1));
  };

  const copyId = () => {
    navigator.clipboard.writeText(myId);
    setError("ID 已复制到剪贴板"); 
    setTimeout(() => setError(null), 2000);
  };

  const kickPlayer = (peerId: string) => {
    if (p2p && mode === GAME_MODE.MULTI_HOST) {
        p2p.kick(peerId);
    }
  };

  return {
    digits, setDigits,
    allowDuplicates,
    gameEngine,
    guess, setGuess,
    history,
    status, setStatus,
    error,
    scrollRef,
    mode, setMode,
    playStyle, setPlayStyle,
    matchStrategy, setMatchStrategy,
    view, setView,
    p2p, setP2P,
    myId,
    username, setUsername,
    peerIdInput, setPeerIdInput,
    isConnected,
    isInitializing,
    opponents,
    mySecret,
    opponentSecret,
    activeIndex,
    setActiveIndex,
    handleJoin,
    handleCreateRoom,
    startSingleGame,
    startHostGame,
    copyId,
    handleSubmit,
    handleVirtualKeyPress,
    handleVirtualDelete,
    kickPlayer,
    currentTurn,
    turnOrder
  };
}
