/**
 * Home / Splash screen component
 */

import React, { useState } from 'react';
import { Button } from './common';
import { useApi } from '../hooks/useApi';

export interface HomeProps {
  onCreateRoom: (roomId: string, wsUrl: string) => void;
  onJoinRoom: (roomId: string, wsUrl: string) => void;
}

export const Home: React.FC<HomeProps> = ({ onCreateRoom, onJoinRoom }) => {
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [roomIdInput, setRoomIdInput] = useState('');
  const { createRoom, joinRoom, loading, error } = useApi();

  const handleCreateRoom = async () => {
    const result = await createRoom();
    if (result) {
      onCreateRoom(result.roomId, result.wsUrl);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const roomId = roomIdInput.toUpperCase();

    if (!/^[A-Z0-9]{6}$/.test(roomId)) {
      alert('Invalid room ID. Please enter a 6-character code.');
      return;
    }

    const result = await joinRoom(roomId);
    if (result) {
      onJoinRoom(result.roomId, result.wsUrl);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">⌨️ Toolhouse WPM</h1>
          <p className="text-2xl text-gray-600 mb-4">Multiplayer Typing Game</p>
          <p className="text-gray-700 text-lg">
            Race against friends in real-time typing challenges. Type fast and accurately!
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">
            {error}
          </div>
        )}

        {/* Main content */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {!showJoinForm ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Get Started
              </h2>

              <div className="space-y-4">
                <Button
                  variant="success"
                  fullWidth
                  onClick={handleCreateRoom}
                  isLoading={loading}
                >
                  Create New Room
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => setShowJoinForm(true)}
                >
                  Join Existing Room
                </Button>
              </div>

              <p className="text-center text-gray-600 text-sm mt-6">
                No account needed. Each session is unique and anonymous.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Join a Room
              </h2>

              <form onSubmit={handleJoinRoom}>
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomIdInput}
                    onChange={(e) => setRoomIdInput(e.target.value.toUpperCase())}
                    placeholder="ABC123"
                    maxLength={6}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-mono text-lg text-center focus:outline-none focus:border-blue-500 tracking-widest"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Enter the 6-character room code shared by your friend
                  </p>
                </div>

                <div className="space-y-3">
                  <Button
                    type="submit"
                    variant="primary"
                    fullWidth
                    isLoading={loading}
                  >
                    Join Room
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setShowJoinForm(false);
                      setRoomIdInput('');
                    }}
                    disabled={loading}
                  >
                    Back
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-1">Real-time</h3>
            <p className="text-sm text-gray-600">Race against players live</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">👥</div>
            <h3 className="font-semibold text-gray-900 mb-1">Multiplayer</h3>
            <p className="text-sm text-gray-600">Up to 10 players per game</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">📊</div>
            <h3 className="font-semibold text-gray-900 mb-1">Instant Results</h3>
            <p className="text-sm text-gray-600">See rankings immediately</p>
          </div>
        </div>
      </div>
    </div>
  );
};
