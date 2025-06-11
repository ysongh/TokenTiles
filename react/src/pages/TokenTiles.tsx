import React, { useState } from 'react';
import { Play, CheckCircle, Clock } from 'lucide-react';

interface Game {
  id: number;
  scrambledWord: string;
  originalWord: string;
  timeLimit: number;
  entryFee: string;
  prize: string;
  isActive: boolean;
  winner?: string;
  submissions: number;
}

// Mock games data
const mockGames: Game[] = [
  {
    id: 1,
    scrambledWord: 'CNBKALOHCI',
    originalWord: 'BLOCKCHAIN',
    timeLimit: 300,
    entryFee: '0.01',
    prize: '0.05',
    isActive: true,
    submissions: 3
  },
  {
    id: 2,
    scrambledWord: 'MMTARSCTON',
    originalWord: 'SMARTCONTRACT',
    timeLimit: 240,
    entryFee: '0.005',
    prize: '0.025',
    isActive: true,
    submissions: 1
  },
  {
    id: 3,
    scrambledWord: 'EEDCFI',
    originalWord: 'DEFI',
    timeLimit: 180,
    entryFee: '0.002',
    prize: '0.01',
    isActive: true,
    submissions: 7
  }
];

const TokenTiles: React.FC = () => {
  const [currentGame, setCurrentGame] = useState<Game | null>(mockGames[0]);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const [gameHistory, setGameHistory] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const submitAnswer = () => {
    if (!currentGame || !userInput.trim()) return;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {message && (
          <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg text-center">
            {message}
          </div>
        )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Current Game */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              {currentGame ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Current Game</h3>
                    <div className="flex items-center text-orange-400">
                      <Clock className="w-5 h-5 mr-1" />
                      <span className="font-mono">{formatTime(timeLeft)}</span>
                    </div>
                  </div>
                  
                  <div className="text-center mb-6">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 mb-4">
                      <h4 className="text-sm text-gray-300 mb-2">Unscramble this word:</h4>
                      <div className="text-3xl font-bold tracking-widest">
                        {currentGame.scrambledWord}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-300 mb-4">
                      <span>Prize: {currentGame.prize} ETH</span>
                      <span>•</span>
                      <span>{currentGame.submissions} players</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value.toUpperCase())}
                      placeholder="Enter your answer..."
                      className="w-full px-4 py-3 bg-white/20 rounded-lg border border-white/30 text-center text-lg font-semibold tracking-wide placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                    
                    <button
                      onClick={submitAnswer}
                      disabled={isLoading || !userInput.trim()}
                      className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Submit Answer
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Play className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-xl font-bold mb-2">No Active Game</h3>
                  <p className="text-gray-300">Select a game from the available games to start playing!</p>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  );
};

export default TokenTiles;