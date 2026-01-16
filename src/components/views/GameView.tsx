import { useState, useEffect } from "react";
import { 
  XCircle, Shield, Trophy, Users, History, CheckCircle2, Crown, AlertCircle, RefreshCw, ChevronUp 
} from "lucide-react";
import { Button } from "../ui/Button";
import { VirtualKeyboard } from "../ui/VirtualKeyboard";
import { cn } from "../../utils/cn";
import { GameMode, PlayStyle, MatchStrategy } from "../../types";
import { GameEngine, GuessResult } from "../../game/engine";
import { GAME_MODE, PLAY_STYLE, MATCH_STRATEGY, GAME_STATUS, VIEW } from "../../constants";

type GameViewProps = {
  setView: (view: any) => void;
  setStatus: (status: any) => void;
  digits: number;
  mode: GameMode;
  playStyle: PlayStyle;
  matchStrategy: MatchStrategy;
  status: "playing" | "won" | "lost" | "setting_secret";
  opponents?: Map<string, any>;
  history: GuessResult[];
  scrollRef: any;
  mySecret: string;
  gameEngine: GameEngine | null;
  guess: string;
  error: string | null;
  handleVirtualKeyPress: (key: string) => void;
  handleVirtualDelete: () => void;
  handleSubmit: () => void;
  startSingleGame: () => void;
  startHostGame: () => void;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  username: string;
  targetPeerId?: string | null;
  currentTurn?: string | null;
  turnOrder?: string[];
  myId?: string;
};

