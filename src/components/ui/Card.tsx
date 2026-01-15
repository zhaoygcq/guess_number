import React from "react";
import { cn } from "../../utils/cn";

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl shadow-xl p-6", className)}>
    {children}
  </div>
);
