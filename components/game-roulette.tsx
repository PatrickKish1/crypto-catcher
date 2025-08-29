"use client"

import { useEffect, useState, useRef } from "react"
import { useAccount } from 'wagmi'
import { toast } from "sonner"

// Import game components
import CoinFlip from '@/app/coinflip/coinflip-game'
import CryptoGame from '@/components/crypto-game'
import EnhancedCryptoGame from '@/components/enhanced-crypto-game'

// Simplified enums for now
enum GameType {
  COINFLIP_EASY = 0,
  COINFLIP_MEDIUM = 1,
  COINFLIP_HARD = 2,
  CRYPTO_CATCHER_EASY = 3,
  CRYPTO_CATCHER_MEDIUM = 4,
  CRYPTO_CATCHER_HARD = 5,
  ENHANCED_CRYPTO_CATCHER_FREE = 6,
  ENHANCED_CRYPTO_CATCHER_BRONZE = 7,
  ENHANCED_CRYPTO_CATCHER_SILVER = 8,
  ENHANCED_CRYPTO_CATCHER_GOLD = 9,
  ENHANCED_CRYPTO_CATCHER_PLATINUM = 10,
}

enum DifficultyLevel {
  EASY = 0,
  MEDIUM = 1,
  HARD = 2,
  EXPERT = 3,
}

interface RouletteSession {
  sessionId: string
  currentGame: GameType
  currentDifficulty: DifficultyLevel
  isActive: boolean
  gamesPlayed: number
  totalScore: number
}

interface GameState {
  gameType: GameType
  score: number
  level: number
  tokens: number
  difficulty: DifficultyLevel
  isPaused: boolean
  gameData: any
}

