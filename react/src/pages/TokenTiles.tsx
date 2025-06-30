import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Play, CheckCircle, Clock } from 'lucide-react';
import { useAccount, useBlockNumber, useReadContract, useWriteContract } from "wagmi";
import { formatEther } from "viem";

import TileTokenERC20 from "../artifacts/contracts/TileTokenERC20.sol/TileTokenERC20.json";
import TokenTilesGame from "../artifacts/contracts/TokenTilesGame.sol/TokenTilesGame.json";

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

const numberToLetter = {
  1: 'A',
  2: 'B',
  3: 'C',
  4: 'D',
  5: 'E',
  6: 'F',
  7: 'G',
  8: 'H',
  9: 'I',
  10: 'J',
  11: 'K',
  12: 'L',
  13: 'M',
  14: 'N',
  15: 'O',
  16: 'P',
  17: 'Q',
  18: 'R',
  19: 'S',
  20: 'T',
  21: 'U',
  22: 'V',
  23: 'W',
  24: 'X',
  25: 'Y',
  26: 'Z'
};

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
  const { id } = useParams();
  const { address } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true })

  const [currentGame, setCurrentGame] = useState<Game | null>(mockGames[0]);
  const [userInput, setUserInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Letter changing state
  const [playerLetters, setPlayerLetters] = useState<string[]>([]);

  const { data: tokenBalance = 0 } = useReadContract({
    address: import.meta.env.VITE_TILETOKENERC20,
    abi: TileTokenERC20.abi,
    functionName: 'balanceOf',
    args: [address]
  }) as { data: any  };

  const { data: gameData = []} = useReadContract({
    address: import.meta.env.VITE_TOKENTILESGAME,
    abi: TokenTilesGame.abi,
    functionName: 'getSession',
    args: [id]
  }) as { data: any  };

  const { data: wordList = [] } = useReadContract({
    address: import.meta.env.VITE_TOKENTILESGAME,
    abi: TokenTilesGame.abi,
    functionName: 'getWordList',
    args: [id],
  }) as { data: any  };

  const { data: playerWords = [], refetch: wordListRefetch } = useReadContract({
    address: import.meta.env.VITE_TOKENTILESGAME,
    abi: TokenTilesGame.abi,
    functionName: 'getPlayerTiles',
    args: [id, address]
  }) as { data: any, refetch: () => void };

  const { data: changesRemaining = 0, refetch: changesRemainingRefetch } = useReadContract({
    address: import.meta.env.VITE_TOKENTILESGAME,
    abi: TokenTilesGame.abi,
    functionName: 'getPlayerSwapsRemaining',
    args: [id, address]
  }) as { data: any, refetch: () => void  };

  const {
    writeContract,
    data: txHash,
    isPending
  } = useWriteContract();

  // Initialize player letters from contract data
  useEffect(() => {
    if (playerWords && playerWords.length > 0) {
      const letters = playerWords.map((p: BigInt) => numberToLetter[Number(p) + 1]);
      setPlayerLetters(letters);
    }
  }, [playerWords]);

  useEffect(() => {
    wordListRefetch();
    changesRemainingRefetch();
  }, [blockNumber])

  const joinGame = () => {
    writeContract({
      address: import.meta.env.VITE_TOKENTILESGAME,
      abi: TokenTilesGame.abi,
      functionName: "joinGame",
      args: [id]
    })
  }

  const submitAnswer = () => {
    if (!currentGame || !userInput.trim()) return;

    writeContract({
      address: import.meta.env.VITE_TOKENTILESGAME,
      abi: TokenTilesGame.abi,
      functionName: "submitWord",
      args: [id, userInput],
    })
  };

  const handleLetterClick = (index: number) => {
    if (changesRemaining <= 0) {
      setMessage('No more letter changes remaining!');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    writeContract({
      address: import.meta.env.VITE_TOKENTILESGAME,
      abi: TokenTilesGame.abi,
      functionName: "swapTile",
      args: [id, index]
    })
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  console.log(gameData);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {message && (
          <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg text-center">
            {message}
          </div>
        )}

          <div className="w-[500px] mx-auto">
            <button
              onClick={joinGame}
              className="w-full bg-green-200 hover:bg-green-300 text-gray-800 py-2 px-6 rounded-lg transition-colors mb-3"
            >
             Join Game
            </button>
            {isPending && <div className="my-4">Pending...</div>}
            {txHash && (
              <div className="mb-4">
                {txHash}
              </div>
            )}

            {/* Current Game */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              {currentGame ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Current Game #{gameData[0] && gameData[0]?.toString()}</h3>
                    <div className="flex items-center text-orange-400">
                      <Clock className="w-5 h-5 mr-1" />
                      <span className="font-mono">{formatTime(timeLeft)}</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-100 mb-2">🎯 Target Words</h2>
                    <ul className="grid grid-cols-2 gap-2">
                      <li className={`bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-center font-mono text-sm tracking-wide text-white border border-white/20 shadow-sm ${gameData[7] && 'line-through'}`}>
                        {wordList[0]}
                      </li>
                      <li className={`bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-center font-mono text-sm tracking-wide text-white border border-white/20 shadow-sm ${gameData[8] && 'line-through'}`}>
                        {wordList[1]}
                      </li>
                      <li className={`bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-center font-mono text-sm tracking-wide text-white border border-white/20 shadow-sm ${gameData[9] && 'line-through'}`}>
                        {wordList[2]}
                      </li>
                      <li className={`bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg text-center font-mono text-sm tracking-wide text-white border border-white/20 shadow-sm ${gameData[10] && 'line-through'}`}>
                        {wordList[3]}
                      </li>
                    </ul>
                  </div>
                  
                  {playerWords.length > 0 && <div className="text-center mb-6">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 mb-4">
                      <h4 className="text-sm text-gray-300 mb-2">Unscramble this word:</h4>
                      
                      {/* Letter Changes Info */}
                      <div className="text-xs text-yellow-300 mb-3">
                        Changes remaining: {Number(changesRemaining)}
                      </div>
                      
                      {/* Interactive Letter Tiles */}
                      <div className="flex justify-center gap-2 mb-4">
                        {playerLetters.map((letter, index) => (
                          <button
                            key={index}
                            onClick={() => handleLetterClick(index)}
                            disabled={changesRemaining <= 0}
                            className={`
                              w-12 h-12 rounded-lg font-bold text-xl transition-all transform hover:scale-110
                              ${changesRemaining > 0 
                                ? 'bg-white/20 hover:bg-blue-500/50 hover:ring-2 hover:ring-blue-300 text-white cursor-pointer' 
                                : 'bg-gray-500/50 text-gray-400 cursor-not-allowed'
                              }
                            `}
                          >
                            {letter}
                          </button>
                        ))}
                      </div>

                      {/* Instructions */}
                      <div className="text-xs text-gray-300 mb-2">
                        {changesRemaining > 0 
                          ? "Click any letter to change it to a random letter" 
                          : "No more changes available - use reset to start over"
                        }
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-300 mb-4">
                      <span>Token Balance: {formatEther(tokenBalance)} TILE</span>
                      <span>•</span>
                      <span>{currentGame.submissions} players</span>
                    </div>
                  </div>
                  }

                  {playerWords.length > 0 && <div className="space-y-4">
                    <input
                      type="text"
                      value={userInput}
                      onChange={(e) => {
                        const newValue = e.target.value.toUpperCase();
                        setUserInput(newValue);
                        // Update letter arrangement if manually typing
                        if (newValue.length === playerLetters.length) {
                          setPlayerLetters(newValue.split(''));
                        }
                      }}
                      placeholder="Enter your answer or use tiles above..."
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
                  </div>}
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
