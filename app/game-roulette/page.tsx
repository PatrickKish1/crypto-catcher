'use client';

import { Suspense } from 'react';
import GameRoulette from '@/components/game-roulette';
import LoadingSpinner from '@/components/loader-spinner';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { WalletConnect } from '@/components/walletConnect';

export default function GameRoulettePage() {
  const { isConnected } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4">🎰 Game Roulette</h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Experience the ultimate gaming adventure where VRF randomness decides your fate! 
            Every 60 seconds, switch to a completely different game with unpredictable difficulty levels.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">🎲</div>
            <h3 className="text-xl font-bold mb-2">VRF Randomness</h3>
            <p className="text-blue-200 text-sm">
              Verifiable random functions ensure truly unpredictable game selection and difficulty levels
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">⏰</div>
            <h3 className="text-xl font-bold mb-2">60-Second Switches</h3>
            <p className="text-blue-200 text-sm">
              Games automatically switch every minute, keeping you on your toes with new challenges
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="text-xl font-bold mb-2">Sealed Sessions</h3>
            <p className="text-blue-200 text-sm">
              Hidden multipliers revealed after gameplay using blocklock encryption for maximum suspense
            </p>
          </div>
        </div>

        {/* Wallet Connection */}
        {!isConnected && (
          <div className="mb-12 bg-yellow-500/20 backdrop-blur-sm rounded-xl p-8 text-center border border-yellow-500/30">
            <h2 className="text-3xl font-bold mb-4">🔗 Connect Wallet to Play</h2>
            <p className="text-yellow-200 mb-6 text-lg">
              Game Roulette requires wallet connection to access VRF randomness, blockchain features, 
              and save your progress across game switches.
            </p>
            <WalletConnect />
            <div className="mt-6">
              <Link 
                href="/crypto-catcher"
                className="text-blue-300 hover:text-blue-200 underline"
              >
                Or play individual games without wallet
              </Link>
            </div>
          </div>
        )}

        {/* Game Roulette Interface */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 scale-[0.7]">
          {isConnected ? (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold mb-4">🎮 Ready for the Roulette?</h2>
                <p className="text-blue-200 text-lg">
                  Click "Start Roulette" to begin your unpredictable gaming journey!
                </p>
              </div>
              
              <Suspense fallback={<LoadingSpinner />}>
                <GameRoulette />
              </Suspense>
            </>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-bold mb-4">Wallet Required</h3>
              <p className="text-blue-200 mb-8 text-lg">
                Please connect your wallet above to access the Game Roulette experience.
              </p>
              <div className="space-y-4">
                <Link 
                  href="/coinflip"
                  className="block px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  🪙 Try Coin Flip
                </Link>
                <Link 
                  href="/crypto-catcher"
                  className="block px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
                >
                  🎯 Try Crypto Catcher
                </Link>
                <Link 
                  href="/crypto-catcher-enhanced"
                  className="block px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
                >
                  ⚡ Try Enhanced Crypto Catcher
                </Link>
              </div>
            </div>
          )}
        </div>
        
        {/* How It Works */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold mb-8 text-center">🎯 How Game Roulette Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">🎰 Start Roulette Session</h3>
                  <p className="text-blue-200 text-sm">
                    Connect wallet and create a new roulette session. VRF generates your first random game.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">⏰ 60-Second Countdown</h3>
                  <p className="text-blue-200 text-sm">
                    Play your current game while a timer counts down to the next switch.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-blue-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">🎲 VRF Game Selection</h3>
                  <p className="text-blue-200 text-sm">
                    When time expires, VRF randomly picks your next game and difficulty level.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right Column */}
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">💾 State Preservation</h3>
                  <p className="text-blue-200 text-sm">
                    Current game state is automatically saved before switching to new game.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                  5
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">🔄 Game Switching</h3>
                  <p className="text-blue-200 text-sm">
                    Seamlessly transition to new game with different mechanics and difficulty.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-green-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
                  6
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">🔐 Sealed Rewards</h3>
                  <p className="text-blue-200 text-sm">
                    Optional sealed sessions hide multipliers until revealed for maximum suspense.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Available Games */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold mb-8 text-center">🎮 Available Games</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coin Flip */}
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-6 border border-yellow-500/30">
              <div className="text-4xl mb-4">🪙</div>
              <h3 className="text-xl font-bold mb-2">Coin Flip</h3>
              <p className="text-blue-200 text-sm mb-4">
                Classic heads or tails with VRF-powered randomness
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Easy:</span>
                  <span className="text-green-400">1x Multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span>Medium:</span>
                  <span className="text-yellow-400">1.2x Multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span>Hard:</span>
                  <span className="text-red-400">1.5x Multiplier</span>
                </div>
              </div>
            </div>
            
            {/* Crypto Catcher */}
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl p-6 border border-green-500/30">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">Crypto Catcher</h3>
              <p className="text-blue-200 text-sm mb-4">
                Catch falling crypto tokens while avoiding obstacles
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Easy:</span>
                  <span className="text-green-400">1x Multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span>Medium:</span>
                  <span className="text-yellow-400">1.2x Multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span>Hard:</span>
                  <span className="text-red-400">1.5x Multiplier</span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Crypto Catcher */}
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/30">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold mb-2">Enhanced Crypto Catcher</h3>
              <p className="text-blue-200 text-sm mb-4">
                Advanced version with VRF level changes and sealed sessions
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Free:</span>
                  <span className="text-green-400">1x Multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span>Bronze:</span>
                  <span className="text-yellow-400">1.2x Multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span>Gold:</span>
                  <span className="text-red-400">2x Multiplier</span>
                </div>
                <div className="flex justify-between">
                  <span>Platinum:</span>
                  <span className="text-purple-400">3x Multiplier</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Benefits */}
        <div className="mt-16 bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <h2 className="text-3xl font-bold mb-8 text-center">✨ Why Game Roulette?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-green-400">🎯 For Players</h3>
              <ul className="space-y-3 text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Complete unpredictability - never know what's coming next</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Variety keeps gaming fresh and engaging</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Skill testing across different game mechanics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Sealed sessions add mystery and suspense</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold mb-4 text-blue-400">🔧 For Developers</h3>
              <ul className="space-y-3 text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>High player retention through variety</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>VRF ensures fair and verifiable randomness</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Easy to add new games and mechanics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400">✓</span>
                  <span>Blockchain-based progression and rewards</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
