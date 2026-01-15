import React from "react";
import { cn } from "../../utils/cn";

export const Badge = ({ children, color = "slate" }: { children: React.ReactNode; color?: "slate" | "blue" | "green" | "amber" | "red" }) => {
  const colors = {
    slate: "bg-slate-800 text-slate-300 border-slate-700",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    green: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", colors[color])}>
      {children}
    </span>
  );
};
