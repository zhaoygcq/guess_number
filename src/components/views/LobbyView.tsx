import { Settings, CheckCircle2, Users, X, Share2 } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Tooltip } from "../ui/Tooltip";
import { cn } from "../../utils/cn";
import { GameMode, PlayStyle, MatchStrategy } from "../../types";
import { GAME_MODE, PLAY_STYLE, MATCH_STRATEGY, VIEW } from "../../constants";

type LobbyViewProps = {
  mode: GameMode;
  setView: (view: any) => void;
  setP2P: (val: any) => void;
  p2p: any;
  myId: string;
  opponents?: Map<string, any>;
  copyId: () => void;
  digits: number;
  setDigits: (val: number) => void;
  playStyle: PlayStyle;
  setPlayStyle: (val: PlayStyle) => void;
  matchStrategy: MatchStrategy;
  setMatchStrategy: (val: MatchStrategy) => void;
  startSingleGame: () => void;
  startHostGame: () => void;
  username: string;
  kickPlayer?: (peerId: string) => void;
};

export const LobbyView = ({
  mode, setView, setP2P, myId, opponents, copyId,
  digits, setDigits, playStyle, setPlayStyle, matchStrategy, setMatchStrategy,
  startSingleGame, startHostGame, username, kickPlayer
}: LobbyViewProps) => {
  const connectedCount = opponents ? opponents.size : 0;

  return (
    <div className="max-w-md mx-auto w-full h-full flex flex-col gap-6 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => { setView(VIEW.HOME); setP2P(null); }} className="px-0">
           ← 返回
        </Button>
        <Badge color={mode === GAME_MODE.SINGLE ? "blue" : "green"}>
           {mode === GAME_MODE.SINGLE ? "单机" : mode === GAME_MODE.MULTI_HOST ? "房主" : "访客"}
        </Badge>
      </div>

      <Card className="flex-1">
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-4">
            <Settings className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-bold">游戏设置</h2>
          </div>

          {/* Room ID Info */}
          {mode === GAME_MODE.MULTI_HOST && (
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-2">
              <label className="text-xs font-semibold uppercase text-slate-500">邀请好友</label>
              <div className="flex gap-2">
                <Tooltip content={myId} className="flex-1 min-w-0">
                    <div className="w-full bg-black/20 p-2 rounded flex items-center gap-2">
                        <code className="flex-1 text-emerald-400 font-mono text-center select-all truncate">
                            {myId || "生成中..."}
                        </code>
                    </div>
                </Tooltip>
                <Button variant="secondary" onClick={copyId} icon={Share2} className="px-3 shrink-0">
                  分享链接
                </Button>
              </div>
              <p className="text-[10px] text-slate-500 text-center">
                 发送链接给好友，点击即可加入房间
              </p>
              {connectedCount > 0 ? (
                 <div className="space-y-1 mt-2">
                    <p className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3"/> {connectedCount} 位玩家已连接
                    </p>
                    <div className="flex flex-col gap-2">
                        {Array.from(opponents?.entries() || []).map(([id, info]) => (
                            <div key={id} className="flex items-center justify-between bg-black/20 p-2 rounded-lg group relative">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Tooltip content={info.username || "未知用户"}>
                                        <Badge color="green" className="font-mono text-[10px] px-1 py-0 h-5 max-w-[80px] truncate block">
                                            {info.username || id.substring(0, 4)}
                                        </Badge>
                                    </Tooltip>
                                    <Tooltip content={id}>
                                        <span className="text-[10px] text-slate-500 font-mono truncate">
                                            {id.substring(0, 4)}...
                                        </span>
                                    </Tooltip>
                                </div>
                                
                                {mode === GAME_MODE.MULTI_HOST && kickPlayer && (
                                    <button 
                                        onClick={() => kickPlayer(id)}
                                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                                        title="踢出玩家"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                 </div>
              ) : (
                 <p className="text-xs text-amber-400 flex items-center gap-1 animate-pulse"><Users className="w-3 h-3"/> 等待连接...</p>
              )}
            </div>
          )}

          {mode === GAME_MODE.MULTI_JOIN && (
             <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 text-center">
                <p className="text-slate-400 text-sm">已连接到房间</p>
                <div className="mt-2 flex items-center justify-center gap-2">
                    <span className="text-xs text-slate-500">我是</span>
                    <Badge color="blue" className="font-mono">{username}</Badge>
                </div>
                <p className="text-xs text-slate-500 mt-2">等待房主开始游戏...</p>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500">数字位数</label>
               <div className="flex items-center gap-2 bg-slate-950 rounded-lg p-1 border border-slate-800 h-[42px]">
                  <button onClick={() => setDigits(Math.max(3, digits-1))} disabled={mode === GAME_MODE.MULTI_JOIN || digits <= 3} className="w-10 h-full flex items-center justify-center hover:bg-slate-800 rounded disabled:opacity-30 active:bg-slate-700">-</button>
                  <span className="flex-1 text-center font-mono font-bold text-lg">{digits}</span>
                  <button onClick={() => setDigits(Math.min(10, digits+1))} disabled={mode === GAME_MODE.MULTI_JOIN || digits >= 10} className="w-10 h-full flex items-center justify-center hover:bg-slate-800 rounded disabled:opacity-30 active:bg-slate-700">+</button>
               </div>
             </div>
             
             <div className="space-y-2">
               <label className="text-xs font-semibold text-slate-500">匹配策略</label>
               <div className="grid grid-cols-2 gap-2">
                   <button 
                      onClick={() => setMatchStrategy(MATCH_STRATEGY.EXACT)}
                      disabled={mode === GAME_MODE.MULTI_JOIN}
                      className={cn(
                        "p-2 rounded-lg border text-sm transition-all h-[42px]", 
                        matchStrategy === MATCH_STRATEGY.EXACT ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-slate-950 border-slate-800 text-slate-500"
                      )}
                   >
                      全匹配
                   </button>
                   <button 
                      onClick={() => setMatchStrategy(MATCH_STRATEGY.VALUE)}
                      disabled={mode === GAME_MODE.MULTI_JOIN}
                      className={cn(
                        "p-2 rounded-lg border text-sm transition-all h-[42px]", 
                        matchStrategy === MATCH_STRATEGY.VALUE ? "bg-purple-500/20 border-purple-500 text-purple-400" : "bg-slate-950 border-slate-800 text-slate-500"
                      )}
                   >
                      数匹配
                   </button>
               </div>
             </div>
          </div>

          {mode === GAME_MODE.MULTI_HOST && (
             <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-500">出题模式</label>
                <div className="grid grid-cols-2 gap-2">
                   <button 
                      onClick={() => setPlayStyle(PLAY_STYLE.RACE)}
                      className={cn("p-2 rounded-lg border text-sm transition-all h-[50px]", playStyle === PLAY_STYLE.RACE ? "bg-blue-500/20 border-blue-500 text-blue-400" : "bg-slate-950 border-slate-800 text-slate-500")}
                   >
                      🚀 系统随机
                   </button>
                   <button 
                      onClick={() => setPlayStyle(PLAY_STYLE.DUEL)}
                      className={cn("p-2 rounded-lg border text-sm transition-all h-[50px]", playStyle === PLAY_STYLE.DUEL ? "bg-amber-500/20 border-amber-500 text-amber-400" : "bg-slate-950 border-slate-800 text-slate-500")}
                   >
                      ⚔️ 互相出题
                   </button>
                </div>
             </div>
          )}

          {/* Start Button */}
          {mode !== GAME_MODE.MULTI_JOIN && (
             <Button 
                onClick={mode === GAME_MODE.SINGLE ? startSingleGame : startHostGame} 
                className="w-full h-14 text-lg mt-auto"
                disabled={mode === GAME_MODE.MULTI_HOST && connectedCount === 0}
             >
                {mode === GAME_MODE.SINGLE ? "开始游戏" : `开始对战 ${playStyle === PLAY_STYLE.DUEL ? "(设置题目)" : ""}`}
             </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
