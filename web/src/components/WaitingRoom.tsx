/**
 * Waiting room component
 * Shows player list and allows leader to start the game
 */

import React, { useEffect, useState } from 'react';
import { Button, RoomIdDisplay, Loading, ErrorAlert } from './common';

export interface Player {
  id: string;
  joinedAt: number;
}

export interface WaitingRoomProps {
  roomId: string;
  playerId: string;
  players: Player[];
  leaderId: string;
  isConnected: boolean;
  onStartGame: () => void;
  onBack: () => void;
  error?: string;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  roomId,
  playerId,
  players,
  leaderId,
  isConnected,
  onStartGame,
  onBack,
  error,
}) => {
  const [copied, setCopied] = useState(false);
  const isLeader = playerId === leaderId;
  const isReady = players.length >= 1 && isConnected;

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900">Connecting to room...</h2>
            <p className="text-gray-600 mt-2">Please wait while we connect you to the game</p>
          </div>
          <Button variant="secondary" fullWidth onClick={onBack}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto py-6 px-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Waiting Room</h1>
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900 text-lg font-semibold"
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4">
        {error && <ErrorAlert message={error} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Room info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <RoomIdDisplay roomId={roomId} onCopy={handleCopyRoomId} />
              {copied && (
                <p className="text-center text-green-600 text-sm font-semibold">
                  Copied to clipboard!
                </p>
              )}
            </div>

            {/* Player list */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Players ({players.length}/10)
              </h2>

              {players.length === 0 ? (
                <p className="text-gray-600 text-center py-8">Waiting for players to join...</p>
              ) : (
                <div className="space-y-3">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${
                        player.id === playerId ? 'bg-blue-50 border-2 border-blue-500' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {player.id === playerId ? 'You' : `Player ${index + 1}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {player.id === leaderId && (
                              <span className="inline-block bg-yellow-200 text-yellow-900 px-2 py-0.5 rounded text-xs font-semibold">
                                Leader
                              </span>
                            )}
                            {player.id === playerId && (
                              <span className="inline-block bg-blue-200 text-blue-900 px-2 py-0.5 rounded text-xs font-semibold ml-2">
                                Current User
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">{formatTime(player.joinedAt)}</p>
                    </div>
                  ))}
                </div>
              )}

              {players.length < 10 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    {10 - players.length} more player{10 - players.length !== 1 ? 's' : ''} can join this room
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right column: Actions */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Game Status</h3>

              {isLeader ? (
                <>
                  <p className="text-sm text-gray-700 mb-4">
                    You are the room leader. You can start the game whenever you're ready.
                  </p>

                  <div className="space-y-3">
                    <Button
                      variant="success"
                      fullWidth
                      onClick={onStartGame}
                      disabled={!isReady}
                    >
                      Start Game
                    </Button>

                    {!isReady && (
                      <p className="text-xs text-gray-600 text-center">
                        At least 1 player needed to start
                      </p>
                    )}

                    <Button variant="secondary" fullWidth onClick={onBack}>
                      Leave Room
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
                    <p className="text-sm text-yellow-900">
                      <span className="font-semibold">Waiting for {players.find(p => p.id === leaderId)?.id || 'leader'}</span> to start
                      the game...
                    </p>
                  </div>

                  <Button variant="secondary" fullWidth onClick={onBack}>
                    Leave Room
                  </Button>
                </>
              )}

              {/* Connection indicator */}
              <div className="mt-6 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-xs text-green-900 font-semibold">✓ Connected</p>
                <p className="text-xs text-green-700">Ready to play</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
