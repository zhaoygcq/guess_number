import { ArrowRight, Delete } from "lucide-react";
import { cn } from "../../utils/cn";

export const VirtualKeyboard = ({ onKeyPress, onDelete, onSubmit, canSubmit }: { 
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
}) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-3 p-2 select-none">
      {keys.map(k => (
        <button
          key={k}
          onClick={() => onKeyPress(k.toString())}
          className="h-12 sm:h-14 bg-slate-800/50 hover:bg-slate-700/80 active:bg-slate-600 rounded-xl text-xl font-bold text-slate-200 transition-colors shadow-sm active:scale-95"
        >
          {k}
        </button>
      ))}
      <button
        onClick={onDelete}
        className="h-12 sm:h-14 bg-slate-800/30 hover:bg-slate-700/50 rounded-xl flex items-center justify-center text-slate-400 active:scale-95"
      >
        <Delete className="w-6 h-6" />
      </button>
      <button
        onClick={() => onKeyPress("0")}
        className="h-12 sm:h-14 bg-slate-800/50 hover:bg-slate-700/80 active:bg-slate-600 rounded-xl text-xl font-bold text-slate-200 transition-colors shadow-sm active:scale-95"
      >
        0
      </button>
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={cn(
          "h-12 sm:h-14 rounded-xl flex items-center justify-center font-bold text-white transition-all active:scale-95",
          canSubmit 
            ? "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-500/20" 
            : "bg-slate-800/30 text-slate-600 cursor-not-allowed"
        )}
      >
        <ArrowRight className="w-6 h-6" />
      </button>
    </div>
  );
};
