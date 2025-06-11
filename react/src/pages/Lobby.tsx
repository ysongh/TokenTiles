import React, { useState } from 'react';
import { Shuffle, Trophy, Wallet, Play, CheckCircle, Clock, Star, Coins } from 'lucide-react';

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

function Lobby() {
  const [availableGames, setAvailableGames] = useState<Game[]>(mockGames);

  const shuffleWord = (word: string) => {
    return word.split('').sort(() => Math.random() - 0.5).join('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <Coins className="w-6 h-6 mr-2 text-yellow-400" />
            Available Games
          </h3>
          
          <div className="space-y-3">
            {availableGames.map((game) => (
              <div
                key={game.id}
                className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-mono text-lg font-bold tracking-wide">
                    {shuffleWord(game.scrambledWord)}
                  </div>
                  <div className="text-right">
                    <div className="text-yellow-400 font-semibold">{game.prize} ETH</div>
                    <div className="text-xs text-gray-400">Prize</div>
                  </div>
                </div>
                
                <div className="flex justify-between text-sm text-gray-300">
                  <span>Fee: {game.entryFee} ETH</span>
                  <span>{game.submissions} players</span>
                  <span>{game.timeLimit}</span>
                </div>
                
                <button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 py-2 rounded text-sm font-semibold transition-colors">
                  Join Game
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Lobby