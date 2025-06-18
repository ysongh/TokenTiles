import React, { useState, useEffect, useCallback } from 'react';
import { Shuffle, Trophy, Wallet, Play, CheckCircle, Clock, Star, Coins, Crown, Medal, Award, TrendingUp, Users } from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  address: string;
  displayName: string;
  gamesWon: number;
  totalEarnings: string;
  winRate: number;
  currentStreak: number;
  isCurrentUser?: boolean;
}

  // Mock leaderboard data
  const mockLeaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      address: '0xCryptoMaster2024...',
      displayName: 'CryptoMaster',
      gamesWon: 127,
      totalEarnings: '15.234',
      winRate: 89,
      currentStreak: 12
    },
    {
      rank: 2,
      address: '0xWordWizard1337...',
      displayName: 'WordWizard',
      gamesWon: 98,
      totalEarnings: '12.876',
      winRate: 85,
      currentStreak: 7
    },
    {
      rank: 3,
      address: '0xPuzzlePro9000...',
      displayName: 'PuzzlePro',
      gamesWon: 76,
      totalEarnings: '9.543',
      winRate: 82,
      currentStreak: 4
    },
    {
      rank: 4,
      address: '0x742d35Cc655...',
      displayName: 'You',
      gamesWon: 8,
      totalEarnings: '0.156',
      winRate: 67,
      currentStreak: 3,
      isCurrentUser: true
    },
    {
      rank: 5,
      address: '0xTokenTiger888...',
      displayName: 'TokenTiger',
      gamesWon: 65,
      totalEarnings: '8.221',
      winRate: 78,
      currentStreak: 2
    },
    {
      rank: 6,
      address: '0xScrambleSage...',
      displayName: 'ScrambleSage',
      gamesWon: 54,
      totalEarnings: '6.789',
      winRate: 75,
      currentStreak: 0
    },
    {
      rank: 7,
      address: '0xLetterLord555...',
      displayName: 'LetterLord',
      gamesWon: 43,
      totalEarnings: '5.432',
      winRate: 72,
      currentStreak: 1
    },
    {
      rank: 8,
      address: '0xWordWarrior...',
      displayName: 'WordWarrior',
      gamesWon: 38,
      totalEarnings: '4.567',
      winRate: 69,
      currentStreak: 5
    },
    {
      rank: 9,
      address: '0xAlphabetAce...',
      displayName: 'AlphabetAce',
      gamesWon: 32,
      totalEarnings: '3.891',
      winRate: 65,
      currentStreak: 0
    },
    {
      rank: 10,
      address: '0xVocabVirtuoso...',
      displayName: 'VocabVirtuoso',
      gamesWon: 29,
      totalEarnings: '3.456',
      winRate: 63,
      currentStreak: 2
    }
  ];

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(mockLeaderboard);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-400" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-300" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-400">#{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
       <div className="container mx-auto px-4 py-8">
      {/* Leaderboard Header */}
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-4">
          Leaderboard
        </h2>
        <p className="text-gray-300">Top players in the TokenTiles ecosystem</p>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {leaderboard.slice(0, 3).map((player, index) => (
          <div
            key={player.address}
            className={`bg-gradient-to-br ${
              index === 0 
                ? 'from-yellow-500/20 to-yellow-600/20 border-yellow-400/30' 
                : index === 1
                ? 'from-gray-400/20 to-gray-500/20 border-gray-300/30'
                : 'from-amber-600/20 to-amber-700/20 border-amber-500/30'
            } backdrop-blur-sm rounded-xl p-6 text-center border ${
              player.isCurrentUser ? 'ring-2 ring-blue-400' : ''
            }`}
          >
            <div className="flex justify-center mb-4">
              {getRankIcon(player.rank)}
            </div>
            <h3 className="text-xl font-bold mb-2">
              {player.isCurrentUser ? 'You' : player.displayName}
            </h3>
            <p className="text-gray-400 text-sm mb-4 font-mono">
              {player.address}
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Games Won:</span>
                <span className="font-semibold text-green-400">{player.gamesWon}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Earnings:</span>
                <span className="font-semibold text-yellow-400">{player.totalEarnings} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Win Rate:</span>
                <span className="font-semibold">{player.winRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Streak:</span>
                <span className="font-semibold flex items-center">
                  {player.currentStreak}
                  <Star className="w-4 h-4 ml-1 text-yellow-400" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Full Leaderboard Table */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-400" />
            All Players
          </h3>
          <div className="flex items-center text-gray-300">
            <Users className="w-5 h-5 mr-2" />
            <span>{leaderboard.length} Players</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left py-3 px-4">Rank</th>
                <th className="text-left py-3 px-4">Player</th>
                <th className="text-right py-3 px-4">Games Won</th>
                <th className="text-right py-3 px-4">Total Earnings</th>
                <th className="text-right py-3 px-4">Win Rate</th>
                <th className="text-right py-3 px-4">Current Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player) => (
                <tr
                  key={player.address}
                  className={`border-b border-white/10 hover:bg-white/5 transition-colors ${
                    player.isCurrentUser ? 'bg-blue-500/10 border-blue-400/20' : ''
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center">
                      {getRankIcon(player.rank)}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <div className="font-semibold">
                        {player.isCurrentUser ? 'You' : player.displayName}
                        {player.isCurrentUser && (
                          <span className="ml-2 px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-gray-400 text-sm font-mono">
                        {player.address}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-green-400">{player.gamesWon}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold text-yellow-400">{player.totalEarnings} ETH</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="font-semibold">{player.winRate}%</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end">
                      <span className="font-semibold">{player.currentStreak}</span>
                      <Star className="w-4 h-4 ml-1 text-yellow-400" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
          <h3 className="text-2xl font-bold mb-2">
            {leaderboard.reduce((sum, player) => sum + player.gamesWon, 0)}
          </h3>
          <p className="text-gray-300">Total Games Won</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <Coins className="w-12 h-12 mx-auto mb-4 text-green-400" />
          <h3 className="text-2xl font-bold mb-2">
            {leaderboard.reduce((sum, player) => sum + parseFloat(player.totalEarnings), 0).toFixed(3)} ETH
          </h3>
          <p className="text-gray-300">Total Earnings Distributed</p>
        </div>
        
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-purple-400" />
          <h3 className="text-2xl font-bold mb-2">
            {Math.max(...leaderboard.map(player => player.currentStreak))}
          </h3>
          <p className="text-gray-300">Highest Active Streak</p>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Leaderboard;
