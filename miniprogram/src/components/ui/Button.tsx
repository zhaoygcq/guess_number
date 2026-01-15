import React from "react";
import { Button as TaroButton, View } from "@tarojs/components";
import { cn } from "../../utils/cn";

export const Button = ({ 
  children, onClick, variant = "primary", className, disabled
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  className?: string;
  disabled?: boolean;
}) => {
  const baseStyles = "relative inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200";
  
  // Inline styles simulation for Tailwind classes since we don't have full Tailwind setup
  const variantStyles = {
    primary: "bg-blue-600 text-white",
    secondary: "bg-slate-800 text-slate-200 border border-slate-700",
    outline: "bg-transparent border-2 border-slate-700 text-slate-300",
    danger: "bg-red-500/10 text-red-400 border border-red-500/20",
    ghost: "text-slate-400"
  };

  return (
    <View 
      onClick={!disabled ? onClick : undefined} 
      className={cn(baseStyles, variantStyles[variant], className, disabled ? 'opacity-50' : '')}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '12px',
        padding: '10px 16px',
        opacity: disabled ? 0.5 : 1
      }}
    >
      {children}
    </View>
  );
};
