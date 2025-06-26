import { useNavigate } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { useReadContract } from "wagmi";

import TokenTilesGame from "../artifacts/contracts/TokenTilesGame.sol/TokenTilesGame.json"
import { formatDate } from '../utils/format';

interface Game {
  sessionId: number;
  gameName: string;
  playerCount: number;
  startTime: number;
  endTime: number;
  creator: string;
  wordListId: number;
  active: boolean;
}

function Lobby() {
  const navigate = useNavigate();

  const { data: games = [] } = useReadContract({
    address: import.meta.env.VITE_TOKENTILESGAME,
    abi: TokenTilesGame.abi,
    functionName: 'getAllGames',
  }) as { data: Game[] };

  console.log(games);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8 w-[600px]">
        <button
          onClick={() => navigate("/createwords")}
          className="w-full bg-green-200 hover:bg-green-300 text-gray-800 py-2 px-6 rounded-lg transition-colors mb-3"
        >
          New Game
        </button>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Coins className="w-6 h-6 mr-2 text-yellow-400" />
            Available Games
          </h3>
          
          <div className="space-y-3">
            {games.map(game => (
              <div key={game?.sessionId?.toString()}className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-lg font-bold tracking-wide">
                    {game?.gameName}
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-semibold">{game.active ? "Started" : "Not Started"}</div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{game?.playerCount?.toString()} Players</span>
                  <span>{formatDate(BigInt(game?.startTime) || BigInt(0))}</span>
                  <span>{game?.endTime?.toString()}</span>
                </div>
                
                <button
                  className="w-full mt-2 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm font-semibold transition-colors"
                  onClick={() => navigate("/game/" + game?.sessionId?.toString())}
                >
                  Join Game
                </button>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => navigate("/leaderboard")}
          className="w-full mt-3 bg-green-200 hover:bg-green-300 text-gray-800 py-2 px-6 rounded-lg transition-colors mb-3"
        >
          Leaderboard
        </button>
      </div>
    </div>
  )
}

export default Lobby;
