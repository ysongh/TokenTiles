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
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/createwords")}
          className="w-full bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-gray-900 font-semibold py-3 px-6 rounded-xl shadow hover:shadow-lg transition-all mb-4"
        >
          ➕ New Game
        </button>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Coins className="w-6 h-6 mr-2 text-yellow-400" />
            Available Games
          </h3>
          
          <div className="space-y-4">
            {games.map((game) => (
              <div
                key={game?.sessionId?.toString()}
                className="bg-gradient-to-br from-white/10 via-white/5 to-white/10 border border-white/10 rounded-xl p-5 hover:scale-[1.02] hover:bg-white/10 transition-all duration-200 cursor-pointer shadow-lg"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="inline-block bg-indigo-500/40 rounded-full px-3 py-1 text-xs uppercase tracking-wider font-semibold text-indigo-100">
                      {game?.gameName}
                    </span>
                    <span
                      className={`text-xs font-bold ${
                        game.active
                          ? "text-green-400"
                          : "text-yellow-400"
                      }`}
                    >
                      {game.active ? "Started" : "Not Started"}
                    </span>
                  </div>
                  <span className="text-sm text-gray-300 font-mono">
                    {formatDate(BigInt(game?.startTime) || BigInt(0))}
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-300 mb-4">
                  <span className="flex items-center gap-1">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M17 20h5V4H2v16h5m10-12l-5 5m0 0l-5-5m5 5V4"
                      />
                    </svg>
                    {game?.playerCount?.toString()} Players
                  </span>
                  {/* <span className="font-mono text-xs text-gray-400">
                    Ends: {game?.endTime?.toString()}
                  </span> */}
                </div>

                <button
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 py-2 rounded-lg text-sm font-semibold transition-all text-white shadow-md hover:shadow-lg"
                  onClick={() => navigate("/game/" + game?.sessionId?.toString())}
                >
                  Join Game
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* <button
          onClick={() => navigate("/leaderboard")}
          className="w-full bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-gray-900 font-semibold py-3 px-6 rounded-xl shadow hover:shadow-lg transition-all mt-4"
        >
          🏆 Leaderboard
        </button> */}
      </div>
    </div>
  )
}

export default Lobby;
