import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useAccount, useBlockNumber, useReadContract, useWriteContract, useWalletClient, usePublicClient } from "wagmi";
import { ethers } from "ethers";
import { formatEther } from "viem";
import { sdk } from '@farcaster/frame-sdk';
import { Randomness } from "randomness-js";

import GameRulesPopup from '../components/GameRulesPopup';
import ViewTransaction from '../components/ViewTransaction';

import TileTokenERC20 from "../artifacts/contracts/TileTokenERC20.sol/TileTokenERC20.json";
import TokenTilesGame from "../artifacts/contracts/TokenTilesGame.sol/TokenTilesGame.json";

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

const TokenTiles: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { address, connector } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const publicClient = usePublicClient();

  const [userInput, setUserInput] = useState('');

  const [isLoading] = useState(false);

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


  const { data: submittedWords = [], refetch: submittedWordsRefetch } = useReadContract({
    address: import.meta.env.VITE_TOKENTILESGAME,
    abi: TokenTilesGame.abi,
    functionName: 'getPlayerWords',
    args: [id, address]
  }) as { data: any, refetch: () => void };

  const {
    writeContract,
    data: txHash,
    isPending
  } = useWriteContract();

  // Initialize player letters from contract data
  useEffect(() => {
    if (playerWords && playerWords.length > 0) {
      // @ts-ignore
      const letters = playerWords.map((p: BigInt) => numberToLetter[Number(p) + 1]);
      setPlayerLetters(letters);
    }
  }, [playerWords]);

  useEffect(() => {
    wordListRefetch();
    changesRemainingRefetch();
    submittedWordsRefetch();
  }, [blockNumber])

  const requestRandomness = async () => {
    const callbackGasLimit = 700_000;
    const jsonProvider = new ethers.JsonRpcProvider(publicClient?.transport?.url);
    const randomness = Randomness.createBaseSepolia(jsonProvider);
    console.log(randomness);
    // const response = await randomness.requestRandomness();
    // console.log(response);
    const [requestCallBackPrice] = await randomness.calculateRequestPriceNative(BigInt(callbackGasLimit));
    console.log(requestCallBackPrice);

    writeContract({
      address: import.meta.env.VITE_TOKENTILESGAME,
      abi: TokenTilesGame.abi,
      functionName: 'generateWithDirectFunding',
      args: [callbackGasLimit],
      value: requestCallBackPrice,
    })
  }

  const joinGame = () => {
    writeContract({
      address: import.meta.env.VITE_TOKENTILESGAME,
      abi: TokenTilesGame.abi,
      functionName: "joinGame",
      args: [id]
    })
  }

  const submitAnswer = () => {
    if (!userInput.trim()) return;

    writeContract({
      address: import.meta.env.VITE_TOKENTILESGAME,
      abi: TokenTilesGame.abi,
      functionName: "submitWord",
      args: [id, userInput],
    })
  };

  const handleLetterClick = (index: number) => {
    writeContract({
      address: import.meta.env.VITE_TOKENTILESGAME,
      abi: TokenTilesGame.abi,
      functionName: "swapTile",
      args: [id, index]
    })
  };

  const handleComposeCast = async () => {
    try {
      const result = await sdk.actions.composeCast({
        text: 'Check out my mini app🎉',
        embeds: ["https://tokentiles.netlify.app/#/game/" + id],
        // Optional: parent cast reference
        // parent: { type: 'cast', hash: '0xabc123...' },
        // Optional: close the app after composing
        // close: true,
      });
  
      if (result) {
        console.log('Cast composed:', result.cast);
      } else {
        console.log('Cast composition was closed or canceled.');
      }
    } catch (error) {
      console.error('Error composing cast:', error);
    }
  };

  // const formatTime = (seconds: number) => {
  //   const mins = Math.floor(seconds / 60);
  //   const secs = seconds % 60;
  //   return `${mins}:${secs.toString().padStart(2, '0')}`;
  // };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
          {isPending && <div className="my-4">Pending...</div>}
          {txHash && (
            <ViewTransaction txHash={txHash} />
          )}
          
          <div className="max-w-2xl mx-auto mt-4">
            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-gray-400 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors mb-3"
            >
              Back
            </button>

            <button
              onClick={requestRandomness}
              className="flex-1 bg-gray-400 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors mb-3"
            >
              Request randomness
            </button>
            
            {/* Current Game */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold">Current Game #{gameData[0] && gameData[0]?.toString()}</h3>
                  <div className="flex items-center text-yellow-400">
                    <GameRulesPopup />
                    {/* <span className="font-mono">{formatTime(timeLeft)}</span> */}
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
                    <span>{Number(gameData[3])} players</span>
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

                {submittedWords.length > 0 && (
                  <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-100 mb-3">✅ Your Submitted Words</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {submittedWords.map((word: string, index: number) => (
                        <div 
                          key={index} 
                          className={`border px-3 py-2 rounded-lg text-center font-mono text-sm tracking-wide ${word === wordList[0] || word === wordList[1] || word === wordList[2] || word === wordList[3]
                              ? 'bg-green-500/20 border-green-400/30 text-green-200'
                              : 'bg-red-500/20 border-red-400/30 text-red-200'}`}
                        >
                          {word}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {playerWords.length === 0 && <button
              onClick={joinGame}
              className="w-full mt-3 bg-green-200 hover:bg-green-300 text-gray-800 py-2 px-6 rounded-lg transition-colors mb-3"
            >
             Join Game
            </button>}
            <button
              onClick={handleComposeCast}
              className="w-full py-2 px-4 my-2 bg-green-600 text-white font-medium rounded hover:bg-green-700"
            >
              Share on Farcaster 🚀
            </button>
          </div>
      </div>
    </div>
  );
};

export default TokenTiles;