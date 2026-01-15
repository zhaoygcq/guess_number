import { Gamepad2, Users, Trophy, LogIn, ArrowRight, Loader2, User } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { cn } from "../../utils/cn";
import { GAME_MODE, VIEW } from "../../constants";

type HomeViewProps = {
  setMode: (mode: any) => void;
  setView: (view: any) => void;
  handleCreateRoom: () => void;
  peerIdInput: string;
  setPeerIdInput: (val: string) => void;
  handleJoin: () => void;
  isInitializing?: boolean;
  username: string;
  setUsername: (val: string) => void;
  error?: string | null;
};

export const HomeView = ({ 
  setMode, setView, handleCreateRoom, peerIdInput, setPeerIdInput, handleJoin, isInitializing = false,
  username, setUsername, error
}: HomeViewProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-8 animate-in fade-in zoom-in duration-500 p-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-blue-500/20 text-blue-400 mb-4 ring-1 ring-blue-500/50 shadow-lg shadow-blue-500/20 animate-pulse">
          <Gamepad2 className="w-12 h-12" />
        </div>
        <h1 className="text-5xl font-black bg-gradient-to-br from-white via-blue-100 to-blue-400 bg-clip-text text-transparent">
          猜数字
        </h1>
        <p className="text-slate-400 max-w-xs mx-auto text-lg">
          猜猜有几个数字是对的
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
              placeholder="输入你的昵称"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
        </div>

        <div className="grid gap-4">
          <Card className="hover:border-blue-500/50 transition-colors group cursor-pointer active:scale-95" >
            <div onClick={() => { setMode(GAME_MODE.SINGLE); setView(VIEW.LOBBY); }} className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-slate-200">单机练习</h3>
                <p className="text-xs text-slate-500">挑战系统 AI</p>
              </div>
              <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" />
            </div>
          </Card>

          <Card className={cn(
              "hover:border-emerald-500/50 transition-colors group cursor-pointer active:scale-95",
              isInitializing && "opacity-70 pointer-events-none"
          )}>
            <div onClick={handleCreateRoom} className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                {isInitializing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trophy className="w-6 h-6" />}
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-slate-200">
                    {isInitializing ? "正在创建..." : "创建房间"}
                </h3>
                <p className="text-xs text-slate-500">P2P 联机对战</p>
              </div>
              {!isInitializing && <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />}
            </div>
          </Card>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-950 px-2 text-slate-600">或者加入</span>
            </div>
          </div>

          <div className="flex gap-2">
            <input 
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-center focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600"
              placeholder="输入房间 ID"
              value={peerIdInput}
              onChange={e => setPeerIdInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && peerIdInput && !isInitializing && handleJoin()}
            />
            <Button onClick={handleJoin} disabled={!peerIdInput || isInitializing} icon={isInitializing ? Loader2 : LogIn} isLoading={isInitializing}>
              {isInitializing ? "连接中" : "加入"}
            </Button>
          </div>
          {error && (
            <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium">
                {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
