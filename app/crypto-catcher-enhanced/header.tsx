'use client';

import Link from 'next/link';
import Image from 'next/image';
import { WalletConnect } from '@/components/walletConnect';
import { useAccount } from 'wagmi';

export default function EnhancedHeader() {
  const { isConnected, address } = useAccount();

  return (
    <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Logo and Title */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/assets/logos/logo.svg"
              alt="Randamu Logo"
              width={40}
              height={40}
            />
            <div>
              <h1 className="text-2xl font-bold">Crypto Catcher</h1>
              <p className="text-sm opacity-90">Powered by VRF + Blocklock</p>
            </div>
          </Link>

          <WalletConnect />
        </div>

        {/* Navigation */}
        <nav className="flex flex-wrap items-center gap-6 text-sm">
          <Link 
            href="/crypto-catcher" 
            className="px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            🎮 Classic Mode
          </Link>
          <Link 
            href="/crypto-catcher-enhanced" 
            className="px-3 py-1 bg-white/40 rounded-full hover:bg-white/50 transition-colors"
          >
            🎯 Enhanced Mode
          </Link>
          <Link 
            href="/crypto-catcher/claims" 
            className="px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            💰 Claims
          </Link>
          <Link 
            href="/randomnumber" 
            className="px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            🎲 VRF Demo
          </Link>
          <Link 
            href="/coinflip" 
            className="px-3 py-1 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
          >
            🪙 Coin Flip
          </Link>
        </nav>

        {/* Connection Status */}
        {isConnected && (
          <div className="mt-4 flex items-center gap-4 text-sm bg-white/10 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span>Connected: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
            </div>
            <div className="text-xs opacity-75">
              Network: Base Sepolia • VRF: Active • Blocklock: Ready
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
