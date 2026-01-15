import { Settings, Copy, CheckCircle2, Users } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { cn } from "../../utils/cn";
import { GameMode, PlayStyle, MatchStrategy } from "../../types";

type LobbyViewProps = {
  mode: GameMode;
  setView: (view: any) => void;
  setP2P: (val: any) => void;
  p2p: any;
  myId: string;
  isConnected: boolean;
  copyId: () => void;
  digits: number;
  setDigits: (val: number) => void;
  playStyle: PlayStyle;
  setPlayStyle: (val: PlayStyle) => void;
  matchStrategy: MatchStrategy;
  setMatchStrategy: (val: MatchStrategy) => void;
  startSingleGame: () => void;
  startHostGame: () => void;
};

export const LobbyView = ({
  mode, setView, setP2P, p2p, myId, isConnected, copyId,
  digits, setDigits, playStyle, setPlayStyle, matchStrategy, setMatchStrategy,
  startSingleGame, startHostGame
}: LobbyViewProps) => {
  return (
    <div className="max-w-md mx-auto w-full h-full flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => { setView("home"); p2p?.destroy(); setP2P(null); }} className="px-0">
           ← 返回
        </Button>
        <Badge color={mode === "single" ? "blue" : "green"}>
           {mode === "single" ? "单机" : mode === "multi_host" ? "房主" : "访客"}
        </Badge>
      </div>

      <Card className="flex-1">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
            <Settings className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold">游戏设置</h2>
          </div>

          {/* Room ID Info */}
          {mode === "multi_host" && (
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">房间 ID</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-black/20 p-2 rounded text-emerald-400 font-mono text-center select-all truncate">
                  {myId || "生成中..."}
                </code>
                <Button variant="secondary" onClick={copyId} icon={Copy} className="px-3 shrink-0">
                  复制
                </Button>
              </div>
              {isConnected && <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> 好友已连接</p>}
              {!isConnected && <p className="text-xs text-amber-400 flex items-center gap-1 animate-pulse"><Users className="w-3 h-3"/> 等待连接...</p>}
            </div>
          )}

          {mode === "multi_join" && (
             <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-slate-400 text-sm">已连接到房间</p>
                <p className="text-xs text-slate-500 mt-1">等待房主开始游戏...</p>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500">数字位数</label>
               <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-1 border border-slate-800 h-[42px]">
                  <button onClick={() => setDigits(Math.max(3, digits-1))} disabled={mode === "multi_join" || digits <= 3} className="w-10 h-full flex items-center justify-center hover:bg-slate-800 rounded disabled:opacity-30 active:bg-slate-700">-</button>
                  <span className="flex-1 text-center font-mono font-bold text-lg">{digits}</span>
                  <button onClick={() => setDigits(Math.min(10, digits+1))} disabled={mode === "multi_join" || digits >= 10} className="w-10 h-full flex items-center justify-center hover:bg-slate-800 rounded disabled:opacity-30 active:bg-slate-700">+</button>
               </div>
             </div>
             
             <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500">匹配策略</label>
               <div className="grid grid-cols-2 gap-2">
                   <button 
                      onClick={() => setMatchStrategy("exact")}
                      disabled={mode === "multi_join"}
                      className={cn(
                        "p-2 rounded-lg border text-sm transition-all h-[42px]", 
                        matchStrategy === "exact" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-slate-950 border-slate-800 text-slate-500"
                      )}
                   >
                      全匹配
                   </button>
                   <button 
                      onClick={() => setMatchStrategy("value")}
                      disabled={mode === "multi_join"}
                      className={cn(
                        "p-2 rounded-lg border text-sm transition-all h-[42px]", 
                        matchStrategy === "value" ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-slate-950 border-slate-800 text-slate-500"
                      )}
                   >
                      数匹配
                   </button>
               </div>
             </div>
          </div>

          {mode === "multi_host" && (
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">出题模式</label>
                <div className="grid grid-cols-2 gap-2">
                   <button 
                      onClick={() => setPlayStyle("race")}
                      className={cn("p-2 rounded-lg border text-sm transition-all h-[50px]", playStyle === "race" ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-slate-950 border-slate-800 text-slate-500")}
                   >
                      🚀 系统随机
                   </button>
                   <button 
                      onClick={() => setPlayStyle("duel")}
                      className={cn("p-2 rounded-lg border text-sm transition-all h-[50px]", playStyle === "duel" ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-slate-950 border-slate-800 text-slate-500")}
                   >
                      ⚔️ 互相出题
                   </button>
                </div>
             </div>
          )}

          {/* Start Button */}
          {mode !== "multi_join" && (
             <Button 
                onClick={mode === "single" ? startSingleGame : startHostGame} 
                className="w-full h-14 text-lg mt-auto"
                disabled={mode === "multi_host" && !isConnected}
             >
                {mode === "single" ? "开始游戏" : `开始对战 ${playStyle === "duel" ? "(设置题目)" : ""}`}
             </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
