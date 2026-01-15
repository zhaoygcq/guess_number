import React from "react";
import { View } from "@tarojs/components";
import { cn } from "../../utils/cn";

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <View className={cn("bg-slate-900/60 border border-slate-800 rounded-2xl shadow-xl p-6", className)} style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(12px)' }}>
    {children}
  </View>
);
