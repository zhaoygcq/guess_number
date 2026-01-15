import React, { useState, useRef, useEffect } from "react";
import { View, Text, Input, ScrollView } from "@tarojs/components";
import Taro from "@tarojs/taro";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { VirtualKeyboard } from "../../components/ui/VirtualKeyboard";
import { GameEngine, GuessResult } from "../../game/engine";

// Mocking icons with text for now to avoid svg issues in Taro initial setup
const Icons = {
  Gamepad: () => <Text>🎮</Text>,
  Users: () => <Text>👥</Text>,
  Trophy: () => <Text>🏆</Text>,
  Settings: () => <Text>⚙️</Text>,
  History: () => <Text>📜</Text>
};

export default function Index() {
  const [view, setView] = useState<"home" | "lobby" | "game">("home");
  const [digits, setDigits] = useState(3);
  const [matchStrategy, setMatchStrategy] = useState<'exact' | 'value'>('exact');
  const [gameEngine, setGameEngine] = useState<GameEngine | null>(null);
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState<GuessResult[]>([]);
  const [status, setStatus] = useState<"playing" | "won" | "lost">("playing");

  const startSingleGame = () => {
    const engine = new GameEngine({ digits, allowDuplicates: true });
    setGameEngine(engine);
    setHistory([]);
    setStatus("playing");
    setGuess("");
    setView("game");
  };

  const handleKeyPress = (key: string) => {
    if (guess.length < digits) setGuess(prev => prev + key);
  };

  const handleDelete = () => {
    setGuess(prev => prev.slice(0, -1));
  };

  const handleSubmit = () => {
    if (!gameEngine || guess.length !== digits) return;
    try {
      const result = gameEngine.checkGuess(guess);
      setHistory([...history, result]);
      setGuess("");
      
      if (matchStrategy === 'exact' && result.exact === digits) {
        setStatus("won");
      } else if (matchStrategy === 'value' && result.exact === digits) {
        setStatus("won"); 
      }
    } catch (e) {
      Taro.showToast({ title: 'Error', icon: 'none' });
    }
  };

  // --- Views ---

  const HomeView = () => (
    <View className="flex flex-col items-center justify-center h-full p-4 gap-8" style={{minHeight: '80vh', justifyContent: 'center', display: 'flex', flexDirection: 'column', padding: '20px'}}>
      <View style={{textAlign: 'center', marginBottom: '40px'}}>
        <View style={{fontSize: '48px', marginBottom: '16px'}}><Icons.Gamepad /></View>
        <Text style={{fontSize: '32px', fontWeight: 'bold', color: 'white'}}>猜数字</Text>
        <View><Text style={{color: '#94a3b8'}}>微信小程序版</Text></View>
      </View>

      <Card>
        <View onClick={() => setView("lobby")} style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <Icons.Users />
          <View>
            <Text style={{fontWeight: 'bold', display: 'block', color: 'white'}}>单机练习</Text>
            <Text style={{fontSize: '12px', color: '#64748b'}}>挑战系统 AI</Text>
          </View>
        </View>
      </Card>

      <Card>
        <View onClick={() => Taro.showModal({title: '提示', content: '小程序联机功能需要接入云开发，目前仅演示单机版。', showCancel: false})} style={{display: 'flex', alignItems: 'center', gap: '16px'}}>
          <Icons.Trophy />
          <View>
            <Text style={{fontWeight: 'bold', display: 'block', color: 'white'}}>联机对战</Text>
            <Text style={{fontSize: '12px', color: '#64748b'}}>P2P 暂不可用</Text>
          </View>
        </View>
      </Card>
    </View>
  );

  const LobbyView = () => (
    <View style={{padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column'}}>
      <Button variant="ghost" onClick={() => setView("home")} className="mb-4">← 返回</Button>
      
      <Card className="flex-1" style={{marginTop: '20px'}}>
        <View style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #334155', paddingBottom: '16px'}}>
          <Icons.Settings />
          <Text style={{fontWeight: 'bold', color: 'white'}}>游戏设置</Text>
        </View>

        <View style={{marginBottom: '20px'}}>
          <Text style={{color: '#94a3b8', fontSize: '14px', marginBottom: '8px', display: 'block'}}>数字位数: {digits}</Text>
          <View style={{display: 'flex', gap: '8px'}}>
            <Button onClick={() => setDigits(Math.max(3, digits-1))}>-</Button>
            <Button onClick={() => setDigits(Math.min(10, digits+1))}>+</Button>
          </View>
        </View>

        <View style={{marginBottom: '40px'}}>
          <Text style={{color: '#94a3b8', fontSize: '14px', marginBottom: '8px', display: 'block'}}>匹配策略</Text>
          <View style={{display: 'flex', gap: '8px'}}>
            <Button variant={matchStrategy === 'exact' ? 'primary' : 'secondary'} onClick={() => setMatchStrategy('exact')}>全匹配</Button>
            <Button variant={matchStrategy === 'value' ? 'primary' : 'secondary'} onClick={() => setMatchStrategy('value')}>数匹配</Button>
          </View>
        </View>

        <Button onClick={startSingleGame} style={{width: '100%', height: '50px'}}>开始游戏</Button>
      </Card>
    </View>
  );

  const GameView = () => (
    <View style={{height: '100vh', display: 'flex', flexDirection: 'column', padding: '20px'}}>
      <View style={{display: 'flex', justifyContent: 'space-between', marginBottom: '16px'}}>
        <Button variant="ghost" onClick={() => setView("lobby")}>退出</Button>
        <Text style={{color: '#94a3b8'}}>{digits}位 / {matchStrategy === 'exact' ? '全匹配' : '数匹配'}</Text>
      </View>

      <ScrollView scrollY style={{flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.3)', borderRadius: '16px', marginBottom: '20px', padding: '16px'}}>
        {history.length === 0 ? (
          <View style={{textAlign: 'center', marginTop: '40px', color: '#475569'}}>
            <Icons.History />
            <Text>暂无记录</Text>
          </View>
        ) : (
          history.map((h, i) => (
            <View key={i} style={{display: 'flex', justifyContent: 'space-between', marginBottom: '12px', backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '8px'}}>
              <Text style={{fontFamily: 'monospace', fontSize: '20px', color: 'white', letterSpacing: '4px'}}>{h.guess}</Text>
              <View style={{display: 'flex', gap: '8px'}}>
                <Text style={{color: matchStrategy === 'exact' ? '#60a5fa' : '#c084fc', fontWeight: 'bold'}}>
                  {matchStrategy === 'exact' ? `全匹配: ${h.exact}` : `数匹配: ${h.total}`}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {status === 'won' && (
        <View style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.9)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
          <Text style={{fontSize: '40px', color: '#4ade80', marginBottom: '16px'}}>🎉 胜利！</Text>
          <Text style={{color: 'white', marginBottom: '32px'}}>答案是: {gameEngine?.getSecret()}</Text>
          <Button onClick={startSingleGame}>再来一局</Button>
        </View>
      )}

      <View style={{marginBottom: '20px', display: 'flex', justifyContent: 'center', gap: '8px'}}>
        {Array.from({length: digits}).map((_, i) => (
          <View key={i} style={{
            width: '40px', height: '56px', border: '2px solid #334155', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', fontWeight: 'bold', color: 'white',
            backgroundColor: i < guess.length ? 'rgba(30, 41, 59, 0.5)' : 'transparent',
            borderColor: i === guess.length ? '#3b82f6' : '#334155'
          }}>
            {guess[i] || ''}
          </View>
        ))}
      </View>

      <VirtualKeyboard 
        onKeyPress={handleKeyPress}
        onDelete={handleDelete}
        onSubmit={handleSubmit}
        canSubmit={guess.length === digits}
      />
    </View>
  );

  return (
    <View style={{backgroundColor: '#0f172a', minHeight: '100vh', color: '#e2e8f0'}}>
      {view === "home" && <HomeView />}
      {view === "lobby" && <LobbyView />}
      {view === "game" && <GameView />}
    </View>
  );
}