export const GameView = ({
  setView, setStatus, digits, mode, playStyle, matchStrategy, status,
  opponents, history, scrollRef, mySecret, gameEngine, guess, error,
  handleVirtualKeyPress, handleVirtualDelete, handleSubmit, startSingleGame, startHostGame,
  activeIndex, setActiveIndex, username, targetPeerId, currentTurn, myId
}: GameViewProps) => {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(true);

  const isMyTurn = mode === GAME_MODE.SINGLE || !currentTurn || currentTurn === myId;
  const isRaceMode = mode !== GAME_MODE.SINGLE && playStyle === PLAY_STYLE.RACE;
  
  // Auto-open keyboard when game starts or status changes to input-ready states
  useEffect(() => {
    if ((status === GAME_STATUS.PLAYING && isMyTurn) || status === GAME_STATUS.SETTING_SECRET) {
       setIsKeyboardOpen(true);
    } else {
       setIsKeyboardOpen(false);
    }
  }, [status, isMyTurn]);

  // Find current turn username
  const getCurrentTurnUsername = () => {
      if (!currentTurn) return "";
      if (currentTurn === myId) return "我";
      return opponents?.get(currentTurn)?.username || "对手";
  };

  return (
    <div className="max-w-lg mx-auto w-full h-full flex flex-col gap-2 animate-in fade-in duration-500 pb-safe relative">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800 backdrop-blur shrink-0">
         <div className="flex items-center gap-2">
             <Button variant="ghost" onClick={() => { setView(VIEW.LOBBY); setStatus(GAME_STATUS.PLAYING); }} className="px-2 h-8 text-xs">
               <XCircle className="w-4 h-4 mr-1"/> 退出
             </Button>
             <div className="h-4 w-px bg-slate-800 mx-1"></div>
             <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                <span className="text-xs font-mono font-bold text-slate-300 max-w-[80px] truncate">{username}</span>
             </div>
         </div>
         <div className="flex flex-col items-end">
            <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
                <span className="flex items-center gap-1">{digits}位</span>
                {mode !== GAME_MODE.SINGLE && (
                    <span className={cn("flex items-center gap-1", playStyle === PLAY_STYLE.DUEL ? "text-amber-400" : "text-blue-400")}>
                        {playStyle === PLAY_STYLE.DUEL ? <Shield className="w-3 h-3"/> : <Trophy className="w-3 h-3"/>}
                        {playStyle === PLAY_STYLE.DUEL ? "对决" : "竞速"}
                    </span>
                )}
                {mode !== GAME_MODE.SINGLE && status === GAME_STATUS.PLAYING && (
                    <span className="text-slate-500 text-xs border border-slate-700 rounded px-1.5 py-0.5">
                        {playStyle === PLAY_STYLE.RACE ? "猜系统" : `猜 ${(targetPeerId && opponents?.get(targetPeerId)?.username) || "对手"}`}
                    </span>
                )}
            </div>
            {/* Turn Indicator */}
            {isRaceMode && status === GAME_STATUS.PLAYING && (
                <div className="text-xs font-mono mt-1 flex items-center gap-1">
                   <span className="text-slate-500">当前回合:</span>
                   <span className={cn("font-bold", isMyTurn ? "text-emerald-400" : "text-amber-400 animate-pulse")}>
                       {getCurrentTurnUsername()}
                   </span>
                </div>
            )}
            {mode !== GAME_MODE.SINGLE && mySecret && status === GAME_STATUS.PLAYING && (
                <div className="text-xs text-amber-500/80 font-mono mt-1">
                   我出的题: <span className="font-bold">{mySecret}</span>
                </div>
            )}
         </div>
      </div>

      {/* Opponent Status Bar (Multiplayer) */}
      {mode !== GAME_MODE.SINGLE && status === GAME_STATUS.PLAYING && opponents && opponents.size > 0 && (
        <div className="flex flex-col gap-2 shrink-0">
           {Array.from(opponents.entries()).map(([id, status]) => (
                <div key={id} className={cn(
                    "flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border transition-all duration-300",
                    isRaceMode && currentTurn === id ? "border-amber-500/50 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "border-slate-700/50"
                )}>
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                            isRaceMode && currentTurn === id ? "bg-amber-500/20 text-amber-400" : "bg-slate-700 text-slate-400"
                        )}>
                            <Users className="w-4 h-4"/>
                        </div>
                        <div className="flex flex-col">
                            <span className={cn(
                                "text-xs font-bold",
                                isRaceMode && currentTurn === id ? "text-amber-400" : "text-slate-400"
                            )}>
                                {status.username || `对手 (${id.substring(0, 4)})`}
                                {isRaceMode && currentTurn === id && <span className="ml-1 text-[10px] bg-amber-500/20 px-1 rounded">Thinking...</span>}
                            </span>
                            <span className="text-sm font-mono text-slate-200">已猜 {status.guessCount} 次</span>
                        </div>
                    </div>
                    {status.lastResult ? (
                        <div className="flex gap-2 text-sm font-mono bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
                            <span className={cn("font-bold", matchStrategy === MATCH_STRATEGY.EXACT ? "text-blue-400" : "text-purple-400")}>
                                {matchStrategy === MATCH_STRATEGY.EXACT ? "全匹配" : "数匹配"}: {matchStrategy === MATCH_STRATEGY.EXACT ? status.lastResult.exact : status.lastResult.total}
                            </span>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-500 italic">思考中...</span>
                    )}
                </div>
           ))}
        </div>
      )}

      {/* History List - Scrollable Area */}
      <div 
        className="flex-1 relative overflow-hidden bg-slate-900/20 rounded-2xl border border-slate-800/30"
        onClick={() => setIsKeyboardOpen(false)}
      >
         <div className="absolute inset-0 overflow-y-auto p-4 custom-scrollbar" ref={scrollRef}>
             {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2 opacity-50">
                   <History className="w-12 h-12"/>
                   <p>暂无猜测记录</p>
                </div>
             ) : (
                <div className="space-y-2">
                   {history.map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-xl border border-slate-800/50 animate-in slide-in-from-bottom-2 duration-300">
                         <span className="font-mono text-xl tracking-widest text-slate-300 ml-2">{item.guess}</span>
                         <div className="flex gap-2">
                            <span className={cn(
                               "px-2 py-1 rounded-md text-xs font-bold min-w-[3.5rem] text-center",
                               matchStrategy === MATCH_STRATEGY.EXACT ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                            )}>
                               {matchStrategy === MATCH_STRATEGY.EXACT ? "全匹配" : "数匹配"}: {matchStrategy === MATCH_STRATEGY.EXACT ? item.exact : item.total}
                            </span>
                         </div>
                      </div>
                   ))}
                </div>
             )}
         </div>
      </div>

      {/* Input Display Area */}
      <div className="shrink-0 pt-2 pb-2 flex flex-col items-center relative">
         
         {/* Not My Turn Overlay */}
         {isRaceMode && status === GAME_STATUS.PLAYING && !isMyTurn && (
             <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-[2px] flex items-center justify-center rounded-2xl animate-in fade-in">
                 <div className="flex flex-col items-center gap-2">
                     <div className="flex gap-1">
                         <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                         <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                         <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce"></span>
                     </div>
                     <p className="text-sm font-medium text-amber-400">
                         等待 <span className="font-bold underline">{getCurrentTurnUsername()}</span> 行动...
                     </p>
                 </div>
             </div>
         )}

         {/* Setting Secret Overlay - Waiting State Only */}
         {status === GAME_STATUS.SETTING_SECRET && mySecret && (
            <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center rounded-2xl animate-in fade-in">
                  <div className="space-y-4">
                     <div className="text-3xl font-mono tracking-[0.5em] text-amber-400 font-bold">{mySecret}</div>
                     <p className="text-sm text-emerald-400 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4"/> 等待对手设置...
                     </p>
                  </div>
            </div>
         )}

         {/* Setting Secret Instructions - Input State */}
         {status === GAME_STATUS.SETTING_SECRET && !mySecret && (
            <div className="text-center mb-4 animate-in slide-in-from-top-2">
                <h2 className="text-xl font-bold text-amber-400 mb-1">设置谜底</h2>
                <p className="text-slate-400 text-xs">请输入 {digits} 位数字</p>
            </div>
         )}
         
         {/* Result Overlay */}
         {(status === GAME_STATUS.WON || status === GAME_STATUS.LOST) && (
            <div className="absolute inset-0 z-20 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl animate-in fade-in">
                {status === GAME_STATUS.WON ? (
                   <>
                      <Crown className="w-16 h-16 text-emerald-400 mx-auto animate-bounce"/>
                      <h2 className="text-3xl font-bold text-white">恭喜胜利！</h2>
                   </>
                ) : (
                   <>
                      <AlertCircle className="w-16 h-16 text-red-400 mx-auto animate-pulse"/>
                      <h2 className="text-3xl font-bold text-white">惜败！</h2>
                   </>
                )}
                <p className="text-slate-300">
                   正确答案是 <span className="font-mono font-bold text-white mx-1 text-xl">{gameEngine?.getSecret()}</span>
                </p>
                <Button onClick={() => {
                    if (mode === GAME_MODE.SINGLE) startSingleGame();
                    else startHostGame(); 
                }} icon={RefreshCw} className="w-full max-w-xs">
                   再来一局
                </Button>
            </div>
         )}

         {/* OTP Display */}
         <div className="flex justify-center gap-2 mb-2 w-full px-4">
            {Array.from({ length: digits }).map((_, i) => {
               const char = guess[i];
               // Active if it matches activeIndex
               const isActive = i === activeIndex && (status === GAME_STATUS.PLAYING || status === GAME_STATUS.SETTING_SECRET);
               const isFilled = !!char;
               
               return (
                  <div 
                     key={i}
                     onClick={() => {
                        if (!isMyTurn) return; // Disable click if not my turn
                        setActiveIndex(i);
                        setIsKeyboardOpen(true);
                     }}
                     className={cn(
                        "h-14 flex-1 max-w-[3.5rem] rounded-xl border-2 flex items-center justify-center text-3xl font-mono font-bold transition-all duration-200 select-none",
                        isActive ? "border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-105 z-10" : 
                        isFilled ? "border-slate-700 bg-slate-800/50 text-slate-100" : 
                        "border-slate-800 bg-slate-900/30 text-slate-700",
                        !isMyTurn ? "cursor-not-allowed opacity-80" : "cursor-pointer"
                     )}
                  >
                     {char}
                     {isActive && !char && (
                        <div className="w-0.5 h-6 bg-blue-400 animate-pulse absolute" />
                     )}
                  </div>
               );
            })}
         </div>

         {error && (
            <div className="text-red-400 text-xs font-medium animate-pulse h-5">
               {error}
            </div>
         )}
         {!error && <div className="h-5"></div>}
      </div>

      {/* Virtual Keyboard */}
      <div className={cn(
          "shrink-0 bg-slate-900/50 rounded-t-2xl border-t border-slate-800/50 transition-all duration-300 ease-out z-30",
          isKeyboardOpen ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 h-0 overflow-hidden"
      )}>
        {/* Drag/Click Handle to Close */}
        <div 
            className="flex items-center justify-center py-1 cursor-pointer hover:bg-slate-800/50 active:bg-slate-800 transition-colors"
            onClick={() => setIsKeyboardOpen(false)}
        >
            <div className="w-12 h-1 bg-slate-700 rounded-full"/>
        </div>
        
        <div className="pb-safe">
            <VirtualKeyboard 
            onKeyPress={handleVirtualKeyPress}
            onDelete={handleVirtualDelete}
            onSubmit={handleSubmit}
            canSubmit={isMyTurn && guess.length === digits && (status === GAME_STATUS.PLAYING || (status === GAME_STATUS.SETTING_SECRET && !mySecret))}
            />
        </div>
      </div>
      
      {/* Re-open handle (visible when keyboard is closed) */}
      {!isKeyboardOpen && (status === GAME_STATUS.PLAYING || status === GAME_STATUS.SETTING_SECRET) && isMyTurn && (
         <div className="absolute bottom-safe left-0 right-0 flex justify-center pb-2 z-20 pointer-events-none">
             <Button 
                variant="secondary" 
                className="pointer-events-auto shadow-lg shadow-black/50 animate-in slide-in-from-bottom-4 fade-in rounded-full px-6 opacity-80 hover:opacity-100 backdrop-blur-md bg-slate-800/80 border-slate-700 py-1 h-8 text-xs"
                onClick={() => setIsKeyboardOpen(true)}
             >
                <ChevronUp className="w-4 h-4 mr-1"/> 打开键盘
             </Button>
         </div>
      )}
    </div>
  );
};