const GameRoulette = () => {
  const { isConnected, address } = useAccount()
  
  // Roulette state
  const [currentSession, setCurrentSession] = useState<RouletteSession | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [isRequestingNextGame, setIsRequestingNextGame] = useState(false)
  
  // Game state management
  const [currentGameType, setCurrentGameType] = useState<GameType>(GameType.COINFLIP_EASY)
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>(DifficultyLevel.EASY)
  const [savedGameStates, setSavedGameStates] = useState<Map<GameType, GameState>>(new Map())
  const [gameSwitchEffect, setGameSwitchEffect] = useState(false)
  
  // Refs for game state
  const gameStateRef = useRef<Map<GameType, GameState>>(new Map())
  const countdownRef = useRef<NodeJS.Timeout | null>(null)
  
  // Create new roulette session (simplified - no blockchain)
  const createRouletteSession = async () => {
    if (!isConnected) return toast.error("Please connect your wallet first")
    
    setIsCreatingSession(true)
    try {
      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Create a new session with random initial game
      const initialGame = Math.floor(Math.random() * 11) as GameType
      const initialDifficulty = Math.floor(Math.random() * 4) as DifficultyLevel
      
      const newSession: RouletteSession = {
        sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        currentGame: initialGame,
        currentDifficulty: initialDifficulty,
        isActive: true,
        gamesPlayed: 0,
        totalScore: 0
      }
      
      setCurrentSession(newSession)
      setCurrentGameType(initialGame)
      setCurrentDifficulty(initialDifficulty)
      setTimeRemaining(60)
      
      toast.success("🎰 Roulette session started! Your first game is ready!")
    } catch (error: any) {
      console.error("Failed to create session:", error)
      toast.error("Failed to create roulette session")
    } finally {
      setIsCreatingSession(false)
    }
  }
  
  // Request next game (simplified - no blockchain)
  const triggerGameSwitch = async () => {
    if (!currentSession) return

    setIsRequestingNextGame(true)
    try {
      // Save current game state
      await saveCurrentGameState()

      // Simulate blockchain delay
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Randomly select next game and difficulty
      const nextGame = Math.floor(Math.random() * 11) as GameType
      const nextDifficulty = Math.floor(Math.random() * 4) as DifficultyLevel
      
      // Update session
      setCurrentSession(prev => prev ? {
        ...prev,
        currentGame: nextGame,
        currentDifficulty: nextDifficulty,
        gamesPlayed: prev.gamesPlayed + 1
      } : null)
      
      setCurrentGameType(nextGame)
      setCurrentDifficulty(nextDifficulty)
      setTimeRemaining(60)
      
      // Show game switch effect
      setGameSwitchEffect(true)
      setTimeout(() => setGameSwitchEffect(false), 2000)
      
      toast.success("🎲 Switched to new game!")
    } catch (error: any) {
      console.error("Failed to switch game:", error)
      toast.error("Failed to switch game")
    } finally {
      setIsRequestingNextGame(false)
    }
  }
  
  // Save current game state (simplified - no blockchain)
  const saveCurrentGameState = async () => {
    if (!currentSession) return
    const currentState = gameStateRef.current.get(currentGameType)
    if (!currentState) return

    try {
      // Simulate saving to blockchain
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setSavedGameStates(prev => new Map(prev.set(currentGameType, currentState)))
      console.log('Game state saved:', currentState)
    } catch (error) {
      console.warn('saveGameState failed:', error)
    }
  }
  
  // Countdown timer
  useEffect(() => {
    if (currentSession?.isActive) {
      countdownRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            triggerGameSwitch()
            return 60
          }
          return prev - 1
        })
      }, 1000)
    }
    
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [currentSession])
  
  const getCurrentGameComponent = () => {
    switch (currentGameType) {
      case GameType.COINFLIP_EASY:
      case GameType.COINFLIP_MEDIUM:
      case GameType.COINFLIP_HARD:
        return <CoinFlip difficulty={currentDifficulty} onStateChange={(state) => {
          gameStateRef.current.set(currentGameType, state)
        }} />
      case GameType.CRYPTO_CATCHER_EASY:
      case GameType.CRYPTO_CATCHER_MEDIUM:
      case GameType.CRYPTO_CATCHER_HARD:
        return <CryptoGame difficulty={currentDifficulty} onStateChange={(state) => {
          gameStateRef.current.set(currentGameType, state)
        }} />
      case GameType.ENHANCED_CRYPTO_CATCHER_FREE:
      case GameType.ENHANCED_CRYPTO_CATCHER_BRONZE:
      case GameType.ENHANCED_CRYPTO_CATCHER_SILVER:
      case GameType.ENHANCED_CRYPTO_CATCHER_GOLD:
      case GameType.ENHANCED_CRYPTO_CATCHER_PLATINUM:
        return <EnhancedCryptoGame difficulty={currentDifficulty} onStateChange={(state) => {
          gameStateRef.current.set(currentGameType, state)
        }} />
      default:
        return <div>Unknown game type</div>
    }
  }
  
  const getGameName = (gameType: GameType) => {
    switch (gameType) {
      case GameType.COINFLIP_EASY:
      case GameType.COINFLIP_MEDIUM:
      case GameType.COINFLIP_HARD:
        return "Coin Flip"
      case GameType.CRYPTO_CATCHER_EASY:
      case GameType.CRYPTO_CATCHER_MEDIUM:
      case GameType.CRYPTO_CATCHER_HARD:
        return "Crypto Catcher"
      case GameType.ENHANCED_CRYPTO_CATCHER_FREE:
      case GameType.ENHANCED_CRYPTO_CATCHER_BRONZE:
      case GameType.ENHANCED_CRYPTO_CATCHER_SILVER:
      case GameType.ENHANCED_CRYPTO_CATCHER_GOLD:
      case GameType.ENHANCED_CRYPTO_CATCHER_PLATINUM:
        return "Enhanced Crypto Catcher"
      default:
        return "Unknown Game"
    }
  }
  
  const getDifficultyName = (difficulty: DifficultyLevel) => {
    switch (difficulty) {
      case DifficultyLevel.EASY: return "Easy"
      case DifficultyLevel.MEDIUM: return "Medium"
      case DifficultyLevel.HARD: return "Hard"
      case DifficultyLevel.EXPERT: return "Expert"
      default: return "Unknown"
    }
  }
  
  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">🎰 Game Roulette</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Connect your wallet to experience unpredictable game switching!
        </p>
        <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-2">🔗 Wallet Required</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Game Roulette requires wallet connection to access VRF randomness and blockchain features.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/20">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-center mb-2">🎰 Game Roulette</h1>
          <p className="text-center text-blue-200">
            Experience unpredictable game switching powered by VRF randomness!
          </p>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* Session Management */}
        {!currentSession ? (
          <div className="text-center py-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold mb-4">🎮 Start Your Roulette Adventure</h2>
              <p className="text-blue-200 mb-6">
                Every 60 seconds, VRF will randomly pick your next game and difficulty level!
              </p>
              <button
                onClick={createRouletteSession}
                disabled={isCreatingSession}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50"
              >
                {isCreatingSession ? "🎲 Creating Session..." : "🎰 Start Roulette"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Game Info Panel */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                  <h3 className="text-lg font-bold text-blue-200">Current Game</h3>
                  <p className="text-2xl font-bold">{getGameName(currentGameType)}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-200">Difficulty</h3>
                  <p className="text-2xl font-bold">{getDifficultyName(currentDifficulty)}</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-200">Time Left</h3>
                  <p className="text-2xl font-bold text-yellow-400">{timeRemaining}s</p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-blue-200">Games Played</h3>
                  <p className="text-2xl font-bold">{currentSession.gamesPlayed}</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="bg-white/20 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-red-500 h-full transition-all duration-1000 ease-linear"
                    style={{ width: `${((60 - timeRemaining) / 60) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            
            {/* Game Switch Effect */}
            {gameSwitchEffect && (
              <div className="fixed inset-0 bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center z-50 animate-pulse">
                <div className="text-center">
                  <h2 className="text-6xl font-bold mb-4">🎲</h2>
                  <p className="text-2xl font-bold">Switching Games...</p>
                  <p className="text-lg text-blue-200">VRF is selecting your next challenge!</p>
                </div>
              </div>
            )}
            
            {/* Current Game */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6">
              <div className="mb-4 flex justify-between items-center">
                <h2 className="text-2xl font-bold">
                  🎮 {getGameName(currentGameType)} - {getDifficultyName(currentDifficulty)}
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={triggerGameSwitch}
                    disabled={isRequestingNextGame || timeRemaining > 0}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    {isRequestingNextGame ? "🎲 Requesting..." : "🎲 Switch Now"}
                  </button>
                </div>
              </div>
              
              {/* Game Component */}
              <div className="min-h-[600px]">
                {getCurrentGameComponent()}
              </div>
            </div>
            
            {/* Session Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mt-8">
              <h3 className="text-xl font-bold mb-4 text-center">📊 Session Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-blue-200">Total Score</p>
                  <p className="text-2xl font-bold">{currentSession.totalScore}</p>
                </div>
                <div>
                  <p className="text-blue-200">Games Completed</p>
                  <p className="text-2xl font-bold">{currentSession.gamesPlayed}</p>
                </div>
                <div>
                  <p className="text-blue-200">Status</p>
                  <p className="text-2xl font-bold text-green-400">🎯 Active</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default GameRoulette
