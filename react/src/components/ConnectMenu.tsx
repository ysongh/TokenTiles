import { useNavigate } from "react-router-dom";
import { Shuffle, Wallet } from "lucide-react";
import { DynamicWidget } from "@dynamic-labs/sdk-react-core";
import {
  useAccount,
  useConnect,
  useChains,
  useChainId
} from "wagmi";

import { formatAddress } from '../utils/format';

export function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();
  const chains = useChains();
  const chainId = useChainId();
  const navigate = useNavigate();

  const currentChain = chains.find(chain => chain.id === chainId);

  return (
    <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-xl">
            <Shuffle className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent cursor-pointer"
            onClick={() => navigate("/")}
          >
            TokenTiles
          </h1>
        </div>

        {isConnected ? (
          <div className="flex items-center space-x-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
              <span className="text-sm text-gray-300">Connected: {currentChain ? currentChain.name : 'Not connected'}</span>
              <p className="font-mono text-sm">{formatAddress(address || "")}</p>
            </div>
            <button
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex items-center">
            <button
              onClick={() => connect({ connector: connectors[0] })}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all transform hover:scale-105 disabled:opacity-50 mr-3"
            >
              <Wallet className="w-5 h-5" />
              <span>Connect Wallet</span>
            </button>
            <DynamicWidget />
          </div>
        )}
      </div>
    </div>
  );
}