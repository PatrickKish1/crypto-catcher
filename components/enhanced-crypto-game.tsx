"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from 'wagmi'
import { ethers } from 'ethers'
import { Randomness } from 'randomness-js'
import { tokens, difficultyLevels, type Token } from "@/lib/lib/config/token"
import { saveTokenScore, getTokenScores } from "@/lib/lib/cookies"
import { toast } from "sonner"

import { ENHANCED_CONTRACTS } from '@/lib/enhanced-contracts'
const RANDOMNESS_CONTRACT_ADDRESS = ENHANCED_CONTRACTS.RANDOMNESS
const RANDOMNESS_CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint32",
        "name": "callbackGasLimit",
        "type": "uint32"
      }
    ],
    "name": "generateWithDirectFunding",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "randomness",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const

interface GameSession {
  sessionId: string
  sessionType: 'FREE' | 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  isActive: boolean
  seedReceived: boolean
  levelChangeThresholds: number[]
  currentLevelIndex: number
  vrfMultiplier: number
  isSealed: boolean
}

interface UserProfile {
  username: string
  isRegistered: boolean
  level: number
  totalScore: number
  gamesPlayed: number
  achievements: number[]
}

const EnhancedCryptoGame = () => {
  const { isConnected, address } = useAccount()
  const { theme } = useTheme()
  
  // Game state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tokenImagesRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [selectedToken, setSelectedToken] = useState<Token>(tokens[0])
  const [difficulty, setDifficulty] = useState(difficultyLevels[0])
  const [gameOver, setGameOver] = useState(false)
  const [highScore, setHighScore] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const [tokenScores, setTokenScores] = useState(getTokenScores())
  
  // Enhanced features
  const [gameMode, setGameMode] = useState<'CLASSIC' | 'VRF_ENHANCED'>('VRF_ENHANCED')
  const [currentSession, setCurrentSession] = useState<GameSession | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [nextLevelThreshold, setNextLevelThreshold] = useState<number | null>(null)
  const [currentGameLevel, setCurrentGameLevel] = useState(1)
  const [levelChangeEffect, setLevelChangeEffect] = useState(false)
  
  // VRF contract integration
  const { writeContract, data: hash, isPending } = useWriteContract()
  const { isLoading: isTransactionLoading, isSuccess: isTransactionSuccess } = useWaitForTransactionReceipt({
    hash,
  })
  
  const { data: vrfRandomness, refetch: refetchVRF } = useReadContract({
    address: RANDOMNESS_CONTRACT_ADDRESS,
    abi: RANDOMNESS_CONTRACT_ABI,
    functionName: 'randomness',
  })

  // Session type configurations
  const sessionConfigs = {
    FREE: { entryFee: 0, baseMultiplier: 100, maxLevelChanges: 2, color: 'gray' },
    BRONZE: { entryFee: 0.001, baseMultiplier: 120, maxLevelChanges: 3, color: 'orange' },
    SILVER: { entryFee: 0.005, baseMultiplier: 150, maxLevelChanges: 4, color: 'gray' },
    GOLD: { entryFee: 0.01, baseMultiplier: 200, maxLevelChanges: 5, color: 'yellow' },
    PLATINUM: { entryFee: 0.025, baseMultiplier: 300, maxLevelChanges: 7, color: 'purple' },
  }

  // Load images when component mounts
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = tokens.map((token) => {
        return new Promise<[string, HTMLImageElement]>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve([token.symbol, img])
          img.onerror = reject
          img.src = token.imageUrl.replace('/public', '')
        })
      })

      try {
        const loadedImages = await Promise.all(imagePromises)
        loadedImages.forEach(([symbol, img]) => {
          tokenImagesRef.current.set(symbol, img)
        })
        setImagesLoaded(true)
      } catch (error) {
        console.error('Error loading images:', error)
        setImagesLoaded(true)
      }
    }

    loadImages()
  }, [])

  // Create VRF-enhanced game session
  const createVRFSession = async (sessionType: keyof typeof sessionConfigs) => {
    if (!isConnected) {
      toast.error("Please connect your wallet first")
      return
    }

    setIsCreatingSession(true)
    
    try {
      const callbackGasLimit = 700_000
      const jsonProvider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`)
      const randomness = Randomness.createBaseSepolia(jsonProvider)
      const [requestCallBackPrice] = await randomness.calculateRequestPriceNative(BigInt(callbackGasLimit))
      
      const config = sessionConfigs[sessionType]
      const totalCost = requestCallBackPrice + BigInt(ethers.parseEther(config.entryFee.toString()))

      writeContract({
        address: RANDOMNESS_CONTRACT_ADDRESS,
        abi: RANDOMNESS_CONTRACT_ABI,
        functionName: 'generateWithDirectFunding',
        args: [callbackGasLimit],
        value: totalCost,
      })

      toast.success("VRF session creation initiated!")
      
    } catch (error) {
      console.error('VRF session creation failed:', error)
      toast.error("Failed to create VRF session")
      setIsCreatingSession(false)
    }
  }

  // Handle VRF transaction success
  useEffect(() => {
    if (isTransactionSuccess && vrfRandomness) {
      // Generate session parameters from VRF
      const randomBytes = ethers.getBytes(vrfRandomness.toString())
      const sessionSeed = ethers.keccak256(randomBytes)
      
      // Generate level change thresholds
      const thresholds: number[] = []
      for (let i = 0; i < 5; i++) {
        const threshold = 100 * (i + 1) + (parseInt(sessionSeed.slice(2 + i * 2, 4 + i * 2), 16) % (200 * (i + 1)))
        thresholds.push(threshold)
      }
      
      // Create session
      const newSession: GameSession = {
        sessionId: `vrf-${Date.now()}`,
        sessionType: 'BRONZE', // Default for now
        isActive: true,
        seedReceived: true,
        levelChangeThresholds: thresholds,
        currentLevelIndex: 0,
        vrfMultiplier: 120, // Base Bronze multiplier
        isSealed: false
      }
      
      setCurrentSession(newSession)
      setNextLevelThreshold(thresholds[0])
      setIsCreatingSession(false)
      setGameMode('VRF_ENHANCED')
      
      toast.success("VRF session created! Level thresholds generated.")
      
      // Auto-start the game
      setGameStarted(true)
      
    }
  }, [isTransactionSuccess, vrfRandomness])

  // Enhanced game logic with VRF features
  useEffect(() => {
    if (!imagesLoaded) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const gameState = {
      walletX: canvas.width / 2 - 40,
      coins: [] as { x: number; y: number; token: Token; rotation: number }[],
      animationFrameId: 0
    }

    const drawWallet = () => {
      if (!ctx) return
      const walletImg = new Image()
      walletImg.src = '/assets/images/wallet.svg'
      ctx.drawImage(walletImg, gameState.walletX, canvas.height - 80, 80, 80)
    }

    const drawCoin = (x: number, y: number, token: Token, rotation: number) => {
      if (!ctx) return

      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(rotation)

      ctx.beginPath()
      ctx.arc(0, 0, 30, 0, Math.PI * 2)
      ctx.clip()

      const tokenImage = tokenImagesRef.current.get(token.symbol)
      if (tokenImage) {
        ctx.drawImage(tokenImage, -30, -30, 60, 60)
        
        if (token.isObstacle) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'
          ctx.fillRect(-30, -30, 60, 60)
        }
      } else {
        ctx.fillStyle = token.isObstacle ? '#EF4444' : '#F7931A'
        ctx.fill()
        
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 16px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(token.symbol.substring(0, 2), 0, 0)
      }

      ctx.restore()
    }

    const spawnCoin = () => {
      // Enhanced spawn logic based on game mode and level
      const baseMaxCoins = 6
      let difficultyMultiplier = difficulty.name === "Easy" ? 1 : 
                                 difficulty.name === "Medium" ? 1.2 : 
                                 difficulty.name === "Hard" ? 1.5 : 1.8
      
      // Apply VRF level multiplier if in enhanced mode
      if (gameMode === 'VRF_ENHANCED' && currentSession) {
        difficultyMultiplier *= (1 + (currentGameLevel - 1) * 0.3) // Increase difficulty with level
      }
      
      const maxCoinsOnScreen = Math.floor(baseMaxCoins * difficultyMultiplier)
      
      if (gameState.coins.length >= maxCoinsOnScreen) {
        return
      }

      let spawnRate = difficulty.spawnRate
      if (gameMode === 'VRF_ENHANCED') {
        spawnRate *= (1 + currentGameLevel * 0.1) // Increase spawn rate with level
      }

      if (Math.random() < spawnRate) {
        const randomToken = Math.random() < 0.8
          ? selectedToken
          : tokens.filter((t) => t.isObstacle)[Math.floor(Math.random() * tokens.filter((t) => t.isObstacle).length)]

        gameState.coins.push({
          x: Math.random() * (canvas.width - 60) + 30,
          y: -20,
          token: randomToken,
          rotation: 0,
        })
      }
    }

    const updateCoins = () => {
      for (let i = gameState.coins.length - 1; i >= 0; i--) {
        const coin = gameState.coins[i]
        
        // Enhanced speed based on current level
        let coinSpeed = difficulty.speed
        if (gameMode === 'VRF_ENHANCED') {
          coinSpeed *= (1 + (currentGameLevel - 1) * 0.2)
        }
        
        coin.y += coinSpeed
        coin.rotation += 0.02

        // Collision detection
        if (
          coin.x > gameState.walletX &&
          coin.x < gameState.walletX + 80 &&
          coin.y > canvas.height - 80 &&
          coin.y < canvas.height - 20
        ) {
          if (coin.token.isObstacle) {
            setGameOver(true)
            if (score > highScore) {
              setHighScore(score)
            }
            
            // End VRF session if active
            if (currentSession?.isActive) {
              setCurrentSession({...currentSession, isActive: false})
            }
            
            return
          } else {
            const newScore = score + 1
            setScore(newScore)
            saveTokenScore(coin.token.symbol, tokenScores[coin.token.symbol as keyof typeof tokenScores] + 1)
            setTokenScores(getTokenScores())
            gameState.coins.splice(i, 1)
            
            // Check for VRF level change
            if (gameMode === 'VRF_ENHANCED' && currentSession && nextLevelThreshold && newScore >= nextLevelThreshold) {
              triggerLevelChange(newScore)
            }
          }
        } else if (coin.y > canvas.height) {
          gameState.coins.splice(i, 1)
        }
      }

      spawnCoin()
    }

    // VRF level change trigger
    const triggerLevelChange = (currentScore: number) => {
      if (!currentSession) return
      
      const nextLevel = currentGameLevel + 1
      setCurrentGameLevel(nextLevel)
      setLevelChangeEffect(true)
      
      // Update next threshold if available
      if (currentSession.currentLevelIndex < currentSession.levelChangeThresholds.length - 1) {
        const nextIndex = currentSession.currentLevelIndex + 1
        setNextLevelThreshold(currentSession.levelChangeThresholds[nextIndex])
        setCurrentSession({
          ...currentSession,
          currentLevelIndex: nextIndex
        })
      } else {
        setNextLevelThreshold(null) // No more level changes
      }
      
      toast.success(`🎮 Level Up! Now Level ${nextLevel}`, {
        duration: 3000,
      })
      
      // Clear effect after animation
      setTimeout(() => setLevelChangeEffect(false), 2000)
    }

    const gameLoop = () => {
      if (!ctx || !canvas || gameOver || isPaused || !gameStarted) {
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Add level change effect
      if (levelChangeEffect) {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.3)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      drawWallet()
      updateCoins()
      gameState.coins.forEach((coin) => drawCoin(coin.x, coin.y, coin.token, coin.rotation))

      gameState.animationFrameId = requestAnimationFrame(gameLoop)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || isPaused || gameOver) return

      const moveSpeed = 20
      if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        gameState.walletX = Math.max(0, gameState.walletX - moveSpeed)
      }
      if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        gameState.walletX = Math.min(canvas.width - 80, gameState.walletX + moveSpeed)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!gameStarted || isPaused || gameOver || !canvas) return

      const touch = e.touches[0]
      const rect = canvas.getBoundingClientRect()
      const x = touch.clientX - rect.left

      gameState.walletX = Math.max(0, Math.min(canvas.width - 80, x - 40))
    }

    window.addEventListener("keydown", handleKeyDown)
    canvas.addEventListener("touchmove", handleTouchMove)

    if (gameStarted && !isPaused && !gameOver) {
      gameLoop()
    }

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      canvas.removeEventListener("touchmove", handleTouchMove)
      cancelAnimationFrame(gameState.animationFrameId)
    }
  }, [gameStarted, isPaused, difficulty.speed, difficulty.spawnRate, gameOver, imagesLoaded, selectedToken, score, highScore, tokenScores, gameMode, currentSession, nextLevelThreshold, currentGameLevel, levelChangeEffect])

  const resetGame = () => {
    setGameOver(false)
    setScore(0)
    setGameStarted(true)
    setCurrentGameLevel(1)
    setLevelChangeEffect(false)
    setTokenScores(getTokenScores())
    
    // Reset VRF session if needed
    if (gameMode === 'VRF_ENHANCED' && currentSession) {
      setCurrentSession({
        ...currentSession,
        currentLevelIndex: 0
      })
      setNextLevelThreshold(currentSession.levelChangeThresholds[0])
    }
  }

  const isDark = theme === "dark"

  return (
    <div className="flex flex-col items-center">
      {!isConnected && (
        <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200">
            Connect your wallet to access VRF-enhanced gameplay with verifiable randomness!
          </p>
        </div>
      )}
      
      {/* Game Mode Selection */}
      {isConnected && !gameStarted && (
        <div className="mb-6 p-4 bg-blue-100 dark:bg-blue-900 rounded-lg">
          <h3 className="text-lg font-bold mb-4">Choose Game Mode</h3>
          <div className="flex gap-4">
            <button
              onClick={() => setGameMode('CLASSIC')}
              className={`px-4 py-2 rounded-lg ${
                gameMode === 'CLASSIC' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              Classic Mode
            </button>
            <button
              onClick={() => setGameMode('VRF_ENHANCED')}
              className={`px-4 py-2 rounded-lg ${
                gameMode === 'VRF_ENHANCED' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              🎯 VRF Enhanced
            </button>
          </div>
        </div>
      )}

      {/* VRF Session Creation */}
      {isConnected && gameMode === 'VRF_ENHANCED' && !currentSession && (
        <div className="mb-6 p-4 bg-purple-100 dark:bg-purple-900 rounded-lg">
          <h3 className="text-lg font-bold mb-4">🎮 Create VRF Session</h3>
          <p className="mb-4 text-sm">
            VRF sessions use verifiable randomness to determine when difficulty levels change during gameplay!
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(sessionConfigs).map(([type, config]) => (
              <button
                key={type}
                onClick={() => createVRFSession(type as keyof typeof sessionConfigs)}
                disabled={isCreatingSession || isPending}
                className={`p-3 rounded-lg border-2 hover:shadow-lg transition-all ${
                  isCreatingSession ? 'opacity-50 cursor-not-allowed' : ''
                } bg-${config.color}-100 border-${config.color}-300 hover:bg-${config.color}-200`}
              >
                <div className="font-bold">{type}</div>
                <div className="text-xs">
                  {config.entryFee > 0 ? `${config.entryFee} ETH` : 'FREE'}
                </div>
                <div className="text-xs">
                  {config.baseMultiplier / 100}x multiplier
                </div>
              </button>
            ))}
          </div>
          {isCreatingSession && (
            <div className="mt-4 text-center">
              <div className="inline-block w-6 h-6 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-2">Creating VRF session...</p>
            </div>
          )}
        </div>
      )}

      {/* Current Session Info */}
      {currentSession && (
        <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 rounded-lg">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-bold">🎯 VRF Session Active</span>
              <span className="ml-2 text-sm">Level {currentGameLevel}</span>
            </div>
            {nextLevelThreshold && (
              <div className="text-sm">
                Next level at: {nextLevelThreshold} points
              </div>
            )}
          </div>
        </div>
      )}

      {/* Game Settings */}
      <div className="mb-4 flex gap-4">
        <select
          className="p-2 rounded border bg-background text-foreground"
          value={selectedToken.symbol}
          onChange={(e) => setSelectedToken(tokens.find((t) => t.symbol === e.target.value) || tokens[0])}
          disabled={gameStarted && !gameOver}
        >
          {tokens
            .filter((t) => !t.isObstacle)
            .map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.name}
              </option>
            ))}
        </select>

        <select
          className="p-2 rounded border bg-background text-foreground"
          value={difficulty.name}
          onChange={(e) =>
            setDifficulty(difficultyLevels.find((d) => d.name === e.target.value) || difficultyLevels[0])
          }
          disabled={gameStarted && !gameOver}
        >
          {difficultyLevels.map((level) => (
            <option key={level.name} value={level.name}>
              {level.name}
            </option>
          ))}
        </select>
      </div>

      {/* Score Display */}
      <div className="mb-4 flex gap-6">
        <div className="text-xl font-bold">Score: {score}</div>
        <div className="text-xl font-bold">High Score: {highScore}</div>
                 {currentSession && (
           <div className="text-xl font-bold text-purple-600">
             🎯 VRF Multiplier: {currentSession.vrfMultiplier / 100}x
           </div>
         )}
      </div>
      
      <div className="mb-4 flex gap-4 text-sm">
        {Object.entries(tokenScores).map(([token, score]) => (
          token !== 'total' && (
            <div key={token} className="flex items-center gap-2">
              <span>{token}:</span>
              <span className="font-bold">{score}</span>
            </div>
          )
        ))}
      </div>

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className={`border border-gray-300 dark:border-gray-600 rounded-lg ${
            isDark ? "bg-gradient-to-b from-gray-900 to-gray-800" : "bg-gradient-to-b from-blue-50 to-white"
          }`}
        />

        {!imagesLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
              <div className="text-lg">Loading game assets...</div>
            </div>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
            <div className="text-3xl font-bold text-white mb-4">Game Over!</div>
            <div className="text-xl text-white mb-2">Final Score: {score}</div>
                         {currentSession && (
               <div className="text-lg text-purple-300 mb-4">
                 🎯 VRF Enhanced Session Complete!
               </div>
             )}
            <button
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
              onClick={resetGame}
            >
              Play Again
            </button>
          </div>
        )}

        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg">
                         <div className="text-2xl font-bold text-white mb-6">
               🎯 VRF Enhanced Crypto Catcher
             </div>
                         <div className="text-white mb-6 max-w-md text-center">
               <p className="mb-2">Catch the falling crypto tokens with your wallet!</p>
               <p className="mb-2">Use arrow keys or touch to move.</p>
               <p className="text-purple-300">🎯 VRF mode: Random level changes for ultimate challenge!</p>
             </div>
                         <button
               className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
               onClick={() => setGameStarted(true)}
               disabled={!currentSession}
             >
               {!currentSession ? 'Create VRF Session First' : 'Start Game'}
             </button>
          </div>
        )}
      </div>

      {/* Game Controls */}
      {gameStarted && !gameOver && (
        <div className="flex gap-4 mt-4">
          <button
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => {
              setGameStarted(false)
              setScore(0)
              setCurrentGameLevel(1)
              setLevelChangeEffect(false)
            }}
          >
            Stop Game
          </button>
        </div>
      )}

             <div className="mt-4 text-sm text-muted-foreground">
         Controls: Arrow keys or touch to move the wallet
         {currentSession && (
           <div className="mt-2 text-purple-600">
             🎯 VRF Enhanced: Level changes triggered by verifiable randomness!
           </div>
         )}
       </div>
    </div>
  )
}

export default EnhancedCryptoGame
