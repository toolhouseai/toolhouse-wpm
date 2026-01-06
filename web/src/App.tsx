import { useState, useEffect } from 'react';
import { Home } from './components/Home';
import { WaitingRoom } from './components/WaitingRoom';
import { GameArena } from './components/GameArena';
import { Leaderboard } from './components/Leaderboard';
import { useGameRoom } from './hooks/useGameRoom';
import { useTyping } from './hooks/useTyping';
import type { Passage } from './hooks/useApi';
import './App.css';

type PageType = 'home' | 'waiting' | 'game' | 'results';

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('home');
  const [roomId, setRoomId] = useState<string>('');
  const [wsUrl, setWsUrl] = useState<string>('');
  const [passage, setPassage] = useState<Passage | null>(null);

  // Game room hook for multiplayer state
  const gameRoom = useGameRoom({
    roomId,
    wsUrl,
  });

  // Typing progress tracking
  const typing = useTyping({
    passage: passage?.text || '',
    isActive: gameRoom.gameState === 'active',
    elapsedSeconds: 60 - gameRoom.timeRemaining,
    onUpdateStats: (stats) => {
      // Update typing stats when they change
      if (gameRoom.gameState === 'active') {
        gameRoom.updateTyping(stats.charsTyped, stats.correctChars);
      }
    },
  });

  /**
   * Handle room creation
   */
  const handleCreateRoom = (newRoomId: string, newWsUrl: string, newPassage: Passage) => {
    setRoomId(newRoomId);
    setWsUrl(newWsUrl);
    setPassage(newPassage);
    setCurrentPage('waiting');
  };

  /**
   * Handle joining existing room
   */
  const handleJoinRoom = (newRoomId: string, newWsUrl: string, newPassage: Passage) => {
    setRoomId(newRoomId);
    setWsUrl(newWsUrl);
    setPassage(newPassage);
    setCurrentPage('waiting');
  };

  /**
   * Handle game start
   */
  const handleStartGame = () => {
    gameRoom.startGame();
    typing.reset();
    setCurrentPage('game');
  };

  /**
   * Handle game state transitions
   */
  useEffect(() => {
    // Transition from waiting to game when game starts (for non-leader players)
    if (gameRoom.gameState === 'active' && currentPage === 'waiting') {
      typing.reset();
      setCurrentPage('game');
    }

    // Transition from game to results when game ends
    if (gameRoom.gameState === 'completed' && currentPage === 'game') {
      setCurrentPage('results');
    }
  }, [gameRoom.gameState, currentPage, typing]);

  /**
   * Handle play again
   */
  const handlePlayAgain = () => {
    setCurrentPage('waiting');
    typing.reset();
    gameRoom.playerId && gameRoom.updateTyping(0, 0);
  };

  /**
   * Handle back to home
   */
  const handleBackHome = () => {
    setCurrentPage('home');
    setRoomId('');
    setWsUrl('');
    setPassage(null);
    typing.reset();
  };

  return (
    <>
      {currentPage === 'home' && (
        <Home onCreateRoom={handleCreateRoom} onJoinRoom={handleJoinRoom} />
      )}

      {currentPage === 'waiting' && (
        <WaitingRoom
          roomId={roomId}
          playerId={gameRoom.playerId || ''}
          players={gameRoom.players}
          leaderId={gameRoom.leaderId || ''}
          isConnected={gameRoom.isConnected}
          onStartGame={handleStartGame}
          onBack={handleBackHome}
          error={gameRoom.error || undefined}
        />
      )}

      {currentPage === 'game' && passage && (
        <GameArena
          passage={passage.text}
          playerId={gameRoom.playerId || ''}
          timeRemaining={gameRoom.timeRemaining}
          isActive={gameRoom.gameState === 'active'}
          input={typing.input}
          wpm={typing.wpm}
          accuracy={typing.accuracy}
          charsTyped={typing.charsTyped}
          progress={typing.progress}
          otherPlayers={gameRoom.players
            .filter(p => p.id !== gameRoom.playerId)
            .map(p => ({
              id: p.id,
              charsTyped: p.charsTyped,
              correctChars: p.correctChars,
            }))}
          onInput={typing.handleInputChange}
        />
      )}

      {currentPage === 'results' && (
        <Leaderboard
          results={gameRoom.results}
          currentPlayerId={gameRoom.playerId || ''}
          totalPlayers={gameRoom.players.length}
          onPlayAgain={handlePlayAgain}
          onHome={handleBackHome}
        />
      )}
    </>
  );
}

export default App;
