import { useState, useEffect, useRef } from "react";
import { GameEngine, GuessResult } from "../game/engine";
import { P2PManager, GameConfigPayload, GuessUpdatePayload, DuelInitPayload } from "../game/p2p";
import { GameMode, PlayStyle, MatchStrategy } from "../types";

export function useGame() {
  // --- State ---
  const [digits, setDigits] = useState(3);
  const allowDuplicates = true; 
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost" | "setting_secret">("playing");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Network & Flow State
  const [mode, setMode] = useState<GameMode>("single");
  const [playStyle, setPlayStyle] = useState<PlayStyle>("race");
  const [matchStrategy, setMatchStrategy] = useState<MatchStrategy>('exact'); 
  const [view, setView] = useState<"home" | "lobby" | "game">("home"); 
  const [p2p, setP2P] = useState<P2PManager | null>(null);
  const [myId, setMyId] = useState<string>("");
  const [peerIdInput, setPeerIdInput] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [opponentStatus, setOpponentStatus] = useState<{
    guessCount: number;
    lastResult: { exact: number; total: number } | null;
  }>({ guessCount: 0, lastResult: null });
  
  // Duel State
  const [mySecret, setMySecret] = useState("");
  const [opponentSecret, setOpponentSecret] = useState<string | null>(null);

  // --- Effects ---

  useEffect(() => {
    return () => {
      p2p?.destroy();
    };
  }, []);

  // Check if we can start duel
  useEffect(() => {
     if (mode !== "single" && playStyle === "duel" && mySecret && opponentSecret && status === "setting_secret") {
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
    if (view !== "game") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== "playing" && status !== "setting_secret") return;
      
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
    
    newP2P.onConnect(() => {
      setIsConnected(true);
      setError(null);
      if (view !== "game") setView("lobby"); 
    });

    newP2P.onDisconnect(() => {
      setIsConnected(false);
      setError("对方已断开连接");
      setMode("single");
      setView("home");
      setP2P(null);
    });

    newP2P.onMessage((msg) => {
      switch (msg.type) {
        case "GAME_START":
          const config = msg.payload as GameConfigPayload;
          handleRemoteGameStart(config);
          break;
        case "DUEL_INIT":
          const duelConfig = msg.payload as DuelInitPayload;
          handleDuelInit(duelConfig);
          break;
        case "DUEL_READY":
           setOpponentSecret(msg.payload.secret);
           break;
        case "GUESS_UPDATE":
          setOpponentStatus(msg.payload as GuessUpdatePayload);
          break;
        case "GAME_OVER":
          setStatus("lost");
          break;
      }
    });

    setP2P(newP2P);
    return newP2P;
  };

  // --- Game Logic Handlers ---

  const handleRemoteGameStart = (config: GameConfigPayload) => {
    setDigits(config.digits);
    setPlayStyle("race");
    setMatchStrategy(config.matchStrategy);
    
    const engine = new GameEngine({ digits: config.digits, allowDuplicates: true });
    // @ts-ignore
    engine["secret"] = config.secret; 
    
    setGameEngine(engine);
    resetGameState();
    setView("game");
  };

  const handleDuelInit = (config: DuelInitPayload) => {
    setDigits(config.digits);
    setPlayStyle("duel");
    setMatchStrategy(config.matchStrategy);
    setStatus("setting_secret");
    setMySecret("");
    setOpponentSecret(null);
    setHistory([]);
    setError(null);
    setView("game");
  };

  const startDuelGame = () => {
      if (!opponentSecret) return;
      
      const engine = new GameEngine({ digits, allowDuplicates: true });
      // @ts-ignore
      engine["secret"] = opponentSecret;
      setGameEngine(engine);
      
      setStatus("playing");
      setHistory([]);
      setGuess("");
      setError(null);
      setOpponentStatus({ guessCount: 0, lastResult: null });
  };

  const resetGameState = () => {
    setHistory([]);
    setStatus("playing");
    setGuess("");
    setError(null);
    setOpponentStatus({ guessCount: 0, lastResult: null });
  };

  const startSingleGame = () => {
    let d = digits;
    if (d < 3) d = 3;
    if (d > 10) d = 10;
    if (d !== digits) setDigits(d);

    const engine = new GameEngine({ digits: d, allowDuplicates: true });
    setGameEngine(engine);
    resetGameState();
    setView("game");
  };

  const startHostGame = async () => {
    if (!p2p) return;
    
    let d = digits;
    if (d < 3) d = 3;
    if (d > 10) d = 10;

    if (playStyle === "race") {
        const engine = new GameEngine({ digits: d, allowDuplicates: true });
        setGameEngine(engine);
        resetGameState();
        const secret = engine.getSecret();
        p2p.send({ type: "GAME_START", payload: { digits: d, allowDuplicates: true, matchStrategy, secret } });
    } else {
        setStatus("setting_secret");
        setMySecret("");
        setOpponentSecret(null);
        p2p.send({ type: "DUEL_INIT", payload: { digits: d, allowDuplicates: true, matchStrategy } });
    }
    setView("game");
  };

  const handleJoin = async () => {
    if (!peerIdInput) return;
    const manager = await initP2P();
    manager.connect(peerIdInput);
    setMode("multi_join");
    setView("lobby");
    setMatchStrategy("exact"); 
  };

  const handleCreateRoom = async () => {
    await initP2P();
    setMode("multi_host");
    setView("lobby");
  };

  const handleSecretSubmit = () => {
      if (!p2p) return;
      
      if (!validateInput(guess)) return;
      
      setMySecret(guess);
      setGuess("");
      setError(null);
      
      p2p.send({ type: "DUEL_READY", payload: { secret: guess } });
  };

  const validateInput = (val: string) => {
    if (val.length !== digits) {
      setError(`请输入 ${digits} 位数字`);
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (status === "setting_secret") {
        handleSecretSubmit();
        return;
    }

    if (!gameEngine || status !== "playing") return;

    if (!validateInput(guess)) return;

    try {
      const result = gameEngine.checkGuess(guess);
      const newHistory = [...history, result]; 
      setHistory(newHistory);
      setGuess("");
      setError(null);

      if (mode !== "single" && p2p) {
        p2p.send({
          type: "GUESS_UPDATE",
          payload: {
            guessCount: newHistory.length,
            lastResult: { exact: result.exact, total: result.total }
          }
        });
      }

      if (matchStrategy === "exact") {
          if (result.exact === digits) {
             setStatus("won");
             if (mode !== "single" && p2p) {
                p2p.send({ type: "GAME_OVER" });
             }
          }
      } else {
          if (result.exact === digits) {
             setStatus("won");
             if (mode !== "single" && p2p) {
                p2p.send({ type: "GAME_OVER" });
             }
          }
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVirtualKeyPress = (key: string) => {
    if (guess.length < digits) {
      setGuess(prev => prev + key);
      setError(null); 
    }
  };

  const handleVirtualDelete = () => {
    setGuess(prev => prev.slice(0, -1));
  };

  const copyId = () => {
    navigator.clipboard.writeText(myId);
    setError("ID 已复制到剪贴板"); 
    setTimeout(() => setError(null), 2000);
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
    peerIdInput, setPeerIdInput,
    isConnected,
    opponentStatus,
    mySecret,
    opponentSecret,
    handleJoin,
    handleCreateRoom,
    startSingleGame,
    startHostGame,
    copyId,
    handleSubmit,
    handleVirtualKeyPress,
    handleVirtualDelete
  };
}
