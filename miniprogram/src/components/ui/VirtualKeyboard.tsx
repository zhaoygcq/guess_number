import React from "react";
import { View, Text } from "@tarojs/components";
import { cn } from "../../utils/cn";

export const VirtualKeyboard = ({ onKeyPress, onDelete, onSubmit, canSubmit }: { 
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
}) => {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  const btnStyle = {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '12px',
    backgroundColor: 'rgba(30, 41, 59, 0.5)', // slate-800/50
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#e2e8f0'
  };

  return (
    <View className="grid grid-cols-3 gap-2 p-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '8px' }}>
      {keys.map(k => (
        <View
          key={k}
          onClick={() => onKeyPress(k.toString())}
          style={btnStyle}
        >
          {k}
        </View>
      ))}
      <View
        onClick={onDelete}
        style={{...btnStyle, backgroundColor: 'rgba(30, 41, 59, 0.3)'}}
      >
        Del
      </View>
      <View
        onClick={() => onKeyPress("0")}
        style={btnStyle}
      >
        0
      </View>
      <View
        onClick={() => canSubmit && onSubmit()}
        style={{
          ...btnStyle, 
          backgroundColor: canSubmit ? '#2563eb' : 'rgba(30, 41, 59, 0.3)',
          color: canSubmit ? 'white' : '#475569'
        }}
      >
        OK
      </View>
    </View>
  );
};
