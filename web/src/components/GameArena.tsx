/**
 * Game arena component
 * Where players type and race against each other
 */

import React, { useEffect, useRef } from 'react';
import { Timer, PlayerStats, ProgressBar } from './common';

export interface OtherPlayer {
  id: string;
  charsTyped: number;
  correctChars: number;
}

export interface GameArenaProps {
  passage: string;
  playerId: string;
  timeRemaining: number;
  isActive: boolean;
  input: string;
  wpm: number;
  accuracy: number;
  charsTyped: number;
  progress: number;
  otherPlayers: OtherPlayer[];
  onInput: (text: string) => void;
}

export const GameArena: React.FC<GameArenaProps> = ({
  passage,
  playerId,
  timeRemaining,
  isActive,
  input,
  wpm,
  accuracy,
  charsTyped,
  progress,
  otherPlayers,
  onInput,
}) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isActive]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto py-4 px-4">
          <h1 className="text-2xl font-bold text-gray-900">Game in Progress</h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main game area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Timer */}
            <div className="bg-white rounded-lg shadow p-6">
              <Timer seconds={timeRemaining} isActive={isActive} />
            </div>

            {/* Passage display */}
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-lg leading-relaxed text-gray-700 mb-4">
                {passage.split('').map((char, index) => {
                  const isTyped = index < input.length;
                  const isCorrect = isTyped && input[index] === char;

                  return (
                    <span
                      key={index}
                      className={`${
                        !isTyped
                          ? 'text-gray-700'
                          : isCorrect
                            ? 'text-green-600 bg-green-50'
                            : 'text-red-600 bg-red-50'
                      }`}
                    >
                      {char}
                    </span>
                  );
                })}
              </p>

              <ProgressBar progress={progress} label="Passage progress" />
            </div>

            {/* Input field */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Your Input
              </label>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => onInput(e.target.value)}
                disabled={!isActive}
                className={`w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-sm resize-none focus:outline-none ${
                  isActive
                    ? 'focus:border-blue-500 bg-white'
                    : 'bg-gray-100 cursor-not-allowed'
                }`}
                rows={4}
                placeholder={isActive ? 'Start typing...' : 'Waiting for game to start...'}
              />
              <p className="text-xs text-gray-500 mt-2">
                Type the passage above as accurately and quickly as possible.
              </p>
            </div>

            {/* Your stats */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Performance</h3>
              <PlayerStats
                wpm={wpm}
                accuracy={accuracy}
                charsTyped={charsTyped}
                isCurrentPlayer={true}
              />
            </div>
          </div>

          {/* Sidebar: Other players */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Other Players</h3>

              {otherPlayers.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">
                  You're the only player in this game!
                </p>
              ) : (
                <div className="space-y-4">
                  {otherPlayers.map((player, index) => (
                    <div key={player.id} className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Player {index + 1}
                      </p>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">WPM:</span>
                          <span className="text-sm font-bold text-blue-600">
                            {Math.round(
                              ((player.charsTyped / 5) / (Math.max(1, 60 - timeRemaining) / 60))
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-600">Chars:</span>
                          <span className="text-sm font-bold text-purple-600">
                            {player.charsTyped}
                          </span>
                        </div>
                        <div className="w-full bg-gray-300 rounded-full h-1 mt-2">
                          <div
                            className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(
                                100,
                                (player.charsTyped / passage.length) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Game info */}
              <div className="mt-6 p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-900 font-semibold">Game Time</p>
                <p className="text-xs text-blue-700 mt-1">
                  {60 - timeRemaining}s / 60s
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
