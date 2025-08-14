"use client"

import { useEffect, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { tokens, difficultyLevels, type Token } from "@/lib/lib/config/token"
import { saveTokenScore, getTokenScores } from "@/lib/lib/cookies"

const CryptoGame = () => {
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
  const { theme } = useTheme()
  const [tokenScores, setTokenScores] = useState(getTokenScores())

  // Load images when component mounts or theme changes
  useEffect(() => {
    const loadImages = async () => {
      const imagePromises = tokens.map((token) => {
        return new Promise<[string, HTMLImageElement]>((resolve, reject) => {
          const img = new Image()
          img.onload = () => resolve([token.symbol, img])
          img.onerror = reject
          img.src = token.imageUrl.replace('/public', '') // Remove '/public' from path
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
        setImagesLoaded(true) // Set to true anyway to fallback to basic rendering
      }
    }

    loadImages()
  }, [])

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

      // Increased size from 20 to 30
      ctx.beginPath()
      ctx.arc(0, 0, 30, 0, Math.PI * 2)
      ctx.clip()

      const tokenImage = tokenImagesRef.current.get(token.symbol)
      if (tokenImage) {
        // Increased size from 40 to 60
        ctx.drawImage(tokenImage, -30, -30, 60, 60)
        
        if (token.isObstacle) {
          ctx.fillStyle = 'rgba(239, 68, 68, 0.5)'
          ctx.fillRect(-30, -30, 60, 60)
        }
      } else {
        ctx.fillStyle = token.isObstacle ? '#EF4444' : '#F7931A'
        ctx.fill()
        
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 16px Arial' // Increased font size
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(token.symbol.substring(0, 2), 0, 0)
      }

      ctx.restore()
    }

    const spawnCoin = () => {
      // Scale maximum coins based on difficulty for better game balance
      const baseMaxCoins = 6;
      const difficultyMultiplier = difficulty.name === "Easy" ? 1 : 
                                   difficulty.name === "Medium" ? 1.2 : 
                                   difficulty.name === "Hard" ? 1.5 : 1.8; // Expert
      const maxCoinsOnScreen = Math.floor(baseMaxCoins * difficultyMultiplier);
      
      if (gameState.coins.length >= maxCoinsOnScreen) {
        return; // Don't spawn if we already have too many coins
      }

      if (Math.random() < difficulty.spawnRate) {
        // 80% chance for selected token, 20% chance for obstacle tokens
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
        coin.y += difficulty.speed
        coin.rotation += 0.02

        // Adjusted collision detection for larger tokens
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
            return
          } else {
            const newScore = score + 1;
            setScore(newScore)
            // Save the token score when collected
            saveTokenScore(coin.token.symbol, tokenScores[coin.token.symbol as keyof typeof tokenScores] + 1)
            setTokenScores(getTokenScores()) // Update the local state
            gameState.coins.splice(i, 1)
          }
        } else if (coin.y > canvas.height) {
          gameState.coins.splice(i, 1)
        }
      }

      // Always attempt to spawn new coins based on difficulty and max tokens on screen
      spawnCoin()
    }

    const gameLoop = () => {
      if (!ctx || !canvas || gameOver || isPaused || !gameStarted) {
        return
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      drawWallet()
      updateCoins() // Moved spawnCoin inside updateCoins
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

      // Center wallet on touch position
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
  }, [gameStarted, isPaused, difficulty.speed, difficulty.spawnRate, gameOver, imagesLoaded, selectedToken, score, highScore, tokenScores])

  const resetGame = () => {
    setGameOver(false)
    setScore(0)
    setGameStarted(true)
    setTokenScores(getTokenScores()) // Reset token scores from cookies
  }

  const isDark = theme === "dark"

  return (
    <div className="flex flex-col items-center">
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

      <div className="mb-4 flex gap-6">
        <div className="text-xl font-bold">Score: {score}</div>
        <div className="text-xl font-bold">High Score: {highScore}</div>
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
            <div className="text-xl text-white mb-6">Final Score: {score}</div>
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
            <div className="text-2xl font-bold text-white mb-6">Crypto Catcher</div>
            <div className="text-white mb-6 max-w-md text-center">
              <p className="mb-2">Catch the falling crypto tokens with your wallet!</p>
              <p className="mb-2">Use arrow keys or touch to move.</p>
              <p className="text-red-400">{`Avoid red tokens or it's game over!`}</p>
            </div>
            <button
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium"
              onClick={() => setGameStarted(true)}
            >
              Start Game
            </button>
          </div>
        )}
      </div>

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
            }}
          >
            Stop Game
          </button>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">Controls: Arrow keys or touch to move the wallet</div>
    </div>
  )
}

export default CryptoGame