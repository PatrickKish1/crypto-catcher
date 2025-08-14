'use client';
import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { 
  Swap, 
  SwapAmountInput, 
  SwapToggleButton, 
  SwapButton, 
  SwapMessage, 
  SwapToast,
//   TokenSelectDropdown
} from '@coinbase/onchainkit/swap';
import { TokenSelectDropdown, type Token } from '@coinbase/onchainkit/token';
import { setOnchainKitConfig } from '@coinbase/onchainkit';
import { getTokens } from '@coinbase/onchainkit/api';
import { isApiError } from '@/lib/lib/types/api';
import Image from 'next/image';

const COINBASE_TOKEN = `${process.env.COINBASE_TOKEN}`;

const TokenSwap: React.FC = () => {
  const { address, isConnected } = useAccount();
  const [popularTokens, setPopularTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fromToken, setFromToken] = useState<Token | null>(null);
  const [toToken, setToToken] = useState<Token | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Token[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Fetch popular tokens on component mount
  address?.toString()
  useEffect(() => {
    const fetchPopularTokens = async () => {
      setIsLoading(true);
      setOnchainKitConfig({
        apiKey: process.env.NEXT_PUBLIC_ONCHAINKIT_API_KEY || COINBASE_TOKEN, // Make sure this is set in .env
      });
      
      try {
        const tokens = await Promise.all([
          getTokens({ search: 'SOLANA' }),
          getTokens({ search: 'USDC' }),
          getTokens({ search: 'DOGE' }),
          getTokens({ search: 'USDT' }),
          getTokens({ search: 'DAI' })
        ]);
        
        const validTokens: Token[] = [];
        
        for (const tokenResponse of tokens) {
          if (!isApiError(tokenResponse) && tokenResponse.length > 0) {
            validTokens.push(tokenResponse[0]);
          }
        }
        
        // Add ETH as default token
        const ethToken: Token = {
          name: 'Ethereum',
          address: '',
          symbol: 'ETH',
          decimals: 18,
          image: 'https://wallet-api-production.s3.amazonaws.com/uploads/tokens/eth_288.png',
          chainId: 8453,
        };
        
        const allTokens = [ethToken, ...validTokens];
        setPopularTokens(allTokens);
        
        // Set default from and to tokens
        if (allTokens.length >= 2) {
          setFromToken(allTokens[0]);
          setToToken(allTokens[1]);
        }
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPopularTokens();
  }, []);
  // Handle token search
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const response = await getTokens({ search: query });
      
      if (!isApiError(response)) {
        setSearchResults(response);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching tokens:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };
  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Token Swap</h2>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  if (!isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Token Swap</h2>
        <p className="text-gray-400 mb-4">Connect your wallet to swap tokens</p>
      </div>
    );
  }
  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Token Swap</h2>
      
      {popularTokens.length > 0 && fromToken && toToken ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main swap form */}
          <div>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search for tokens by name or address..."
                className="w-full bg-gray-700 text-white rounded p-2 mb-2"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
              
              {isSearching && (
                <div className="flex justify-center py-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
              
              {searchResults.length > 0 && (
                <div className="bg-gray-700 rounded p-2 mb-4 max-h-40 overflow-y-auto">
                  {searchResults.map((token) => (
                    <div 
                      key={token.address || token.symbol}
                      className="flex items-center p-2 hover:bg-gray-600 cursor-pointer rounded"
                      onClick={() => {
                        setFromToken(token);
                        setSearchQuery('');
                        setSearchResults([]);
                      }}
                    >
                      {token.image && (
                        <Image
                         src={token.image} alt={token.symbol} width={50} height={50} className="w-6 h-6 mr-2 rounded-full" />
                      )}
                      <div>
                        <div className="font-medium">{token.symbol}</div>
                        <div className="text-xs text-gray-400">{token.name}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <Swap>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2 mt-10">From</label>
                <div className="flex items-center bg-gray-700 rounded p-2">
                  <TokenSelectDropdown
                    token={fromToken}
                    setToken={setFromToken}
                    options={popularTokens}
                  />
                </div>
              </div>
              
              <SwapAmountInput
                label="You pay"
                token={fromToken}
                type="from"
              />
              
              <div className="flex justify-center my-2">
                <SwapToggleButton />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">To</label>
                <div className="flex items-center bg-gray-700 rounded p-2">
                  <TokenSelectDropdown
                    token={toToken}
                    setToken={setToToken}
                    options={popularTokens}
                  />
                </div>
              </div>
              
              <SwapAmountInput
                label="You receive"
                token={toToken}
                type="to"
              />
              
              <div className="mt-4">
                <SwapButton />
              </div>
              
              <SwapMessage />
              <SwapToast />
            </Swap>
          </div>
          
          {/* Popular tokens section */}
          <div className="bg-gray-700 rounded-lg p-4 scale-75">
            <h3 className="text-lg font-bold mb-2">Popular Tokens</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {popularTokens.map((token) => (
                <div 
                  key={token.address || token.symbol}
                  className="flex flex-col items-center p-2 hover:bg-gray-600 cursor-pointer rounded scale-125"
                  onClick={() => setFromToken(token)}
                >
                  {token.image && (
                    <Image
                     src={token.image}
                     alt={token.symbol}
                     className="w-8 h-8 mb-1 rounded-full"
                     width={50}
                     height={50}
                     />
                  )}
                  <div className="text-sm font-medium">{token.symbol}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <p className="text-gray-400">No tokens available for swapping</p>
      )}
    </div>
  );
};
export default TokenSwap;