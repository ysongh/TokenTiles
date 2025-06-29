import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWriteContract } from "wagmi";

import TokenTilesGame from "../artifacts/contracts/TokenTilesGame.sol/TokenTilesGame.json";

interface GameFormData {
  word3: string;
  word4: string;
  word5: string;
  word6: string;
}

const CreateWords: React.FC = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [gameForm, setGameForm] = useState<GameFormData>({
    word3: '',
    word4: '',
    word5: '',
    word6: ''
  });

    const {
      writeContract,
      data: txHash,
      isPending
    } = useWriteContract();

  const handleFormChange = (field: keyof GameFormData, value: string) => {
    setGameForm((prev) => ({
      ...prev,
      [field]: value
    }));
  };
    

  const createGame = () => {
    const { word3, word4, word5, word6 } = gameForm;
    
    // Validate form
    if (!word3 || !word4 || !word5 || !word6) {
      setMessage('Please provide words for all difficulty levels (3, 4, 5, and 6 letters)');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (word3.length !== 3 || word4.length !== 4 || word5.length !== 5 || word6.length !== 6) {
      setMessage('Each word must be exactly the specified number of letters');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsLoading(true);

    writeContract({
      address: import.meta.env.VITE_TOKENTILESGAME,
      abi: TokenTilesGame.abi,
      functionName: "createWordList",
      args: [word3, word4, word5, word6],
    })

    // Simulate blockchain transaction for game creation
    setTimeout(() => {
      // Reset form
      setGameForm({
        word3: '',
        word4: '',
        word5: '',
        word6: ''
      });
      
      setIsLoading(false);
      setMessage(`Successfully created 4 games with different difficulty levels!`);
      setTimeout(() => setMessage(''), 4000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {message && (
          <div className="mb-6 p-4 bg-blue-600/20 border border-blue-500/30 rounded-lg text-center">
            {message}
          </div>
        )}
        <div className="flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-8 max-w-2xl w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Create Custom Game</h2>
              </div>

              <div className="space-y-6">
                <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg p-4">
                  <p className="text-sm text-blue-200">
                    Create a game with four words of different lengths (3, 4, 5, and 6 letters). 
                    Players will get separate games for each difficulty level with the same entry fee and time limit.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">3-Letter Word</label>
                    <input
                      type="text"
                      value={gameForm.word3}
                      onChange={(e) => handleFormChange('word3', e.target.value.toUpperCase())}
                      placeholder="CAT"
                      maxLength={3}
                      className={`w-full px-4 py-3 bg-white/20 rounded-lg border ${
                        gameForm.word3
                          ? 'border-red-500' 
                          : 'border-white/30'
                      } text-center font-mono text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {gameForm.word3 && gameForm.word3.length !== 3 && (
                      <p className="text-red-400 text-xs mt-1">Must be exactly 3 letters</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">4-Letter Word</label>
                    <input
                      type="text"
                      value={gameForm.word4}
                      onChange={(e) => handleFormChange('word4', e.target.value.toUpperCase())}
                      placeholder="WORD"
                      maxLength={4}
                      className={`w-full px-4 py-3 bg-white/20 rounded-lg border ${
                        gameForm.word4
                          ? 'border-red-500' 
                          : 'border-white/30'
                      } text-center font-mono text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {gameForm.word4 && gameForm.word4.length !== 4 && (
                      <p className="text-red-400 text-xs mt-1">Must be exactly 4 letters</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">5-Letter Word</label>
                    <input
                      type="text"
                      value={gameForm.word5}
                      onChange={(e) => handleFormChange('word5', e.target.value.toUpperCase())}
                      placeholder="GAMES"
                      maxLength={5}
                      className={`w-full px-4 py-3 bg-white/20 rounded-lg border ${
                        gameForm.word5
                          ? 'border-red-500' 
                          : 'border-white/30'
                      } text-center font-mono text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {gameForm.word5 && gameForm.word5.length !== 5 && (
                      <p className="text-red-400 text-xs mt-1">Must be exactly 5 letters</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">6-Letter Word</label>
                    <input
                      type="text"
                      value={gameForm.word6}
                      onChange={(e) => handleFormChange('word6', e.target.value.toUpperCase())}
                      placeholder="PUZZLE"
                      maxLength={6}
                      className={`w-full px-4 py-3 bg-white/20 rounded-lg border ${
                        gameForm.word6
                          ? 'border-red-500' 
                          : 'border-white/30'
                      } text-center font-mono text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                    {gameForm.word6 && gameForm.word6.length !== 6 && (
                      <p className="text-red-400 text-xs mt-1">Must be exactly 6 letters</p>
                    )}
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                   onClick={() => navigate("/")}
                    className="flex-1 bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createGame}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      'Create Games'
                    )}
                  </button>
                </div>

                {isPending && <div className="my-4">Pending...</div>}
                {txHash && (
                  <div className="mb-4">
                    {txHash}
                  </div>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
};

export default CreateWords;