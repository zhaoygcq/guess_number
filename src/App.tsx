import "./App.css";
import { useGame } from "./hooks/useGame";
import { HomeView } from "./components/views/HomeView";
import { LobbyView } from "./components/views/LobbyView";
import { GameView } from "./components/views/GameView";

function App() {
  const gameState = useGame();
  const { view } = gameState;

  return (
    <div className="h-screen w-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col p-safe">
      <div className="flex-1 w-full max-w-lg mx-auto p-4 flex flex-col h-full">
         {view === "home" && <HomeView {...gameState} />}
         {view === "lobby" && <LobbyView {...gameState} />}
         {view === "game" && <GameView {...gameState} />}
      </div>
    </div>
  );
}

export default App;
