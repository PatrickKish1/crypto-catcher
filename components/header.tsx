"use client"
import Image from "next/image";
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const Header = () => {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

  return (
    <div className="fixed top-0 w-full h-20 flex items-center z-10 bg-white/10 backdrop-blur-sm border-b border-white/20">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <Image
              className="cursor-pointer"
              src="/assets/logos/lightLogo.svg"
              width={120}
              height={120}
              alt="Randamu Logo"
            />
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/coinflip"
            className={`px-4 py-2 rounded-lg transition-colors ${
              isActive('/coinflip') 
                ? 'bg-blue-500 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            🪙 Coin Flip
          </Link>
          
          <Link 
            href="/crypto-catcher"
            className={`px-4 py-2 rounded-lg transition-colors ${
              isActive('/crypto-catcher') 
                ? 'bg-green-500 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            🎯 Crypto Catcher
          </Link>
          
          <Link 
            href="/crypto-catcher-enhanced"
            className={`px-4 py-2 rounded-lg transition-colors ${
              isActive('/crypto-catcher-enhanced') 
                ? 'bg-purple-500 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            ⚡ Enhanced
          </Link>
          
          <Link 
            href="/game-roulette"
            className={`px-4 py-2 rounded-lg transition-colors ${
              isActive('/game-roulette') 
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white' 
                : 'text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            🎰 Game Roulette
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button className="text-white p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Header;

