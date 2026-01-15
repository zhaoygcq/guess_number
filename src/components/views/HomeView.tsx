import { Gamepad2, Users, Trophy, LogIn, ArrowRight } from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";

type HomeViewProps = {
  setMode: (mode: any) => void;
  setView: (view: any) => void;
  handleCreateRoom: () => void;
  peerIdInput: string;
  setPeerIdInput: (val: string) => void;
  handleJoin: () => void;
};

export const HomeView = ({ 
  setMode, setView, handleCreateRoom, peerIdInput, setPeerIdInput, handleJoin 
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

      <div className="grid gap-4 w-full max-w-xs">
        <Card className="hover:border-blue-500/50 transition-colors group cursor-pointer active:scale-95" >
          <div onClick={() => { setMode("single"); setView("lobby"); }} className="flex items-center gap-4">
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

        <Card className="hover:border-emerald-500/50 transition-colors group cursor-pointer active:scale-95">
          <div onClick={handleCreateRoom} className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1 text-left">
              <h3 className="font-bold text-slate-200">创建房间</h3>
              <p className="text-xs text-slate-500">P2P 联机对战</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 transition-colors" />
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
          />
          <Button onClick={handleJoin} disabled={!peerIdInput} icon={LogIn}>
            加入
          </Button>
        </div>
      </div>
    </div>
  );
};
