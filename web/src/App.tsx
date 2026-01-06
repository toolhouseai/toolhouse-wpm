import { useState } from 'react';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<'home' | 'waiting' | 'game' | 'results'>('home');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4">
          <h1 className="text-3xl font-bold text-gray-900">
            ⌨️ Toolhouse WPM
          </h1>
          <p className="text-gray-600 mt-1">Multiplayer Typing Game</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-12 px-4">
        {currentPage === 'home' && (
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Ready to test your typing speed?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Race against friends in real-time multiplayer typing challenges.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setCurrentPage('waiting')}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Create Room
              </button>
              <button
                onClick={() => setCurrentPage('waiting')}
                className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Join Room
              </button>
            </div>
          </div>
        )}

        {currentPage === 'waiting' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Game Room</h2>
            <div className="mb-6 p-4 bg-gray-100 rounded">
              <p className="text-sm text-gray-600">Room ID</p>
              <p className="text-2xl font-mono font-bold text-gray-900">ABC123</p>
            </div>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Players ({1}/10)</h3>
              <div className="bg-gray-50 rounded p-4">
                <p className="text-gray-600">You (Leader)</p>
              </div>
            </div>
            <button
              onClick={() => setCurrentPage('game')}
              className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
            >
              Start Game
            </button>
            <button
              onClick={() => setCurrentPage('home')}
              className="w-full mt-3 px-6 py-3 bg-gray-300 text-gray-900 font-semibold rounded-lg hover:bg-gray-400 transition"
            >
              Back
            </button>
          </div>
        )}

        {currentPage === 'game' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <div className="mb-8">
              <div className="text-center mb-4">
                <p className="text-4xl font-bold text-blue-600">60</p>
                <p className="text-gray-600">seconds remaining</p>
              </div>
            </div>

            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-700 leading-relaxed">
                The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet.
              </p>
            </div>

            <div className="mb-6">
              <textarea
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg font-mono focus:outline-none focus:border-blue-500"
                rows={4}
                placeholder="Start typing here..."
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded">
                <p className="text-sm text-gray-600">WPM</p>
                <p className="text-2xl font-bold text-blue-600">0</p>
              </div>
              <div className="bg-green-50 p-4 rounded">
                <p className="text-sm text-gray-600">Accuracy</p>
                <p className="text-2xl font-bold text-green-600">0%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded">
                <p className="text-sm text-gray-600">Characters</p>
                <p className="text-2xl font-bold text-purple-600">0</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentPage('results')}
              className="w-full px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition"
            >
              End Game
            </button>
          </div>
        )}

        {currentPage === 'results' && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Final Results</h2>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                <div>
                  <p className="text-sm text-gray-600">1st Place</p>
                  <p className="font-bold text-gray-900">You</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-yellow-600">75 WPM</p>
                  <p className="text-sm text-gray-600">98% accuracy</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentPage('home')}
              className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Play Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
