import React, { useState } from "react";
import { HelpCircle, Users, Target, Coins, RefreshCw, X } from "lucide-react";

interface GameRulesPopupProps {
  children?: React.ReactNode;
}

const GameRulesPopup: React.FC<GameRulesPopupProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div onClick={() => setIsOpen(true)}>
        {children || (
          <button className="inline-flex items-center gap-2 h-11 rounded-md px-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer">
            <HelpCircle className="h-7 w-7" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 mt-[100px]">
          <div className="bg-gradient-to-br from-purple-900/95 to-blue-900/95 backdrop-blur-lg border border-white/20 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <div className="bg-orange-500 p-2 rounded-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                How to Play
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6 text-white">
              {/* Starting Setup */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-500 p-2 rounded-full">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Starting Setup</h3>
                </div>
                <p className="text-white/80 leading-relaxed">
                  Each player starts with <span className="font-semibold text-white">7 letter tiles</span> to begin their word-building journey.
                </p>
              </div>

              {/* Target Words */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-500 p-2 rounded-full">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Target Words</h3>
                </div>
                <p className="text-white/80 leading-relaxed">
                  Game creators define a target word list with words ranging from <span className="font-semibold text-white">3 to 6 letters</span>. These are the words you'll be trying to form!
                </p>
              </div>

              {/* Tile Swapping */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-500 p-2 rounded-full">
                    <RefreshCw className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Tile Swapping</h3>
                </div>
                <p className="text-white/80 leading-relaxed">
                  Players can <span className="font-semibold text-white">swap one letter tile</span> with a random tile to get new letter combinations and improve their chances of forming target words.
                </p>
              </div>

              {/* Earning Rewards */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-orange-500 p-2 rounded-full">
                    <Coins className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Earning Rewards</h3>
                </div>
                <p className="text-white/80 leading-relaxed">
                  Players earn <span className="font-semibold text-white">token rewards</span> by submitting valid target words they can form from their tiles. The more words you find, the more tokens you earn!
                </p>
              </div>

              {/* One-Time Claims */}
              <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <h3 className="text-lg font-semibold text-white mb-2">⚠️ Important Rule</h3>
                <p className="text-white/80 leading-relaxed">
                  Each target word can only be <span className="font-semibold text-white">claimed once</span>. First come, first served - so think fast and submit quickly!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GameRulesPopup;
