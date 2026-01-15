import { 
  XCircle, Shield, Trophy, Users, History, CheckCircle2, Crown, AlertCircle, RefreshCw 
} from "lucide-react";
import { Button } from "../ui/Button";
import { VirtualKeyboard } from "../ui/VirtualKeyboard";
import { cn } from "../../utils/cn";
import { GameMode, PlayStyle, MatchStrategy } from "../../types";
import { GameEngine, GuessResult } from "../../game/engine";

type GameViewProps = {
  setView: (view: any) => void;
  setStatus: (status: any) => void;
  digits: number;
  mode: GameMode;
  playStyle: PlayStyle;
  matchStrategy: MatchStrategy;
  status: "playing" | "won" | "lost" | "setting_secret";
  opponentStatus: any;
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
};

export const GameView = ({
  setView, setStatus, digits, mode, playStyle, matchStrategy, status,
  opponentStatus, history, scrollRef, mySecret, gameEngine, guess, error,
  handleVirtualKeyPress, handleVirtualDelete, handleSubmit, startSingleGame, startHostGame
}: GameViewProps) => {
  return (
    <div className="max-w-lg mx-auto w-full h-full flex flex-col gap-2 animate-in fade-in duration-500 pb-safe">
      {/* Header Bar */}
      <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-800 backdrop-blur shrink-0">
         <Button variant="ghost" onClick={() => { setView("lobby"); setStatus("playing"); }} className="px-2 h-8 text-xs">
           <XCircle className="w-4 h-4 mr-1"/> 退出
         </Button>
         <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
            <span className="flex items-center gap-1">{digits}位</span>
            {mode !== "single" && (
                <span className={cn("flex items-center gap-1", playStyle === "duel" ? "text-amber-400" : "text-blue-400")}>
                    {playStyle === "duel" ? <Shield className="w-3 h-3"/> : <Trophy className="w-3 h-3"/>}
                    {playStyle === "duel" ? "对决" : "竞速"}
                </span>
            )}
         </div>
      </div>

      {/* Opponent Status Bar (Multiplayer) */}
      {mode !== "single" && status === "playing" && (
        <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/50 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                 <Users className="w-4 h-4 text-slate-400"/>
              </div>
              <div className="flex flex-col">
                 <span className="text-xs font-bold text-slate-400">对手进度</span>
                 <span className="text-sm font-mono text-slate-200">已猜 {opponentStatus.guessCount} 次</span>
              </div>
           </div>
           {opponentStatus.lastResult ? (
              <div className="flex gap-2 text-sm font-mono bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-800">
                  <span className={cn("font-bold", matchStrategy === "exact" ? "text-blue-400" : "text-purple-400")}>
                    {matchStrategy === "exact" ? "全匹配" : "数匹配"}: {matchStrategy === "exact" ? opponentStatus.lastResult.exact : opponentStatus.lastResult.total}
                  </span>
              </div>
           ) : (
              <span className="text-xs text-slate-500 italic">思考中...</span>
           )}
        </div>
      )}

      {/* History List - Scrollable Area */}
      <div className="flex-1 relative overflow-hidden bg-slate-900/20 rounded-2xl border border-slate-800/30">
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
                               matchStrategy === "exact" ? "bg-blue-500/20 text-blue-400" : "bg-purple-500/20 text-purple-400"
                            )}>
                               {matchStrategy === "exact" ? "全匹配" : "数匹配"}: {matchStrategy === "exact" ? item.exact : item.total}
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
         {/* Setting Secret Overlay */}
         {status === "setting_secret" && (
            <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center rounded-2xl animate-in fade-in">
               {!mySecret ? (
                  <>
                     <h2 className="text-xl font-bold text-amber-400 mb-2 animate-pulse">设置谜底</h2>
                     <p className="text-slate-400 text-sm mb-4">请输入 {digits} 位数字</p>
                  </>
               ) : (
                  <div className="space-y-4">
                     <div className="text-3xl font-mono tracking-[0.5em] text-amber-400 font-bold">{mySecret}</div>
                     <p className="text-sm text-emerald-400 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-4 h-4"/> 等待对手设置...
                     </p>
                  </div>
               )}
            </div>
         )}
         
         {/* Result Overlay */}
         {(status === "won" || status === "lost") && (
            <div className="absolute inset-0 z-20 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center space-y-4 rounded-2xl animate-in fade-in">
                {status === "won" ? (
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
                    if (mode === "single") startSingleGame();
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
               const isActive = i === guess.length && (status === "playing" || status === "setting_secret");
               const isFilled = !!char;
               
               return (
                  <div 
                     key={i}
                     className={cn(
                        "h-14 flex-1 max-w-[3.5rem] rounded-xl border-2 flex items-center justify-center text-3xl font-mono font-bold transition-all duration-200",
                        isActive ? "border-blue-500 bg-blue-500/10 shadow-[0_0_10px_rgba(59,130,246,0.5)] scale-105 z-10" : 
                        isFilled ? "border-slate-700 bg-slate-800/50 text-slate-100" : 
                        "border-slate-800 bg-slate-900/30 text-slate-700"
                     )}
                  >
                     {char}
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
      <div className="shrink-0 bg-slate-900/50 rounded-t-2xl border-t border-slate-800/50 pb-safe">
        <VirtualKeyboard 
          onKeyPress={handleVirtualKeyPress}
          onDelete={handleVirtualDelete}
          onSubmit={handleSubmit}
          canSubmit={guess.length === digits && (status === "playing" || (status === "setting_secret" && !mySecret))}
        />
      </div>
    </div>
  );
};
