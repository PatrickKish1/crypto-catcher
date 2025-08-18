/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { useState, useEffect } from 'react'
import { getTokenScores, type TokenScores } from '@/lib/lib/cookies'
import { tokens } from '@/lib/lib/config/token'
import TokenSwap from '@/components/token-swap'
import Image from 'next/image'
import { useAccount, useSignMessage, useWalletClient } from 'wagmi'
import { toast } from 'sonner'
import { Address } from 'viem/accounts'
import { base, baseSepolia } from 'viem/chains'
import { claimRewards, executeClaimTransaction } from '@/lib/lib/claims/contracts';

const CONVERSION_RATES = {
  '10': 0.1,    // 1000 points = 0.1 USDC
  '5000': 0.5,    // 5000 points = 0.5 USDC
  '10000': 1.0,   // 10000 points = 1 USDC
  '50000': 6.0,   // 50000 points = 6 USDC
  '100000': 15.0  // 100000 points = 15 USDC
}

type ClaimHistory = {
  date: string;
  points: number;
  amount: number;
  txHash: string;
}

export default function ClaimsPage() {
  const [scores, setScores] = useState<TokenScores>(getTokenScores())
  const [selectedToken, setSelectedToken] = useState<string>('total')
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([])
  const { address, isConnected } = useAccount()
  const { signMessage } = useSignMessage({
    mutation: {
      onSuccess: (signature) => {
        toast.success("Claim successful", {
          description: `You have caimed ${usdcValue.toFixed(4)} USDC`
        })
        handleSuccessfulClaim();
      },
    }
  })
  const { data: walletClient } = useWalletClient()
  // const { chain } = useNetwork()

  const getUSDCValue = (points: number) => {
    const thresholds = Object.keys(CONVERSION_RATES).map(Number).sort((a, b) => b - a)
    for (const threshold of thresholds) {
      if (points >= threshold) {
        return CONVERSION_RATES[threshold as unknown as keyof typeof CONVERSION_RATES]
      }
    }
    return 0
  }

  const calculateClaimAmount = (points: number) => {
    if (points < 10) return 0; // Minimum threshold
    const baseAmount = 0.1; // Base amount for 10 points
    return (points / 10) * baseAmount;
  }

  const handleSuccessfulClaim = () => {
    const newClaim: ClaimHistory = {
      date: new Date().toISOString(),
      points: currentPoints,
      amount: usdcValue,
      txHash: '0x' + Math.random().toString(16).slice(2),
    };
    setClaimHistory([newClaim, ...claimHistory]);
    // toast.success('Claim successful!');
  }

  const handleClaim = async () => {
    if (!isConnected || !address || !walletClient) {
      toast.error('Please connect your wallet');
      return;
    }
    
    try {
      await signMessage({ message: `Claiming ${usdcValue} USDC for ${currentPoints} points` });
      const txHash = await executeClaimTransaction(currentPoints, walletClient);
      
      const newClaim: ClaimHistory = {
        date: new Date().toISOString(),
        points: currentPoints,
        amount: usdcValue,
        txHash,
      };
      
      setClaimHistory([newClaim, ...claimHistory]);
      toast.success("Claim successful");
    } catch (error) {
      toast.error('Claim failed');
      console.error(error);
    }
  }

  const currentPoints = selectedToken === 'total' ? scores.total : scores[selectedToken as keyof TokenScores]
  const usdcValue = calculateClaimAmount(currentPoints);

  const getExplorerUrl = (txHash: string) => {
    const chainId = walletClient?.chain?.id || baseSepolia.id;
    const baseUrl = chainId === base.id 
      ? 'https://basescan.org/tx/' 
      : 'https://sepolia.basescan.org/tx/';
    return baseUrl + txHash;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Claim Your Rewards</h1>
        
        {/* Disclaimer */}
        <div className="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-4 mb-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            Disclaimer: Game points are currently for demonstration purposes only. 
            Token swaps will simulate transactions without actual token transfers.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2">Your Token Scores</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {tokens.filter(t => !t.isObstacle).map(token => (
                <button
                  key={token.symbol}
                  onClick={() => setSelectedToken(token.symbol)}
                  className={`p-4 rounded-lg ${
                    selectedToken === token.symbol 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-center mb-2">
                    <Image
                      src={token.imageUrl}
                      alt={token.name}
                      width={32}
                      height={32}
                    />
                  </div>
                  <div className="text-center">
                    <div className="font-bold">{token.symbol}</div>
                    <div>{scores[token.symbol as keyof TokenScores]} points</div>
                  </div>
                </button>
              ))}
              <button
                onClick={() => setSelectedToken('total')}
                className={`p-4 rounded-lg ${
                  selectedToken === 'total' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-center mb-2">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="text-center">
                  <div className="font-bold">TOTAL</div>
                  <div>{scores.total} points</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">Conversion Rates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(CONVERSION_RATES).map(([points, usdc]) => (
                <div
                  key={points}
                  className={`p-4 rounded-lg ${
                    currentPoints >= Number(points)
                      ? 'bg-green-100 dark:bg-green-900'
                      : 'bg-gray-100 dark:bg-gray-700'
                  }`}
                >
                  <div className="font-bold">{points} points</div>
                  <div>{usdc} USDC</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Token Swap Integration */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md mb-6">
          <h2 className="text-xl font-bold mb-4">Claim Tokens</h2>
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Available to claim: {usdcValue.toFixed(4)} USDC
            </p>
          <div className="bg-blue-100 dark:bg-blue-900 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-2">Your Potential Claim</h2>
            <div className="text-3xl font-bold mb-4">
              {usdcValue.toFixed(2)} USDC
            </div>
            {/* <button
              className={`w-full py-3 rounded-lg font-bold ${
                usdcValue > 0
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              }`}
              disabled={usdcValue === 0}
            >
              Claim Now
            </button> */}
            <button
              onClick={handleClaim}
              disabled={currentPoints < 10 || !isConnected}
              className={`w-full mt-4 px-6 py-2 rounded-lg text-[30px] font-bold ${
                currentPoints >= 10 && isConnected
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
              }`}
            >
              {!isConnected ? 'Connect Wallet to Claim' : 'Claim Rewards'}
            </button>
          </div>
          </div>
            <TokenSwap />
        </div>

        {/* Claims History */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 shadow-md">
          <h2 className="text-xl font-bold mb-4">Claims History</h2>
          {claimHistory.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No claims yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-right py-3 px-4">Points</th>
                    <th className="text-right py-3 px-4">Amount (USDC)</th>
                    <th className="text-right py-3 px-4">Transaction</th>
                  </tr>
                </thead>
                <tbody>
                  {claimHistory.map((claim, index) => (
                    <tr key={index} className="border-b dark:border-gray-700">
                      <td className="py-3 px-4">
                        {new Date(claim.date).toLocaleDateString()}
                      </td>
                      <td className="text-right py-3 px-4">{claim.points}</td>
                      <td className="text-right py-3 px-4">{claim.amount.toFixed(4)}</td>
                      <td className="text-right py-3 px-4">
                        <a
                          href={getExplorerUrl(claim.txHash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-600"
                        >
                          View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}