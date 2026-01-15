import React from "react";
import { cn } from "../../utils/cn";

export const Button = ({ 
  children, onClick, variant = "primary", className, disabled, icon: Icon, isLoading
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  className?: string;
  disabled?: boolean;
  icon?: any;
  isLoading?: boolean;
}) => {
  const baseStyles = "relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20",
    secondary: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    outline: "bg-transparent border-2 border-slate-700 hover:border-slate-600 text-slate-300",
    danger: "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20",
    ghost: "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200"
  };

  return (
    <button onClick={onClick} disabled={disabled || isLoading} className={cn(baseStyles, variants[variant], className)}>
      {Icon && <Icon className={cn("w-4 h-4", isLoading && "animate-spin")} />}
      {children}
    </button>
  );
};
