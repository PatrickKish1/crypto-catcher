"use client"

import React, { useState, useEffect } from 'react';
import { useTheme } from "next-themes";

interface CoinFlipProps {
  difficulty: number; // 0 = EASY, 1 = MEDIUM, 2 = HARD, 3 = EXPERT
  onStateChange: (state: any) => void;
}

interface GameState {
  gameType: number; // 0 = Coin Flip
  score: number;
  level: number;
  tokens: number;
  difficulty: number;
  isPaused: boolean;
  gameData: any;
}

const CoinFlip: React.FC<CoinFlipProps> = ({ difficulty, onStateChange }) => {
  const { theme } = useTheme();
  const [result, setResult] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [tokens, setTokens] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [flipHistory, setFlipHistory] = useState<number[]>([]);
  const [consecutiveWins, setConsecutiveWins] = useState(0);
  const [consecutiveLosses, setConsecutiveLosses] = useState(0);

  // Difficulty multipliers
  const getDifficultyMultiplier = () => {
    switch (difficulty) {
      case 0: return 1.0; // EASY
      case 1: return 1.2; // MEDIUM
      case 2: return 1.5; // HARD
      case 3: return 2.0; // EXPERT
      default: return 1.0;
    }
  };

  // Update game state for roulette
  useEffect(() => {
    const gameState: GameState = {
      gameType: 0, // Coin Flip
      score,
      level,
      tokens,
      difficulty,
      isPaused: false,
      gameData: {
        flipHistory,
        consecutiveWins,
        consecutiveLosses,
        highScore
      }
    };
    onStateChange(gameState);
  }, [score, level, tokens, difficulty, flipHistory, consecutiveWins, consecutiveLosses, highScore, onStateChange]);

  // Load high score from localStorage
  useEffect(() => {
    const savedHighScore = localStorage.getItem('coinflip-highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }
  }, []);

  // Save high score to localStorage
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('coinflip-highscore', score.toString());
    }
  }, [score, highScore]);

  const generateRandomNumber = async () => {
    if (gameOver) return;
    
    setIsFlipping(true);
    setError(null);
    
    try {
      // Simulate VRF randomness (in real implementation, this would call your VRF contract)
      const randomResult = Math.floor(Math.random() * 2) + 1; // 1 = Heads, 2 = Tails
      
      // Add some delay for dramatic effect
      setTimeout(() => {
        setResult(randomResult);
        setIsFlipping(false);
        
        // Update game state
        updateGameState(randomResult);
        
        // Start game if not already started
        if (!gameStarted) {
          setGameStarted(true);
        }
      }, 1500);
      
    } catch (error) {
      console.error("Error in generateRandomNumber:", error);
      setError("Failed to generate random number. Please try again.");
      setIsFlipping(false);
    }
  };

  const updateGameState = (flipResult: number) => {
    // Add to history
    setFlipHistory(prev => [...prev, flipResult]);
    
    // Update consecutive counts
    if (flipResult === 1) { // Heads
      setConsecutiveWins(prev => prev + 1);
      setConsecutiveLosses(0);
    } else { // Tails
      setConsecutiveLosses(prev => prev + 1);
      setConsecutiveWins(0);
    }
    
    // Calculate score based on difficulty and consecutive wins
    const difficultyMultiplier = getDifficultyMultiplier();
    const consecutiveBonus = Math.floor(consecutiveWins / 3) * 0.5; // Bonus every 3 consecutive wins
    const baseScore = 10;
    const finalScore = Math.floor(baseScore * difficultyMultiplier * (1 + consecutiveBonus));
    
    setScore(prev => prev + finalScore);
    setTokens(prev => prev + Math.floor(finalScore / 10));
    
    // Level up every 100 points
    const newLevel = Math.floor((score + finalScore) / 100) + 1;
    if (newLevel > level) {
      setLevel(newLevel);
    }
  };

  const resetGame = () => {
    setScore(0);
    setLevel(1);
    setTokens(0);
    setGameStarted(false);
    setGameOver(false);
    setResult(0);
    setFlipHistory([]);
    setConsecutiveWins(0);
    setConsecutiveLosses(0);
    setError(null);
  };

  const getResultText = () => {
    if (result === 0) return "Ready to Flip!";
    if (result === 1) return "HEADS! 🪙";
    if (result === 2) return "TAILS! 🪙";
    return "Unknown";
  };

  const getResultColor = () => {
    if (result === 0) return "text-gray-400";
    if (result === 1) return "text-green-500";
    if (result === 2) return "text-blue-500";
    return "text-gray-400";
  };

  const getDifficultyColor = () => {
    switch (difficulty) {
      case 0: return "text-green-400"; // EASY
      case 1: return "text-yellow-400"; // MEDIUM
      case 2: return "text-orange-400"; // HARD
      case 3: return "text-red-400"; // EXPERT
      default: return "text-gray-400";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">🪙 Coin Flip</h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
            <span className={`font-bold ${getDifficultyColor()}`}>
              {difficulty === 0 && "Easy"}
              {difficulty === 1 && "Medium"}
              {difficulty === 2 && "Hard"}
              {difficulty === 3 && "Expert"}
            </span>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Multiplier: {getDifficultyMultiplier()}x
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Game Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
            <div className="text-xl font-bold text-gray-800 dark:text-white">{score}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Level</div>
            <div className="text-xl font-bold text-gray-800 dark:text-white">{level}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">Tokens</div>
            <div className="text-xl font-bold text-gray-800 dark:text-white">{tokens}</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">High Score</div>
            <div className="text-xl font-bold text-gray-800 dark:text-white">{highScore}</div>
          </div>
        </div>

        {/* Result Display */}
        <div className="text-center mb-8">
          <div className={`text-6xl font-bold mb-4 ${getResultColor()}`}>
            {getResultText()}
          </div>
          
          {/* Coin Animation */}
          {isFlipping && (
            <div className="text-8xl animate-spin mb-4">🪙</div>
          )}
          
          {!isFlipping && result !== 0 && (
            <div className="text-8xl mb-4 animate-bounce">
              {result === 1 ? "🪙" : "🪙"}
            </div>
          )}
        </div>

        {/* Consecutive Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-100 dark:bg-green-900 rounded-lg p-3 text-center">
            <div className="text-sm text-green-600 dark:text-green-400">Consecutive Wins</div>
            <div className="text-lg font-bold text-green-800 dark:text-green-200">{consecutiveWins}</div>
          </div>
          <div className="bg-red-100 dark:bg-red-900 rounded-lg p-3 text-center">
            <div className="text-sm text-red-600 dark:text-red-400">Consecutive Losses</div>
            <div className="text-lg font-bold text-red-800 dark:text-red-200">{consecutiveLosses}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={generateRandomNumber}
            disabled={isFlipping || gameOver}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl text-lg transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
          >
            {isFlipping ? "🎲 Flipping..." : "🎲 Flip Coin"}
          </button>
          
          {gameStarted && (
            <button
              onClick={resetGame}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
            >
              🔄 Reset Game
            </button>
          )}
        </div>

        {/* Flip History */}
        {flipHistory.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3">Recent Flips</h3>
            <div className="flex flex-wrap gap-2">
              {flipHistory.slice(-10).map((flip, index) => (
                <div
                  key={index}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    flip === 1 
                      ? 'bg-green-500 text-white' 
                      : 'bg-blue-500 text-white'
                  }`}
                >
                  {flip === 1 ? 'H' : 'T'}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Game Instructions */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-2">How to Play:</h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Click "Flip Coin" to generate a random result</li>
            <li>• Consecutive wins earn bonus points</li>
            <li>• Higher difficulty = higher score multipliers</li>
            <li>• Level up every 100 points</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CoinFlip;
