/**
 * Leaderboard / Results component
 * Shows final game results and rankings
 */

import React from 'react';
import { Button } from './common';

export interface GameResult {
  playerId: string;
  wpm: number;
  accuracy: number;
  charsTyped: number;
  placement: number;
}

export interface LeaderboardProps {
  results: GameResult[];
  currentPlayerId: string;
  totalPlayers: number;
  onPlayAgain: () => void;
  onHome: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  results,
  currentPlayerId,
  totalPlayers,
  onPlayAgain,
  onHome,
}) => {
  const sortedResults = [...results].sort((a, b) => a.placement - b.placement);
  const currentPlayerResult = sortedResults.find(r => r.playerId === currentPlayerId);
  const isWinner = currentPlayerResult?.placement === 1;

  const getMedalEmoji = (placement: number) => {
    switch (placement) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '▪️';
    }
  };

  const getPlacementColor = (placement: number) => {
    switch (placement) {
      case 1:
        return 'bg-yellow-50 border-yellow-300';
      case 2:
        return 'bg-gray-50 border-gray-300';
      case 3:
        return 'bg-orange-50 border-orange-300';
      default:
        return 'bg-white border-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {isWinner ? '🎉 You Won!' : 'Game Results'}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4">
        {/* Winner banner */}
        {isWinner && (
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-lg p-8 mb-8 text-center">
            <p className="text-5xl mb-4">🏆</p>
            <h2 className="text-3xl font-bold text-white mb-2">You're the Champion!</h2>
            <p className="text-yellow-100 text-lg">
              Fastest typing speed of the game
            </p>
          </div>
        )}

        {/* Results table */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b-2 border-gray-300">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    Placement
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                    Player
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                    WPM
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                    Accuracy
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                    Characters
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedResults.map((result, index) => (
                  <tr
                    key={result.playerId}
                    className={`border-b border-gray-200 ${
                      result.placement === 1 ? 'bg-yellow-50' : ''
                    } ${result.playerId === currentPlayerId ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getMedalEmoji(result.placement)}</span>
                        <span className="text-lg font-bold text-gray-900">
                          #{result.placement}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                          {result.placement}
                        </div>
                        <span className="font-semibold text-gray-900">
                          {result.playerId === currentPlayerId ? 'You' : `Player ${result.placement}`}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-blue-600">
                        {Math.round(result.wpm)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-green-600">
                        {result.accuracy.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-lg font-bold text-purple-600">
                        {result.charsTyped}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Your stats highlight */}
        {currentPlayerResult && (
          <div className="bg-white rounded-lg shadow p-6 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Your Final Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Final WPM</p>
                <p className="text-4xl font-bold text-blue-600 mt-2">
                  {Math.round(currentPlayerResult.wpm)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Accuracy</p>
                <p className="text-4xl font-bold text-green-600 mt-2">
                  {currentPlayerResult.accuracy.toFixed(1)}%
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600 font-semibold">Characters</p>
                <p className="text-4xl font-bold text-purple-600 mt-2">
                  {currentPlayerResult.charsTyped}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-2">Game Summary</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Total Players: {totalPlayers}</li>
            <li>✓ Game Duration: 60 seconds</li>
            <li>
              ✓ Your Placement: {currentPlayerResult?.placement} of {totalPlayers}
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button variant="success" fullWidth onClick={onPlayAgain}>
            Play Again
          </Button>
          <Button variant="secondary" fullWidth onClick={onHome}>
            Back to Home
          </Button>
        </div>
      </main>
    </div>
  );
};
